import test from "node:test";
import assert from "node:assert/strict";
import { buildAutoScoutListingPayload, type AutoScoutSyncCarInput } from "./push-mapper";
import type { AutoScoutReferenceIndex } from "./types";

const references: AutoScoutReferenceIndex = {
  getReferenceName() {
    return null;
  },
  getReferenceId(type, name) {
    const values: Record<string, Record<string, string>> = {
      FuelType: { Benzine: "1", "Super 95": "2" },
      FuelCategory: { "Elektrisch/Benzine": "2" },
      Transmission: { Automatisch: "A" },
      BodyType: { SUV: "6" },
      BodyColor: { Zwart: "1" },
      Equipment: { Navigatiesysteem: "1" },
    };
    return values[type]?.[String(name)] ?? null;
  },
  getMakeName() {
    return null;
  },
  getMakeId(name) {
    return name === "BMW" ? "13" : null;
  },
  getModelName() {
    return null;
  },
  getModelId(makeId, modelName) {
    return String(makeId) === "13" && modelName === "X5" ? "1641" : null;
  },
};

const baseCar: AutoScoutSyncCarInput = {
  id: "car_1",
  slug: "bmw-x5",
  title: "BMW X5",
  brand: "BMW",
  model: "X5",
  year: 2021,
  mileage: 45000,
  fuel_type: "Benzine",
  transmission: "Automatisch",
  price: 54950,
  horsepower: 340,
  color: "Zwart",
  description: "Zeer mooie wagen.",
  sold: false,
  reserved: false,
  carpass_url: null,
  features: ["Navigatiesysteem"],
  autoscoutListingId: null,
  makeCode: null,
  modelCode: null,
  offerTypeCode: "U",
  availabilityTypeCode: "1",
  version: "M Sport",
  bodyTypeCode: "6",
  vehicleTypeCode: "C",
  fuelTypeCode: "1",
  fuelCategory: null,
  transmissionCode: "A",
  drivetrainCode: null,
  powerKw: 250,
  engineSize: 2998,
  cylinderCount: 6,
  firstRegistrationRaw: "2021-05",
  constructionYear: 2021,
  doors: 5,
  seats: 5,
  exteriorColorCode: "1",
  manufacturerColorName: "Black Sapphire",
  interiorColorCode: null,
  upholsteryCode: null,
  emissionClassCode: null,
  co2Emissions: null,
  consumptionCombined: null,
  consumption: null,
  wltp: null,
  priceCurrency: "EUR",
  netPrice: null,
  vatRate: 21,
  vatDeductible: true,
  priceNegotiable: false,
  warrantyMonths: 12,
  hasWarranty: true,
  referenceNumber: "BH-001",
  crossReferenceId: "internal-001",
  vin: null,
  licencePlate: null,
  equipmentCodes: [],
  technicalData: null,
  sourcePayload: null,
  images: [],
};

test("builds a complete AutoScout listing payload from a website car", () => {
  const result = buildAutoScoutListingPayload({
    car: baseCar,
    references,
    imageIds: ["image-1", "image-2"],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.payload?.make, 13);
  assert.equal(result.payload?.model, 1641);
  assert.equal(result.payload?.vehicleType, "C");
  assert.equal(result.payload?.publication.status, "Active");
  assert.equal(result.payload?.productionYear, "2021");
  assert.equal(result.payload?.prices.public.price, 54950);
  assert.equal(result.payload?.prices.public.isTaxDeductible, true);
  assert.deepEqual(result.payload?.images, [{ id: "image-1" }, { id: "image-2" }]);
  assert.deepEqual(result.payload?.equipment, [1]);
});

test("normalizes production year to the AutoScout yyyy format", () => {
  const result = buildAutoScoutListingPayload({
    car: {
      ...baseCar,
      constructionYear: "2 021" as unknown as number,
      sourcePayload: { productionYear: "2021-05" },
    },
    references,
    imageIds: ["image-1"],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.payload?.productionYear, "2021");
});

test("derives required AutoScout fuel type from fuel category when code is missing", () => {
  const result = buildAutoScoutListingPayload({
    car: {
      ...baseCar,
      fuel_type: "Plug-in Hybride",
      fuelTypeCode: null,
      fuelCategory: "Elektrisch/Benzine",
    },
    references,
    imageIds: ["image-1"],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.payload?.primaryFuelType, 2);
  assert.equal(result.payload?.fuelCategory, "2");
});

test("marks reserved website cars inactive on AutoScout", () => {
  const result = buildAutoScoutListingPayload({
    car: { ...baseCar, reserved: true },
    references,
    imageIds: ["image-1"],
  });

  assert.equal(result.payload?.publication.status, "Inactive");
});

test("uses the website car ID as stable cross-reference when none exists", () => {
  const result = buildAutoScoutListingPayload({
    car: { ...baseCar, crossReferenceId: null },
    references,
    imageIds: ["image-1"],
  });

  assert.equal(result.payload?.crossReferenceId, baseCar.id);
});

test("returns validation errors before posting incomplete cars", () => {
  const result = buildAutoScoutListingPayload({
    car: { ...baseCar, bodyTypeCode: null, price: 0 },
    references,
    imageIds: [],
  });

  assert.equal(result.payload, undefined);
  assert.ok(result.errors.some((error) => error.includes("koetswerktype")));
  assert.ok(result.errors.some((error) => error.includes("Prijs")));
  assert.ok(result.errors.some((error) => error.includes("foto")));
});
