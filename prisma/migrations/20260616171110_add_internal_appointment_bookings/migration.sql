CREATE TYPE "AppointmentKind" AS ENUM ('customer', 'internal');

ALTER TABLE "Appointment"
ADD COLUMN "kind" "AppointmentKind" NOT NULL DEFAULT 'customer',
ADD COLUMN "internalCarId" TEXT,
ADD COLUMN "internalCarLabel" TEXT,
ADD COLUMN "internalKeyNumber" TEXT;

CREATE INDEX "Appointment_kind_idx" ON "Appointment"("kind");
CREATE INDEX "Appointment_internalCarId_idx" ON "Appointment"("internalCarId");

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_internalCarId_fkey"
FOREIGN KEY ("internalCarId") REFERENCES "Car"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
