import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import { locales, isValidLocale, type Locale } from "@/lib/i18n";
import { MapPin, Car, Wrench, Phone, Globe, ChevronRight } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const titles: Record<string, string> = {
    nl: "Sitemap | BhenAuto",
    fr: "Plan du site | BhenAuto",
    en: "Sitemap | BhenAuto",
  };
  return {
    title: titles[lang] ?? "Sitemap | BhenAuto",
    alternates: {
      canonical: `${BASE_URL}/${lang}/sitemap`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/sitemap`])),
    },
    robots: { index: false }, // Sitemap page itself needn't be indexed
  };
}

export default async function SitemapPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);

  const cars = await prisma.car.findMany({
    select: { slug: true, title: true, brand: true, model: true, year: true, sold: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  const staticPages = [
    { href: `/${locale}`, label: dict.nav.home, icon: "home" },
    { href: `/${locale}/inventory`, label: dict.nav.inventory, icon: "car" },
    { href: `/${locale}/werkplaats`, label: dict.nav.werkplaats, icon: "wrench" },
    { href: `/${locale}/contact`, label: dict.nav.contact, icon: "phone" },
  ];

  // Group cars by brand
  const carsByBrand = cars.reduce<Record<string, typeof cars>>((acc, car) => {
    const brand = car.brand || "Other";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(car);
    return acc;
  }, {});

  const sitemapLabels: Record<string, Record<string, string>> = {
    nl: {
      title: "Sitemap",
      subtitle: "Een overzicht van alle pagina's op onze website.",
      mainPages: "Hoofdpagina's",
      vehicles: "Voertuigen",
      xmlVersion: "XML-versie bekijken",
    },
    fr: {
      title: "Plan du site",
      subtitle: "Un aperçu de toutes les pages de notre site web.",
      mainPages: "Pages principales",
      vehicles: "Véhicules",
      xmlVersion: "Voir la version XML",
    },
    en: {
      title: "Sitemap",
      subtitle: "An overview of all pages on our website.",
      mainPages: "Main pages",
      vehicles: "Vehicles",
      xmlVersion: "View XML version",
    },
  };

  const t = sitemapLabels[locale] ?? sitemapLabels.fr;

  return (
    <main className="min-h-screen theme-bg pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.22em] uppercase text-[#d91c1c] mb-4">
            <Globe size={12} />
            BhenAuto
          </div>
          <h1 className="text-4xl md:text-5xl font-headings font-black theme-text tracking-tight mb-3">
            {t.title}
          </h1>
          <p className="theme-text-muted text-lg font-medium max-w-xl">{t.subtitle}</p>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-[#d91c1c] hover:underline"
          >
            {t.xmlVersion}
            <ChevronRight size={12} />
          </a>
        </div>

        {/* ── Main Pages ── */}
        <section className="mb-14">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] theme-text-faint mb-5 flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: "var(--theme-border)" }} />
            {t.mainPages}
            <span className="flex-1 h-px" style={{ background: "var(--theme-border)" }} />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {staticPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group theme-surface rounded-xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ border: "1px solid var(--theme-border)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-[#d91c1c] shrink-0 transition-colors duration-300 group-hover:bg-[#d91c1c] group-hover:text-white"
                  style={{ background: "rgba(217,28,28,0.08)" }}
                >
                  {page.icon === "home" && <MapPin size={18} />}
                  {page.icon === "car" && <Car size={18} />}
                  {page.icon === "wrench" && <Wrench size={18} />}
                  {page.icon === "phone" && <Phone size={18} />}
                </div>
                <span className="font-bold text-sm theme-text group-hover:text-[#d91c1c] transition-colors duration-300">
                  {page.label}
                </span>
                <ChevronRight size={14} className="ml-auto theme-text-faint group-hover:text-[#d91c1c] group-hover:translate-x-0.5 transition-all duration-300" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Vehicles ── */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] theme-text-faint mb-5 flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: "var(--theme-border)" }} />
            {t.vehicles} ({cars.length})
            <span className="flex-1 h-px" style={{ background: "var(--theme-border)" }} />
          </h2>

          <div className="space-y-8">
            {Object.entries(carsByBrand).map(([brand, brandCars]) => (
              <div key={brand}>
                {/* Brand header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d91c1c]">
                    {brand}
                  </span>
                  <span className="text-[10px] theme-text-faint font-bold">
                    {brandCars.length}
                  </span>
                  <span className="flex-1 h-px" style={{ background: "var(--theme-border-subtle)" }} />
                </div>

                {/* Car links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {brandCars.map((car) => (
                    <Link
                      key={car.slug}
                      href={`/${locale}/cars/${car.slug}`}
                      className="group flex items-center gap-2.5 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-[rgba(217,28,28,0.06)]"
                      style={{ border: "1px solid transparent" }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200"
                        style={{
                          background: car.sold
                            ? "var(--theme-text-faint)"
                            : "#d91c1c",
                        }}
                      />
                      <span className="text-sm theme-text-muted group-hover:theme-text font-medium truncate transition-colors duration-200">
                        {car.year} {car.brand} {car.model}
                      </span>
                      {car.sold && (
                        <span className="ml-auto text-[9px] font-black uppercase tracking-wider theme-text-faint shrink-0">
                          sold
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
