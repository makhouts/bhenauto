import "server-only";

import prisma from "@/lib/prisma";
import type { Locale } from "@/lib/i18n";
import {
  normalizeVehicleDescription,
  translateColorLabel,
  translateFuelLabel,
  translateTransmissionLabel,
  unknownVehicleLabel,
} from "./presentation-format";

type PublicCarPresentationInput = {
  fuel_type: string;
  fuelTypeCode?: string | null;
  fuelCategory?: string | null;
  transmission: string;
  transmissionCode?: string | null;
  color: string;
  exteriorColor?: string | null;
  exteriorColorCode?: string | null;
  manufacturerColorName?: string | null;
  description: string;
};

function localizedName(
  reference: { nameNl: string | null; nameFr: string | null; nameEn: string | null },
  locale: Locale,
) {
  if (locale === "nl") return reference.nameNl ?? reference.nameFr ?? reference.nameEn;
  if (locale === "fr") return reference.nameFr ?? reference.nameNl ?? reference.nameEn;
  return reference.nameEn ?? reference.nameNl ?? reference.nameFr;
}

function uniqueCodes(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

export async function localizeCarsForPublic<T extends PublicCarPresentationInput>(
  cars: T[],
  locale: Locale,
): Promise<T[]> {
  if (cars.length === 0) return cars;

  const fuelCodes = uniqueCodes(cars.map((car) => car.fuelTypeCode));
  const transmissionCodes = uniqueCodes(cars.map((car) => car.transmissionCode));
  const colorCodes = uniqueCodes(cars.map((car) => car.exteriorColorCode));
  const referenceFilters = [
    ...(fuelCodes.length > 0 ? [{ referenceType: "FuelType", referenceId: { in: fuelCodes } }] : []),
    ...(transmissionCodes.length > 0 ? [{ referenceType: "Transmission", referenceId: { in: transmissionCodes } }] : []),
    ...(colorCodes.length > 0 ? [{ referenceType: "BodyColor", referenceId: { in: colorCodes } }] : []),
  ];

  const references = referenceFilters.length === 0
    ? []
    : await prisma.autoScoutReference.findMany({
        where: { OR: referenceFilters },
        select: {
          referenceType: true,
          referenceId: true,
          nameNl: true,
          nameFr: true,
          nameEn: true,
        },
      });

  const labels = new Map<string, string>();
  for (const reference of references) {
    const localized = localizedName(reference, locale);
    if (!localized) continue;
    labels.set(`${reference.referenceType}:${reference.referenceId}`, localized);
  }

  return cars.map((car) => {
    const translatedFuel = translateFuelLabel(car.fuelCategory, locale)
      ?? car.fuelCategory?.trim()
      ?? labels.get(`FuelType:${car.fuelTypeCode ?? ""}`)
      ?? translateFuelLabel(car.fuel_type, locale)
      ?? car.fuel_type?.trim()
      ?? unknownVehicleLabel(locale);

    const translatedColor = labels.get(`BodyColor:${car.exteriorColorCode ?? ""}`)
      ?? translateColorLabel(car.exteriorColor, locale)
      ?? translateColorLabel(car.color, locale)
      ?? car.manufacturerColorName?.trim()
      ?? car.color
      ?? unknownVehicleLabel(locale);

    const translatedTransmission = translateTransmissionLabel(car.transmission, locale)
      ?? labels.get(`Transmission:${car.transmissionCode ?? ""}`)
      ?? car.transmission?.trim()
      ?? unknownVehicleLabel(locale);

    return {
      ...car,
      fuel_type: translatedFuel,
      transmission: translatedTransmission,
      color: translatedColor,
      description: normalizeVehicleDescription(car.description),
    };
  });
}

export async function localizeCarForPublic<T extends PublicCarPresentationInput>(
  car: T,
  locale: Locale,
): Promise<T> {
  const [localized] = await localizeCarsForPublic([car], locale);
  return localized;
}
