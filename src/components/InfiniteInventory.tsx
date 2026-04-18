"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import CarCard from "@/components/CarCard";
import CarCardSkeleton from "@/components/CarCardSkeleton";
import { fetchCarsPaginated, type CarWithImages } from "@/app/actions/fetchCars";
import SortSelect from "@/components/SortSelect";
import { useLocale } from "@/components/LocaleContext";
import type { InventoryDict, CommonDict } from "@/lib/dictionaries";

interface InfiniteInventoryProps {
    initialCars: CarWithImages[];
    initialHasMore: boolean;
    initialTotal: number;
    dict: InventoryDict;
    commonDict: CommonDict;
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
    dict,
    commonDict,
}: InfiniteInventoryProps) {
    const { locale } = useLocale();
    const [cars, setCars] = useState<CarWithImages[]>(initialCars);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [page, setPage] = useState(2);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    // Serialize searchParams to a stable string — prevents new object references
    // on every render from causing loadMore to be recreated, which was causing
    // the IntersectionObserver to fire in an infinite loop.
    const searchParamsKey = JSON.stringify(searchParams);

    // Reset when filters change (triggered by stable serialized key, not array ref)
    useEffect(() => {
        setCars(initialCars);
        setHasMore(initialHasMore);
        setPage(2);
        loadingRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParamsKey, initialHasMore]);

    const loadMore = useCallback(() => {
        if (loadingRef.current || !hasMore) return;
        loadingRef.current = true;

        const params = JSON.parse(searchParamsKey);
        startTransition(async () => {
            const result = await fetchCarsPaginated({
                page,
                pageSize: PAGE_SIZE,
                ...params,
            });
            setCars(prev => {
                const ids = new Set(prev.map(c => c.id));
                const fresh = result.cars.filter(c => !ids.has(c.id));
                return [...prev, ...fresh];
            });
            setHasMore(result.hasMore);
            setPage(p => p + 1);
            loadingRef.current = false;
        });
    }, [hasMore, page, searchParamsKey]);

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
                <div className="theme-text-muted text-sm">
                    <span className="font-black theme-text mr-1 text-base">{initialTotal}</span>
                    {initialTotal === 1 ? dict.found : dict.foundPlural}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm theme-text-muted">
                        {dict.sort}:
                        <SortSelect dict={dict} />
                    </div>
                    {/* Grid / List toggle */}
                    <div className="hidden sm:flex rounded overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            title="Kaartweergave"
                            className={`p-2 transition-colors ${
                                viewMode === 'grid' ? 'bg-[#d91c1c] text-white' : 'theme-text-faint'
                            }`}
                            style={viewMode !== 'grid' ? { backgroundColor: 'transparent' } : {}}
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
                            className={`p-2 transition-colors ${
                                viewMode === 'list' ? 'bg-[#d91c1c] text-white' : 'theme-text-faint'
                            }`}
                            style={{ borderLeft: '1px solid var(--theme-border)', ...(viewMode !== 'list' ? { backgroundColor: 'transparent' } : {}) }}
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
                    <CarCard key={car.id} car={car} listView={viewMode === 'list'} commonDict={commonDict} locale={locale} />
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
                        <div className="flex items-center gap-3 theme-text-faint text-sm font-medium">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {dict.loadingMore}
                        </div>
                    )}
                </div>
            )}

            {/* End of results */}
            {!hasMore && cars.length > 0 && (
                <div className="mt-12 text-center">
                    <div className="inline-flex items-center gap-3 theme-text-faint text-sm font-medium pt-6 px-8" style={{ borderTop: '1px solid var(--theme-border)' }}>
                        <div className="w-8 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
                        {cars.length} {cars.length === 1 ? dict.allViewedSingular : dict.allViewedPlural}
                        <div className="w-8 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
                    </div>
                </div>
            )}

            {/* Empty state */}
            {cars.length === 0 && !isPending && (
                <div className="theme-surface rounded-lg p-12 text-center flex flex-col items-center" style={{ border: '1px solid var(--theme-border)' }}>
                    <h3 className="text-2xl font-headings font-bold theme-text mb-2">{dict.noResultsTitle}</h3>
                    <p className="theme-text-muted mb-8 font-medium">
                        {dict.noResultsBody}
                    </p>
                    <a
                        href={`/${locale}/inventory`}
                        className="px-6 py-3 theme-text-secondary rounded transition-colors uppercase tracking-widest text-sm font-bold"
                        style={{ border: '1px solid var(--theme-border)' }}
                    >
                        {dict.clearFilters}
                    </a>
                </div>
            )}
        </>
    );
}
