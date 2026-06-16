export const TENANT_FEATURE_KEYS = [
    "contacts",
    "appointments",
    "autoscout24",
    "imageAnalysis",
] as const;

export type TenantFeatureKey = (typeof TENANT_FEATURE_KEYS)[number];
export type TenantFeatureFlags = Record<TenantFeatureKey, boolean>;

export type TenantBootstrap = {
    slug: string;
    name: string;
    displayName: string;
    adminDisplayName: string;
    primaryDomain: string;
    domains: string[];
    siteUrl: string;
    legalName: string;
    supportEmail: string;
    phone: string;
    whatsappNumber: string;
    addressLine: string;
    postalCode: string;
    city: string;
    region: string;
    countryCode: string;
    timeZone: string;
    currency: string;
    r2KeyPrefix: string;
    sessionContext: string;
    features: TenantFeatureFlags;
};

export function getTenantBootstrapSiteUrl(tenant: TenantBootstrap) {
    return tenant.siteUrl;
}

export function getTenantBootstrapImageHosts(tenant: TenantBootstrap) {
    const hosts = new Set<string>();
    const configuredOrigins = [
        process.env.NEXT_PUBLIC_IMAGE_CDN_ORIGIN,
        process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    ];

    for (const origin of configuredOrigins) {
        if (!origin) continue;

        try {
            hosts.add(new URL(origin).origin);
        } catch {
            // Ignore malformed env overrides.
        }
    }

    if (tenant.siteUrl) {
        try {
            hosts.add(new URL(tenant.siteUrl).origin);
        } catch {
            // Ignore invalid tenant URLs.
        }
    }

    return [...hosts];
}

export function getTenantBootstrapEmailParts(tenant: TenantBootstrap) {
    const [user = "", host = ""] = tenant.supportEmail.split("@");
    const [domainName = "", tld = ""] = host.split(".");
    return { user, domainName, tld };
}

export function getTenantBootstrapAddress(tenant: TenantBootstrap) {
    return `${tenant.addressLine}, ${tenant.postalCode} ${tenant.city}`;
}

export function getTenantBootstrapPhoneHref(tenant: TenantBootstrap) {
    const normalized = tenant.phone.replace(/[^\d+]/g, "");

    if (normalized.startsWith("+")) {
        return `tel:${normalized}`;
    }

    const digits = normalized.replace(/\D/g, "");
    if (digits.startsWith("00")) {
        return `tel:+${digits.slice(2)}`;
    }
    if (digits.startsWith("0") && tenant.countryCode === "BE") {
        return `tel:+32${digits.slice(1)}`;
    }

    return `tel:+${digits}`;
}

export function getTenantBootstrapWhatsappUrl(tenant: TenantBootstrap) {
    return `https://wa.me/${tenant.whatsappNumber}`;
}
