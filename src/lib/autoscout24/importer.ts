import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AutoScoutClient, createAutoScoutClientFromEnv } from "./client";
import { importAutoScoutImageToR2, deleteR2ObjectsForImageUrls } from "./images";
import { mapAutoScoutListingToCar, slugify } from "./mapper";
import { buildReferenceIndex, IMPORT_REFERENCE_TYPES } from "./references";
import { AUTOSCOUT_SOURCE_OF_TRUTH, isAutoScoutSourceOfTruth } from "./source-of-truth";
import type {
  AutoScoutListing,
  AutoScoutListingSummary,
  AutoScoutMappedCar,
  AutoScoutMappedImage,
  AutoScoutReferenceIndex,
} from "./types";

const SOURCE = "autoscout24";
const SOLD_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
const IMPORT_DETAIL_FETCH_CONCURRENCY = 4;
const IMPORT_LOCK_ID = "autoscout24-import";
const IMPORT_LOCK_LEASE_MS = 5 * 60 * 1000;
const IMPORT_HEARTBEAT_INTERVAL_MS = 60 * 1000;
const IMPORT_QUEUE_GRACE_MS = 30 * 1000;

type ExistingImportedCar = Awaited<ReturnType<typeof getImportedCars>>[number];

export type AutoScoutImportOptions = {
  mode: "dry-run" | "apply";
  customerId?: string;
  resetTestInventory?: boolean;
  cleanupSold?: boolean;
  overwriteFromAutoscout?: boolean;
  createOnlyFromAutoscout?: boolean;
  now?: Date;
};

export type AutoScoutImportSummary = {
  mode: "dry-run" | "apply";
  customerId: string;
  fetchedListings: number;
  fetchedDetails: number;
  reusedExisting: number;
  created: number;
  updated: number;
  skipped: number;
  markedSold: number;
  deletedInactive: number;
  resetDeletedCars: number;
  deletedSoldCars: number;
  uploadedImages: number;
  deletedImages: number;
  failures: Array<{ listingId?: string; message: string }>;
  actions: string[];
};

export class AutoScoutImportLockError extends Error {
  constructor() {
    super("An AutoScout24 import is already running.");
    this.name = "AutoScoutImportLockError";
  }
}

export class AutoScoutImportPartialFailureError extends Error {
  constructor(public readonly summary: AutoScoutImportSummary) {
    super(`AutoScout24 import completed with ${summary.failures.length} failed listing(s).`);
    this.name = "AutoScoutImportPartialFailureError";
  }
}

function emptySummary(mode: "dry-run" | "apply", customerId: string): AutoScoutImportSummary {
  return {
    mode,
    customerId,
    fetchedListings: 0,
    fetchedDetails: 0,
    reusedExisting: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    markedSold: 0,
    deletedInactive: 0,
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

function isMissingImportStateTableError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2021"
  );
}

async function getLastImportedCarSyncAt() {
  const aggregate = await prisma.car.aggregate({
    where: { externalSource: SOURCE },
    _max: { lastSyncedAt: true },
  });
  return aggregate._max.lastSyncedAt ?? null;
}

export async function getAutoScoutImportStatus() {
  try {
    const state = await prisma.autoScoutImportState.findUnique({
      where: { id: IMPORT_LOCK_ID },
      select: {
        status: true,
        lockedUntil: true,
        lastCompletedAt: true,
        lastError: true,
      },
    });

    const running = Boolean(
      state &&
      (state.status === "queued" || state.status === "running") &&
      state.lockedUntil &&
      state.lockedUntil.getTime() > Date.now()
    );

    return {
      running,
      configured: true,
      lastCompletedAt: state?.lastCompletedAt ?? await getLastImportedCarSyncAt(),
      lastError: state?.lastError ?? null,
    };
  } catch (error) {
    if (!isMissingImportStateTableError(error)) {
      throw error;
    }
    return {
      running: false,
      configured: false,
      lastCompletedAt: await getLastImportedCarSyncAt(),
      lastError: "AutoScout24 import state table is missing. Run prisma migrate deploy.",
    };
  }
}

