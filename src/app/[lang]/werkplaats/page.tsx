import type { Metadata } from "next";

import AppointmentBooking from "@/components/AppointmentBooking";
import WerkplaatsHero from "@/components/WerkplaatsHero";
import WerkplaatsServices from "@/components/WerkplaatsServices";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

// Static content — revalidate once per hour
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const w = dict.werkplaats;

  const alternateLanguages: Record<string, string> = {};
  for (const l of locales) {
    alternateLanguages[l] = `${BASE_URL}/${l}/werkplaats`;
  }

  return {
    title: w.heroTitle,
    description: w.heroSubtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/werkplaats`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${w.heroTitle} | BhenAuto`,
      description: w.heroSubtitle,
    },
  };
}

export default async function WerkplaatsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const w = dict.werkplaats;



  return (
    <main className="min-h-screen theme-bg">

      {/* ── Hero + service cards ──────────────────────────────────────── */}
      <WerkplaatsHero dict={dict.werkplaats} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-12">

        {/* ── Services bento grid ───────────────────────────────────── */}
        <WerkplaatsServices dict={dict.werkplaats} />

        {/* ── Inline appointment wizard ─────────────────────────────── */}
        <div id="afspraak-wizard" className="mb-16 scroll-mt-24">
          <AppointmentBooking dict={dict.appointment} />
        </div>



      </div>
    </main>
  );
}
