import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { AutoScoutApiError, createAutoScoutClientFromEnv } from "./client";
import { getAutoScoutReferenceIndex } from "./reference-cache";
import { buildAutoScoutListingPayload } from "./push-mapper";
import { ensureAutoScoutImageIds } from "./push-images";
import { hashAutoScoutPayload } from "./payload-hash";
import type { AutoScoutListing, AutoScoutListingPayload } from "./types";

const SOURCE = "autoscout24";

export type AutoScoutSyncResult = {
  ok: boolean;
  action?: "created" | "updated" | "patched" | "deleted" | "skipped";
  listingId?: string | null;
  payloadHash?: string | null;
  message?: string;
  errors?: string[];
};

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : value as Prisma.InputJsonValue;
}

function getAutoscoutUrl(listing: AutoScoutListing) {
  return listing.publication?.channels?.find((channel) => channel.id === "AS24" && channel.url)?.url
    ?? listing.publication?.channels?.find((channel) => channel.url)?.url
    ?? null;
}

function errorMessage(error: unknown) {
  if (error instanceof AutoScoutApiError) {
    const body = typeof error.body === "string" ? error.body : JSON.stringify(error.body);
    return body && body !== undefined ? `${error.message}: ${body}` : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

function isNotFound(error: unknown) {
  return error instanceof AutoScoutApiError && error.status === 404;
}

async function getClientAndCustomer(customerId?: string | null) {
  const client = createAutoScoutClientFromEnv();
  const resolvedCustomerId = await client.resolveCustomerId(customerId ?? process.env.AUTOSCOUT24_CUSTOMER_ID);
  return { client, customerId: resolvedCustomerId };
}

async function findListingIdByCrossReference(
  client: ReturnType<typeof createAutoScoutClientFromEnv>,
  customerId: string,
  crossReferenceId?: string,
) {
  if (!crossReferenceId) return null;
  const listings = await client.listListings(customerId);
  return listings.find((listing) => listing.crossReferenceId === crossReferenceId)?.id ?? null;
}

async function getCarForSync(carId: string) {
  return prisma.car.findUnique({
    where: { id: carId },
    include: {
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
}

async function recordSyncFailure(carId: string, message: string) {
  await prisma.car.update({
    where: { id: carId },
    data: {
      autoscoutSyncStatus: "failed",
      autoscoutSyncError: message.slice(0, 5000),
    },
  }).catch(() => undefined);
}

async function recordListingResult(input: {
  carId: string;
  customerId: string;
  listing: AutoScoutListing;
  payload?: AutoScoutListingPayload;
  payloadHash?: string | null;
  status: string;
}) {
  const now = new Date();
  const payloadData = input.payload
    ? {
        lastAutoscoutPayload: jsonValue(input.payload),
        lastAutoscoutPayloadHash: input.payloadHash ?? hashAutoScoutPayload(input.payload),
      }
    : {};

  await prisma.car.update({
    where: { id: input.carId },
    data: {
      sourceOfTruth: "website",
      externalSource: SOURCE,
      externalListingId: input.listing.id,
      autoscoutListingId: input.listing.id,
      autoscoutCustomerId: input.customerId,
      autoscoutUrl: getAutoscoutUrl(input.listing),
      autoscoutLastPushedAt: now,
      autoscoutSyncStatus: input.status,
      autoscoutSyncError: null,
      ...payloadData,
      publicationStatus: input.listing.publication?.status ?? null,
    },
  });
}

async function recordPayloadSkipped(carId: string, payload: AutoScoutListingPayload, payloadHash: string) {
  await prisma.car.update({
    where: { id: carId },
    data: {
      autoscoutSyncStatus: "synced",
      autoscoutSyncError: null,
      lastAutoscoutPayload: jsonValue(payload),
      lastAutoscoutPayloadHash: payloadHash,
    },
  });
}

export async function syncCarToAutoScout(carId: string): Promise<AutoScoutSyncResult> {
  const car = await getCarForSync(carId);
  if (!car) return { ok: false, message: "Voertuig niet gevonden." };

  try {
    const { client, customerId } = await getClientAndCustomer(car.autoscoutCustomerId);
    const references = await getAutoScoutReferenceIndex(client);
    const imageIds = await ensureAutoScoutImageIds({
      client,
      customerId,
      images: car.images.map((image) => ({
        id: image.id,
        url: image.url,
        sortOrder: image.sortOrder,
        autoscoutImageId: image.autoscoutImageId,
        sourceMd5: image.sourceMd5,
      })),
    });
    const result = buildAutoScoutListingPayload({ car, references, imageIds });

    if (!result.payload) {
      const message = result.errors.join(" ");
      await recordSyncFailure(car.id, message);
      return { ok: false, message, errors: result.errors };
    }

    const shouldCreate = !car.autoscoutListingId || car.publicationStatus === "Deleted from AutoScout24";
    const payloadHash = hashAutoScoutPayload(result.payload);

    if (!shouldCreate && car.lastAutoscoutPayloadHash === payloadHash) {
      await recordPayloadSkipped(car.id, result.payload, payloadHash);
      return {
        ok: true,
        action: "skipped",
        listingId: car.autoscoutListingId,
        payloadHash,
      };
    }

    let listing: AutoScoutListing;
    let action: "created" | "updated" = shouldCreate ? "created" : "updated";

    if (shouldCreate) {
      const reconciledListingId = await findListingIdByCrossReference(
        client,
        customerId,
        result.payload.crossReferenceId,
      );
      if (reconciledListingId) {
        listing = await client.updateListing(customerId, reconciledListingId, result.payload);
        action = "updated";
      } else {
        listing = await client.createListing(customerId, result.payload);
      }
    } else {
      try {
        listing = await client.updateListing(customerId, car.autoscoutListingId!, result.payload);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        listing = await client.createListing(customerId, result.payload);
        action = "created";
      }
    }

    await recordListingResult({
      carId: car.id,
      customerId,
      listing,
      payload: result.payload,
      payloadHash,
      status: "synced",
    });

    return { ok: true, action, listingId: listing.id, payloadHash };
  } catch (error) {
    const message = errorMessage(error);
    await recordSyncFailure(car.id, message);
    return { ok: false, message };
  }
}

export async function patchAutoScoutPublicationForCar(
  carId: string,
  status: "Active" | "Inactive",
): Promise<AutoScoutSyncResult> {
  const car = await getCarForSync(carId);
  if (!car) return { ok: false, message: "Voertuig niet gevonden." };

  if (!car.autoscoutListingId || car.publicationStatus === "Deleted from AutoScout24") {
    return syncCarToAutoScout(carId);
  }

  try {
    const { client, customerId } = await getClientAndCustomer(car.autoscoutCustomerId);
    const listing = await client.patchListing(customerId, car.autoscoutListingId, {
      publication: {
        status,
        channels: [{ id: "AS24" }],
      },
    });

    await recordListingResult({
      carId: car.id,
      customerId,
      listing,
      status: "synced",
    });

    return { ok: true, action: "patched", listingId: listing.id };
  } catch (error) {
    const message = errorMessage(error);
    await recordSyncFailure(car.id, message);
    return { ok: false, message };
  }
}

export async function deleteAutoScoutListingForCar(carId: string): Promise<AutoScoutSyncResult> {
  const car = await getCarForSync(carId);
  if (!car) return { ok: false, message: "Voertuig niet gevonden." };
  if (!car.autoscoutListingId) {
    await prisma.car.update({
      where: { id: car.id },
      data: {
        autoscoutSyncStatus: "deleted",
        autoscoutSyncError: null,
        publicationStatus: "Deleted from AutoScout24",
      },
    });
    return { ok: true, action: "skipped", listingId: null };
  }

  try {
    const { client, customerId } = await getClientAndCustomer(car.autoscoutCustomerId);
    try {
      await client.deleteListing(customerId, car.autoscoutListingId);
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }

    await prisma.car.update({
      where: { id: car.id },
      data: {
        autoscoutLastPushedAt: new Date(),
        autoscoutSyncStatus: "deleted",
        autoscoutSyncError: null,
        publicationStatus: "Deleted from AutoScout24",
      },
    });

    return { ok: true, action: "deleted", listingId: car.autoscoutListingId };
  } catch (error) {
    const message = errorMessage(error);
    await recordSyncFailure(car.id, message);
    return { ok: false, message };
  }
}

export async function deleteAutoScoutListingByIdentity(input: {
  customerId?: string | null;
  listingId?: string | null;
  crossReferenceId?: string | null;
}): Promise<AutoScoutSyncResult> {
  try {
    const { client, customerId } = await getClientAndCustomer(input.customerId);
    const listingId = input.listingId ?? await findListingIdByCrossReference(
      client,
      customerId,
      input.crossReferenceId ?? undefined,
    );
    if (!listingId) {
      return { ok: true, action: "skipped", listingId: null };
    }
    try {
      await client.deleteListing(customerId, listingId);
    } catch (error) {
      if (!isNotFound(error)) throw error;
    }

    return { ok: true, action: "deleted", listingId };
  } catch (error) {
    return { ok: false, message: errorMessage(error), listingId: input.listingId ?? null };
  }
}
