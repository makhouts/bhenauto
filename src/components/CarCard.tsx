"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, CircleGauge, Fuel, Settings2, type LucideIcon } from "lucide-react";
import { trackClientAnalyticsEvent } from "@/lib/analytics-client";
import type { CommonDict } from "@/lib/dictionaries";
import { getImageUrl, getImageVariantUrl, shouldUseDirectImageDelivery } from "@/lib/image-url";

interface CarImage { url: string; }

interface CarWithImages {
    id: string;
    slug: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    fuel_type: string;
    transmission: string;
    price: number;
    horsepower: number;
    color: string;
    description: string;
    featured: boolean;
    sold: boolean;
    reserved: boolean;
    createdAt: Date | string;
    isNew: boolean;
    images: CarImage[];
}

interface CarCardProps {
    car: CarWithImages;
    listView?: boolean;
    commonDict: CommonDict;
    locale: string;
    priorityImage?: boolean;
}

function SpecItem({ icon: Icon, value, divided = false, lowerRow = false }: { icon: LucideIcon; value: string; divided?: boolean; lowerRow?: boolean }) {
    return (
        <div className={`flex min-h-12 min-w-0 items-center gap-2.5 px-3 py-2 ${divided ? "border-l border-[var(--theme-border)]" : ""} ${lowerRow ? "border-t border-[var(--theme-border)]" : ""}`}>
            <span className="flex size-7 shrink-0 items-center justify-center text-[#d91c1c]">
                <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
            </span>
            <span className="min-w-0 break-words text-[12px] font-bold leading-4 tabular-nums theme-text-secondary" title={value}>
                {value}
            </span>
        </div>
    );
}

function ImageFallback() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[5]"
            style={{ background: "linear-gradient(to bottom right, var(--theme-skeleton-subtle), var(--theme-skeleton))" }}>
            <svg className="w-14 h-14 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--theme-text-faint)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.1 10.9c-1.1-2.9-3.2-5.9-6.9-5.9H11.8c-3.7 0-5.8 3-6.9 5.9C3.6 11.2 2 12 2 13.5V19h2v2h2v-2h12v2h2v-2h2v-5.5c0-1.5-1.6-2.3-2.9-2.6z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--theme-text-faint)" }}>BhenAuto</span>
        </div>
    );
}

function SoldOverlay({ label }: { label: string }) {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
            style={{ background: "rgba(8,8,12,0.58)", backdropFilter: "saturate(0) brightness(0.7)" }}>
            <span className="border border-white/25 bg-black/55 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white"
                style={{ background: "rgba(255,255,255,0.1)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.18)" }}>
                {label}
            </span>
        </div>
    );
}

