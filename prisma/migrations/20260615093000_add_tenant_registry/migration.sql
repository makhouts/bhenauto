CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "adminDisplayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "primaryDomain" TEXT,
    "domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "siteUrl" TEXT,
    "legalName" TEXT,
    "supportEmail" TEXT,
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "addressLine" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "region" TEXT,
    "countryCode" TEXT DEFAULT 'BE',
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "r2KeyPrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TenantFeature" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantFeature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AutoScoutImportState" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoScoutImportState_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AnalyticsEventType') THEN
        CREATE TYPE "AnalyticsEventType" AS ENUM (
            'page_view',
            'car_detail_view',
            'car_card_click',
            'appointment_submitted',
            'contact_submitted'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_primaryDomain_key" ON "Tenant"("primaryDomain");
CREATE INDEX IF NOT EXISTS "Tenant_status_idx" ON "Tenant"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "TenantFeature_tenantId_key_key" ON "TenantFeature"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "TenantFeature_key_idx" ON "TenantFeature"("key");
CREATE INDEX IF NOT EXISTS "AutoScoutImportState_status_lockedUntil_idx" ON "AutoScoutImportState"("status", "lockedUntil");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_type_createdAt_idx" ON "AnalyticsEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_visitorHash_createdAt_idx" ON "AnalyticsEvent"("visitorHash", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_carId_type_createdAt_idx" ON "AnalyticsEvent"("carId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_path_type_createdAt_idx" ON "AnalyticsEvent"("path", "type", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'TenantFeature_tenantId_fkey'
          AND table_name = 'TenantFeature'
    ) THEN
        ALTER TABLE "TenantFeature"
        ADD CONSTRAINT "TenantFeature_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'AnalyticsEvent_carId_fkey'
          AND table_name = 'AnalyticsEvent'
    ) THEN
        ALTER TABLE "AnalyticsEvent"
        ADD CONSTRAINT "AnalyticsEvent_carId_fkey"
        FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

INSERT INTO "Tenant" (
    "id",
    "slug",
    "name",
    "displayName",
    "adminDisplayName",
    "status",
    "primaryDomain",
    "domains",
    "siteUrl",
    "legalName",
    "supportEmail",
    "phone",
    "whatsappNumber",
    "addressLine",
    "postalCode",
    "city",
    "region",
    "countryCode",
    "timeZone",
    "currency",
    "r2KeyPrefix"
)
VALUES (
    'tenant_bhenauto',
    'bhenauto',
    'BhenAuto',
    'BhenAuto',
    'BhenAuto Admin',
    'active',
    'bhenauto.com',
    ARRAY['www.bhenauto.com'],
    'https://bhenauto.com',
    'BhenAuto BV',
    'info@bhenauto.com',
    '02 582 83 53',
    '32477544294',
    'Brusselsesteenweg 223',
    '1730',
    'Asse',
    'Vlaams-Brabant',
    'BE',
    'Europe/Brussels',
    'EUR',
    'bhenauto'
)
ON CONFLICT ("slug") DO UPDATE SET
    "name" = EXCLUDED."name",
    "displayName" = EXCLUDED."displayName",
    "adminDisplayName" = EXCLUDED."adminDisplayName",
    "status" = EXCLUDED."status",
    "primaryDomain" = EXCLUDED."primaryDomain",
    "domains" = EXCLUDED."domains",
    "siteUrl" = EXCLUDED."siteUrl",
    "legalName" = EXCLUDED."legalName",
    "supportEmail" = EXCLUDED."supportEmail",
    "phone" = EXCLUDED."phone",
    "whatsappNumber" = EXCLUDED."whatsappNumber",
    "addressLine" = EXCLUDED."addressLine",
    "postalCode" = EXCLUDED."postalCode",
    "city" = EXCLUDED."city",
    "region" = EXCLUDED."region",
    "countryCode" = EXCLUDED."countryCode",
    "timeZone" = EXCLUDED."timeZone",
    "currency" = EXCLUDED."currency",
    "r2KeyPrefix" = EXCLUDED."r2KeyPrefix",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "TenantFeature" ("id", "tenantId", "key", "enabled")
VALUES
    ('tenant_feature_bhenauto_contacts', 'tenant_bhenauto', 'contacts', true),
    ('tenant_feature_bhenauto_appointments', 'tenant_bhenauto', 'appointments', true),
    ('tenant_feature_bhenauto_autoscout24', 'tenant_bhenauto', 'autoscout24', true),
    ('tenant_feature_bhenauto_image_analysis', 'tenant_bhenauto', 'imageAnalysis', true)
ON CONFLICT ("tenantId", "key") DO UPDATE SET
    "enabled" = EXCLUDED."enabled",
    "updatedAt" = CURRENT_TIMESTAMP;
