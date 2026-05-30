import "server-only";

import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";

function normalizeLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = normalizeLabel(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function localizedName(
  reference: { nameNl: string | null; nameFr: string | null; nameEn: string | null },
  locale: Locale,
) {
  if (locale === "nl") return reference.nameNl ?? reference.nameFr ?? reference.nameEn;
  if (locale === "fr") return reference.nameFr ?? reference.nameNl ?? reference.nameEn;
  return reference.nameEn ?? reference.nameNl ?? reference.nameFr;
}

export async function getTranslatedEquipmentOptions(
  equipmentCodes: string[] | null | undefined,
  locale: Locale,
  fallbackFeatures: string[] | null | undefined = [],
) {
  const codes = uniqueNonEmpty(equipmentCodes ?? []);
  const fallback = uniqueNonEmpty(fallbackFeatures ?? []);

  if (codes.length === 0) return fallback;

  const references = await prisma.autoScoutReference.findMany({
    where: {
      referenceType: "Equipment",
      referenceId: { in: codes },
    },
    select: {
      referenceId: true,
      nameNl: true,
      nameFr: true,
      nameEn: true,
    },
  });

  const referencesById = new Map(references.map((reference) => [reference.referenceId, reference]));
  const knownReferenceLabels = new Set<string>();
  for (const reference of references) {
    for (const name of [reference.nameNl, reference.nameFr, reference.nameEn]) {
      if (name) knownReferenceLabels.add(normalizeLabel(name));
    }
  }

  const translated = codes
    .map((code) => {
      const reference = referencesById.get(code);
      return reference ? localizedName(reference, locale) : null;
    })
    .filter((value): value is string => Boolean(value?.trim()));

  const customFallback = fallback.filter((feature) => !knownReferenceLabels.has(normalizeLabel(feature)));
  return uniqueNonEmpty([...translated, ...customFallback]);
}
