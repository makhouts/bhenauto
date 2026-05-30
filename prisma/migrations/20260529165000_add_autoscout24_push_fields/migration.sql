ALTER TABLE "Car" ADD COLUMN "sourceOfTruth" TEXT NOT NULL DEFAULT 'website';
ALTER TABLE "Car" ADD COLUMN "autoscoutLastPushedAt" TIMESTAMP(3);
ALTER TABLE "Car" ADD COLUMN "autoscoutSyncStatus" TEXT;
ALTER TABLE "Car" ADD COLUMN "autoscoutSyncError" TEXT;
ALTER TABLE "Car" ADD COLUMN "autoscoutTestMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Car" ADD COLUMN "lastAutoscoutPayload" JSONB;
ALTER TABLE "Car" ADD COLUMN "makeCode" TEXT;
ALTER TABLE "Car" ADD COLUMN "modelCode" TEXT;
ALTER TABLE "Car" ADD COLUMN "offerTypeCode" TEXT;
ALTER TABLE "Car" ADD COLUMN "availabilityTypeCode" TEXT;

UPDATE "Car"
SET
  "makeCode" = COALESCE("makeCode", "sourcePayload"->>'make'),
  "modelCode" = COALESCE("modelCode", "sourcePayload"->>'model'),
  "offerTypeCode" = COALESCE("offerTypeCode", "sourcePayload"->>'offerType'),
  "availabilityTypeCode" = COALESCE("availabilityTypeCode", "sourcePayload"->'availability'->>'availabilityType')
WHERE "sourcePayload" IS NOT NULL;

CREATE INDEX "Car_autoscoutSyncStatus_idx" ON "Car"("autoscoutSyncStatus");
CREATE INDEX "Car_sourceOfTruth_idx" ON "Car"("sourceOfTruth");
