CREATE TABLE "AutoScoutReference" (
  "id" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "nameNl" TEXT,
  "nameFr" TEXT,
  "nameEn" TEXT,
  "vehicleTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "countries" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutoScoutReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutoScoutReference_referenceType_referenceId_key"
  ON "AutoScoutReference"("referenceType", "referenceId");

CREATE INDEX "AutoScoutReference_referenceType_idx"
  ON "AutoScoutReference"("referenceType");
