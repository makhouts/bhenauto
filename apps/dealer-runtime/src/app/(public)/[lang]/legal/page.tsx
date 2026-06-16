import type { Metadata } from "next";
import { locales, isValidLocale, type Locale } from "@/lib/i18n";
import LegalClient from "./LegalClient";
import { DEFAULT_TENANT_BOOTSTRAP } from "@/lib/tenant-bootstrap";

const BASE_URL = DEFAULT_TENANT_BOOTSTRAP.siteUrl;

export const revalidate = 86400; // once per day

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";

  const titles: Record<string, string> = {
    nl: "Privacybeleid & Algemene Voorwaarden",
    fr: "Politique de Confidentialité & Conditions Générales",
    en: "Privacy Policy & Terms and Conditions",
  };
  const descriptions: Record<string, string> = {
    nl: `Lees het privacybeleid en de algemene voorwaarden van ${DEFAULT_TENANT_BOOTSTRAP.legalName}, gevestigd te ${DEFAULT_TENANT_BOOTSTRAP.city}.`,
    fr: `Consultez la politique de confidentialité et les conditions générales de ${DEFAULT_TENANT_BOOTSTRAP.legalName}, établie à ${DEFAULT_TENANT_BOOTSTRAP.city}.`,
    en: `Read the privacy policy and general terms and conditions of ${DEFAULT_TENANT_BOOTSTRAP.legalName}, based in ${DEFAULT_TENANT_BOOTSTRAP.city}.`,
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    alternates: {
      canonical: `${BASE_URL}/${locale}/legal`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}/legal`])
      ),
    },
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
    },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  return <LegalClient locale={locale} />;
}
