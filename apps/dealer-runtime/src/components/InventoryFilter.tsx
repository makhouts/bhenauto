"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { InventoryDict } from "@/lib/dictionaries";
import { buildPathWithQuery, updateSearchParams } from "@/lib/search-params";
import {
    PRICE_RANGE_CONFIG,
    MILEAGE_RANGE_CONFIG,
    normalizeQueryRange,
} from "@/lib/inventoryFilterRanges";

type FilterOption = {
    value: string;
    label: string;
};

function formatPriceValue(value: number, noLimitLabel: string): string {
    return value >= PRICE_RANGE_CONFIG.max ? noLimitLabel : `€ ${value.toLocaleString("nl-NL")}`;
}

function formatMileageValue(value: number, noLimitLabel: string): string {
    return value >= MILEAGE_RANGE_CONFIG.max ? noLimitLabel : `${value.toLocaleString("nl-NL")} km`;
}

function formatCompactPrice(value: number): string {
    return value >= PRICE_RANGE_CONFIG.max ? "€250k+" : `€${Math.round(value / 1000)}k`;
}

function formatCompactMileage(value: number): string {
    if (value <= 0) return "0 km";
    return value >= MILEAGE_RANGE_CONFIG.max ? "200k+" : `${Math.round(value / 1000)}k`;
}

