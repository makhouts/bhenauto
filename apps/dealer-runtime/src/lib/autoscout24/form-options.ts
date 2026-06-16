import "server-only";

import { createAutoScoutClientFromEnv } from "./client";
import { getCachedAutoScoutMakes, getCachedAutoScoutReferences } from "./reference-cache";
import { AUTOSCOUT_REFERENCE_TYPES } from "./references";
import type { AutoScoutMake, AutoScoutReference } from "./types";
import type { AdminLocale } from "@/lib/admin-i18n";
import type {
  AutoScoutFormOptions,
  AutoScoutMakeOption,
  AutoScoutReferenceOptions,
  AutoScoutSelectOption,
} from "./form-options.types";

const FORM_REFERENCE_TYPES = AUTOSCOUT_REFERENCE_TYPES;
const CAR_VEHICLE_TYPE = "C";

const EMPTY_REFERENCES: AutoScoutReferenceOptions = {
  availabilityTypes: [],
  bodyColors: [],
  bodyTypes: [],
  drivetrains: [],
  emissionClasses: [],
  equipment: [],
  fuelCategories: [],
  fuelTypes: [],
  offerTypes: [],
  transmissions: [],
  upholsteryColors: [],
  upholsteryTypes: [],
  vehicleTypes: [],
};

const REFERENCE_KEY_BY_TYPE = {
  AvailabilityType: "availabilityTypes",
  BodyColor: "bodyColors",
  BodyType: "bodyTypes",
  Drivetrain: "drivetrains",
  Equipment: "equipment",
  EuEmissionStandard: "emissionClasses",
  FuelCategory: "fuelCategories",
  FuelType: "fuelTypes",
  OfferType: "offerTypes",
  Transmission: "transmissions",
  UpholsteryColor: "upholsteryColors",
  UpholsteryType: "upholsteryTypes",
  VehicleType: "vehicleTypes",
} as const satisfies Record<(typeof FORM_REFERENCE_TYPES)[number], keyof AutoScoutReferenceOptions>;

function cultureForLocale(locale: AdminLocale) {
  return locale === "fr" ? "fr-BE" : "nl-BE";
}

function toOption(reference: AutoScoutReference): AutoScoutSelectOption {
  return {
    value: String(reference.id),
    label: reference.name,
    vehicleTypes: reference.vehicleType,
  };
}

function sortOptions<T extends { label: string }>(options: T[]) {
  return options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

function normalizeLabel(label: string) {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isCarMake(make: { vehicleTypes?: string[]; models?: Array<{ vehicleType?: string }> }) {
  return make.vehicleTypes?.includes(CAR_VEHICLE_TYPE)
    || make.models?.some((model) => model.vehicleType === CAR_VEHICLE_TYPE)
    || false;
}

function isCarReferenceOption(option: { vehicleTypes?: string[] }) {
  return !option.vehicleTypes?.length || option.vehicleTypes.includes(CAR_VEHICLE_TYPE);
}

function toUniqueOptions<T extends { label: string; value: string }>(options: T[]) {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const option of options) {
    const key = normalizeLabel(option.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(option);
  }

  return unique;
}

function toMakeOption(make: AutoScoutMake): AutoScoutMakeOption {
  const models = (make.models ?? [])
    .filter((model) => !model.vehicleType || model.vehicleType === CAR_VEHICLE_TYPE)
    .map((model) => ({
      value: String(model.id),
      label: model.name.trim(),
      vehicleTypes: model.vehicleType ? [model.vehicleType] : undefined,
    }));

  return {
    value: String(make.id),
    label: make.name.trim(),
    vehicleTypes: make.vehicleTypes,
    models: sortOptions(toUniqueOptions(models)),
  };
}

export async function getAutoScoutFormOptions(locale: AdminLocale): Promise<AutoScoutFormOptions> {
  try {
    const client = createAutoScoutClientFromEnv({ culture: cultureForLocale(locale) });
    const [makes, references] = await Promise.all([
      getCachedAutoScoutMakes(client),
      getCachedAutoScoutReferences(client, FORM_REFERENCE_TYPES),
    ]);

    const groupedReferences: AutoScoutReferenceOptions = { ...EMPTY_REFERENCES };
    for (const reference of references) {
      const key = REFERENCE_KEY_BY_TYPE[reference.referenceType as keyof typeof REFERENCE_KEY_BY_TYPE];
      if (!key) continue;
      groupedReferences[key] = [...groupedReferences[key], toOption(reference)];
    }

    for (const key of Object.keys(groupedReferences) as Array<keyof AutoScoutReferenceOptions>) {
      groupedReferences[key] = sortOptions(groupedReferences[key].filter(isCarReferenceOption));
    }

    const makeOptions: AutoScoutMakeOption[] = sortOptions(toUniqueOptions(
      makes
        .filter(isCarMake)
        .map(toMakeOption),
    ));

    return {
      makes: makeOptions,
      references: groupedReferences,
    };
  } catch (error) {
    return {
      makes: [],
      references: EMPTY_REFERENCES,
      error: error instanceof Error ? error.message : "AutoScout24 options could not be loaded.",
    };
  }
}
