import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isValidLocale, type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/components/LocaleContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import { manrope } from "@/app/fonts";
import "../../globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.com";

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Generate locale-aware metadata with hreflang alternates
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const titles: Record<string, string> = {
    nl: "BhenAuto | Premium Tweedehands Voertuigen & Carrosserie",
    fr: "BhenAuto | Véhicules d'Occasion Premium & Carrosserie",
    en: "BhenAuto | Premium Pre-Owned Vehicles & Bodywork",
  };

  const descriptions: Record<string, string> = {
    nl: "Ontdek onze zorgvuldig geselecteerde collectie van premium en luxe tweedehands voertuigen. Professioneel carrosseriewerk en schadeherstel in Asse, België.",
    fr: "Découvrez notre collection soigneusement sélectionnée de véhicules d'occasion premium et de luxe. Carrosserie professionnelle et réparation de dommages à Asse, Belgique.",
    en: "Discover our carefully curated collection of premium and luxury pre-owned vehicles. Professional bodywork and damage repair in Asse, Belgium.",
  };

  const ogLocales: Record<string, string> = {
    nl: "nl_BE",
    fr: "fr_BE",
    en: "en_GB",
  };

  // Build hreflang alternates
  const alternateLanguages: Record<string, string> = {};
  for (const locale of locales) {
    alternateLanguages[locale] = `${BASE_URL}/${locale}`;
  }

  return {
    title: {
      default: titles[lang] || titles.fr,
      template: `%s | BhenAuto`,
    },
    description: descriptions[lang] || descriptions.fr,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${lang}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "website",
      locale: ogLocales[lang] || "fr_BE",
      siteName: "BhenAuto",
      title: titles[lang] || titles.fr,
      description: descriptions[lang] || descriptions.fr,
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1024,
          height: 1024,
          alt: "BhenAuto — Véhicules d'Occasion Premium",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[lang] || titles.fr,
      description: descriptions[lang] || descriptions.fr,
      images: [`${BASE_URL}/og-image.png`],
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale — 404 if invalid
  if (!isValidLocale(lang)) {
    notFound();
  }

  return (
    <html lang={lang} className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="dns-prefetch" href="https://images.bhenauto.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#020214" />
      </head>
      <body className={`${manrope.variable} antialiased min-h-screen flex flex-col`}>
        <LocaleProvider locale={lang as Locale}>
          <ConditionalLayout locale={lang as Locale}>{children}</ConditionalLayout>
        </LocaleProvider>
      </body>
    </html>
  );
}
