ALTER TABLE "Car"
  ADD COLUMN "additionalFuelTypeCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isPluginHybrid" BOOLEAN;

UPDATE "Car"
SET "fuelCategory" = "sourcePayload"->>'fuelCategory'
WHERE "sourcePayload" ? 'fuelCategory'
  AND NULLIF("sourcePayload"->>'fuelCategory', '') IS NOT NULL;

UPDATE "Car"
SET "additionalFuelTypeCodes" = ARRAY(
  SELECT jsonb_array_elements_text("sourcePayload"->'additionalFuelTypes')
)
WHERE jsonb_typeof("sourcePayload"->'additionalFuelTypes') = 'array';

UPDATE "Car"
SET "isPluginHybrid" = ("sourcePayload"->>'isPluginHybrid')::boolean
WHERE "sourcePayload" ? 'isPluginHybrid'
  AND "sourcePayload"->>'isPluginHybrid' IN ('true', 'false');
