import { Prisma } from "@/generated/prisma/client";
import type { AutoScoutListingPayload, AutoScoutReferenceIndex } from "./types";

const HP_TO_KW = 0.73549875;
const DEFAULT_VEHICLE_TYPE = "C";
const DEFAULT_OFFER_TYPE = "U";
const DEFAULT_AVAILABILITY_TYPE = 1;
const DEFAULT_PUBLICATION_CHANNEL = "AS24" as const;
const FUEL_TYPE_FALLBACK_IDS = {
  gasoline: "2",
  diesel: "7",
  electric: "12",
  cng: "10",
  lpg: "9",
  hydrogen: "13",
  ethanol: "16",
} as const;

type JsonRecord = Record<string, unknown>;

export type AutoScoutSyncImageInput = {
  id: string;
  url: string;
  sortOrder: number;
  autoscoutImageId?: string | null;
  sourceMd5?: string | null;
};

export type AutoScoutSyncCarInput = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  price: number;
  horsepower: number;
  color: string;
  description: string;
  sold: boolean;
  reserved: boolean;
  carpass_url?: string | null;
  features: string[];
  autoscoutListingId?: string | null;
  makeCode?: string | null;
  modelCode?: string | null;
  offerTypeCode?: string | null;
  availabilityTypeCode?: string | null;
  version?: string | null;
  bodyTypeCode?: string | null;
  vehicleTypeCode?: string | null;
  fuelTypeCode?: string | null;
  fuelCategory?: string | null;
  transmissionCode?: string | null;
  drivetrainCode?: string | null;
  powerKw?: number | null;
  engineSize?: number | null;
  cylinderCount?: number | null;
  firstRegistrationDate?: Date | string | null;
  firstRegistrationRaw?: string | null;
  constructionYear?: number | null;
  doors?: number | null;
  seats?: number | null;
  exteriorColorCode?: string | null;
  manufacturerColorName?: string | null;
  interiorColorCode?: string | null;
  upholsteryCode?: string | null;
  emissionClassCode?: string | null;
  co2Emissions?: number | null;
  consumptionCombined?: number | null;
  consumption?: Prisma.JsonValue | null;
  wltp?: Prisma.JsonValue | null;
  priceCurrency?: string | null;
  netPrice?: number | null;
  vatRate?: number | null;
  vatDeductible?: boolean | null;
  priceNegotiable?: boolean | null;
  warrantyMonths?: number | null;
  hasWarranty?: boolean | null;
  referenceNumber?: string | null;
  crossReferenceId?: string | null;
  vin?: string | null;
  licencePlate?: string | null;
  equipmentCodes: string[];
  technicalData?: Prisma.JsonValue | null;
  sourcePayload?: Prisma.JsonValue | null;
  images: AutoScoutSyncImageInput[];
};

export type AutoScoutPayloadBuildResult = {
  payload?: AutoScoutListingPayload;
  errors: string[];
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function intOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(/\s/g, ""));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function rawField(sourcePayload: Prisma.JsonValue | null | undefined, key: string) {
  return isRecord(sourcePayload) ? sourcePayload[key] : undefined;
}

function rawNested(sourcePayload: Prisma.JsonValue | null | undefined, objectKey: string, key: string) {
  const object = rawField(sourcePayload, objectKey);
  return isRecord(object) ? object[key] : undefined;
}

function jsonObjectOrUndefined(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function firstRegistrationRaw(car: AutoScoutSyncCarInput) {
  const raw = trimOrNull(car.firstRegistrationRaw ?? rawField(car.sourcePayload, "firstRegistrationDate"));
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;

  const date = car.firstRegistrationDate ? new Date(car.firstRegistrationDate) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  if (Number.isInteger(car.year) && car.year >= 1886) {
    return `${car.year}-01`;
  }

  return null;
}

function validProductionYear(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return validProductionYear(value.getUTCFullYear());
  }

  const raw = trimOrNull(value);
  if (!raw) return null;

  const compact = raw.replace(/\s/g, "");
  const candidate = /^\d{4}$/.test(compact)
    ? compact
    : compact.match(/^(\d{4})-\d{2}/)?.[1] ?? null;

  if (!candidate) return null;

  const year = Number(candidate);
  const maxYear = new Date().getFullYear() + 2;
  if (!Number.isInteger(year) || year < 1886 || year > maxYear) return null;

  return candidate;
}

