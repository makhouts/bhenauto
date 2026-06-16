import type { TenantBootstrap } from "../../../core/src/tenant/bootstrap";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://__DEALER_PRIMARY_DOMAIN__";

export const __DEALER_SLUG_CAMEL__TenantBootstrap: TenantBootstrap = {
    slug: "__DEALER_SLUG__",
    name: "__DEALER_NAME__",
    displayName: "__DEALER_DISPLAY_NAME__",
    adminDisplayName: "__DEALER_ADMIN_DISPLAY_NAME__",
    primaryDomain: "__DEALER_PRIMARY_DOMAIN__",
    domains: ["www.__DEALER_PRIMARY_DOMAIN__"],
    siteUrl,
    legalName: "__DEALER_LEGAL_NAME__",
    supportEmail: "__DEALER_SUPPORT_EMAIL__",
    phone: "__DEALER_PHONE__",
    whatsappNumber: "__DEALER_WHATSAPP_NUMBER__",
    addressLine: "__DEALER_ADDRESS_LINE__",
    postalCode: "__DEALER_POSTAL_CODE__",
    city: "__DEALER_CITY__",
    region: "__DEALER_REGION__",
    countryCode: "__DEALER_COUNTRY_CODE__",
    timeZone: "__DEALER_TIMEZONE__",
    currency: "__DEALER_CURRENCY__",
    r2KeyPrefix: "__DEALER_R2_PREFIX__",
    sessionContext: "__DEALER_SESSION_CONTEXT__",
    features: {
        contacts: true,
        appointments: false,
        autoscout24: false,
        imageAnalysis: false,
    },
};
