import { Prisma } from "@/generated/prisma/client";
import type { AutoScoutListingPayload, AutoScoutReferenceIndex } from "./types";
import {
  getAutoScoutValidationMessage,
  validateAutoScoutListingValues,
} from "./listing-validation";

const HP_TO_KW = 0.73549875;
const DEFAULT_VEHICLE_TYPE = "C";
const DEFAULT_OFFER_TYPE = "U";
const DEFAULT_AVAILABILITY_TYPE = 1;
const DEFAULT_PUBLICATION_CHANNEL = "AS24" as const;
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
  additionalFuelTypeCodes: string[];
  isPluginHybrid?: boolean | null;
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

function deriveModelVersionFromTitle(car: AutoScoutSyncCarInput) {
  const internalTitle = trimOrNull(car.title);
  const explicitVersion = compactString(car.version, 121);
  if (!internalTitle) return explicitVersion;

  const normalizedPrefix = normalizeSearchValue(`${car.brand} ${car.model}`);
  const normalizedTitle = normalizeSearchValue(internalTitle);

  if (!normalizedPrefix || !normalizedTitle.startsWith(normalizedPrefix)) {
    return compactString(internalTitle, 121);
  }

  const titleWithoutPrefix = internalTitle
    .replace(new RegExp(`^\\s*${car.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+${car.model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .replace(/^[-:/|]+/, "")
    .trim();

  return compactString(titleWithoutPrefix, 121) ?? explicitVersion ?? compactString(internalTitle, 121);
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

function resolvePrimaryFuelType(car: AutoScoutSyncCarInput, references: AutoScoutReferenceIndex) {
  return intOrNull(resolveReferenceCode({
    explicit: car.fuelTypeCode,
    sourcePayload: car.sourcePayload,
    rawKey: "primaryFuelType",
    referenceType: "FuelType",
    references,
  }));
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

function resolveAdditionalFuelTypes(car: AutoScoutSyncCarInput) {
  const structured = car.additionalFuelTypeCodes
    .map(intOrNull)
    .filter((code): code is number => code !== null);
  if (structured.length > 0) return [...new Set(structured)];

  const raw = rawField(car.sourcePayload, "additionalFuelTypes");
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(intOrNull).filter((code): code is number => code !== null))];
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
  const fuelCategory = resolveFuelCategory(car, references);
  if (!fuelCategory) errors.push("Brandstofcategorie ontbreekt.");
  const additionalFuelTypes = resolveAdditionalFuelTypes(car);
  const isPluginHybrid = car.isPluginHybrid ?? (
    typeof rawField(car.sourcePayload, "isPluginHybrid") === "boolean"
      ? rawField(car.sourcePayload, "isPluginHybrid") as boolean
      : undefined
  );
  const fuelTypes = [primaryFuelType, ...additionalFuelTypes].filter((fuelType): fuelType is number => fuelType !== null);
  if (isPluginHybrid && (!fuelTypes.includes(12) || !fuelTypes.some((fuelType) => fuelType !== 12))) {
    errors.push("Plug-in hybride vereist elektriciteit en minstens één bijkomend brandstoftype.");
  }

  const transmission = resolveReferenceCode({
    explicit: car.transmissionCode,
    sourcePayload: car.sourcePayload,
    rawKey: "transmission",
    referenceType: "Transmission",
    label: car.transmission,
    references,
  });
  if (!transmission) errors.push("AutoScout24 transmissie ontbreekt.");

  errors.push(...validateAutoScoutListingValues({
    ...car,
    makeCode,
    modelCode,
    vehicleTypeCode: vehicleType,
    offerTypeCode: offerType,
    availabilityTypeCode: String(resolveAvailabilityType(car)),
    firstRegistrationRaw: firstRegistrationDate,
    constructionYear: productionYearValue,
    bodyTypeCode: bodyType,
    fuelTypeCode: primaryFuelType,
    fuelCategory,
    additionalFuelTypeCodes: additionalFuelTypes.map(String),
    transmissionCode: transmission,
    powerKw: car.powerKw ?? Math.max(1, Math.round(car.horsepower * HP_TO_KW)),
    imageCount: input.imageIds.length,
  }).map((validationIssue) => getAutoScoutValidationMessage(validationIssue)));

  const uniqueErrors = [...new Set(errors)];
  if (uniqueErrors.length > 0 || !make) return { errors: uniqueErrors };

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
  const modelVersion = deriveModelVersionFromTitle(car);

  const payload: AutoScoutListingPayload = {
    availability: { availabilityType: resolveAvailabilityType(car) },
    make,
    ...(model ? { model } : { modelName: car.model.slice(0, 50) }),
    ...(modelVersion ? { modelVersion } : {}),
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
    ...(primaryFuelType ? { primaryFuelType } : {}),
    ...(additionalFuelTypes.length > 0 ? { additionalFuelTypes } : {}),
    ...(fuelCategory ? { fuelCategory } : {}),
    ...(isPluginHybrid !== undefined && isPluginHybrid !== null ? { isPluginHybrid } : {}),
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

  return { payload, errors: uniqueErrors };
}