export async function isAutoScoutImportRunning() {
  const status = await getAutoScoutImportStatus();
  return status.running;
}

export async function queueAutoScoutImport(now: Date = new Date()) {
  await prisma.autoScoutImportState.upsert({
    where: { id: IMPORT_LOCK_ID },
    update: {},
    create: {
      id: IMPORT_LOCK_ID,
      status: "idle",
    },
  });

  const result = await prisma.autoScoutImportState.updateMany({
    where: {
      id: IMPORT_LOCK_ID,
      OR: [
        { status: "idle" },
        { lockedUntil: null },
        { lockedUntil: { lt: now } },
      ],
    },
    data: {
      ownerId: null,
      status: "queued",
      startedAt: now,
      heartbeatAt: now,
      lockedUntil: new Date(now.getTime() + IMPORT_QUEUE_GRACE_MS),
      lastError: null,
    },
  });

  if (result.count === 0) {
    throw new AutoScoutImportLockError();
  }
}

async function acquireAutoScoutImportLease(now: Date) {
  await prisma.autoScoutImportState.upsert({
    where: { id: IMPORT_LOCK_ID },
    update: {},
    create: {
      id: IMPORT_LOCK_ID,
      status: "idle",
    },
  });

  const ownerId = crypto.randomUUID();
  const lockedUntil = new Date(now.getTime() + IMPORT_LOCK_LEASE_MS);

  const result = await prisma.autoScoutImportState.updateMany({
    where: {
      id: IMPORT_LOCK_ID,
      OR: [
        { status: "queued", ownerId: null },
        { status: "idle" },
        { lockedUntil: null },
        { lockedUntil: { lt: now } },
      ],
    },
    data: {
      ownerId,
      status: "running",
      startedAt: now,
      heartbeatAt: now,
      lockedUntil,
      lastError: null,
    },
  });

  if (result.count === 0) {
    throw new AutoScoutImportLockError();
  }

  return ownerId;
}

async function heartbeatAutoScoutImportLease(ownerId: string) {
  const now = new Date();
  const result = await prisma.autoScoutImportState.updateMany({
    where: {
      id: IMPORT_LOCK_ID,
      ownerId,
      status: "running",
    },
    data: {
      heartbeatAt: now,
      lockedUntil: new Date(now.getTime() + IMPORT_LOCK_LEASE_MS),
    },
  });

  if (result.count === 0) {
    throw new AutoScoutImportLockError();
  }
}

async function releaseAutoScoutImportLease(input: {
  ownerId: string;
  error?: unknown;
}) {
  const now = new Date();
  await prisma.autoScoutImportState.updateMany({
    where: {
      id: IMPORT_LOCK_ID,
      ownerId: input.ownerId,
    },
    data: {
      ownerId: null,
      status: "idle",
      lockedUntil: null,
      heartbeatAt: now,
      lastCompletedAt: input.error ? undefined : now,
      lastError: input.error ? errorMessage(input.error) : null,
    },
  });
}

async function withAutoScoutImportLock<T>(fn: () => Promise<T>) {
  const ownerId = await acquireAutoScoutImportLease(new Date());
  const heartbeat = setInterval(() => {
    void heartbeatAutoScoutImportLease(ownerId).catch((error) => {
      console.error("Failed to heartbeat AutoScout24 import lease:", error);
    });
  }, IMPORT_HEARTBEAT_INTERVAL_MS);
  heartbeat.unref?.();
  let failure: unknown;

  try {
    return await fn();
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    clearInterval(heartbeat);
    await releaseAutoScoutImportLease({
      ownerId,
      error: failure,
    });
  }
}

