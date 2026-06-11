-- Create enums
CREATE TYPE "AnalyticsEventType" AS ENUM (
  'page_view',
  'car_detail_view',
  'car_card_click',
  'appointment_submitted',
  'contact_submitted'
);

CREATE TYPE "NotificationChannel" AS ENUM ('whatsapp');

CREATE TYPE "NotificationStatus" AS ENUM ('pending', 'sent', 'failed');

-- Create table
CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" "AnalyticsEventType" NOT NULL,
  "path" TEXT NOT NULL,
  "locale" TEXT,
  "visitorHash" TEXT NOT NULL,
  "referrerHost" TEXT,
  "carId" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- Create table
CREATE TABLE "AppointmentNotification" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "provider" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AppointmentNotification_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX "AnalyticsEvent_visitorHash_createdAt_idx" ON "AnalyticsEvent"("visitorHash", "createdAt");
CREATE INDEX "AnalyticsEvent_carId_type_createdAt_idx" ON "AnalyticsEvent"("carId", "type", "createdAt");
CREATE INDEX "AnalyticsEvent_path_type_createdAt_idx" ON "AnalyticsEvent"("path", "type", "createdAt");
CREATE INDEX "AppointmentNotification_channel_status_idx" ON "AppointmentNotification"("channel", "status");

-- Create unique index
CREATE UNIQUE INDEX "AppointmentNotification_appointmentId_channel_key" ON "AppointmentNotification"("appointmentId", "channel");

-- Add foreign keys
ALTER TABLE "AnalyticsEvent"
ADD CONSTRAINT "AnalyticsEvent_carId_fkey"
FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AppointmentNotification"
ADD CONSTRAINT "AppointmentNotification_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
