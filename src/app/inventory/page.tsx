import { Suspense } from "react";
import Link from "next/link";
import InventoryFilter from "@/components/InventoryFilter";
import InfiniteInventory from "@/components/InfiniteInventory";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { fetchCarsPaginated } from "@/app/actions/fetchCars";

export const metadata = {
    title: "Voorraad | BhenAuto",
    description: "Ontdek onze exclusieve collectie luxe en premium tweedehands voertuigen.",
};

const PAGE_SIZE = 9;

export default async function InventoryPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;

    const query = searchParams.query as string | undefined;
    const brand = searchParams.brand as string | string[] | undefined;
    const sort = searchParams.sort as string | undefined;
    const type = searchParams.type as string | string[] | undefined;

    // Fetch first page server-side (SSR — instant first paint)
    const { cars: initialCars, hasMore: initialHasMore, total } = await fetchCarsPaginated({
        page: 1,
        pageSize: PAGE_SIZE,
        brand,
        query,
        sort,
        type,
    });

    const filterParams = { brand, query, sort, type };

    return (
        <main className="min-h-screen bg-[#f8f6f6] flex flex-col pt-8">

            {/* ── Header Banner ── */}
            <header className="bg-[#f8f6f6] py-16 border-b border-slate-200">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        <Link href="/" className="hover:text-[#d91c1c]">Home</Link>
                        <span>/</span>
                        <span className="text-slate-900">Voorraad</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-headings font-black text-slate-900 mb-4">Onze Collectie</h1>
                    <p className="text-slate-500 font-medium max-w-2xl text-lg">
                        Ontdek premium tweedehands voertuigen, onderhouden volgens de hoogste standaarden.
                        Ervaar prestaties en luxe.
                    </p>
                </div>
            </header>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">

                {/* ── Sidebar Filter ── */}
                <aside className="w-full lg:w-1/4 shrink-0">
                    <Suspense fallback={<div className="h-96 bg-white border border-slate-200 rounded-lg shadow-sm animate-pulse" />}>
                        <InventoryFilter />
                    </Suspense>



                    {/* Personal request block */}
                    <div className="mt-8 bg-[#d91c1c] rounded-xl p-8 text-white relative flex flex-col justify-center shadow-lg overflow-hidden group border border-[#d91c1c]">
                        <div className="relative z-10">
                            <h3 className="font-headings font-black text-2xl mb-4 leading-tight">Kunt u uw auto niet vinden?</h3>
                            <p className="text-red-100 text-sm mb-8 leading-relaxed">Wij kunnen het specifieke model vinden waarnaar u op zoek bent.</p>
                            <Link href="/contact" className="inline-block bg-white text-[#d91c1c] font-black px-6 py-3 text-sm rounded hover:bg-slate-100 transition-colors shadow-lg shadow-black/10">
                                Persoonlijke Aanvraag
                            </Link>
                        </div>
                        <svg className="absolute bottom-4 right-[-10%] w-64 h-64 opacity-10 text-white transform group-hover:scale-105 transition-transform duration-700 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.1 10.9c-1.1-2.9-3.2-5.9-6.9-5.9H11.8c-3.7 0-5.8 3-6.9 5.9C3.6 11.2 2 12 2 13.5V19h2v2h2v-2h12v2h2v-2h2v-5.5c0-1.5-1.6-2.3-2.9-2.6zM6.5 17c-1.4 0-2.5-1.1-2.5-2.5S5.1 12 6.5 12 9 13.1 9 14.5 7.9 17 6.5 17zm11 0c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5S18.9 17 17.5 17z" />
                        </svg>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <section className="flex-1 w-full min-w-0">

                    {/* Infinite scroll grid */}
                    <Suspense
                        fallback={
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                        />
                    </Suspense>
                </section>
            </div>
        </main>
    );
}
