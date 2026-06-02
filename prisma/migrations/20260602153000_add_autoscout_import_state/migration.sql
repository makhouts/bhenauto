CREATE TABLE "public"."AutoScoutImportState" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoScoutImportState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AutoScoutImportState_status_lockedUntil_idx"
ON "public"."AutoScoutImportState"("status", "lockedUntil");

ALTER TABLE public."AutoScoutImportState" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."AutoScoutImportState"
FROM anon, authenticated, service_role;
