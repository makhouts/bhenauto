"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import CarCard from "@/components/CarCard";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { fetchCarsPaginated, type CarWithImages } from "@/app/actions/fetchCars";
import SortSelect from "@/components/SortSelect";

interface InfiniteInventoryProps {
    initialCars: CarWithImages[];
    initialHasMore: boolean;
    initialTotal: number;
    searchParams: {
        brand?: string | string[];
        query?: string;
        sort?: string;
        type?: string | string[];
        maxPrice?: string;
        maxMileage?: string;
        fuel?: string | string[];
    };
}

const PAGE_SIZE = 9;

export default function InfiniteInventory({
    initialCars,
    initialHasMore,
    initialTotal,
    searchParams,
}: InfiniteInventoryProps) {
    const [cars, setCars] = useState<CarWithImages[]>(initialCars);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [page, setPage] = useState(2);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    // Reset when filters change (new searchParams = new initial data from server)
    useEffect(() => {
        setCars(initialCars);
        setHasMore(initialHasMore);
        setPage(2);
    }, [initialCars, initialHasMore]);

    const loadMore = useCallback(() => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        startTransition(async () => {
            const result = await fetchCarsPaginated({
                page,
                pageSize: PAGE_SIZE,
                ...searchParams,
            });
            setCars(prev => {
                // deduplicate by id just in case
                const ids = new Set(prev.map(c => c.id));
                const fresh = result.cars.filter(c => !ids.has(c.id));
                return [...prev, ...fresh];
            });
            setHasMore(result.hasMore);
            setPage(p => p + 1);
            loadingRef.current = false;
        });
    }, [hasMore, page, searchParams]);

    // IntersectionObserver to trigger loadMore
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore]);

    const SKELETON_COUNT = Math.min(PAGE_SIZE, initialTotal - cars.length);

    return (
        <>
            {/* Count + Sort + View toggle */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-slate-600 text-sm">
                    <span className="font-black text-slate-900 mr-1 text-base">{initialTotal}</span>
                    voertuigen gevonden
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        Sorteer:
                        <SortSelect />
                    </div>
                    {/* Grid / List toggle */}
                    <div className="flex rounded overflow-hidden border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Kaartweergave"
                            className={`p-2 transition-colors ${
                                viewMode === 'grid' ? 'bg-[#d91c1c] text-white' : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="7" height="7" rx="1"/>
                                <rect x="14" y="3" width="7" height="7" rx="1"/>
                                <rect x="3" y="14" width="7" height="7" rx="1"/>
                                <rect x="14" y="14" width="7" height="7" rx="1"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            title="Lijstweergave"
                            className={`p-2 transition-colors border-l border-slate-200 ${
                                viewMode === 'list' ? 'bg-[#d91c1c] text-white' : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="3" y1="6" x2="21" y2="6"/>
                                <line x1="3" y1="12" x2="21" y2="12"/>
                                <line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid / List */}
            <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'flex flex-col gap-4'
            }>
                {cars.map((car) => (
                    <CarCard key={car.id} car={car} listView={viewMode === 'list'} />
                ))}

                {/* Skeleton cards while loading */}
                {isPending &&
                    Array.from({ length: Math.max(SKELETON_COUNT, 3) }).map((_, i) => (
                        <CarCardSkeleton key={`skeleton-${i}`} />
                    ))
                }
            </div>

            {/* Sentinel element — triggers loadMore when visible */}
            {hasMore && (
                <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-8">
                    {isPending && (
                        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Meer voertuigen laden...
                        </div>
                    )}
                </div>
            )}

            {/* End of results */}
            {!hasMore && cars.length > 0 && (
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-3 text-slate-400 text-sm font-medium border-t border-slate-200 pt-6 px-8">
                        <div className="w-8 h-px bg-slate-300" />
                        Alle {cars.length} voertuigen bekeken
                        <div className="w-8 h-px bg-slate-300" />
                    </div>
                </div>
            )}

            {/* Empty state */}
            {cars.length === 0 && !isPending && (
                <div className="bg-white rounded-lg border border-slate-200 p-12 text-center flex flex-col items-center">
                    <h3 className="text-2xl font-headings font-bold text-slate-900 mb-2">Geen Voertuigen Gevonden</h3>
                    <p className="text-slate-500 mb-8 font-medium">
                        We hebben momenteel geen voertuigen die aan uw specifieke criteria voldoen.
                    </p>
                    <a
                        href="/inventory"
                        className="px-6 py-3 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-colors uppercase tracking-widest text-sm font-bold"
                    >
                        Wis Alle Filters
                    </a>
                </div>
            )}
        </>
    );
}
