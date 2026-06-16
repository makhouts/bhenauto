import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { AutoScoutClient } from "./client";
import { buildReferenceIndex, IMPORT_REFERENCE_TYPES } from "./references";
import type { AutoScoutMake, AutoScoutModel, AutoScoutReference } from "./types";

const MAKE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cachedReferenceNames(reference: {
  referenceId: string;
  referenceType: string;
  nameNl?: string | null;
  nameFr?: string | null;
  nameEn?: string | null;
}) {
  const names = [
    reference.nameNl,
    reference.nameFr,
    reference.nameEn,
    reference.referenceId,
  ]
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name));

  return [...new Set(names)];
}

function cachedReferencesToApiReferences(references: Array<{
  referenceType: string;
  referenceId: string;
  nameNl?: string | null;
  nameFr?: string | null;
  nameEn?: string | null;
  vehicleTypes: string[];
  countries: string[];
}>): AutoScoutReference[] {
  return references.flatMap((reference) => cachedReferenceNames(reference).map((name) => ({
    id: reference.referenceId,
    name,
    referenceType: reference.referenceType,
    vehicleType: reference.vehicleTypes,
    country: reference.countries,
  })));
}

function cachedModels(models: Prisma.JsonValue): AutoScoutModel[] {
  if (!Array.isArray(models)) return [];

  return models.flatMap((model) => {
    if (!model || typeof model !== "object" || Array.isArray(model)) return [];
    if (typeof model.id !== "number" || typeof model.name !== "string") return [];
    return [{
      id: model.id,
      name: model.name,
      ...(typeof model.vehicleType === "string" ? { vehicleType: model.vehicleType } : {}),
    }];
  });
}

function cachedMakesToApiMakes(makes: Array<{
  makeId: string;
  name: string;
  models: Prisma.JsonValue;
  vehicleTypes: string[];
}>): AutoScoutMake[] {
  return makes.map((make) => ({
    id: Number(make.makeId),
    name: make.name,
    models: cachedModels(make.models),
    vehicleTypes: make.vehicleTypes,
  }));
}

function isMakeCacheFresh(makes: Array<{ refreshedAt: Date }>, now = new Date()) {
  if (makes.length === 0) return false;
  const cutoff = now.getTime() - MAKE_CACHE_TTL_MS;
  return makes.some((make) => make.refreshedAt.getTime() >= cutoff);
}

export async function getCachedAutoScoutMakes(client: AutoScoutClient): Promise<AutoScoutMake[]> {
  const cachedMakes = await prisma.autoScoutMakeCache.findMany({
    orderBy: { name: "asc" },
  });

  if (isMakeCacheFresh(cachedMakes)) {
    return cachedMakesToApiMakes(cachedMakes);
  }

  try {
    const makes = await client.getMakes();
    if (makes.length === 0 && cachedMakes.length > 0) {
      return cachedMakesToApiMakes(cachedMakes);
    }

    const refreshedAt = new Date();
    await prisma.$transaction([
      prisma.autoScoutMakeCache.deleteMany(),
      prisma.autoScoutMakeCache.createMany({
        data: makes.map((make) => ({
          makeId: String(make.id),
          name: make.name,
          models: make.models as Prisma.InputJsonValue,
          vehicleTypes: make.vehicleTypes ?? [],
          refreshedAt,
        })),
      }),
    ]);

    return makes;
  } catch (error) {
    if (cachedMakes.length > 0) return cachedMakesToApiMakes(cachedMakes);
    throw error;
  }
}

function localizedReferenceName(reference: {
  referenceId: string;
  nameNl?: string | null;
  nameFr?: string | null;
  nameEn?: string | null;
}, culture: string) {
  if (culture.toLowerCase().startsWith("fr")) {
    return reference.nameFr ?? reference.nameNl ?? reference.nameEn ?? reference.referenceId;
  }
  if (culture.toLowerCase().startsWith("en")) {
    return reference.nameEn ?? reference.nameNl ?? reference.nameFr ?? reference.referenceId;
  }
  return reference.nameNl ?? reference.nameFr ?? reference.nameEn ?? reference.referenceId;
}

export async function getCachedAutoScoutReferences(
  client: AutoScoutClient,
  referenceTypes: readonly string[] = IMPORT_REFERENCE_TYPES,
): Promise<AutoScoutReference[]> {
  const cachedReferences = await prisma.autoScoutReference.findMany({
    where: { referenceType: { in: [...referenceTypes] } },
    orderBy: [{ referenceType: "asc" }, { referenceId: "asc" }],
  });
  const cachedTypes = new Set(cachedReferences.map((reference) => reference.referenceType));

  if (referenceTypes.every((referenceType) => cachedTypes.has(referenceType))) {
    return cachedReferences.map((reference) => ({
      id: reference.referenceId,
      name: localizedReferenceName(reference, client.culture),
      referenceType: reference.referenceType,
      vehicleType: reference.vehicleTypes,
      country: reference.countries,
    }));
  }

  return client.getReferences([...referenceTypes]);
}

export async function getAutoScoutReferenceIndex(client: AutoScoutClient) {
  const [cachedReferences, makes] = await Promise.all([
    prisma.autoScoutReference.findMany({
      where: { referenceType: { in: [...IMPORT_REFERENCE_TYPES] } },
      orderBy: [{ referenceType: "asc" }, { referenceId: "asc" }],
    }),
    getCachedAutoScoutMakes(client),
  ]);

  if (cachedReferences.length > 0) {
    return buildReferenceIndex(cachedReferencesToApiReferences(cachedReferences), makes);
  }

  const liveReferences = await client.getReferences([...IMPORT_REFERENCE_TYPES]);
  return buildReferenceIndex(liveReferences, makes);
}
