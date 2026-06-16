import type { TenantFeatureFlags } from "../tenant/bootstrap";

export const TENANT_THEME_PRESETS = [
    {
        value: "luxury",
        label: "Luxury",
        description: "Editorial, premium, high-trust presentation.",
    },
    {
        value: "sport",
        label: "Sport",
        description: "Aggressive, motion-heavy, performance-forward.",
    },
    {
        value: "minimal",
        label: "Minimal",
        description: "Clean, restrained, product-first layout.",
    },
    {
        value: "utility",
        label: "Utility",
        description: "Fast setup, practical, lead-focused conversion.",
    },
] as const;

export type TenantThemePreset = (typeof TENANT_THEME_PRESETS)[number]["value"];

export type TenantOnboardingInput = {
    slug: string;
    name: string;
    displayName: string;
    adminDisplayName: string;
    legalName: string;
    primaryDomain: string;
    siteUrl: string;
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
    themePreset: TenantThemePreset;
    notes: string;
    features: TenantFeatureFlags;
};

export type TenantOnboardingActionState = {
    status: "idle" | "success" | "error";
    message: string | null;
    tenantId?: string;
    packageDir?: string;
    blueprintPath?: string;
    requiresRestart?: boolean;
};
