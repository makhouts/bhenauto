import prisma from "@/lib/prisma";
import { createAutoScoutClientFromEnv } from "./client";
import { AUTOSCOUT_REFERENCE_TYPES } from "./references";
import type { AutoScoutReference } from "./types";

const CULTURES = [
  { culture: "nl-BE", field: "nameNl" },
  { culture: "fr-BE", field: "nameFr" },
  { culture: "en-GB", field: "nameEn" },
] as const;

type CultureField = (typeof CULTURES)[number]["field"];

export type AutoScoutReferenceSyncMode = "dry-run" | "apply";

export type AutoScoutReferenceSyncSummary = {
  mode: AutoScoutReferenceSyncMode;
  fetchedByCulture: Record<string, number>;
  upserted: number;
  failures: Array<{ culture: string; message: string }>;
  actions: string[];
};

type MergedReference = {
  referenceType: string;
  referenceId: string;
  nameNl?: string;
  nameFr?: string;
  nameEn?: string;
  vehicleTypes: string[];
  countries: string[];
};

function emptySummary(mode: AutoScoutReferenceSyncMode): AutoScoutReferenceSyncSummary {
  return {
    mode,
    fetchedByCulture: {},
    upserted: 0,
    failures: [],
    actions: [],
  };
}

function normalizeId(id: string | number | null | undefined) {
  return id === null || id === undefined ? "" : String(id);
}

function mergeArrayValues(...values: Array<string[] | undefined>) {
  return [...new Set(values.flatMap((value) => value ?? []).filter(Boolean))];
}

function mergeReference(
  merged: Map<string, MergedReference>,
  reference: AutoScoutReference,
  field: CultureField,
) {
  const referenceId = normalizeId(reference.id);
  if (!reference.referenceType || !referenceId) return;

  const key = `${reference.referenceType}:${referenceId}`;
  const current = merged.get(key) ?? {
    referenceType: reference.referenceType,
    referenceId,
    vehicleTypes: [],
    countries: [],
  };

  current[field] = reference.name;
  current.vehicleTypes = mergeArrayValues(current.vehicleTypes, reference.vehicleType);
  current.countries = mergeArrayValues(current.countries, reference.country);
  merged.set(key, current);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function syncAutoScoutReferences(
  mode: AutoScoutReferenceSyncMode = "dry-run",
): Promise<AutoScoutReferenceSyncSummary> {
  const summary = emptySummary(mode);
  const merged = new Map<string, MergedReference>();

  await Promise.all(CULTURES.map(async ({ culture, field }) => {
    try {
      const client = createAutoScoutClientFromEnv({ culture });
      const references = await client.getReferences([...AUTOSCOUT_REFERENCE_TYPES]);
      summary.fetchedByCulture[culture] = references.length;
      for (const reference of references) {
        mergeReference(merged, reference, field);
      }
    } catch (error) {
      summary.fetchedByCulture[culture] = 0;
      summary.failures.push({ culture, message: errorMessage(error) });
    }
  }));

  const references = [...merged.values()]
    .sort((a, b) => `${a.referenceType}:${a.referenceId}`.localeCompare(`${b.referenceType}:${b.referenceId}`));

  if (mode === "dry-run") {
    summary.upserted = references.length;
    summary.actions.push(`would upsert ${references.length} AutoScout24 reference rows`);
    return summary;
  }

  for (const reference of references) {
    await prisma.autoScoutReference.upsert({
      where: {
        referenceType_referenceId: {
          referenceType: reference.referenceType,
          referenceId: reference.referenceId,
        },
      },
      create: reference,
      update: {
        nameNl: reference.nameNl ?? null,
        nameFr: reference.nameFr ?? null,
        nameEn: reference.nameEn ?? null,
        vehicleTypes: reference.vehicleTypes,
        countries: reference.countries,
      },
    });
    summary.upserted += 1;
  }

  summary.actions.push(`upserted ${summary.upserted} AutoScout24 reference rows`);
  return summary;
}
