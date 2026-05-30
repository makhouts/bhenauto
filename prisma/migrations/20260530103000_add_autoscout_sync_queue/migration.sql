ALTER TABLE "Car" ADD COLUMN "lastAutoscoutPayloadHash" TEXT;

CREATE TABLE "AutoScoutSyncJob" (
  "id" TEXT NOT NULL,
  "carId" TEXT,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedUntil" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "dedupeKey" TEXT,
  "customerId" TEXT,
  "listingId" TEXT,
  "publicationStatus" TEXT,
  "payloadHash" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AutoScoutSyncJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutoScoutSyncLog" (
  "id" TEXT NOT NULL,
  "jobId" TEXT,
  "carId" TEXT,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attempt" INTEGER,
  "message" TEXT,
  "payloadHash" TEXT,
  "customerId" TEXT,
  "listingId" TEXT,
  "requestPayload" JSONB,
  "responsePayload" JSONB,
  "errorPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AutoScoutSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Car_lastAutoscoutPayloadHash_idx" ON "Car"("lastAutoscoutPayloadHash");

CREATE UNIQUE INDEX "AutoScoutSyncJob_dedupeKey_key" ON "AutoScoutSyncJob"("dedupeKey");
CREATE INDEX "AutoScoutSyncJob_status_nextRunAt_idx" ON "AutoScoutSyncJob"("status", "nextRunAt");
CREATE INDEX "AutoScoutSyncJob_carId_idx" ON "AutoScoutSyncJob"("carId");
CREATE INDEX "AutoScoutSyncJob_action_idx" ON "AutoScoutSyncJob"("action");
CREATE INDEX "AutoScoutSyncJob_listingId_idx" ON "AutoScoutSyncJob"("listingId");
CREATE INDEX "AutoScoutSyncJob_createdAt_idx" ON "AutoScoutSyncJob"("createdAt");

CREATE INDEX "AutoScoutSyncLog_jobId_idx" ON "AutoScoutSyncLog"("jobId");
CREATE INDEX "AutoScoutSyncLog_carId_idx" ON "AutoScoutSyncLog"("carId");
CREATE INDEX "AutoScoutSyncLog_status_createdAt_idx" ON "AutoScoutSyncLog"("status", "createdAt");
CREATE INDEX "AutoScoutSyncLog_createdAt_idx" ON "AutoScoutSyncLog"("createdAt");
