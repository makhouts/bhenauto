-- Keep existing production databases aligned with the Prisma schema.
ALTER TABLE "Appointment"
ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'fr';

-- Query indexes for public booking throttling and slot checks.
CREATE INDEX IF NOT EXISTS "Appointment_email_createdAt_idx"
ON "Appointment"("email", "createdAt");

CREATE INDEX IF NOT EXISTS "Appointment_date_timeSlot_status_idx"
ON "Appointment"("date", "timeSlot", "status");

-- Direct same-slot race protection for the current maxBookingsPerSlot=1 setup.
CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_active_date_timeSlot_key"
ON "Appointment"("date", "timeSlot")
WHERE "status" IN ('pending', 'confirmed');

-- PostgreSQL allows multiple NULL values in a normal unique index, so split
-- full-day and slot-level blocks into partial unique indexes.
DROP INDEX IF EXISTS "BlockedDate_date_timeSlot_key";

CREATE UNIQUE INDEX IF NOT EXISTS "BlockedDate_date_full_day_key"
ON "BlockedDate"("date")
WHERE "timeSlot" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "BlockedDate_date_timeSlot_not_null_key"
ON "BlockedDate"("date", "timeSlot")
WHERE "timeSlot" IS NOT NULL;
