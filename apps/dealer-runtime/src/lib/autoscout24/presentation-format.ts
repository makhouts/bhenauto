import type { Locale } from "@/lib/i18n";

type LocalizedLabels = Record<Locale, string>;

type GlossaryEntry = {
  keys: string[];
  labels: LocalizedLabels;
};

const UNKNOWN_LABELS: LocalizedLabels = {
  nl: "Onbekend",
  fr: "Inconnu",
  en: "Unknown",
};

const FUEL_GLOSSARY: GlossaryEntry[] = [
  { keys: ["onbekend", "inconnu", "unknown"], labels: { nl: "Onbekend", fr: "Inconnu", en: "Unknown" } },
  { keys: ["benzine", "essence", "petrol", "gasoline"], labels: { nl: "Benzine", fr: "Essence", en: "Petrol" } },
  { keys: ["diesel"], labels: { nl: "Diesel", fr: "Diesel", en: "Diesel" } },
  { keys: ["elektrisch", "electrique", "electric"], labels: { nl: "Elektrisch", fr: "Electrique", en: "Electric" } },
  { keys: ["hybride", "hybride essence", "hybrid"], labels: { nl: "Hybride", fr: "Hybride", en: "Hybrid" } },
  { keys: ["plug in hybride", "plugin hybride", "hybride rechargeable", "plug in hybrid", "plugin hybrid", "plug-in hybride", "plug-in hybrid"], labels: { nl: "Plug-in Hybride", fr: "Hybride rechargeable", en: "Plug-in Hybrid" } },
  { keys: ["lpg"], labels: { nl: "LPG", fr: "LPG", en: "LPG" } },
  { keys: ["cng", "aardgas", "gaz naturel", "natural gas"], labels: { nl: "CNG", fr: "CNG", en: "CNG" } },
  { keys: ["waterstof", "hydrogene", "hydrogen"], labels: { nl: "Waterstof", fr: "Hydrogene", en: "Hydrogen" } },
  { keys: ["ethanol", "e85"], labels: { nl: "Ethanol", fr: "Ethanol", en: "Ethanol" } },
  { keys: ["andere", "autre", "other"], labels: { nl: "Andere", fr: "Autre", en: "Other" } },
];

const COLOR_GLOSSARY: GlossaryEntry[] = [
  { keys: ["onbekend", "inconnu", "unknown"], labels: { nl: "Onbekend", fr: "Inconnu", en: "Unknown" } },
  { keys: ["zwart", "noir", "black"], labels: { nl: "Zwart", fr: "Noir", en: "Black" } },
  { keys: ["wit", "blanc", "white"], labels: { nl: "Wit", fr: "Blanc", en: "White" } },
  { keys: ["grijs", "gris", "grey", "gray"], labels: { nl: "Grijs", fr: "Gris", en: "Grey" } },
  { keys: ["zilver", "argent", "silver"], labels: { nl: "Zilver", fr: "Argent", en: "Silver" } },
  { keys: ["blauw", "bleu", "blue"], labels: { nl: "Blauw", fr: "Bleu", en: "Blue" } },
  { keys: ["rood", "rouge", "red"], labels: { nl: "Rood", fr: "Rouge", en: "Red" } },
  { keys: ["groen", "vert", "green"], labels: { nl: "Groen", fr: "Vert", en: "Green" } },
  { keys: ["bruin", "marron", "brown"], labels: { nl: "Bruin", fr: "Marron", en: "Brown" } },
  { keys: ["beige"], labels: { nl: "Beige", fr: "Beige", en: "Beige" } },
  { keys: ["geel", "jaune", "yellow"], labels: { nl: "Geel", fr: "Jaune", en: "Yellow" } },
  { keys: ["goud", "or", "gold"], labels: { nl: "Goud", fr: "Or", en: "Gold" } },
  { keys: ["oranje", "orange"], labels: { nl: "Oranje", fr: "Orange", en: "Orange" } },
  { keys: ["paars", "violet", "purple"], labels: { nl: "Paars", fr: "Violet", en: "Purple" } },
  { keys: ["roze", "rose", "pink"], labels: { nl: "Roze", fr: "Rose", en: "Pink" } },
  { keys: ["brons", "bronze"], labels: { nl: "Brons", fr: "Bronze", en: "Bronze" } },
  { keys: ["turquoise"], labels: { nl: "Turquoise", fr: "Turquoise", en: "Turquoise" } },
  { keys: ["andere", "autre", "other"], labels: { nl: "Andere", fr: "Autre", en: "Other" } },
];

const TRANSMISSION_GLOSSARY: GlossaryEntry[] = [
  { keys: ["onbekend", "inconnu", "unknown"], labels: { nl: "Onbekend", fr: "Inconnu", en: "Unknown" } },
  { keys: ["automatisch", "automatique", "automatic"], labels: { nl: "Automatisch", fr: "Automatique", en: "Automatic" } },
  { keys: ["handgeschakeld", "manuelle", "manual"], labels: { nl: "Handgeschakeld", fr: "Manuelle", en: "Manual" } },
  { keys: ["semi automatisch", "semi-automatisch", "semi automatique", "semi-automatic"], labels: { nl: "Semi-automatisch", fr: "Semi-automatique", en: "Semi-automatic" } },
];

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function translateFromGlossary(
  value: string | null | undefined,
  locale: Locale,
  glossary: GlossaryEntry[],
): string | null {
  const source = value?.trim();
  if (!source) return null;

  const normalized = normalizeLabel(value);
  if (!normalized) return null;

  for (const entry of glossary) {
    if (entry.keys.includes(normalized)) {
      return entry.labels[locale];
    }
  }

  for (const separator of ["/", "+"]) {
    if (!source.includes(separator)) continue;
    const parts = source.split(separator).map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    return parts
      .map((part) => translateFromGlossary(part, locale, glossary) ?? part)
      .join(separator);
  }

  return null;
}

export function unknownVehicleLabel(locale: Locale) {
  return UNKNOWN_LABELS[locale];
}

export function translateFuelLabel(value: string | null | undefined, locale: Locale): string | null {
  return translateFromGlossary(value, locale, FUEL_GLOSSARY);
}

export function translateColorLabel(value: string | null | undefined, locale: Locale): string | null {
  return translateFromGlossary(value, locale, COLOR_GLOSSARY);
}

export function translateTransmissionLabel(value: string | null | undefined, locale: Locale): string | null {
  return translateFromGlossary(value, locale, TRANSMISSION_GLOSSARY);
}

export function normalizeVehicleDescription(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\+/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