function RangeBubble({
    leftPercent,
    value,
}: {
    leftPercent: number;
    value: string;
}) {
    return (
        <div
            className="absolute -top-3 z-40 -translate-x-1/2"
            style={{ left: `${leftPercent}%` }}
        >
            <div className="relative rounded-lg bg-[#d91c1c] px-3 py-1.5 text-xs leading-none font-black text-white shadow-lg whitespace-nowrap tracking-tight [font-variant-numeric:tabular-nums]">
                {value}
                <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-[55%] rotate-45 bg-[#d91c1c]" />
            </div>
        </div>
    );
}

function DualRangeSlider({
    initialMinValue,
    initialMaxValue,
    minLimit,
    maxLimit,
    step,
    minAriaLabel,
    maxAriaLabel,
    formatBubbleValue,
    startLabel,
    endLabel,
    showMinBubble,
    showMaxBubble,
    summaryFormatter,
    onCommit,
}: {
    initialMinValue: number;
    initialMaxValue: number;
    minLimit: number;
    maxLimit: number;
    step: number;
    minAriaLabel: string;
    maxAriaLabel: string;
    formatBubbleValue: (value: number) => string;
    startLabel: string;
    endLabel: string;
    showMinBubble: (value: number) => boolean;
    showMaxBubble: (value: number) => boolean;
    summaryFormatter: (minValue: number, maxValue: number) => string;
    onCommit: (minValue: number, maxValue: number) => void;
}) {
    const [localMinValue, setLocalMinValue] = useState(initialMinValue);
    const [localMaxValue, setLocalMaxValue] = useState(initialMaxValue);
    const lastCommittedRangeRef = useRef(`${initialMinValue}:${initialMaxValue}`);
    const range = maxLimit - minLimit;
    const minPercent = ((localMinValue - minLimit) / range) * 100;
    const maxPercent = ((localMaxValue - minLimit) / range) * 100;
    const minBubbleValue = formatBubbleValue(localMinValue);
    const maxBubbleValue = formatBubbleValue(localMaxValue);
    const commitIfChanged = useCallback(
        (minValue: number, maxValue: number) => {
            const nextRange = `${minValue}:${maxValue}`;
            if (nextRange === lastCommittedRangeRef.current) return;

            lastCommittedRangeRef.current = nextRange;
            onCommit(minValue, maxValue);
        },
        [onCommit]
    );

    return (
        <div className="pt-10">
            <div className="relative h-10">
                <div
                    className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: "var(--theme-border)" }}
                />
                <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#d91c1c]"
                    style={{
                        left: `${minPercent}%`,
                        width: `${Math.max(maxPercent - minPercent, 0)}%`,
                    }}
                />

                {showMinBubble(localMinValue) && (
                    <RangeBubble leftPercent={minPercent} value={minBubbleValue} />
                )}
                {showMaxBubble(localMaxValue) && (
                    <RangeBubble leftPercent={maxPercent} value={maxBubbleValue} />
                )}

                <input
                    type="range"
                    min={minLimit}
                    max={maxLimit}
                    step={step}
                    value={localMinValue}
                    aria-label={minAriaLabel}
                    aria-valuemin={minLimit}
                    aria-valuemax={maxLimit}
                    aria-valuenow={localMinValue}
                    aria-valuetext={minBubbleValue}
                    onInput={(e) => {
                        const value = Number(e.currentTarget.value);
                        setLocalMinValue(Math.min(value, localMaxValue));
                    }}
                    onChange={(e) => {
                        const value = Number(e.currentTarget.value);
                        setLocalMinValue(Math.min(value, localMaxValue));
                    }}
                    onMouseUp={(e) => commitIfChanged(Math.min(Number(e.currentTarget.value), localMaxValue), localMaxValue)}
                    onTouchEnd={(e) => commitIfChanged(Math.min(Number(e.currentTarget.value), localMaxValue), localMaxValue)}
                    onKeyUp={(e) => commitIfChanged(Math.min(Number(e.currentTarget.value), localMaxValue), localMaxValue)}
                    onBlur={(e) => commitIfChanged(Math.min(Number(e.currentTarget.value), localMaxValue), localMaxValue)}
                    className="dual-range-input z-20"
                />
                <input
                    type="range"
                    min={minLimit}
                    max={maxLimit}
                    step={step}
                    value={localMaxValue}
                    aria-label={maxAriaLabel}
                    aria-valuemin={minLimit}
                    aria-valuemax={maxLimit}
                    aria-valuenow={localMaxValue}
                    aria-valuetext={maxBubbleValue}
                    onInput={(e) => {
                        const value = Number(e.currentTarget.value);
                        setLocalMaxValue(Math.max(value, localMinValue));
                    }}
                    onChange={(e) => {
                        const value = Number(e.currentTarget.value);
                        setLocalMaxValue(Math.max(value, localMinValue));
                    }}
                    onMouseUp={(e) => commitIfChanged(localMinValue, Math.max(Number(e.currentTarget.value), localMinValue))}
                    onTouchEnd={(e) => commitIfChanged(localMinValue, Math.max(Number(e.currentTarget.value), localMinValue))}
                    onKeyUp={(e) => commitIfChanged(localMinValue, Math.max(Number(e.currentTarget.value), localMinValue))}
                    onBlur={(e) => commitIfChanged(localMinValue, Math.max(Number(e.currentTarget.value), localMinValue))}
                    className="dual-range-input z-30"
                />
            </div>

            <div className="mt-3 flex justify-between text-sm font-medium theme-text-muted">
                <span>{startLabel}</span>
                <span>{endLabel}</span>
            </div>
            <div className="mt-1 text-center text-xs font-bold theme-text-secondary">
                {summaryFormatter(localMinValue, localMaxValue)}
            </div>
        </div>
    );
}

