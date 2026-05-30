CREATE TABLE "AutoScoutMakeCache" (
  "makeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "models" JSONB NOT NULL,
  "vehicleTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutoScoutMakeCache_pkey" PRIMARY KEY ("makeId")
);

CREATE INDEX "AutoScoutMakeCache_refreshedAt_idx"
  ON "AutoScoutMakeCache"("refreshedAt");

CREATE INDEX "AutoScoutSyncJob_finishedAt_idx"
  ON "AutoScoutSyncJob"("finishedAt");
