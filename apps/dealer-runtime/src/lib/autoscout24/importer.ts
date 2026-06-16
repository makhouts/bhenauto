import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AutoScoutClient, createAutoScoutClientFromEnv } from "./client";
import { importAutoScoutImageToR2, deleteR2ObjectsForImageUrls } from "./images";
import { mapAutoScoutListingToCar, slugify } from "./mapper";
import { buildReferenceIndex, IMPORT_REFERENCE_TYPES } from "./references";
import type {
  AutoScoutListing,
  AutoScoutMappedCar,
  AutoScoutMappedImage,
  AutoScoutReferenceIndex,
} from "./types";

const SOURCE = "autoscout24";
const SOLD_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

type ExistingImportedCar = Awaited<ReturnType<typeof getImportedCars>>[number];

export type AutoScoutImportOptions = {
  mode: "dry-run" | "apply";
  customerId?: string;
  resetTestInventory?: boolean;
  cleanupSold?: boolean;
  overwriteFromAutoscout?: boolean;
  now?: Date;
};

export type AutoScoutImportSummary = {
  mode: "dry-run" | "apply";
  customerId: string;
  fetchedListings: number;
  fetchedDetails: number;
  created: number;
  updated: number;
  skipped: number;
  markedSold: number;
  resetDeletedCars: number;
  deletedSoldCars: number;
  uploadedImages: number;
  deletedImages: number;
  failures: Array<{ listingId?: string; message: string }>;
  actions: string[];
};

