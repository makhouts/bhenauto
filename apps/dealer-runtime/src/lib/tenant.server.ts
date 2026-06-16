import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
    DEFAULT_TENANT_BOOTSTRAP,
    TENANT_FEATURE_KEYS,
    getTenantBootstrapImageHosts,
    type TenantBootstrap,
    type TenantFeatureFlags,
    type TenantFeatureKey,
} from "@/lib/tenant-bootstrap";

type TenantRecord = Awaited<ReturnType<typeof fetchTenantBySlug>>;

export type ResolvedTenant = TenantBootstrap & {
    id: string | null;
    source: "bootstrap" | "database";
    imageHosts: string[];
};

function isMissingTenantInfrastructure(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError
        && (error.code === "P2021" || error.code === "P2022");
}

function normalizeHost(host: string | null | undefined) {
    return host?.split(":")[0]?.trim().toLowerCase() || null;
}

function mergeFeatureFlags(
    bootstrap: TenantFeatureFlags,
    overrides?: Array<{ key: string; enabled: boolean }>,
) {
    const merged: TenantFeatureFlags = { ...bootstrap };

    for (const key of TENANT_FEATURE_KEYS) {
        const match = overrides?.find((entry) => entry.key === key);
        if (match) merged[key] = match.enabled;
    }

    return merged;
}

function mergeTenant(record: TenantRecord | null): ResolvedTenant {
    const bootstrap = DEFAULT_TENANT_BOOTSTRAP;

    if (!record) {
        return {
            ...bootstrap,
            id: null,
            source: "bootstrap",
            imageHosts: getTenantBootstrapImageHosts(bootstrap),
        };
    }

    const merged: TenantBootstrap = {
        slug: record.slug,
        name: record.name,
        displayName: record.displayName || record.name,
        adminDisplayName: record.adminDisplayName || `${record.displayName || record.name} Admin`,
        primaryDomain: record.primaryDomain || bootstrap.primaryDomain,
        domains: record.domains.length > 0 ? record.domains : bootstrap.domains,
        siteUrl: record.siteUrl || bootstrap.siteUrl,
        legalName: record.legalName || bootstrap.legalName,
        supportEmail: record.supportEmail || bootstrap.supportEmail,
        phone: record.phone || bootstrap.phone,
        whatsappNumber: record.whatsappNumber || bootstrap.whatsappNumber,
        addressLine: record.addressLine || bootstrap.addressLine,
        postalCode: record.postalCode || bootstrap.postalCode,
        city: record.city || bootstrap.city,
        region: record.region || bootstrap.region,
        countryCode: record.countryCode || bootstrap.countryCode,
        timeZone: record.timeZone,
        currency: record.currency,
        r2KeyPrefix: record.r2KeyPrefix || bootstrap.r2KeyPrefix,
        sessionContext: bootstrap.sessionContext,
        features: mergeFeatureFlags(bootstrap.features, record.features),
    };

    return {
        ...merged,
        id: record.id,
        source: "database",
        imageHosts: getTenantBootstrapImageHosts(merged),
    };
}

const fetchTenantBySlug = cache(async (slug: string) => {
    try {
        return await prisma.tenant.findUnique({
            where: { slug },
            include: { features: true },
        });
    } catch (error) {
        if (isMissingTenantInfrastructure(error)) return null;
        throw error;
    }
});

const fetchTenantByHost = cache(async (host: string) => {
    try {
        return await prisma.tenant.findFirst({
            where: {
                status: "active",
                OR: [
                    { primaryDomain: host },
                    { domains: { has: host } },
                ],
            },
            include: { features: true },
        });
    } catch (error) {
        if (isMissingTenantInfrastructure(error)) return null;
        throw error;
    }
});

export async function getDefaultTenant() {
    return mergeTenant(await fetchTenantBySlug(DEFAULT_TENANT_BOOTSTRAP.slug));
}

export async function getCurrentTenant() {
    let host: string | null = null;

    try {
        const headerStore = await headers();
        host = normalizeHost(headerStore.get("host"));
    } catch {
        // Some background contexts do not expose request headers.
    }

    if (host && host !== "localhost" && host !== "127.0.0.1") {
        const tenant = await fetchTenantByHost(host);
        if (tenant) return mergeTenant(tenant);
    }

    return getDefaultTenant();
}

export async function getCurrentTenantFeatures() {
    return (await getCurrentTenant()).features;
}

export async function isCurrentTenantFeatureEnabled(feature: TenantFeatureKey) {
    return (await getCurrentTenantFeatures())[feature];
}

export async function assertCurrentTenantFeatureEnabled(feature: TenantFeatureKey) {
    if (!await isCurrentTenantFeatureEnabled(feature)) {
        throw new Error(`The ${feature} feature is not enabled for this tenant.`);
    }
}

export async function requireCurrentTenantFeature(feature: TenantFeatureKey) {
    if (!await isCurrentTenantFeatureEnabled(feature)) {
        notFound();
    }
}
