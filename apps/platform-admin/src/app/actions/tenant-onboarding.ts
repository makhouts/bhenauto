"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@core/db/prisma";
import {
  dealerPackageExists,
  scaffoldDealerPackage,
} from "@core/tenant/scaffold";
import type {
  TenantOnboardingActionState,
  TenantOnboardingInput,
} from "@core/tenant/onboarding";
import { requirePlatformAdmin } from "@/lib/auth-guard";

function hasPrismaCode(error: unknown, codes: string[]) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    codes.includes((error as { code: string }).code)
  );
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function parseCheckbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

const TenantOnboardingSchema = z.object({
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only."),
  name: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(120),
  adminDisplayName: z.string().trim().min(2).max(140),
  legalName: z.string().trim().min(2).max(160),
  primaryDomain: z.string().trim().min(3).max(200),
  siteUrl: z.string().trim().url(),
  supportEmail: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40),
  whatsappNumber: z.string().trim().regex(/^\d{8,20}$/, "Use digits only."),
  addressLine: z.string().trim().min(3).max(160),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(80),
  region: z.string().trim().min(2).max(80),
  countryCode: z.string().trim().length(2),
  timeZone: z.string().trim().min(3).max(80),
  currency: z.string().trim().length(3),
  r2KeyPrefix: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes only."),
  sessionContext: z.string().trim().min(4).max(120),
  themePreset: z.enum(["luxury", "sport", "minimal", "utility"]),
  notes: z.string().trim().max(4000).default(""),
});

export async function createTenantOnboarding(
  _prevState: TenantOnboardingActionState,
  formData: FormData,
): Promise<TenantOnboardingActionState> {
  await requirePlatformAdmin();

  const payload = {
    slug: formData.get("slug"),
    name: formData.get("name"),
    displayName: formData.get("displayName"),
    adminDisplayName: formData.get("adminDisplayName"),
    legalName: formData.get("legalName"),
    primaryDomain: normalizeHost(String(formData.get("primaryDomain") || "")),
    siteUrl: formData.get("siteUrl"),
    supportEmail: formData.get("supportEmail"),
    phone: formData.get("phone"),
    whatsappNumber: formData.get("whatsappNumber"),
    addressLine: formData.get("addressLine"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    region: formData.get("region"),
    countryCode: String(formData.get("countryCode") || "").toUpperCase(),
    timeZone: formData.get("timeZone"),
    currency: String(formData.get("currency") || "").toUpperCase(),
    r2KeyPrefix: formData.get("r2KeyPrefix"),
    sessionContext: formData.get("sessionContext"),
    themePreset: formData.get("themePreset"),
    notes: formData.get("notes"),
  };

  const parsed = TenantOnboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message || "Invalid onboarding input.",
    };
  }

  const features = {
    contacts: parseCheckbox(formData, "feature_contacts"),
    appointments: parseCheckbox(formData, "feature_appointments"),
    autoscout24: parseCheckbox(formData, "feature_autoscout24"),
    imageAnalysis: parseCheckbox(formData, "feature_imageAnalysis"),
  };

  const input: TenantOnboardingInput = {
    ...parsed.data,
    features,
  };

  try {
    if (await dealerPackageExists(input.slug)) {
      return {
        status: "error",
        message: `Dealer package "${input.slug}" already exists.`,
      };
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: input.slug },
          { primaryDomain: input.primaryDomain },
          { domains: { has: input.primaryDomain } },
        ],
      },
      select: { id: true, slug: true },
    });

    if (existingTenant) {
      return {
        status: "error",
        message: `Tenant "${existingTenant.slug}" already uses that slug or domain.`,
      };
    }

    const domains = [`www.${input.primaryDomain}`].filter((domain) => domain !== input.primaryDomain);
    const createdTenant = await prisma.tenant.create({
      data: {
        slug: input.slug,
        name: input.name,
        displayName: input.displayName,
        adminDisplayName: input.adminDisplayName,
        primaryDomain: input.primaryDomain,
        domains,
        siteUrl: input.siteUrl,
        legalName: input.legalName,
        supportEmail: input.supportEmail,
        phone: input.phone,
        whatsappNumber: input.whatsappNumber,
        addressLine: input.addressLine,
        postalCode: input.postalCode,
        city: input.city,
        region: input.region,
        countryCode: input.countryCode,
        timeZone: input.timeZone,
        currency: input.currency,
        r2KeyPrefix: input.r2KeyPrefix,
        features: {
          create: Object.entries(input.features).map(([key, enabled]) => ({
            key,
            enabled,
          })),
        },
      },
      select: { id: true },
    });

    try {
      const scaffold = await scaffoldDealerPackage(input);
      revalidatePath("/");

      return {
        status: "success",
        message: "Tenant, feature package, and dealer scaffold created.",
        tenantId: createdTenant.id,
        packageDir: scaffold.packageDir,
        blueprintPath: scaffold.blueprintPath,
        requiresRestart: true,
      };
    } catch (error) {
      await prisma.tenant.delete({
        where: { id: createdTenant.id },
      }).catch((cleanupError) => {
        console.error("Tenant cleanup failed after scaffold error:", cleanupError);
      });
      throw error;
    }
  } catch (error) {
    if (hasPrismaCode(error, ["P2021", "P2022"])) {
      return {
        status: "error",
        message: "Tenant tables are not available yet. Apply the tenant migration first.",
      };
    }

    if (hasPrismaCode(error, ["P2002"])) {
      return {
        status: "error",
        message: "Slug or domain already exists.",
      };
    }

    console.error("Tenant onboarding failed:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to onboard tenant.",
    };
  }
}
