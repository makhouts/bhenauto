import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import LatestOccasionsCarousel from "@/components/LatestOccasionsCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import WhyChooseUs from "@/components/WhyChooseUs";
import prisma from "@/lib/prisma";
import heroBg from "@/assets/wallpaper.avif";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";
import { getImageUrl } from "@/lib/image-url";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);

  const alternateLanguages: Record<string, string> = {};
  for (const l of locales) {
    alternateLanguages[l] = `${BASE_URL}/${l}`;
  }

  const ogLocales: Record<Locale, string> = {
    nl: "nl_BE",
    fr: "fr_BE",
    en: "en_GB",
  };

  return {
    title: {
      default: `BhenAuto | ${dict.home.heroLabel}`,
      template: "%s | BhenAuto",
    },
    description: dict.home.heroSubtitle,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: alternateLanguages,
    },
    openGraph: {
      type: "website",
      locale: ogLocales[locale],
      siteName: "BhenAuto",
      title: `BhenAuto | ${dict.home.heroLabel}`,
      description: dict.home.heroSubtitle,
    },
    twitter: {
      card: "summary_large_image",
      title: `BhenAuto | ${dict.home.heroLabel}`,
      description: dict.home.heroSubtitle,
    },
  };
}

// Async server component — runs its Prisma queries independently so the hero
// renders immediately while this streams in behind a Suspense boundary.
async function FeaturedCarsSection({ dict }: { dict: Dictionary }) {
  const [featuredDb, fillDb] = await Promise.all([
    prisma.car.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { images: { take: 1 } },
    }),
    prisma.car.findMany({
      where: { featured: false },
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { images: { take: 1 } },
    }),
  ]);

  const displayCarsDb =
    featuredDb.length >= 9
      ? featuredDb
      : [...featuredDb, ...fillDb.slice(0, 9 - featuredDb.length)];

  const carouselData = displayCarsDb.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    brand: c.brand,
    model: c.model,
    price: c.price,
    year: c.year,
    mileage: c.mileage,
    horsepower: c.horsepower,
    fuel_type: c.fuel_type,
    image:
      c.images[0]?.url
        ? getImageUrl(c.images[0].url)
        : "https://images.unsplash.com/photo-1555312399-28c11e73dbd6?q=80&w=2070&auto=format&fit=crop",
    sold: c.sold,
  }));

  return (
    <LatestOccasionsCarousel
      cars={carouselData}
      dict={dict.carousel}
      homeDict={dict.home}
      commonDict={dict.common}
    />
  );
}

function CarouselSkeleton() {
  return (
    <div className="py-24 theme-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-5 w-32 rounded mb-3 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        <div className="h-10 w-64 rounded mb-14 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
              <div className="h-52 w-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="p-6 space-y-3">
                <div className="h-6 w-3/4 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                <div className="h-10 w-full rounded mt-4" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "name": "BhenAuto",
  "url": "https://bhenauto.be",
  "telephone": "+32 2 582 83 53",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Asse",
    "addressRegion": "Vlaams-Brabant",
    "postalCode": "1730",
    "addressCountry": "BE",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 50.898611,
    "longitude": 4.225758,
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "10:00",
      "closes": "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "10:00",
      "closes": "17:00",
    },
  ],
};

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const h = dict.home;

  return (
    <main className="flex flex-col min-h-screen theme-bg">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd).replace(/<\//g, '<\\/') }}
      />

      {/* Hero — renders immediately, no data dependency */}
      <section className="relative h-screen flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt={h.heroLabel}
            fill
            sizes="100vw"
            className="object-cover animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto flex flex-col items-start animate-fade-in pt-20">
          <h1 className="text-6xl md:text-8xl font-headings text-white mb-2 leading-tight tracking-tighter font-black">
            {locale === "nl" ? (
              <>
                Rijden in perfectie<br />
                <span className="text-[#d91c1c]">begint hier.</span>
              </>
            ) : locale === "fr" ? (
              <>
                La perfection<br />
                <span className="text-[#d91c1c]">commence ici.</span>
              </>
            ) : (
              <>
                Driving perfection<br />
                <span className="text-[#d91c1c]">starts here.</span>
              </>
            )}
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl font-medium tracking-wide">
            {h.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={`/${locale}/inventory`}
              className="px-8 py-3.5 bg-[#d91c1c] text-white font-bold rounded hover:bg-[#b91515] transition-colors w-full sm:w-auto text-center"
            >
              {h.heroCta}
            </Link>
            <Link
              href={`/${locale}/werkplaats`}
              className="px-8 py-3.5 bg-transparent text-white border border-white/50 backdrop-blur-sm font-bold rounded hover:bg-white hover:text-slate-900 hover:border-white transition-colors w-full sm:w-auto text-center"
            >
              {h.heroCtaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel — streams in once Prisma resolves, hero is already visible */}
      <Suspense fallback={<CarouselSkeleton />}>
        <FeaturedCarsSection dict={dict} />
      </Suspense>

      <WhyChooseUs lang={locale} dict={dict.whyChooseUs} />

      {/* Reviews Section */}
      <ScrollReveal>
        <section className="py-24 theme-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h2 className="text-3xl font-headings font-black theme-text inline-block border-b-2 border-[#d91c1c] pb-2 mb-3">
                  {h.reviewsTitle}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black theme-text leading-none">5.0</span>
                  <div className="flex text-amber-500">
                    {Array(5).fill(0).map((_, j) => (
                      <svg key={j} className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold theme-text-muted">
                    Google Reviews
                    <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {h.reviews.map((testimonial, i) => (
                <div
                  key={i}
                  className="theme-surface p-6 rounded-xl shadow-sm relative flex flex-col items-start hover:shadow-md transition-shadow"
                  style={{ border: "1px solid var(--theme-border)" }}
                >
                  <div className="flex gap-4 items-center mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                      style={{ backgroundColor: "var(--theme-badge-bg)", color: "var(--theme-text-muted)" }}
                    >
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold theme-text leading-tight">{testimonial.name}</h3>
                      <p className="text-xs theme-text-faint">{h.reviewsRole}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-amber-400 mb-3">
                    {Array(5).fill(0).map((_, j) => (
                      <svg key={j} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="theme-text-muted text-[13px] leading-relaxed mb-4 flex-grow">
                    {testimonial.quote}
                  </p>
                  <div className="mt-auto w-4 h-4 opacity-50">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