function parseSummaryTimestamp(value: string | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function shouldFetchListingDetail(summary: AutoScoutListingSummary, existingCar?: ExistingImportedCar) {
  if (!existingCar) return true;
  if (!isAutoScoutSourceOfTruth(existingCar.sourceOfTruth)) return true;

  const summaryTimestamp = parseSummaryTimestamp(summary.lastUpdatedAt);
  if (summaryTimestamp === null) return true;
  if (!existingCar.sourcePayloadUpdatedAt) return true;

  return existingCar.sourcePayloadUpdatedAt.getTime() < summaryTimestamp;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
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

async function deleteInactiveImportedCar(input: {
  existingCar: ExistingImportedCar;
  mapped: AutoScoutMappedCar;
  summary: AutoScoutImportSummary;
  dryRun: boolean;
}) {
  input.summary.deletedInactive += 1;
  input.summary.actions.push(`deleted inactive AutoScout24 listing ${input.mapped.autoscoutListingId} (${input.mapped.data.title})`);

  if (input.dryRun) return;

  input.summary.deletedImages += await deleteCarsAndR2Images([input.existingCar]);
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
          autoscoutSyncStatus: "synced",
          autoscoutSyncError: null,
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
          autoscoutSyncStatus: "synced",
          autoscoutSyncError: null,
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
  const mappedListings = await mapWithConcurrency(
    summaries,
    IMPORT_DETAIL_FETCH_CONCURRENCY,
    async (listingSummary) => {
      const existingCar = input.existingByListingId.get(listingSummary.id);
      if (!shouldFetchListingDetail(listingSummary, existingCar)) {
        input.summary.reusedExisting += 1;
        return null;
      }

      try {
        const listing = await input.client.getListing(input.customerId, listingSummary.id);
        input.summary.fetchedDetails += 1;
        return mapAutoScoutListingToCar({
          listing: listing as AutoScoutListing,
          customerId: input.customerId,
          references: input.references,
          now: input.now,
          existingSoldAt: existingCar?.soldAt ?? null,
        });
      } catch (error) {
        input.summary.failures.push({
          listingId: listingSummary.id,
          message: errorMessage(error),
        });
        return null;
      }
    },
  );

  return {
    fetchedListingIds: new Set(summaries.map((listing) => listing.id)),
    mappedListings: mappedListings.filter((listing): listing is AutoScoutMappedCar => Boolean(listing)),
  };
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
        sourceOfTruth: AUTOSCOUT_SOURCE_OF_TRUTH,
        sold: true,
        reserved: false,
        soldAt: car.soldAt ?? input.now,
        publicationStatus: "Missing from AutoScout24",
        availabilityStatus: "Missing from AutoScout24",
        lastSyncedAt: input.now,
        autoscoutSyncStatus: "synced",
        autoscoutSyncError: null,
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
  return withAutoScoutImportLock(async () => {
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
    const { mappedListings, fetchedListingIds } = await fetchAndMapListings({
      client,
      customerId,
      references: referenceIndex,
      existingByListingId,
      summary,
      now,
    });

    const shouldWriteFetchedListings =
      options.resetTestInventory ||
      options.createOnlyFromAutoscout ||
      options.overwriteFromAutoscout !== false;

    for (const mapped of mappedListings) {
      const existingCar = existingByListingId.get(mapped.autoscoutListingId);
      try {
        if (!mapped.isActive) {
          if (!existingCar) {
            summary.skipped += 1;
            summary.actions.push(`skipped inactive AutoScout24 listing ${mapped.autoscoutListingId} (${mapped.data.title})`);
            continue;
          }

          await deleteInactiveImportedCar({
            existingCar,
            mapped,
            summary,
            dryRun,
          });
          continue;
        }

        if (options.createOnlyFromAutoscout && existingCar) {
          summary.skipped += 1;
          summary.actions.push(`skipped existing ${mapped.autoscoutListingId} (${mapped.data.title})`);
          continue;
        }

        if (!shouldWriteFetchedListings) {
          summary.skipped += 1;
          summary.actions.push(`skipped ${mapped.autoscoutListingId} (${mapped.data.title})`);
          continue;
        }

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

    if (summary.reusedExisting > 0) {
      summary.actions.push(`reused ${summary.reusedExisting} unchanged AutoScout24 listings without refetching details`);
    }

    if (!options.resetTestInventory && !options.createOnlyFromAutoscout && shouldWriteFetchedListings) {
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

    if (summary.failures.length > 0) {
      throw new AutoScoutImportPartialFailureError(summary);
    }

    return summary;
  });
}
