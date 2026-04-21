import type { Metadata } from "next";
import { locales, isValidLocale, type Locale } from "@/lib/i18n";
import LegalClient from "./LegalClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

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
    nl: "Privacybeleid & Algemene Voorwaarden | BhenAuto",
    fr: "Politique de Confidentialité & Conditions Générales | BhenAuto",
    en: "Privacy Policy & Terms and Conditions | BhenAuto",
  };
  const descriptions: Record<string, string> = {
    nl: "Lees het privacybeleid en de algemene voorwaarden van Bhenauto BV, gevestigd te Asse.",
    fr: "Consultez la politique de confidentialité et les conditions générales de Bhenauto BV, établie à Asse.",
    en: "Read the privacy policy and general terms and conditions of Bhenauto BV, based in Asse.",
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
