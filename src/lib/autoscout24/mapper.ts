import type {
  AutoScoutListing,
  AutoScoutMappedCar,
  AutoScoutReferenceIndex,
} from "./types";
import { normalizeVehicleDescription } from "./presentation-format";

const KW_TO_HP = 1.3596216173;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function intOrNull(value: unknown): number | null {
  const valueNumber = numberOrNull(value);
  return valueNumber === null ? null : Math.trunc(valueNumber);
}

function boolOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function compactJoin(values: Array<string | number | null | undefined>, separator = " ") {
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(separator);
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 240);
  return slug || "autoscout24-listing";
}

function parseFirstRegistration(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function deriveYear(listing: AutoScoutListing): number {
  if (Number.isInteger(listing.constructionYear) && listing.constructionYear! > 1900) {
    return listing.constructionYear!;
  }
  const firstRegistrationDate = parseFirstRegistration(listing.firstRegistrationDate);
  if (firstRegistrationDate) return firstRegistrationDate.getUTCFullYear();
  return new Date().getFullYear();
}

function normalizeFuelLabel(
  label: string | null,
  code: string | number | undefined,
  fuelCategory: string | null,
) {
  const lower = label?.toLowerCase() ?? "";
  const categoryLower = fuelCategory?.toLowerCase() ?? "";
  if (lower.includes("plug") || lower.includes("oplaad") || lower.includes("recharge")) return "Plug-in Hybride";
  if (categoryLower.includes("plug") || categoryLower.includes("oplaad") || categoryLower.includes("recharge")) return "Plug-in Hybride";
  if (lower.includes("hybr")) return "Hybride";
  if (categoryLower.includes("hybr")) return "Hybride";
  if (lower.includes("elektr") || lower.includes("electric")) return "Elektrisch";
  if (categoryLower.includes("elektr") || categoryLower.includes("electric")) return "Elektrisch";
  if (lower.includes("diesel")) return "Diesel";
  if (categoryLower.includes("diesel")) return "Diesel";
  if (lower.includes("benz") || lower.includes("essence") || lower.includes("petrol")) return "Benzine";
  if (categoryLower.includes("benz") || categoryLower.includes("essence") || categoryLower.includes("petrol")) return "Benzine";
  if (categoryLower.includes("lpg")) return "LPG";
  if (categoryLower.includes("cng") || categoryLower.includes("aardgas") || categoryLower.includes("natural gas")) return "CNG";
  if (categoryLower.includes("waterstof") || categoryLower.includes("hydrogen")) return "Waterstof";

  if (code === 12 || code === "12") return "Elektrisch";
  return label || fuelCategory || "Onbekend";
}

function normalizeTransmissionLabel(label: string | null, code: string | undefined) {
  const normalizedCode = code?.toUpperCase();
  if (normalizedCode === "A") return "Automatisch";
  if (normalizedCode === "M") return "Handgeschakeld";
  if (normalizedCode === "S") return "Semi-automatisch";

  const lower = label?.toLowerCase() ?? "";
  if (lower.includes("auto")) return "Automatisch";
  if (lower.includes("manual") || lower.includes("manueel") || lower.includes("hand")) return "Handgeschakeld";
  return label || "Onbekend";
}

function getPublicPrice(listing: AutoScoutListing) {
  return listing.prices?.public ?? listing.prices?.dealer ?? listing.prices?.manufacturersSuggestedRetail ?? {};
}

function getAutoscoutUrl(listing: AutoScoutListing) {
  return listing.publication?.channels?.find((channel) => channel.id === "AS24" && channel.url)?.url
    ?? listing.publication?.channels?.find((channel) => channel.url)?.url
    ?? null;
}

function getAvailabilityStatus(listing: AutoScoutListing, references: AutoScoutReferenceIndex) {
  const availability = isRecord(listing.availability) ? listing.availability : null;
  return references.getReferenceName("AvailabilityType", availability?.availabilityType as string | number | undefined)
    ?? (availability?.availabilityType ? String(availability.availabilityType) : null);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    result.push(trimmed);
  }
  return result;
}