export default function InventoryFilter({
    availableBrands = [],
    fuelOptions = [],
    transmissionOptions = [],
    dict,
}: {
    availableBrands?: string[];
    fuelOptions?: FilterOption[];
    transmissionOptions?: FilterOption[];
    dict: InventoryDict;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);

    const priceRange = normalizeQueryRange(
        searchParams.get("minPrice"),
        searchParams.get("maxPrice"),
        PRICE_RANGE_CONFIG
    );
    const mileageRange = normalizeQueryRange(
        searchParams.get("minMileage"),
        searchParams.get("maxMileage"),
        MILEAGE_RANGE_CONFIG
    );

    const pushFilterUrl = useCallback(
        (url: string) => {
            router.push(url, { scroll: false });
        },
        [router]
    );

    const createRangeQueryString = useCallback(
        (
            minName: string,
            minValue: number,
            minDefault: number,
            maxName: string,
            maxValue: number,
            maxDefault: number
        ) => {
            return updateSearchParams(searchParams.toString(), {
                [minName]: minValue > minDefault ? String(minValue) : null,
                [maxName]: maxValue < maxDefault ? String(maxValue) : null,
            });
        },
        [searchParams]
    );

    const clearFilters = () => {
        pushFilterUrl(pathname);
    };

    const currentBrand = searchParams.get("brand") || "";
    const currentFuel = searchParams.get("fuel") || "";
    const currentTransmission = searchParams.get("transmission") || "";
    const activeFilterCount = [
        Boolean(currentBrand),
        Boolean(currentFuel),
        Boolean(currentTransmission),
        priceRange.min > PRICE_RANGE_CONFIG.min || priceRange.max < PRICE_RANGE_CONFIG.max,
        mileageRange.min > MILEAGE_RANGE_CONFIG.min || mileageRange.max < MILEAGE_RANGE_CONFIG.max,
    ].filter(Boolean).length;

    // Commit slider values to URL only on release
    const commitMileageRange = (minValue: number, maxValue: number) => {
        pushFilterUrl(
            buildPathWithQuery(
                pathname,
                createRangeQueryString(
                    "minMileage",
                    minValue,
                    MILEAGE_RANGE_CONFIG.min,
                    "maxMileage",
                    maxValue,
                    MILEAGE_RANGE_CONFIG.max
                )
            )
        );
    };

    const commitPriceRange = (minValue: number, maxValue: number) => {
        pushFilterUrl(
            buildPathWithQuery(
                pathname,
                createRangeQueryString(
                    "minPrice",
                    minValue,
                    PRICE_RANGE_CONFIG.min,
                    "maxPrice",
                    maxValue,
                    PRICE_RANGE_CONFIG.max
                )
            )
        );
    };

    return (
        <div className="theme-surface rounded-lg p-6 shadow-sm font-sans flex flex-col gap-6 w-full" style={{ border: '1px solid var(--theme-border)' }}>
            <div className="flex items-center justify-between">
                <h3 className="font-headings font-black text-xl theme-text flex items-center gap-2">
                    {dict.filters}
                </h3>
                <button
                    onClick={clearFilters}
                    className="text-[#d91c1c] text-sm font-bold hover:underline"
                >
                    {dict.resetFilters}
                </button>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-center py-3 text-sm font-bold uppercase tracking-wider theme-text-secondary rounded transition-colors"
                    style={{ border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-badge-bg)' }}
                >
                    <span>{isOpen ? dict.hideFilters : dict.showFilters}</span>
                    {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d91c1c] px-1.5 text-[11px] font-black leading-none text-white">
                            {activeFilterCount}
                        </span>
                    )}
                    <SlidersHorizontal size={16} className="ml-2 theme-text-faint" />
                </button>
            </div>

            {/* Filters Container */}
            <div className={`flex flex-col gap-8 ${isOpen ? 'block' : 'hidden lg:flex'}`}>

                {/* Brand */}
                <div>
                    <h4 className="font-bold theme-text mb-4 text-sm">{dict.brandLabel}</h4>
                    <div className="relative">
                        <label
                            htmlFor="filter-brand"
                            className="sr-only"
                        >
                            {dict.brandLabel}
                        </label>
                        <select
                            id="filter-brand"
                            className="w-full appearance-none rounded-md py-2.5 pl-4 pr-10 text-sm theme-text focus:outline-none focus:ring-1 focus:ring-[#d91c1c] focus:border-[#d91c1c] cursor-pointer"
                            style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}
                            value={currentBrand}
                            onChange={(e) =>
                                pushFilterUrl(
                                    buildPathWithQuery(
                                        pathname,
                                        updateSearchParams(searchParams.toString(), { brand: e.target.value })
                                    )
                                )
                            }
                        >
                            <option value="">{dict.brandAll}</option>
                            {availableBrands.map((brand) => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none theme-text-faint">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Fuel Type */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                    <h4 className="font-bold theme-text mb-4 text-sm">{dict.fuelLabel}</h4>
                    <div className="relative">
                        <label
                            htmlFor="filter-fuel"
                            className="sr-only"
                        >
                            {dict.fuelLabel}
                        </label>
                        <select
                            id="filter-fuel"
                            className="w-full appearance-none rounded-md py-2.5 pl-4 pr-10 text-sm theme-text focus:outline-none focus:ring-1 focus:ring-[#d91c1c] focus:border-[#d91c1c] cursor-pointer"
                            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                            value={currentFuel}
                            onChange={(e) =>
                                pushFilterUrl(
                                    buildPathWithQuery(
                                        pathname,
                                        updateSearchParams(searchParams.toString(), { fuel: e.target.value })
                                    )
                                )
                            }
                        >
                            <option value="">{dict.fuelAll}</option>
                            {fuelOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none theme-text-faint">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Transmission */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                    <h4 className="font-bold theme-text mb-4 text-sm">{dict.transmissionLabel}</h4>
                    <div className="relative">
                        <label
                            htmlFor="filter-transmission"
                            className="sr-only"
                        >
                            {dict.transmissionLabel}
                        </label>
                        <select
                            id="filter-transmission"
                            className="w-full appearance-none rounded-md py-2.5 pl-4 pr-10 text-sm theme-text focus:outline-none focus:ring-1 focus:ring-[#d91c1c] focus:border-[#d91c1c] cursor-pointer"
                            style={{ backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}
                            value={currentTransmission}
                            onChange={(e) =>
                                pushFilterUrl(
                                    buildPathWithQuery(
                                        pathname,
                                        updateSearchParams(searchParams.toString(), { transmission: e.target.value })
                                    )
                                )
                            }
                        >
                            <option value="">{dict.transmissionAll}</option>
                            {transmissionOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none theme-text-faint">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* Mileage Range */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                    <h4 className="font-bold theme-text mb-4 text-sm">{dict.mileageLabel}</h4>
                    <DualRangeSlider
                        key={`mileage-${mileageRange.min}-${mileageRange.max}`}
                        initialMinValue={mileageRange.min}
                        initialMaxValue={mileageRange.max}
                        minLimit={MILEAGE_RANGE_CONFIG.min}
                        maxLimit={MILEAGE_RANGE_CONFIG.max}
                        step={MILEAGE_RANGE_CONFIG.step}
                        minAriaLabel={`${dict.mileageLabel} minimum`}
                        maxAriaLabel={`${dict.mileageLabel} maximum`}
                        formatBubbleValue={formatCompactMileage}
                        startLabel="0 km"
                        endLabel="200k+ km"
                        showMinBubble={(value) => value > MILEAGE_RANGE_CONFIG.min}
                        showMaxBubble={(value) => value < MILEAGE_RANGE_CONFIG.max}
                        onCommit={commitMileageRange}
                        summaryFormatter={(minValue, maxValue) => `${formatMileageValue(minValue, dict.noLimit)} - ${formatMileageValue(maxValue, dict.noLimit)}`}
                    />
                </div>

                {/* Price Range */}
                <div className="pt-8" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                    <h4 className="font-bold theme-text mb-4 text-sm">{dict.priceLabel}</h4>
                    <DualRangeSlider
                        key={`price-${priceRange.min}-${priceRange.max}`}
                        initialMinValue={priceRange.min}
                        initialMaxValue={priceRange.max}
                        minLimit={PRICE_RANGE_CONFIG.min}
                        maxLimit={PRICE_RANGE_CONFIG.max}
                        step={PRICE_RANGE_CONFIG.step}
                        minAriaLabel={`${dict.priceLabel} minimum`}
                        maxAriaLabel={`${dict.priceLabel} maximum`}
                        formatBubbleValue={formatCompactPrice}
                        startLabel="€0"
                        endLabel="€250k+"
                        showMinBubble={(value) => value > PRICE_RANGE_CONFIG.min}
                        showMaxBubble={(value) => value < PRICE_RANGE_CONFIG.max}
                        onCommit={commitPriceRange}
                        summaryFormatter={(minValue, maxValue) => `${formatPriceValue(minValue, dict.noLimit)} - ${formatPriceValue(maxValue, dict.noLimit)}`}
                    />
                </div>

            </div>
        </div>
    );
}
