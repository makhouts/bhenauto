import type { AutoScoutMake, AutoScoutReference, AutoScoutReferenceIndex } from "./types";

export const AUTOSCOUT_REFERENCE_TYPES = [
  "AvailabilityType",
  "BodyColor",
  "BodyType",
  "Drivetrain",
  "Equipment",
  "EuEmissionStandard",
  "FuelCategory",
  "FuelType",
  "OfferType",
  "Transmission",
  "UpholsteryColor",
  "UpholsteryType",
  "VehicleType",
] as const;

export const IMPORT_REFERENCE_TYPES = AUTOSCOUT_REFERENCE_TYPES;

function normalizeId(id: string | number | undefined | null) {
  return id === undefined || id === null ? "" : String(id);
}

function normalizeName(name: string | undefined | null) {
  return (name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildReferenceIndex(
  references: AutoScoutReference[],
  makes: AutoScoutMake[],
): AutoScoutReferenceIndex {
  const referencesByType = new Map<string, Map<string, string>>();
  const referenceIdsByTypeName = new Map<string, Map<string, string>>();
  const makeNames = new Map<string, string>();
  const makeIdsByName = new Map<string, string>();
  const modelNames = new Map<string, Map<string, string>>();
  const modelIdsByMakeAndName = new Map<string, Map<string, string>>();

  for (const reference of references) {
    const typeMap = referencesByType.get(reference.referenceType) ?? new Map<string, string>();
    typeMap.set(normalizeId(reference.id), reference.name);
    referencesByType.set(reference.referenceType, typeMap);

    const reverseTypeMap = referenceIdsByTypeName.get(reference.referenceType) ?? new Map<string, string>();
    reverseTypeMap.set(normalizeName(reference.name), normalizeId(reference.id));
    referenceIdsByTypeName.set(reference.referenceType, reverseTypeMap);
  }

  for (const make of makes) {
    const makeId = normalizeId(make.id);
    makeNames.set(makeId, make.name);
    makeIdsByName.set(normalizeName(make.name), makeId);

    const modelMap = modelNames.get(makeId) ?? new Map<string, string>();
    const reverseModelMap = modelIdsByMakeAndName.get(makeId) ?? new Map<string, string>();
    for (const model of make.models ?? []) {
      modelMap.set(normalizeId(model.id), model.name);
      reverseModelMap.set(normalizeName(model.name), normalizeId(model.id));
    }
    modelNames.set(makeId, modelMap);
    modelIdsByMakeAndName.set(makeId, reverseModelMap);
  }

  return {
    getReferenceName(referenceType, id) {
      const normalizedId = normalizeId(id);
      if (!normalizedId) return null;
      return referencesByType.get(referenceType)?.get(normalizedId) ?? null;
    },
    getReferenceId(referenceType, name) {
      const normalizedName = normalizeName(name);
      if (!normalizedName) return null;
      return referenceIdsByTypeName.get(referenceType)?.get(normalizedName) ?? null;
    },
    getMakeName(id) {
      const normalizedId = normalizeId(id);
      if (!normalizedId) return null;
      return makeNames.get(normalizedId) ?? null;
    },
    getMakeId(name) {
      const normalizedName = normalizeName(name);
      if (!normalizedName) return null;
      return makeIdsByName.get(normalizedName) ?? null;
    },
    getModelName(makeId, modelId) {
      const normalizedMakeId = normalizeId(makeId);
      const normalizedModelId = normalizeId(modelId);
      if (!normalizedMakeId || !normalizedModelId) return null;
      return modelNames.get(normalizedMakeId)?.get(normalizedModelId) ?? null;
    },
    getModelId(makeId, modelName) {
      const normalizedMakeId = normalizeId(makeId);
      const normalizedModelName = normalizeName(modelName);
      if (!normalizedMakeId || !normalizedModelName) return null;
      return modelIdsByMakeAndName.get(normalizedMakeId)?.get(normalizedModelName) ?? null;
    },
  };
}