export function mapAutoScoutListingToCar(input: {
  listing: AutoScoutListing;
  customerId: string;
  references: AutoScoutReferenceIndex;
  now?: Date;
  existingSoldAt?: Date | null;
}): AutoScoutMappedCar {
  const { listing, customerId, references } = input;
  const now = input.now ?? new Date();
  const makeName = references.getMakeName(listing.make) ?? `AutoScout make ${listing.make}`;
  const modelName = references.getModelName(listing.make, listing.model) ?? (listing.model ? `Model ${listing.model}` : "Onbekend model");
  const version = stringOrNull(listing.modelVersion);
  const year = deriveYear(listing);
  const firstRegistrationDate = parseFirstRegistration(listing.firstRegistrationDate);
  const publicationStatus = listing.publication?.status ?? null;
  const isActive = publicationStatus === "Active";
  const price = getPublicPrice(listing);
  const powerKw = intOrNull(listing.power);
  const horsepower = powerKw === null ? 0 : Math.round(powerKw * KW_TO_HP);
  const primaryFuelLabel = references.getReferenceName("FuelType", listing.primaryFuelType);
  const fuelCategoryCode = stringOrNull(listing.fuelCategory);
  const fuelCategoryLabel = references.getReferenceName("FuelCategory", listing.fuelCategory)
    ?? fuelCategoryCode;
  const fuelType = normalizeFuelLabel(primaryFuelLabel, listing.primaryFuelType, fuelCategoryLabel);
  const transmissionLabel = references.getReferenceName("Transmission", listing.transmission);
  const transmission = normalizeTransmissionLabel(transmissionLabel, listing.transmission);
  const exteriorColor = references.getReferenceName("BodyColor", listing.bodyColor);
  const color = exteriorColor ?? stringOrNull(listing.bodyColorName) ?? "Onbekend";
  const bodyType = references.getReferenceName("BodyType", listing.bodyType);
  const vehicleType = references.getReferenceName("VehicleType", listing.vehicleType);
  const drivetrain = references.getReferenceName("Drivetrain", listing.drivetrain);
  const interiorColor = references.getReferenceName("UpholsteryColor", listing.upholsteryColor);
  const upholstery = references.getReferenceName("UpholsteryType", listing.upholsteryType);
  const emissionClass = references.getReferenceName("EuEmissionStandard", listing.euEmissionStandard);
  const equipmentCodes = (listing.equipment ?? []).map(String);
  const equipmentLabels = equipmentCodes.map((code) => references.getReferenceName("Equipment", code)).filter((value): value is string => Boolean(value));
  const features = uniqueStrings([...equipmentLabels, ...(listing.highlights ?? [])]);
  const title = compactJoin([makeName, modelName, version]);
  const slugBase = slugify(compactJoin([year, makeName, modelName, version, listing.id.slice(0, 8)]));
  const consumptionCombined = numberOrNull(isRecord(listing.consumption) ? listing.consumption.combined : undefined);
  const warrantyMonths = intOrNull(listing.warranty);
  const hasWarranty = boolOrNull(listing.hasWarranty);
  const warrantyText = hasWarranty || warrantyMonths
    ? compactJoin([warrantyMonths, warrantyMonths ? "maanden" : null], " ")
    : null;

  return {
    autoscoutListingId: listing.id,
    autoscoutCustomerId: customerId,
    externalSource: "autoscout24",
    externalListingId: listing.id,
    importSource: "autoscout24",
    slugBase,
    isActive,
    images: (listing.images ?? [])
      .filter((image) => Boolean(image.previewUrl))
      .map((image, index) => ({
        autoscoutImageId: image.id,
        sourceUrl: image.previewUrl!,
        sourceMd5: image.md5,
        sortOrder: index,
      })),
    data: {
      slug: slugBase,
      title,
      brand: makeName,
      model: modelName,
      year,
      mileage: Math.max(0, intOrNull(listing.mileage) ?? 0),
      fuel_type: fuelType,
      transmission,
      price: Math.max(0, numberOrNull(price.price) ?? 0),
      horsepower,
      color,
      description: normalizeVehicleDescription(stringOrNull(listing.description) ?? title),
      sold: !isActive,
      reserved: false,
      soldAt: isActive ? null : input.existingSoldAt ?? now,
      carpass_url: stringOrNull(listing.belgianCarpassMileageUrl),
      features,
      externalSource: "autoscout24",
      externalListingId: listing.id,
      importSource: "autoscout24",
      sourceOfTruth: "website",
      autoscoutListingId: listing.id,
      autoscoutCustomerId: customerId,
      autoscoutUrl: getAutoscoutUrl(listing),
      lastSyncedAt: now,
      sourcePayload: listing,
      sourcePayloadUpdatedAt: now,
      vin: stringOrNull(listing.vin),
      referenceNumber: stringOrNull(listing.offerReferenceId),
      crossReferenceId: stringOrNull(listing.crossReferenceId),
      licencePlate: stringOrNull(listing.licencePlate),
      version,
      makeCode: listing.make === undefined ? null : String(listing.make),
      modelCode: listing.model === undefined ? null : String(listing.model),
      bodyType,
      bodyTypeCode: listing.bodyType === undefined ? null : String(listing.bodyType),
      vehicleType,
      vehicleTypeCode: stringOrNull(listing.vehicleType),
      offerTypeCode: stringOrNull(listing.offerType),
      availabilityTypeCode: isRecord(listing.availability) && listing.availability.availabilityType !== undefined
        ? String(listing.availability.availabilityType)
        : null,
      fuelTypeCode: listing.primaryFuelType === undefined ? null : String(listing.primaryFuelType),
      fuelCategory: fuelCategoryCode,
      additionalFuelTypeCodes: (listing.additionalFuelTypes ?? []).map(String),
      isPluginHybrid: boolOrNull(listing.isPluginHybrid),
      transmissionCode: stringOrNull(listing.transmission),
      drivetrain,
      drivetrainCode: stringOrNull(listing.drivetrain),
      powerKw,
      engineSize: intOrNull(listing.cylinderCapacity),
      cylinderCount: intOrNull(listing.cylinderCount),
      firstRegistrationDate,
      firstRegistrationRaw: stringOrNull(listing.firstRegistrationDate),
      constructionYear: intOrNull(listing.constructionYear),
      doors: intOrNull(listing.doorCount),
      seats: intOrNull(listing.seatCount),
      exteriorColor,
      exteriorColorCode: listing.bodyColor === undefined ? null : String(listing.bodyColor),
      manufacturerColorName: stringOrNull(listing.bodyColorName),
      interiorColor,
      interiorColorCode: listing.upholsteryColor === undefined ? null : String(listing.upholsteryColor),
      upholstery,
      upholsteryCode: stringOrNull(listing.upholsteryType),
      emissionClass,
      emissionClassCode: stringOrNull(listing.euEmissionStandard),
      co2Emissions: intOrNull(listing.co2Emissions),
      consumptionCombined,
      consumption: listing.consumption ?? null,
      wltp: listing.wltp ?? null,
      priceCurrency: stringOrNull(price.currency) ?? "EUR",
      netPrice: intOrNull(price.netPrice),
      vatRate: numberOrNull(price.vatRate),
      vatDeductible: boolOrNull(price.isTaxDeductible),
      priceNegotiable: boolOrNull(price.isNegotiable),
      warrantyMonths,
      warrantyText,
      hasWarranty,
      availabilityStatus: getAvailabilityStatus(listing, references),
      publicationStatus,
      equipmentCodes,
      equipment: {
        codes: equipmentCodes,
        labels: equipmentLabels,
      },
      technicalData: {
        condition: listing.condition ?? null,
        availability: listing.availability ?? null,
        additionalFuelTypes: listing.additionalFuelTypes ?? [],
        hasFullServiceHistory: listing.hasFullServiceHistory ?? null,
        hasParticleFilter: listing.hasParticleFilter ?? null,
        isMetallic: listing.isMetallic ?? null,
        isNonSmoking: listing.isNonSmoking ?? null,
        wasCabOrRental: listing.wasCabOrRental ?? null,
        previousOwnerCount: listing.previousOwnerCount ?? null,
        offerType: listing.offerType ?? null,
        offerTypeLabel: references.getReferenceName("OfferType", listing.offerType) ?? null,
      },
    },
  };
}
