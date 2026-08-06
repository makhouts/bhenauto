import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import InventoryFilter from "@/components/InventoryFilter";
import InfiniteInventory from "@/components/InfiniteInventory";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { fetchCarsPaginated } from "@/app/actions/fetchCars";
import prisma from "@/lib/prisma";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { translateFuelLabel, translateTransmissionLabel } from "@/lib/autoscout24/presentation-format";
import { getLocalizedReferenceLabels } from "@/lib/autoscout24/public-presentation";
import { buildPageSocialMetadata, localizedAlternates, localizedUrl } from "@/lib/site-seo";

const PAGE_SIZE = 9;

const getInventoryReferenceData = unstable_cache(
  async () => {
    const [availableBrands, fuelCategoryRows, fuelTypeRows, transmissionRows] = await Promise.all([
      prisma.car.findMany({ select: { brand: true }, distinct: ["brand"] })
        .then(rows => rows.map(r => r.brand).filter(Boolean).sort() as string[]),
      prisma.car.findMany({ select: { fuelCategory: true }, distinct: ["fuelCategory"] }),
      prisma.car.findMany({ select: { fuel_type: true }, distinct: ["fuel_type"] }),
      prisma.car.findMany({ select: { transmission: true }, distinct: ["transmission"] }),
    ]);

    return {
      availableBrands,
      fuelCategoryRows,
      fuelTypeRows,
      transmissionRows,
    };
  },
  ["inventory-reference-data"],
  { revalidate: 3600 }
);

type FilterOption = {
  value: string;
  label: string;
};

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function sortFilterOptions(options: FilterOption[]) {
  return options.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
}

// ISR: rebuild at most every 60 seconds; admin actions call revalidatePath to bust sooner
export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const filters = await searchParams;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const inv = dict.inventory;
  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value)
  );

  return {
    title: inv.pageTitle,
    description: inv.pageSubtitle,
    alternates: {
      canonical: localizedUrl(locale, "/inventory"),
      languages: localizedAlternates("/inventory"),
    },
    robots: hasActiveFilters ? { index: false, follow: true } : undefined,
    ...buildPageSocialMetadata({
      locale,
      path: "/inventory",
      title: inv.pageTitle,
      description: inv.pageSubtitle,
    }),
  };
}

export default async function InventoryPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await props.params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const searchParams = await props.searchParams;
  const dict = await getDictionary(locale);
  const inv = dict.inventory;

  const query = searchParams.query as string | undefined;
  const brand = searchParams.brand as string | string[] | undefined;
  const sort = searchParams.sort as string | undefined;
  const minPrice = searchParams.minPrice as string | undefined;
  const maxPrice = searchParams.maxPrice as string | undefined;
  const minMileage = searchParams.minMileage as string | undefined;
  const maxMileage = searchParams.maxMileage as string | undefined;
  const fuel = searchParams.fuel as string | string[] | undefined;
  const transmission = searchParams.transmission as string | string[] | undefined;

  // Fetch both in parallel — single render pass, no Suspense flash on re-navigation
  const [{ availableBrands, fuelCategoryRows, fuelTypeRows, transmissionRows }, { cars: initialCars, hasMore: initialHasMore, total }] =
    await Promise.all([
      getInventoryReferenceData(),
      fetchCarsPaginated({ page: 1, pageSize: PAGE_SIZE, locale, brand, query, sort, minPrice, maxPrice, minMileage, maxMileage, fuel, transmission }),
    ]);

  const fuelValues = uniqueNonEmpty(
    [
      ...fuelCategoryRows.map((row) => row.fuelCategory?.trim()),
      ...fuelTypeRows.map((row) => row.fuel_type?.trim()),
    ]
  );
  const fuelCategoryLabels = await getLocalizedReferenceLabels("FuelCategory", fuelValues, locale);
  const fuelOptions = sortFilterOptions(fuelValues.map((value) => ({
    value,
    label: fuelCategoryLabels.get(value) ?? translateFuelLabel(value, locale) ?? value,
  })));

  const transmissionOptions = sortFilterOptions(uniqueNonEmpty(
    transmissionRows.map((row) => row.transmission?.trim())
  ).map((value) => ({
    value,
    label: translateTransmissionLabel(value, locale) ?? value,
  })));

  const filterParams = { brand, query, sort, minPrice, maxPrice, minMileage, maxMileage, fuel, transmission };

  const renderPersonalRequestBlock = (className: string) => (
    <div className={`group relative flex-col justify-center overflow-hidden border-t-2 border-t-[#d91c1c] bg-[#111116] p-8 text-white ${className}`}>
      <div className="relative z-10">
        <p className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-white/45">BHEN / SERVICE</p>
        <h3 className="mb-4 font-headings text-3xl font-semibold uppercase leading-none">{inv.personalTitle}</h3>
        <p className="mb-8 text-sm leading-7 text-white/60">{inv.personalBody}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-flex min-h-12 items-center border border-white/25 px-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#111116]"
        >
          {inv.personalCta}
        </Link>
      </div>
      <span className="pointer-events-none absolute -bottom-8 right-4 font-headings text-[9rem] font-bold leading-none text-white/[0.035] transition-transform duration-500 group-hover:-translate-y-1">B</span>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col theme-bg">

      <header className="relative overflow-hidden bg-[#111116] pb-16 pt-16 text-white sm:pb-20 sm:pt-20 md:pt-[154px] lg:pb-24">
        <div className="absolute inset-y-0 right-[18%] hidden w-px bg-white/10 lg:block" />
        <div className="mx-auto grid max-w-[1720px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-10 xl:px-12">
          <div className="lg:col-span-8">
          <div className="mb-7 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/45">
            <Link href={`/${locale}`} className="hover:text-[#d91c1c]">
              {inv.breadcrumbHome}
            </Link>
            <span className="h-px w-8 bg-[#d91c1c]" />
            <span className="text-white/80">{inv.breadcrumbInventory}</span>
          </div>
          <h1 className="max-w-5xl font-headings text-[clamp(3.8rem,8vw,8.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.045em]">{inv.pageTitle}</h1>
          </div>
          <div className="flex flex-col justify-end border-l border-white/10 pl-0 lg:col-span-4 lg:pl-10">
            <p className="max-w-md text-base leading-8 text-white/62">{inv.pageSubtitle}</p>
            <div className="mt-9 flex items-end gap-4 border-t border-white/15 pt-6">
              <span className="font-headings text-5xl font-semibold leading-none text-[#d91c1c] tabular-nums">{total}</span>
              <span className="pb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/50">{total === 1 ? inv.found : inv.foundPlural}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 items-start gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:px-10 xl:gap-14 xl:px-12">

        {/* Sidebar Filter */}
        <aside className="w-full lg:col-span-3">
          <InventoryFilter
            availableBrands={availableBrands}
            fuelOptions={fuelOptions}
            transmissionOptions={transmissionOptions}
            dict={inv}
          />
          {renderPersonalRequestBlock("mt-8 hidden lg:flex")}
        </aside>

        {/* Car Grid — Suspense only covers the client-interactive grid,
            which may suspend when InfiniteInventory fires a new filter fetch */}
        <section className="w-full min-w-0 lg:col-span-9">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <CarCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <InfiniteInventory
              initialCars={initialCars}
              initialHasMore={initialHasMore}
              initialTotal={total}
              searchParams={filterParams}
              fuelOptions={fuelOptions}
              transmissionOptions={transmissionOptions}
              dict={inv}
              commonDict={dict.common}
            />
          </Suspense>
          {renderPersonalRequestBlock("mt-8 flex lg:hidden")}
        </section>
      </div>
    </main>
  );
}
