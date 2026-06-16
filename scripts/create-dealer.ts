import { scaffoldDealerPackage } from "../packages/core/src/tenant/scaffold";
import type { TenantOnboardingInput } from "../packages/core/src/tenant/onboarding";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function requireArg(flag: string) {
  const value = getArg(flag);
  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }
  return value;
}

async function main() {
  const slug = requireArg("--slug");
  const name = requireArg("--name");
  const primaryDomain = getArg("--primary-domain") || `${slug}.example.com`;
  const siteUrl = getArg("--site-url") || `https://${primaryDomain}`;
  const displayName = getArg("--display-name") || name;
  const adminDisplayName = getArg("--admin-display-name") || `${displayName} Admin`;
  const legalName = getArg("--legal-name") || name;
  const supportEmail = getArg("--email") || `info@${primaryDomain}`;
  const input: TenantOnboardingInput = {
    slug,
    name,
    displayName,
    adminDisplayName,
    legalName,
    siteUrl,
    supportEmail,
    phone: getArg("--phone") || "+32 0 00 00 00 00",
    whatsappNumber: getArg("--whatsapp-number") || "32000000000",
    primaryDomain,
    addressLine: getArg("--address-line") || "Dealer Address Line",
    postalCode: getArg("--postal-code") || "0000",
    city: getArg("--city") || "Dealer City",
    region: getArg("--region") || "Dealer Region",
    countryCode: getArg("--country-code") || "BE",
    timeZone: getArg("--time-zone") || "Europe/Brussels",
    currency: getArg("--currency") || "EUR",
    r2KeyPrefix: getArg("--r2-prefix") || slug,
    sessionContext: getArg("--session-context") || `${slug}-admin-session-v1`,
    themePreset: (getArg("--theme-preset") || "luxury") as TenantOnboardingInput["themePreset"],
    notes: getArg("--notes") || "",
    features: {
      contacts: true,
      appointments: false,
      autoscout24: false,
      imageAnalysis: false,
    },
  };

  const scaffold = await scaffoldDealerPackage(input);

  console.log(`Created dealer package at ${scaffold.packageDir}`);
  console.log(`Blueprint written to ${scaffold.blueprintPath}`);
  console.log(`Next: fill dealer-specific public UI inside packages/dealers/${slug}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
