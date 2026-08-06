import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import LatestOccasionsCarousel from "@/components/LatestOccasionsCarousel";
import ScrollReveal from "@/components/ScrollReveal";
import WhyChooseUs from "@/components/WhyChooseUs";
import prisma from "@/lib/prisma";
import heroBg from "@/assets/wallpaper.webp";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";
import { getImageUrl, getImageVariantUrl } from "@/lib/image-url";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { localizeCarsForPublic } from "@/lib/autoscout24/public-presentation";
import { businessJsonLd, jsonLdScriptContent } from "@/lib/business-schema";
import { buildPageSocialMetadata, localizedAlternates, localizedUrl, SITE_URL } from "@/lib/site-seo";

const HOMEPAGE_CAROUSEL_LIMIT = 12;

export const revalidate = 60;

const homepageTitles: Record<Locale, string> = {
  nl: "BhenAuto Asse | Premium Tweedehandswagens & Garage",
  fr: "BhenAuto Asse | Voitures d'occasion premium & Garage",
  en: "BhenAuto Asse | Premium Used Cars & Garage",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const homepageTitle = homepageTitles[locale];

  return {
    title: { absolute: homepageTitle },
    description: dict.home.heroSubtitle,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: localizedUrl(locale),
      languages: localizedAlternates(),
    },
    ...buildPageSocialMetadata({
      locale,
      title: homepageTitle,
      description: dict.home.heroSubtitle,
    }),
  };
}

// Async server component — runs its Prisma queries independently so the hero
// renders immediately while this streams in behind a Suspense boundary.
async function FeaturedCarsSection({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [featuredDb, fillDb] = await Promise.all([
    prisma.car.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: HOMEPAGE_CAROUSEL_LIMIT,
      include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1 } },
    }),
    prisma.car.findMany({
      where: { featured: false },
      orderBy: { createdAt: "desc" },
      take: HOMEPAGE_CAROUSEL_LIMIT,
      include: { images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 1 } },
    }),
  ]);

  const displayCarsDb =
    featuredDb.length >= HOMEPAGE_CAROUSEL_LIMIT
      ? featuredDb
      : [...featuredDb, ...fillDb.slice(0, HOMEPAGE_CAROUSEL_LIMIT - featuredDb.length)];
  const localizedCars = await localizeCarsForPublic(displayCarsDb, locale);

  const carouselData = localizedCars.map((c) => ({
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
        ? getImageVariantUrl(c.images[0].url, "thumb")
        : "https://images.unsplash.com/photo-1555312399-28c11e73dbd6?q=80&w=2070&auto=format&fit=crop",
    imageFallback: c.images[0]?.url ? getImageUrl(c.images[0].url) : undefined,
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
        <div className="h-5 w-32 mb-3 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        <div className="h-10 w-64 mb-14 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden animate-pulse" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
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
        dangerouslySetInnerHTML={jsonLdScriptContent(businessJsonLd)}
      />

      {/* Hero — renders immediately, no data dependency */}
      <section className="relative flex min-h-[760px] items-end overflow-hidden bg-[#111116] pb-16 pt-32 sm:min-h-[820px] sm:pb-20 lg:min-h-svh lg:items-center lg:pb-0">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroBg}
            alt={h.heroLabel}
            fill
            sizes="100vw"
            quality={70}
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,12,.9)_0%,rgba(8,8,12,.52)_48%,rgba(8,8,12,.12)_78%),linear-gradient(0deg,rgba(8,8,12,.72)_0%,transparent_48%)]"></div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-start px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="mb-6 flex items-center gap-4 text-[10px] font-extrabold uppercase tracking-[0.24em] text-white/65">
            <span className="h-[2px] w-9 bg-[#d91c1c]" /> BhenAuto · Asse
          </div>
          <h1 className="brand-display max-w-5xl text-white">
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
          <p className="mb-9 mt-7 max-w-xl border-l border-white/30 pl-5 text-base font-medium leading-7 text-white/75 sm:text-lg">
            {h.heroSubtitle}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={`/${locale}/inventory`}
              className="brand-button-primary w-full sm:w-auto"
            >
              {h.heroCta}
            </Link>
            <Link
              href={`/${locale}/werkplaats`}
              className="brand-button-secondary w-full text-white hover:bg-white hover:text-[#111116] sm:w-auto"
            >
              {h.heroCtaSecondary}
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel — streams in once Prisma resolves, hero is already visible */}
        <Suspense fallback={<CarouselSkeleton />}>
          <FeaturedCarsSection dict={dict} locale={locale} />
        </Suspense>

      <WhyChooseUs lang={locale} dict={dict.whyChooseUs} />

      {/* Reviews Section */}
      <ScrollReveal>
        <section className="theme-bg py-20 sm:py-28">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <p className="brand-kicker mb-5">Google</p>
                <h2 className="brand-section-title theme-text">{h.reviewsTitle}</h2>
                <div className="mt-7 border-t border-[var(--theme-border)] pt-5">
                  <span className="font-headings text-6xl font-bold leading-none theme-text">5.0</span>
                  <div className="flex text-amber-500">
                    {Array(5).fill(0).map((_, j) => (
                      <svg key={j} className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wider theme-text-muted">
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

            <div className="grid grid-cols-1 border-t border-l border-[var(--theme-border)] sm:grid-cols-2 lg:col-span-9 lg:grid-cols-2">
              {h.reviews.map((testimonial, i) => (
                <div
                  key={i}
                  className="relative flex min-h-[260px] flex-col items-start border-b border-r border-[var(--theme-border)] p-6 sm:p-8"
                >
                  <div className="flex gap-4 items-center mb-4">
                    <div
                      className="flex size-10 items-center justify-center border border-[var(--theme-border)] font-headings text-xl font-bold"
                      style={{ color: "var(--theme-text-muted)" }}
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
                  <p className="mb-4 flex-grow text-sm leading-7 theme-text-muted">
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
          </div>
        </section>
      </ScrollReveal>
    </main>
  );
}
