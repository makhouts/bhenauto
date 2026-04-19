import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import InventoryFilter from "@/components/InventoryFilter";
import InfiniteInventory from "@/components/InfiniteInventory";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { fetchCarsPaginated } from "@/app/actions/fetchCars";
import { getAllBrands } from "@/lib/brands";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";
const PAGE_SIZE = 9;

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const inv = dict.inventory;

  const alternateLanguages: Record<string, string> = {};
  for (const l of locales) {
    alternateLanguages[l] = `${BASE_URL}/${l}/inventory`;
  }

  return {
    title: inv.pageTitle,
    description: inv.pageSubtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/inventory`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${inv.pageTitle} | BhenAuto`,
      description: inv.pageSubtitle,
    },
  };
}

// ── Async server components — each owns its own data fetch ─────────────────

async function FilterSection({
  dict,
}: {
  dict: Awaited<ReturnType<typeof getDictionary>>["inventory"];
}) {
  const availableBrands = await getAllBrands();
  return <InventoryFilter availableBrands={availableBrands} dict={dict} />;
}



async function CarsSection({
  searchParams,
  dict,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  dict: Awaited<ReturnType<typeof getDictionary>>;
}) {
  const { query, brand, sort, maxPrice, maxMileage, fuel } = searchParams as {
    query?: string;
    brand?: string | string[];
    sort?: string;
    maxPrice?: string;
    maxMileage?: string;
    fuel?: string | string[];
  };

  const { cars: initialCars, hasMore: initialHasMore, total } = await fetchCarsPaginated({
    page: 1,
    pageSize: PAGE_SIZE,
    brand,
    query,
    sort,
    maxPrice,
    maxMileage,
    fuel,
  });

  return (
    <InfiniteInventory
      initialCars={initialCars}
      initialHasMore={initialHasMore}
      initialTotal={total}
      searchParams={{ brand, query, sort, maxPrice, maxMileage, fuel }}
      dict={dict.inventory}
      commonDict={dict.common}
    />
  );
}

// ── Skeleton fallbacks ─────────────────────────────────────────────────────

function FilterSkeleton() {
  return (
    <div className="rounded-lg p-6 animate-pulse space-y-6" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
      <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CarsGridSkeleton() {
  return (
    <>
      <div className="flex justify-between mb-6">
        <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        <div className="h-8 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <CarCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function InventoryPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await props.params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const searchParams = await props.searchParams;
  const dict = await getDictionary(locale);
  const inv = dict.inventory;

  const renderPersonalRequestBlock = (className: string) => (
    <div className={`bg-[#d91c1c] rounded-xl p-8 text-white relative flex-col justify-center shadow-lg overflow-hidden group border border-[#d91c1c] ${className}`}>
      <div className="relative z-10">
        <h3 className="font-headings font-black text-2xl mb-4 leading-tight">{inv.personalTitle}</h3>
        <p className="text-red-100 text-sm mb-8 leading-relaxed">{inv.personalBody}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-block bg-white text-[#d91c1c] font-black px-6 py-3 text-sm rounded hover:bg-slate-100 transition-colors shadow-lg shadow-black/10"
        >
          {inv.personalCta}
        </Link>
      </div>
      <svg className="absolute bottom-4 right-[-10%] w-64 h-64 opacity-10 text-white transform group-hover:scale-105 transition-transform duration-700 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.1 10.9c-1.1-2.9-3.2-5.9-6.9-5.9H11.8c-3.7 0-5.8 3-6.9 5.9C3.6 11.2 2 12 2 13.5V19h2v2h2v-2h12v2h2v-2h2v-5.5c0-1.5-1.6-2.3-2.9-2.6zM6.5 17c-1.4 0-2.5-1.1-2.5-2.5S5.1 12 6.5 12 9 13.1 9 14.5 7.9 17 6.5 17zm11 0c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5S18.9 17 17.5 17z" />
      </svg>
    </div>
  );

  return (
    <main className="min-h-screen theme-bg flex flex-col pt-8">

      {/* Header Banner — no data dependency, renders immediately */}
      <header className="theme-bg py-16" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold theme-text-faint uppercase tracking-widest mb-4">
            <Link href={`/${locale}`} className="hover:text-[#d91c1c]">
              {inv.breadcrumbHome}
            </Link>
            <span>/</span>
            <span className="theme-text">{inv.breadcrumbInventory}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headings font-black theme-text mb-4">{inv.pageTitle}</h1>
          <p className="theme-text-muted font-medium max-w-2xl text-lg">{inv.pageSubtitle}</p>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">

        {/* Sidebar Filter — streams in with brand list */}
        <aside className="w-full lg:w-80 shrink-0">
          <Suspense fallback={<FilterSkeleton />}>
            <FilterSection dict={inv} />
          </Suspense>

          {renderPersonalRequestBlock("mt-8 hidden lg:flex")}
        </aside>

        {/* Main Content — streams in with car results */}
        <section className="flex-1 w-full min-w-0">
          <Suspense fallback={<CarsGridSkeleton />}>
            <CarsSection searchParams={searchParams} dict={dict} />
          </Suspense>

          {renderPersonalRequestBlock("mt-8 flex lg:hidden")}
        </section>
      </div>
    </main>
  );
}
