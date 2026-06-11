import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isValidLocale, type Locale } from "@/lib/i18n";
import PublicAnalyticsTracker from "@/components/analytics/PublicAnalyticsTracker";
import { LocaleProvider } from "@/components/LocaleContext";
import ConditionalLayout from "@/components/ConditionalLayout";
import { manrope } from "@/app/fonts";
import { absoluteUrl, localizedAlternates, localizedUrl, ogLocales, SITE_URL } from "@/lib/site-seo";
import "../../globals.css";

const imageHosts = (() => {
  const hosts = new Set<string>(["https://images.bhenauto.com"]);
  const configured = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (configured) {
    try {
      hosts.add(new URL(configured).origin);
    } catch {}
  }
  return [...hosts];
})();

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
  const locale: Locale = isValidLocale(lang) ? lang : "fr";

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

  return {
    title: {
      default: titles[locale],
      template: `%s | BhenAuto`,
    },
    description: descriptions[locale],
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: localizedUrl(locale),
      languages: localizedAlternates(),
    },
    openGraph: {
      type: "website",
      url: localizedUrl(locale),
      locale: ogLocales[locale],
      siteName: "BhenAuto",
      title: titles[locale],
      description: descriptions[locale],
      images: [
        {
          url: absoluteUrl("/og-image.png"),
          width: 1024,
          height: 1024,
          alt: "BhenAuto — Véhicules d'Occasion Premium",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale],
      description: descriptions[locale],
      images: [absoluteUrl("/og-image.png")],
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
        {imageHosts.map((href) => (
          <link key={`${href}-prefetch`} rel="dns-prefetch" href={href} />
        ))}
        {imageHosts.map((href) => (
          <link key={`${href}-preconnect`} rel="preconnect" href={href} crossOrigin="" />
        ))}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#020214" />
      </head>
      <body className={`${manrope.variable} antialiased min-h-screen flex flex-col`}>
        <LocaleProvider locale={lang as Locale}>
          <PublicAnalyticsTracker locale={lang} />
          <ConditionalLayout locale={lang as Locale}>{children}</ConditionalLayout>
        </LocaleProvider>
      </body>
    </html>
  );
}
