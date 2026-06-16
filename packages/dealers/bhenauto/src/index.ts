import type { TenantBootstrap } from "../../../core/src/tenant/bootstrap";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.com";

export const bhenautoTenantBootstrap: TenantBootstrap = {
    slug: process.env.DEFAULT_TENANT_SLUG || "bhenauto",
    name: "BhenAuto",
    displayName: "BhenAuto",
    adminDisplayName: "BhenAuto Admin",
    primaryDomain: "bhenauto.com",
    domains: ["www.bhenauto.com"],
    siteUrl,
    legalName: "BhenAuto BV",
    supportEmail: "info@bhenauto.com",
    phone: "02 582 83 53",
    whatsappNumber: "32477544294",
    addressLine: "Brusselsesteenweg 223",
    postalCode: "1730",
    city: "Asse",
    region: "Vlaams-Brabant",
    countryCode: "BE",
    timeZone: "Europe/Brussels",
    currency: "EUR",
    r2KeyPrefix: "bhenauto",
    sessionContext: "bhenauto-admin-session-v1",
    features: {
        contacts: true,
        appointments: true,
        autoscout24: true,
        imageAnalysis: true,
    },
};