function ReservedBadge({ label }: { label: string }) {
    return (
        <div className="absolute right-3.5 top-3.5 z-10 flex items-center gap-1.5 border border-[#d4b678]/30 bg-[#171204]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d4b678]"
            style={{ background: "rgba(20,16,5,0.72)", color: "#d4b678", border: "1px solid rgba(212,182,120,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4b678] animate-pulse" />
            {label}
        </div>
    );
}

export default function CarCard({ car, listView = false, commonDict, locale, priorityImage = false }: CarCardProps) {
    const [hovered, setHovered] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [failedVariantUrls, setFailedVariantUrls] = useState<Set<string>>(() => new Set());

    const img1Source = car.images[0]?.url ? getImageUrl(car.images[0].url) : null;
    const img2Source = car.images[1]?.url ? getImageUrl(car.images[1].url) : null;
    const img1Variant = car.images[0]?.url ? getImageVariantUrl(car.images[0].url, "thumb") : null;
    const img2Variant = car.images[1]?.url ? getImageVariantUrl(car.images[1].url, "thumb") : null;
    const img1 = img1Variant && failedVariantUrls.has(img1Variant) ? img1Source : img1Variant;
    const img2 = img2Variant && failedVariantUrls.has(img2Variant) ? img2Source : img2Variant;
    const img1Unoptimized = img1 ? shouldUseDirectImageDelivery(img1) : false;
    const img2Unoptimized = img2 ? shouldUseDirectImageDelivery(img2) : false;
    const href = `/${locale}/cars/${car.slug}`;
    const handleCardClick = () => {
        trackClientAnalyticsEvent({
            type: "car_card_click",
            path: href,
            locale,
            carId: car.id,
            meta: {
                layout: listView ? "list" : "grid",
            },
        });
    };
    const handleImageError = (variantUrl: string | null, sourceUrl: string | null, isPrimary = false) => {
        if (variantUrl && sourceUrl && variantUrl !== sourceUrl && !failedVariantUrls.has(variantUrl)) {
            setFailedVariantUrls((current) => {
                const next = new Set(current);
                next.add(variantUrl);
                return next;
            });
            return;
        }
        if (isPrimary) setImgError(true);
    };

    if (listView) {
        return (
            <Link
                href={href}
                prefetch={false}
                className="group relative flex flex-row overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] transition-colors duration-200 hover:border-[#a9a49c]"
                style={{
                    minHeight: "200px",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={handleCardClick}
            >
                {/* Red hover accent bar */}
                <div
                    className="absolute inset-y-0 left-0 z-20 w-[3px] transition-all duration-300"
                    style={{ background: hovered ? "#d91c1c" : "transparent" }}
                />

                {/* Image — more visual weight in list view */}
                <div className="relative shrink-0 overflow-hidden" style={{ width: "46%" }}>
                    {(!img1 || imgError) && <ImageFallback />}
                    {img1 && !imgError && (
                        <Image
                            src={img1} alt={car.title} fill
                            sizes="(max-width: 768px) 100vw, 46vw"
                            quality={75}
                            priority={priorityImage}
                            unoptimized={img1Unoptimized}
                            fetchPriority={priorityImage ? "high" : "auto"}
                            loading={priorityImage ? "eager" : "lazy"}
                            onError={() => handleImageError(img1Variant, img1Source, true)}
                            className={`object-cover transition-all duration-700 ${hovered ? "scale-[1.05]" : "scale-100"} ${hovered && img2 ? "opacity-0" : "opacity-100"}`}
                        />
                    )}
                    {img1 && img2 && (
                        <Image
                            src={img2} alt={`${car.title} – 2`} fill
                            sizes="(max-width: 768px) 100vw, 46vw"
                            quality={75}
                            unoptimized={img2Unoptimized}
                            loading="lazy"
                            onError={() => handleImageError(img2Variant, img2Source)}
                            className={`object-cover transition-opacity duration-700 ${hovered ? "opacity-100" : "opacity-0"}`}
                        />
                    )}
                    {car.sold && <SoldOverlay label={commonDict.sold} />}
                    {!car.sold && car.reserved && <ReservedBadge label={commonDict.reserved} />}
                    {car.isNew && (
                        <div className="absolute top-3.5 left-3.5 z-10">
                            <span className="border border-white/20 bg-black/70 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
                                style={{ background: "rgba(10,10,15,0.65)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)" }}>
                                {commonDict.newBadge}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 pl-2 pr-6 py-5 min-w-0">
                    {/* Brand + Price row */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <span
                            className="border-l-2 border-[#d91c1c] pl-2 text-[10px] font-black uppercase tracking-[0.22em]"
                            style={{ color: "var(--theme-text-secondary)" }}
                        >
                            {car.brand}
                        </span>
                        <span className="text-[1.45rem] font-black shrink-0 leading-none tabular-nums" style={{ color: "#d91c1c" }}>
                            €{car.price.toLocaleString("nl-BE")}
                        </span>
                    </div>

                    {/* Title */}
                    <h3
                        className="text-[1.25rem] font-headings font-bold leading-snug mb-0.5 group-hover:text-[#d91c1c] transition-colors duration-200 truncate"
                        style={{ color: "var(--theme-text)" }}
                    >
                        {car.brand} {car.model}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-[12px] font-medium mb-3 truncate" style={{ color: "var(--theme-text-muted)" }} title={car.title}>
                        {car.title}
                    </p>

                    {/* Description */}
                    {car.description && (
                        <p className="text-[13px] leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--theme-text-muted)" }}>
                            {car.description}
                        </p>
                    )}

                    {/* Spec chips + CTA on same row */}
                    <div className="mt-auto flex items-center flex-wrap gap-2">
                        {[
                            { icon: CalendarDays, label: `${car.year}` },
                            { icon: CircleGauge, label: `${car.mileage.toLocaleString("nl-BE")} km` },
                            { icon: Fuel, label: car.fuel_type },
                            ...(car.transmission ? [{ icon: Settings2, label: car.transmission }] : []),
                        ].map(({ icon: Icon, label }, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 border-r border-[var(--theme-border)] pr-3 text-[10px] font-semibold last:border-r-0"
                                style={{
                                    color: "var(--theme-text-secondary)",
                                }}
                            >
                                <Icon size={14} strokeWidth={1.65} aria-hidden="true" />
                                {label}
                            </div>
                        ))}

                        {/* CTA pushed right */}
                        <div
                            className="ml-auto flex items-center gap-1.5 text-[13px] font-bold transition-colors duration-200 group-hover:text-[#d91c1c] shrink-0"
                            style={{ color: "var(--theme-text)" }}
                        >
                            {commonDict.viewDetails}
                            <span className={`transition-transform duration-200 ${hovered ? "translate-x-1.5" : ""}`}>
                                <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            prefetch={false}
            className="group flex flex-col overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-surface)] transition-colors duration-200 hover:border-[#8f8a83]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleCardClick}
        >
            {/* Image */}
            <div
                className="relative aspect-[16/10] overflow-hidden"
                style={{ background: "var(--theme-skeleton)" }}
            >
                {(!img1 || imgError) && <ImageFallback />}

                {img1 && !imgError && (
                    <Image
                        src={img1}
                        alt={car.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                        quality={80}
                        priority={priorityImage}
                        unoptimized={img1Unoptimized}
                        fetchPriority={priorityImage ? "high" : "auto"}
                        loading={priorityImage ? "eager" : "lazy"}
                        onError={() => handleImageError(img1Variant, img1Source, true)}
                        className={`object-cover transition-all duration-700 ${hovered && img2 ? "opacity-0" : "opacity-100"} ${hovered ? "scale-[1.04]" : "scale-100"}`}
                    />
                )}

                {img1 && img2 && (
                    <Image
                        src={img2}
                        alt={`${car.title} – 2`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                        quality={75}
                        unoptimized={img2Unoptimized}
                        loading="lazy"
                        onError={() => handleImageError(img2Variant, img2Source)}
                        className={`object-cover transition-opacity duration-700 ${hovered ? "opacity-100" : "opacity-0"}`}
                    />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

                {car.sold && <SoldOverlay label={commonDict.sold} />}
                {!car.sold && car.reserved && <ReservedBadge label={commonDict.reserved} />}

                <div className="absolute top-3.5 left-3.5 flex gap-2 z-10">
                    {car.isNew && (
                        <span className="border-l-2 border-l-[#d91c1c] bg-black/70 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                            {commonDict.newBadge}
                        </span>
                    )}
                </div>

                <div className="absolute bottom-4 left-4 z-10 border-l-2 border-[#d91c1c] pl-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/90">BHEN AUTO</div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col px-5 pb-0 pt-6 sm:px-6">
                <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.2em] theme-text-faint">{car.brand} / {car.year}</p>
                <div className="mb-5 flex items-start justify-between gap-5">
                    <h3 className="min-w-0 flex-1 font-headings text-[2rem] font-semibold uppercase leading-[0.9] transition-colors duration-200 group-hover:text-[#d91c1c]"
                        style={{ color: "var(--theme-text)" }}>
                        {car.brand} {car.model}
                    </h3>
                    <div className="shrink-0 pt-0.5 font-headings text-2xl font-bold leading-none tabular-nums text-[#d91c1c]">
                        €{car.price.toLocaleString("nl-BE")}
                    </div>
                </div>

                <div className="mb-5">
                    <p className="line-clamp-1 text-[12px] font-medium" style={{ color: "var(--theme-text-muted)" }} title={car.title}>
                        {car.title}
                    </p>
                </div>

                <div className="grid grid-cols-2 border-y border-[var(--theme-border)]">
                    <SpecItem icon={CalendarDays} value={`${car.year}`} />
                    <SpecItem icon={CircleGauge} value={`${car.mileage.toLocaleString("nl-BE")} km`} divided />
                    <SpecItem icon={Fuel} value={car.fuel_type} lowerRow />
                    <SpecItem icon={Settings2} value={car.transmission || "–"} divided lowerRow />
                </div>

                <div className="mt-auto flex min-h-14 items-center justify-between border-t border-[var(--theme-border)] text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-200 theme-text-faint group-hover:text-[#d91c1c]">
                        <span>{commonDict.viewDetails}</span>
                        <span className="flex items-center gap-3 text-[#d91c1c]">
                            <span className="h-px w-5 bg-current transition-[width] duration-200 group-hover:w-9" />
                            <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
                        </span>
                </div>
            </div>
        </Link>
    );
}
