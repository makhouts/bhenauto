-- Add AutoScout24 import/sync metadata and richer vehicle fields.
ALTER TABLE "Car"
  ADD COLUMN "soldAt" TIMESTAMP(3),
  ADD COLUMN "externalSource" TEXT,
  ADD COLUMN "externalListingId" TEXT,
  ADD COLUMN "importSource" TEXT,
  ADD COLUMN "autoscoutListingId" TEXT,
  ADD COLUMN "autoscoutCustomerId" TEXT,
  ADD COLUMN "autoscoutUrl" TEXT,
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3),
  ADD COLUMN "sourcePayload" JSONB,
  ADD COLUMN "sourcePayloadUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "vin" TEXT,
  ADD COLUMN "referenceNumber" TEXT,
  ADD COLUMN "crossReferenceId" TEXT,
  ADD COLUMN "licencePlate" TEXT,
  ADD COLUMN "version" TEXT,
  ADD COLUMN "bodyType" TEXT,
  ADD COLUMN "bodyTypeCode" TEXT,
  ADD COLUMN "vehicleType" TEXT,
  ADD COLUMN "vehicleTypeCode" TEXT,
  ADD COLUMN "fuelTypeCode" TEXT,
  ADD COLUMN "fuelCategory" TEXT,
  ADD COLUMN "transmissionCode" TEXT,
  ADD COLUMN "drivetrain" TEXT,
  ADD COLUMN "drivetrainCode" TEXT,
  ADD COLUMN "powerKw" INTEGER,
  ADD COLUMN "engineSize" INTEGER,
  ADD COLUMN "cylinderCount" INTEGER,
  ADD COLUMN "firstRegistrationDate" TIMESTAMP(3),
  ADD COLUMN "firstRegistrationRaw" TEXT,
  ADD COLUMN "constructionYear" INTEGER,
  ADD COLUMN "doors" INTEGER,
  ADD COLUMN "seats" INTEGER,
  ADD COLUMN "exteriorColor" TEXT,
  ADD COLUMN "exteriorColorCode" TEXT,
  ADD COLUMN "manufacturerColorName" TEXT,
  ADD COLUMN "interiorColor" TEXT,
  ADD COLUMN "interiorColorCode" TEXT,
  ADD COLUMN "upholstery" TEXT,
  ADD COLUMN "upholsteryCode" TEXT,
  ADD COLUMN "emissionClass" TEXT,
  ADD COLUMN "emissionClassCode" TEXT,
  ADD COLUMN "co2Emissions" INTEGER,
  ADD COLUMN "consumptionCombined" DOUBLE PRECISION,
  ADD COLUMN "consumption" JSONB,
  ADD COLUMN "wltp" JSONB,
  ADD COLUMN "priceCurrency" TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "netPrice" INTEGER,
  ADD COLUMN "vatRate" DOUBLE PRECISION,
  ADD COLUMN "vatDeductible" BOOLEAN,
  ADD COLUMN "priceNegotiable" BOOLEAN,
  ADD COLUMN "warrantyMonths" INTEGER,
  ADD COLUMN "warrantyText" TEXT,
  ADD COLUMN "hasWarranty" BOOLEAN,
  ADD COLUMN "availabilityStatus" TEXT,
  ADD COLUMN "publicationStatus" TEXT,
  ADD COLUMN "equipmentCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "equipment" JSONB,
  ADD COLUMN "technicalData" JSONB;

ALTER TABLE "Image"
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "autoscoutImageId" TEXT,
  ADD COLUMN "sourceMd5" TEXT;

CREATE UNIQUE INDEX "Car_autoscoutListingId_key" ON "Car"("autoscoutListingId");
CREATE UNIQUE INDEX "Car_externalSource_externalListingId_key" ON "Car"("externalSource", "externalListingId");
CREATE INDEX "Car_soldAt_idx" ON "Car"("soldAt");
CREATE INDEX "Car_externalSource_idx" ON "Car"("externalSource");
CREATE INDEX "Car_lastSyncedAt_idx" ON "Car"("lastSyncedAt");
CREATE INDEX "Car_publicationStatus_idx" ON "Car"("publicationStatus");
CREATE INDEX "Image_carId_sortOrder_idx" ON "Image"("carId", "sortOrder");
CREATE INDEX "Image_autoscoutImageId_idx" ON "Image"("autoscoutImageId");
