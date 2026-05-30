import test from "node:test";
import assert from "node:assert/strict";
import { mapAutoScoutListingToCar } from "./mapper";
import type { AutoScoutReferenceIndex, AutoScoutListing } from "./types";

const references: AutoScoutReferenceIndex = {
  getReferenceName(type, id) {
    const values: Record<string, Record<string, string>> = {
      FuelType: { "1": "Benzine" },
      FuelCategory: { plugin_hybrid: "Plug-in Hybride" },
      Transmission: { M: "Handgeschakeld", A: "Automatisch" },
      BodyColor: { "2": "Groen" },
      BodyType: { "1": "Berline" },
      Equipment: { "1": "Navigatiesysteem", "2": "Lederen bekleding" },
      VehicleType: { C: "Auto" },
      AvailabilityType: { "1": "Onmiddellijk beschikbaar" },
    };
    return values[type]?.[String(id)] ?? null;
  },
  getReferenceId() {
    return null;
  },
  getMakeName(id) {
    return String(id) === "13" ? "BMW" : null;
  },
  getMakeId() {
    return null;
  },
  getModelName(makeId, modelId) {
    return String(makeId) === "13" && String(modelId) === "1641" ? "320" : null;
  },
  getModelId() {
    return null;
  },
};

const baseListing: AutoScoutListing = {
  id: "982a9a2d-982f-4162-8128-ec6250530950",
  make: 13,
  model: 1641,
  modelVersion: "Touring",
  mileage: 75000,
  firstRegistrationDate: "2019-05",
  power: 110,
  primaryFuelType: 1,
  transmission: "M",
  bodyColor: 2,
  bodyColorName: "British Racing Green",
  bodyType: 1,
  vehicleType: "C",
  doorCount: 5,
  seatCount: 5,
  description: "Dealer maintained.",
  equipment: [1, 2],
  prices: {
    public: {
      price: 16500,
      currency: "EUR",
      isTaxDeductible: true,
      isNegotiable: false,
    },
  },
  availability: { availabilityType: 1 },
  publication: {
    status: "Active",
    channels: [{ id: "AS24", url: "https://www.autoscout24.be/offers/example" }],
  },
  images: [
    {
      id: "269e6ae5-a49b-4ea5-85a2-9c2093c26287",
      previewUrl: "https://prod.pictures.autoscout24.net/listing-images/example.jpg",
      md5: "abc",
    },
  ],
};

test("maps active AutoScout listing to available website car", () => {
  const mapped = mapAutoScoutListingToCar({
    listing: baseListing,
    customerId: "42338301",
    references,
    now: new Date("2026-05-29T10:00:00.000Z"),
  });

  assert.equal(mapped.data.brand, "BMW");
  assert.equal(mapped.data.model, "320");
  assert.equal(mapped.data.year, 2019);
  assert.equal(mapped.data.fuel_type, "Benzine");
  assert.equal(mapped.data.transmission, "Handgeschakeld");
  assert.equal(mapped.data.horsepower, 150);
  assert.equal(mapped.data.color, "Groen");
  assert.equal(mapped.data.sold, false);
  assert.equal(mapped.data.soldAt, null);
  assert.deepEqual(mapped.data.features, ["Navigatiesysteem", "Lederen bekleding"]);
  assert.equal(mapped.images[0].sortOrder, 0);
});

test("marks inactive AutoScout listing as sold and keeps existing soldAt", () => {
  const existingSoldAt = new Date("2026-05-27T09:00:00.000Z");
  const mapped = mapAutoScoutListingToCar({
    listing: {
      ...baseListing,
      publication: { status: "Inactive", channels: [] },
    },
    customerId: "42338301",
    references,
    now: new Date("2026-05-29T10:00:00.000Z"),
    existingSoldAt,
  });

  assert.equal(mapped.data.sold, true);
  assert.equal(mapped.data.soldAt, existingSoldAt);
  assert.equal(mapped.data.publicationStatus, "Inactive");
});

test("falls back to fuel category and cleans imported descriptions", () => {
  const mapped = mapAutoScoutListingToCar({
    listing: {
      ...baseListing,
      primaryFuelType: undefined,
      fuelCategory: "plugin_hybrid",
      description: "**Véhicule livré.**\\\\Wij spreken Nederlands\\Service après-vente",
    },
    customerId: "42338301",
    references,
    now: new Date("2026-05-29T10:00:00.000Z"),
  });

  assert.equal(mapped.data.fuel_type, "Plug-in Hybride");
  assert.equal(mapped.data.description, "Véhicule livré.\nWij spreken Nederlands\nService après-vente");
});