function emptySummary(mode: "dry-run" | "apply", customerId: string): AutoScoutImportSummary {
  return {
    mode,
    customerId,
    fetchedListings: 0,
    fetchedDetails: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    markedSold: 0,
    resetDeletedCars: 0,
    deletedSoldCars: 0,
    uploadedImages: 0,
    deletedImages: 0,
    failures: [],
    actions: [],
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function getImportedCars() {
  return prisma.car.findMany({
    where: { externalSource: SOURCE },
    include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
  });
}

async function getAllCarsForReset() {
  return prisma.car.findMany({
    include: { images: true },
  });
}

function getImageUrls(cars: Array<{ images: Array<{ url: string }> }>) {
  return cars.flatMap((car) => car.images.map((image) => image.url));
}

async function deleteCarsAndR2Images(cars: Array<{ id: string; images: Array<{ url: string }> }>) {
  const deletedImages = await deleteR2ObjectsForImageUrls(getImageUrls(cars));
  if (cars.length > 0) {
    await prisma.car.deleteMany({ where: { id: { in: cars.map((car) => car.id) } } });
  }
  return deletedImages;
}

async function ensureUniqueSlug(slugBase: string, existingCarId?: string | null) {
  const base = slugify(slugBase).slice(0, 240);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.car.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === existingCarId) return candidate;
    candidate = `${base.slice(0, 232)}-${suffix}`;
    suffix += 1;
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : value as Prisma.InputJsonValue;
}

function toPrismaCarData(data: AutoScoutMappedCar["data"]): Prisma.CarUncheckedCreateInput {
  return {
    ...data,
    sourcePayload: jsonValue(data.sourcePayload),
    consumption: jsonValue(data.consumption),
    wltp: jsonValue(data.wltp),
    equipment: jsonValue(data.equipment),
    technicalData: jsonValue(data.technicalData),
  };
}

function findReusableImage(existingCar: ExistingImportedCar | undefined, image: AutoScoutMappedImage) {
  if (!existingCar) return null;
  return existingCar.images.find((existing) => {
    if (image.autoscoutImageId && existing.autoscoutImageId === image.autoscoutImageId) {
      return !image.sourceMd5 || !existing.sourceMd5 || existing.sourceMd5 === image.sourceMd5;
    }
    return existing.sourceUrl === image.sourceUrl;
  }) ?? null;
}

async function prepareImages(input: {
  mapped: AutoScoutMappedCar;
  existingCar?: ExistingImportedCar;
  summary: AutoScoutImportSummary;
}) {
  const uploadedKeys: string[] = [];
  const nextImages: Prisma.ImageUncheckedCreateWithoutCarInput[] = [];

  for (const image of input.mapped.images) {
    const reusable = findReusableImage(input.existingCar, image);
    if (reusable) {
      nextImages.push({
        url: reusable.url,
        sortOrder: image.sortOrder,
        sourceUrl: image.sourceUrl,
        autoscoutImageId: image.autoscoutImageId ?? null,
        sourceMd5: image.sourceMd5 ?? null,
      });
      continue;
    }

    const key = await importAutoScoutImageToR2(input.mapped.autoscoutListingId, image);
    uploadedKeys.push(key);
    input.summary.uploadedImages += 1;
    nextImages.push({
      url: key,
      sortOrder: image.sortOrder,
      sourceUrl: image.sourceUrl,
      autoscoutImageId: image.autoscoutImageId ?? null,
      sourceMd5: image.sourceMd5 ?? null,
    });
  }

  return { nextImages, uploadedKeys };
}

async function cleanupUploadedImages(uploadedKeys: string[], summary: AutoScoutImportSummary) {
  if (uploadedKeys.length === 0) return;
  summary.deletedImages += await deleteR2ObjectsForImageUrls(uploadedKeys);
}

async function upsertMappedCar(input: {
  mapped: AutoScoutMappedCar;
  existingCar?: ExistingImportedCar;
  summary: AutoScoutImportSummary;
}) {
  const { mapped, existingCar, summary } = input;
  const uploadedKeys: string[] = [];

  try {
    mapped.data.slug = existingCar?.slug ?? await ensureUniqueSlug(mapped.slugBase, existingCar?.id);
    const imageResult = await prepareImages({ mapped, existingCar, summary });
    uploadedKeys.push(...imageResult.uploadedKeys);
    const carData = toPrismaCarData(mapped.data);

    if (existingCar) {
      await prisma.car.update({
        where: { id: existingCar.id },
        data: {
          ...carData,
          images: {
            deleteMany: {},
            create: imageResult.nextImages,
          },
        },
      });

      const nextUrls = new Set(imageResult.nextImages.map((image) => image.url));
      const oldUrlsToDelete = existingCar.images
        .map((image) => image.url)
        .filter((url) => !nextUrls.has(url));
      summary.deletedImages += await deleteR2ObjectsForImageUrls(oldUrlsToDelete);
      summary.updated += 1;
      summary.actions.push(`updated ${mapped.autoscoutListingId} (${mapped.data.title})`);
    } else {
      await prisma.car.create({
        data: {
          ...carData,
          images: {
            create: imageResult.nextImages,
          },
        },
      });
      summary.created += 1;
      summary.actions.push(`created ${mapped.autoscoutListingId} (${mapped.data.title})`);
    }
  } catch (error) {
    await cleanupUploadedImages(uploadedKeys, summary).catch(() => undefined);
    throw error;
  }
}

async function fetchAndMapListings(input: {
  client: AutoScoutClient;
  customerId: string;
  references: AutoScoutReferenceIndex;
  existingByListingId: Map<string, ExistingImportedCar>;
  summary: AutoScoutImportSummary;
  now: Date;
}) {
  const summaries = await input.client.listListings(input.customerId);
  input.summary.fetchedListings = summaries.length;
  const mappedListings: AutoScoutMappedCar[] = [];

  for (const listingSummary of summaries) {
    try {
      const listing = await input.client.getListing(input.customerId, listingSummary.id);
      input.summary.fetchedDetails += 1;
      mappedListings.push(mapAutoScoutListingToCar({
        listing: listing as AutoScoutListing,
        customerId: input.customerId,
        references: input.references,
        now: input.now,
        existingSoldAt: input.existingByListingId.get(listingSummary.id)?.soldAt ?? null,
      }));
    } catch (error) {
      input.summary.failures.push({
        listingId: listingSummary.id,
        message: errorMessage(error),
      });
    }
  }

  return mappedListings;
}

async function markMissingListingsSold(input: {
  summary: AutoScoutImportSummary;
  fetchedListingIds: Set<string>;
  now: Date;
  dryRun: boolean;
}) {
  const missingImportedCars = await prisma.car.findMany({
    where: {
      externalSource: SOURCE,
      AND: [
        { autoscoutListingId: { not: null } },
        { autoscoutListingId: { notIn: [...input.fetchedListingIds] } },
      ],
    },
    select: {
      id: true,
      title: true,
      autoscoutListingId: true,
      sold: true,
      soldAt: true,
    },
  });

  for (const car of missingImportedCars) {
    if (car.sold) continue;
    input.summary.markedSold += 1;
    input.summary.actions.push(`marked sold missing AutoScout24 listing ${car.autoscoutListingId} (${car.title})`);
    if (input.dryRun) continue;

    await prisma.car.update({
      where: { id: car.id },
      data: {
        sold: true,
        reserved: false,
        soldAt: car.soldAt ?? input.now,
        publicationStatus: "Missing from AutoScout24",
        availabilityStatus: "Missing from AutoScout24",
        lastSyncedAt: input.now,
      },
    });
  }
}

async function cleanupSoldCars(input: {
  summary: AutoScoutImportSummary;
  now: Date;
  dryRun: boolean;
}) {
  const cutoff = new Date(input.now.getTime() - SOLD_RETENTION_MS);
  const carsToDelete = await prisma.car.findMany({
    where: {
      externalSource: SOURCE,
      sold: true,
      soldAt: { lte: cutoff },
    },
    include: { images: true },
  });

  input.summary.deletedSoldCars = carsToDelete.length;
  for (const car of carsToDelete) {
    input.summary.actions.push(`deleted sold imported car older than 2 days (${car.title})`);
  }

  if (!input.dryRun && carsToDelete.length > 0) {
    input.summary.deletedImages += await deleteCarsAndR2Images(carsToDelete);
  }
}

export async function runAutoScoutImport(options: AutoScoutImportOptions): Promise<AutoScoutImportSummary> {
  const client = createAutoScoutClientFromEnv();
  const customerId = await client.resolveCustomerId(options.customerId ?? process.env.AUTOSCOUT24_CUSTOMER_ID);
  const now = options.now ?? new Date();
  const dryRun = options.mode === "dry-run";
  const summary = emptySummary(options.mode, customerId);

  const [references, makes] = await Promise.all([
    client.getReferences([...IMPORT_REFERENCE_TYPES]),
    client.getMakes(),
  ]);
  const referenceIndex = buildReferenceIndex(references, makes);

  if (options.resetTestInventory) {
    const cars = await getAllCarsForReset();
    summary.resetDeletedCars = cars.length;
    summary.actions.push(`reset inventory: ${cars.length} cars would be deleted`);
    if (!dryRun && cars.length > 0) {
      summary.deletedImages += await deleteCarsAndR2Images(cars);
    }
  }

  const importedCars = options.resetTestInventory ? [] : await getImportedCars();
  const existingByListingId = new Map(
    importedCars
      .filter((car) => car.autoscoutListingId)
      .map((car) => [car.autoscoutListingId!, car]),
  );
  const mappedListings = await fetchAndMapListings({
    client,
    customerId,
    references: referenceIndex,
    existingByListingId,
    summary,
    now,
  });
  const fetchedListingIds = new Set(mappedListings.map((listing) => listing.autoscoutListingId));

  const shouldWriteFetchedListings = options.resetTestInventory || options.overwriteFromAutoscout;

  if (!shouldWriteFetchedListings) {
    summary.skipped += mappedListings.length;
    if (mappedListings.length > 0) {
      summary.actions.push(`skipped ${mappedListings.length} fetched AutoScout24 listings because website is source of truth`);
    }
  } else {
    for (const mapped of mappedListings) {
      const existingCar = existingByListingId.get(mapped.autoscoutListingId);
      try {
        if (dryRun) {
          if (existingCar) {
            summary.updated += 1;
            summary.actions.push(`would update ${mapped.autoscoutListingId} (${mapped.data.title})`);
          } else {
            summary.created += 1;
            summary.actions.push(`would create ${mapped.autoscoutListingId} (${mapped.data.title})`);
          }
          continue;
        }

        await upsertMappedCar({ mapped, existingCar, summary });
      } catch (error) {
        summary.failures.push({
          listingId: mapped.autoscoutListingId,
          message: errorMessage(error),
        });
      }
    }
  }

  if (!options.resetTestInventory && options.overwriteFromAutoscout) {
    await markMissingListingsSold({
      summary,
      fetchedListingIds,
      now,
      dryRun,
    });
  }

  if (options.cleanupSold !== false) {
    await cleanupSoldCars({ summary, now, dryRun });
  }

  return summary;
}