function productionYear(car: AutoScoutSyncCarInput) {
  return validProductionYear(car.constructionYear)
    ?? validProductionYear(rawField(car.sourcePayload, "productionYear"))
    ?? validProductionYear(rawField(car.sourcePayload, "constructionYear"))
    ?? validProductionYear(car.year);
}

function compactString(value: string | null | undefined, maxLength: number) {
  const trimmed = trimOrNull(value);
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function resolveMakeCode(car: AutoScoutSyncCarInput, references: AutoScoutReferenceIndex) {
  return trimOrNull(car.makeCode)
    ?? trimOrNull(rawField(car.sourcePayload, "make"))
    ?? references.getMakeId(car.brand);
}

function resolveModelCode(car: AutoScoutSyncCarInput, makeCode: string | null, references: AutoScoutReferenceIndex) {
  return trimOrNull(car.modelCode)
    ?? trimOrNull(rawField(car.sourcePayload, "model"))
    ?? references.getModelId(makeCode, car.model);
}

function resolveReferenceCode(input: {
  explicit?: string | null;
  sourcePayload?: Prisma.JsonValue | null;
  rawKey?: string;
  referenceType: string;
  label?: string | null;
  references: AutoScoutReferenceIndex;
  fallback?: string | null;
}) {
  return trimOrNull(input.explicit)
    ?? (input.rawKey ? trimOrNull(rawField(input.sourcePayload, input.rawKey)) : null)
    ?? input.references.getReferenceId(input.referenceType, input.label)
    ?? input.fallback
    ?? null;
}

function resolveAvailabilityType(car: AutoScoutSyncCarInput) {
  return intOrNull(car.availabilityTypeCode)
    ?? intOrNull(rawNested(car.sourcePayload, "availability", "availabilityType"))
    ?? DEFAULT_AVAILABILITY_TYPE;
}

function resolveReferenceByLabels(
  references: AutoScoutReferenceIndex,
  referenceType: string,
  labels: string[],
  fallback?: string,
) {
  for (const label of labels) {
    const id = references.getReferenceId(referenceType, label);
    if (id) return id;
  }
  return fallback ?? null;
}

function inferFuelKind(car: AutoScoutSyncCarInput): keyof typeof FUEL_TYPE_FALLBACK_IDS | null {
  const haystack = [
    car.fuel_type,
    car.fuelCategory,
    rawField(car.sourcePayload, "fuelCategory"),
    rawField(car.sourcePayload, "primaryFuelType"),
  ].map(normalizeSearchValue).join(" ");

  if (!haystack.trim()) return null;
  if (/\bcng\b|aardgas|natural gas|gaz naturel/.test(haystack)) return "cng";
  if (/\blpg\b|\bgpl\b|petroleum/.test(haystack)) return "lpg";
  if (/waterstof|hydrogen|hydrogene|hydrogenium/.test(haystack)) return "hydrogen";
  if (/ethanol|e85/.test(haystack)) return "ethanol";
  if (/diesel|gasoil/.test(haystack)) return "diesel";
  if (/elektrisch diesel|electric diesel|electrique diesel/.test(haystack)) return "diesel";
  if (/elektr|electric|electrique|stroom/.test(haystack) && !/(benz|essence|gasoline|petrol|hybrid|hybride)/.test(haystack)) return "electric";
  if (/benz|essence|gasoline|petrol|super|hybrid|hybride|plug/.test(haystack)) return "gasoline";

  return null;
}

function resolvePrimaryFuelType(car: AutoScoutSyncCarInput, references: AutoScoutReferenceIndex) {
  const explicit = intOrNull(resolveReferenceCode({
    explicit: car.fuelTypeCode,
    sourcePayload: car.sourcePayload,
    rawKey: "primaryFuelType",
    referenceType: "FuelType",
    label: car.fuel_type,
    references,
  }));
  if (explicit) return explicit;

  const fuelKind = inferFuelKind(car);
  if (!fuelKind) return null;

  const labelsByKind: Record<keyof typeof FUEL_TYPE_FALLBACK_IDS, string[]> = {
    gasoline: ["Super 95", "Benzine", "Essence", "Gasoline"],
    diesel: ["Diesel"],
    electric: ["Stroom", "Elektrisch", "Électrique", "Electricity", "Electric"],
    cng: ["Aardgas H", "Gaz naturel H", "Domestic gas H", "CNG"],
    lpg: ["Lpg", "GPL", "Liquid petroleum gas (LPG)", "LPG"],
    hydrogen: ["Hydrogenium", "Hydrogène", "Hydrogen"],
    ethanol: ["Ethanol"],
  };

  return intOrNull(resolveReferenceByLabels(
    references,
    "FuelType",
    labelsByKind[fuelKind],
    FUEL_TYPE_FALLBACK_IDS[fuelKind],
  ));
}

function resolveFuelCategory(car: AutoScoutSyncCarInput, references: AutoScoutReferenceIndex) {
  const explicit = trimOrNull(car.fuelCategory ?? rawField(car.sourcePayload, "fuelCategory"));
  if (!explicit) return null;
  if (references.getReferenceName("FuelCategory", explicit)) return explicit;
  const referenceId = references.getReferenceId("FuelCategory", explicit);
  if (referenceId) return referenceId;

  const normalized = normalizeSearchValue(explicit);
  if (/elektr|electric|electrique|plug|hybrid|hybride/.test(normalized) && /diesel/.test(normalized)) return "3";
  if (/elektr|electric|electrique|plug|hybrid|hybride/.test(normalized) && /(benz|essence|gasoline|petrol)/.test(normalized)) return "2";
  if (/plug|hybrid|hybride/.test(normalized)) return "2";
  if (/elektr|electric|electrique/.test(normalized)) return "E";
  if (/diesel/.test(normalized)) return "D";
  if (/benz|essence|gasoline|petrol|super/.test(normalized)) return "B";
  if (/\bcng\b|aardgas|natural gas|gaz naturel/.test(normalized)) return "C";
  if (/\blpg\b|\bgpl\b/.test(normalized)) return "L";
  if (/waterstof|hydrogen|hydrogene/.test(normalized)) return "H";
  if (/ethanol/.test(normalized)) return "M";

  return explicit;
}

function numericEquipmentCodes(car: AutoScoutSyncCarInput, references: AutoScoutReferenceIndex) {
  const fromCodes = car.equipmentCodes
    .map((code) => intOrNull(code))
    .filter((code): code is number => code !== null);
  const fromLabels = car.features
    .map((feature) => intOrNull(references.getReferenceId("Equipment", feature)))
    .filter((code): code is number => code !== null);
  return [...new Set([...fromCodes, ...fromLabels])];
}

function buildDescription(car: AutoScoutSyncCarInput) {
  const description = trimOrNull(car.description) ?? car.title;
  const featureLines = car.features.length > 0
    ? `\n\nUitrusting:\n${car.features.map((feature) => `* ${feature}`).join("\n")}`
    : "";
  return `${description}${featureLines}`.slice(0, 10000);
}

export function buildAutoScoutListingPayload(input: {
  car: AutoScoutSyncCarInput;
  references: AutoScoutReferenceIndex;
  imageIds: string[];
}): AutoScoutPayloadBuildResult {
  const { car, references } = input;
  const errors: string[] = [];

  if (car.sold) {
    errors.push("Verkochte voertuigen worden van AutoScout24 verwijderd en niet opnieuw gepubliceerd.");
  }

  const makeCode = resolveMakeCode(car, references);
  const make = intOrNull(makeCode);
  if (!make) errors.push("AutoScout24 merk-ID ontbreekt of is ongeldig.");

  const vehicleType = resolveReferenceCode({
    explicit: car.vehicleTypeCode,
    sourcePayload: car.sourcePayload,
    rawKey: "vehicleType",
    referenceType: "VehicleType",
    references,
    fallback: DEFAULT_VEHICLE_TYPE,
  }) ?? DEFAULT_VEHICLE_TYPE;

  const modelCode = resolveModelCode(car, makeCode, references);
  const model = intOrNull(modelCode);
  if ((vehicleType === "C" || vehicleType === "B") && !model) {
    errors.push("AutoScout24 model-ID ontbreekt of is ongeldig.");
  }

  const offerType = resolveReferenceCode({
    explicit: car.offerTypeCode,
    sourcePayload: car.sourcePayload,
    rawKey: "offerType",
    referenceType: "OfferType",
    references,
    fallback: DEFAULT_OFFER_TYPE,
  }) ?? DEFAULT_OFFER_TYPE;

  const bodyType = intOrNull(resolveReferenceCode({
    explicit: car.bodyTypeCode,
    sourcePayload: car.sourcePayload,
    rawKey: "bodyType",
    referenceType: "BodyType",
    references,
  }));
  if (!bodyType) errors.push("AutoScout24 koetswerktype ontbreekt.");

  const firstRegistrationDate = firstRegistrationRaw(car);
  if ((offerType === "U" || offerType === "J" || offerType === "S" || offerType === "O") && !firstRegistrationDate) {
    errors.push("Eerste inschrijving ontbreekt.");
  }
  const productionYearValue = productionYear(car);
  if (!productionYearValue) errors.push("Productiejaar moet een geldig jaartal in formaat yyyy zijn.");

  if (!Number.isFinite(car.price) || car.price <= 0) errors.push("Prijs moet groter zijn dan 0.");
  if (!Number.isFinite(car.mileage) || car.mileage < 0) errors.push("Kilometerstand is ongeldig.");
  if (input.imageIds.length === 0) errors.push("Minstens één foto is nodig voor AutoScout24.");

  const primaryFuelType = resolvePrimaryFuelType(car, references);
  if (!primaryFuelType) errors.push("AutoScout24 brandstoftype ontbreekt.");
  const fuelCategory = resolveFuelCategory(car, references);

  const transmission = resolveReferenceCode({
    explicit: car.transmissionCode,
    sourcePayload: car.sourcePayload,
    rawKey: "transmission",
    referenceType: "Transmission",
    label: car.transmission,
    references,
  });
  if (!transmission) errors.push("AutoScout24 transmissie ontbreekt.");

  if (errors.length > 0 || !make) return { errors };

  const publicPrice = {
    price: car.price,
    currency: trimOrNull(car.priceCurrency) ?? "EUR",
    ...(car.netPrice !== null && car.netPrice !== undefined ? { netPrice: car.netPrice } : {}),
    ...(car.vatRate !== null && car.vatRate !== undefined ? { vatRate: car.vatRate } : {}),
    ...(car.priceNegotiable !== null && car.priceNegotiable !== undefined ? { isNegotiable: car.priceNegotiable } : {}),
    ...(car.vatDeductible !== null && car.vatDeductible !== undefined ? { isTaxDeductible: car.vatDeductible } : {}),
  };

  const consumption = jsonObjectOrUndefined(car.consumption) ?? (
    car.consumptionCombined ? { combined: car.consumptionCombined } : undefined
  );
  const technicalData = jsonObjectOrUndefined(car.technicalData);
  const condition = isRecord(technicalData?.condition) ? technicalData.condition : undefined;

  const payload: AutoScoutListingPayload = {
    availability: { availabilityType: resolveAvailabilityType(car) },
    make,
    ...(model ? { model } : { modelName: car.model.slice(0, 50) }),
    ...(compactString(car.version, 121) ? { modelVersion: compactString(car.version, 121) } : {}),
    vehicleType,
    offerType,
    ...(compactString(car.referenceNumber, 50) ? { offerReferenceId: compactString(car.referenceNumber, 50) } : {}),
    crossReferenceId: compactString(car.crossReferenceId, 50) ?? car.id.slice(0, 50),
    ...(compactString(car.vin, 17)?.length === 17 ? { vin: compactString(car.vin, 17) } : {}),
    ...(compactString(car.licencePlate, 10) ? { licencePlate: compactString(car.licencePlate, 10) } : {}),
    mileage: Math.max(0, Math.trunc(car.mileage)),
    ...(firstRegistrationDate ? { firstRegistrationDate } : {}),
    productionYear: productionYearValue!,
    power: car.powerKw ?? Math.max(1, Math.round(car.horsepower * HP_TO_KW)),
    ...(car.engineSize ? { cylinderCapacity: car.engineSize } : {}),
    ...(car.cylinderCount ? { cylinderCount: car.cylinderCount } : {}),
    primaryFuelType: primaryFuelType!,
    ...(fuelCategory ? { fuelCategory } : {}),
    transmission: transmission!,
    ...(trimOrNull(car.drivetrainCode ?? rawField(car.sourcePayload, "drivetrain")) ? { drivetrain: trimOrNull(car.drivetrainCode ?? rawField(car.sourcePayload, "drivetrain"))! } : {}),
    bodyType: bodyType!,
    ...(intOrNull(car.exteriorColorCode ?? rawField(car.sourcePayload, "bodyColor")) ? { bodyColor: intOrNull(car.exteriorColorCode ?? rawField(car.sourcePayload, "bodyColor"))! } : {}),
    bodyColorName: (compactString(car.manufacturerColorName, 30) ?? compactString(car.color, 30))!,
    ...(intOrNull(car.interiorColorCode ?? rawField(car.sourcePayload, "upholsteryColor")) ? { upholsteryColor: intOrNull(car.interiorColorCode ?? rawField(car.sourcePayload, "upholsteryColor"))! } : {}),
    ...(trimOrNull(car.upholsteryCode ?? rawField(car.sourcePayload, "upholsteryType")) ? { upholsteryType: trimOrNull(car.upholsteryCode ?? rawField(car.sourcePayload, "upholsteryType"))! } : {}),
    ...(car.doors ? { doorCount: car.doors } : {}),
    ...(car.seats ? { seatCount: car.seats } : {}),
    ...(car.co2Emissions ? { co2Emissions: car.co2Emissions } : {}),
    ...(consumption ? { consumption } : {}),
    ...(jsonObjectOrUndefined(car.wltp) ? { wltp: jsonObjectOrUndefined(car.wltp) } : {}),
    ...(trimOrNull(car.emissionClassCode ?? rawField(car.sourcePayload, "euEmissionStandard")) ? { euEmissionStandard: trimOrNull(car.emissionClassCode ?? rawField(car.sourcePayload, "euEmissionStandard"))! } : {}),
    description: buildDescription(car),
    ...(trimOrNull(car.carpass_url) ? { belgianCarpassMileageUrl: trimOrNull(car.carpass_url)! } : {}),
    ...(numericEquipmentCodes(car, references).length > 0 ? { equipment: numericEquipmentCodes(car, references) } : {}),
    ...(condition ? { condition } : {}),
    ...(car.warrantyMonths !== null && car.warrantyMonths !== undefined ? { warranty: car.warrantyMonths } : {}),
    ...(boolOrUndefined(car.hasWarranty) !== undefined ? { hasWarranty: car.hasWarranty! } : {}),
    images: input.imageIds.map((id) => ({ id })),
    prices: {
      public: publicPrice,
      dealer: {
        price: car.price,
        currency: trimOrNull(car.priceCurrency) ?? "EUR",
      },
    },
    publication: {
      status: car.reserved ? "Inactive" : "Active",
      channels: [{ id: DEFAULT_PUBLICATION_CHANNEL }],
    },
  };

  return { payload, errors };
}
