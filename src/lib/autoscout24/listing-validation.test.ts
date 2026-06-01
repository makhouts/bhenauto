import test from "node:test";
import assert from "node:assert/strict";
import { validateAutoScoutListingValues } from "./listing-validation";

const validListing = {
  makeCode: "13",
  modelCode: "1641",
  vehicleTypeCode: "C",
  offerTypeCode: "U",
  availabilityTypeCode: "1",
  firstRegistrationRaw: "2021-05",
  constructionYear: "2021",
  bodyTypeCode: "6",
  fuelCategory: "B",
  fuelTypeCode: "1",
  transmissionCode: "A",
  price: 54950,
  mileage: 45000,
  powerKw: 250,
  imageCount: 2,
};

test("accepts a valid AutoScout listing", () => {
  assert.deepEqual(validateAutoScoutListingValues(validListing), []);
});

test("rejects more than 99 cylinders before sync", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    cylinderCount: 100,
  });

  assert.ok(issues.some((issue) => issue.field === "cylinderCount" && issue.code === "maximum"));
});

test("rejects invalid VAT and net price values", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    vatRate: 21.25,
    netPrice: 60000,
  });

  assert.ok(issues.some((issue) => issue.field === "vatRate" && issue.code === "vat-decimals"));
  assert.ok(issues.some((issue) => issue.field === "netPrice" && issue.code === "net-price-below-gross"));
});

test("requires plug-in hybrids to include electric and non-electric fuel types", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    fuelCategory: "2",
    fuelTypeCode: "12",
    additionalFuelTypeCodes: [],
    isPluginHybrid: true,
  });

  assert.ok(issues.some((issue) => issue.field === "fuelTypeCode" && issue.code === "plugin-fuels"));
});

test("rejects mutually exclusive equipment choices", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    equipmentCodes: ["30", "241", "152", "244"],
  });

  assert.ok(issues.some((issue) => issue.code === "equipment-climate-conflict"));
  assert.ok(issues.some((issue) => issue.code === "equipment-sliding-door-conflict"));
});

test("rejects production years outside the supported range", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    constructionYear: "9999",
  });

  assert.ok(issues.some((issue) => issue.field === "constructionYear" && issue.code === "invalid-date-range"));
});

test("rejects forbidden content in listing identifiers", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    referenceNumber: "https://example.com/car",
    licencePlate: "<TEST>",
  });

  assert.ok(issues.some((issue) => issue.field === "referenceNumber" && issue.code === "invalid-content"));
  assert.ok(issues.some((issue) => issue.field === "licencePlate" && issue.code === "invalid-content"));
});

test("rejects a first registration date in the future", () => {
  const issues = validateAutoScoutListingValues({
    ...validListing,
    firstRegistrationRaw: `${new Date().getFullYear() + 1}-01`,
  });

  assert.ok(issues.some((issue) => issue.field === "firstRegistrationRaw" && issue.code === "invalid-date-range"));
});
