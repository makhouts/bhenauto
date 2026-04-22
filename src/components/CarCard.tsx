"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CommonDict } from "@/lib/dictionaries";
import { getImageUrl } from "@/lib/image-url";

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
    images: CarImage[];
}

interface CarCardProps {
    car: CarWithImages;
    listView?: boolean;
    commonDict: CommonDict;
    locale: string;
}

function SpecPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div style={{ color: "var(--theme-text-faint)" }}>{icon}</div>
            <span className="text-[11px] font-semibold" style={{ color: "var(--theme-text-secondary)" }}>
                {label}
            </span>
        </div>
    );
}

const CalIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const OdoIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FuelIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3h10a2 2 0 012 2v1h1a2 2 0 012 2v2a2 2 0 01-2 2h-1v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8h4" /></svg>;
const GearIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="6" r="2" strokeWidth={1.5} /><circle cx="12" cy="6" r="2" strokeWidth={1.5} /><circle cx="5" cy="18" r="2" strokeWidth={1.5} /><circle cx="12" cy="18" r="2" strokeWidth={1.5} /><line x1="5" y1="8" x2="5" y2="16" strokeWidth={1.5} strokeLinecap="round" /><line x1="12" y1="8" x2="12" y2="16" strokeWidth={1.5} strokeLinecap="round" /></svg>;
const ArrowIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;

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
            <span className="text-[11px] font-black uppercase tracking-[0.22em] px-4 py-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.1)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.18)" }}>
                {label}
            </span>
        </div>
    );
}

function ReservedBadge({ label }: { label: string }) {
    return (
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md"
            style={{ background: "rgba(20,16,5,0.72)", color: "#d4b678", border: "1px solid rgba(212,182,120,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4b678] animate-pulse" />
            {label}
        </div>
    );
}

export default function CarCard({ car, listView = false, commonDict, locale }: CarCardProps) {
    const [hovered, setHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    const img1 = car.images[0]?.url ? getImageUrl(car.images[0].url) : null;
    const img2 = car.images[1]?.url ? getImageUrl(car.images[1].url) : null;
    const href = `/${locale}/cars/${car.slug}`;

    if (listView) {
        return (
            <Link
                href={href}
                className="group flex flex-row overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{
                    background: "var(--theme-surface)",
                    border: "1px solid var(--theme-border)",
                    borderRadius: "16px",
                    boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image */}
                <div className="relative w-72 shrink-0 overflow-hidden" style={{ background: "var(--theme-skeleton)" }}>
                    {imgError && <ImageFallback />}
                    <Image src={img1} alt={car.title} fill sizes="288px" onError={() => setImgError(true)}
                        className={`object-cover transition-all duration-700 ${hovered ? "scale-[1.04]" : "scale-100"} ${hovered && img2 ? "opacity-0" : "opacity-100"}`}
                    />
                    {img2 && (
                        <Image src={img2} alt={`${car.title} – 2`} fill sizes="288px"
                            className={`object-cover transition-opacity duration-700 ${hovered ? "opacity-100" : "opacity-0"}`}
                        />
                    )}
                    {car.sold && <SoldOverlay label={commonDict.sold} />}
                    {!car.sold && car.reserved && <ReservedBadge label={commonDict.reserved} />}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-7 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--theme-text-secondary)" }}>
                            {car.brand}
                        </span>
                        <span className="text-2xl font-black shrink-0 leading-none" style={{ color: "var(--theme-text)" }}>
                            €{car.price.toLocaleString("nl-BE")}
                        </span>
                    </div>

                    <h3 className="text-xl font-headings font-bold leading-tight mb-1 group-hover:text-[#d91c1c] transition-colors duration-200 truncate" style={{ color: "var(--theme-text)" }}>
                        {car.brand} {car.model}
                    </h3>

                    <p className="text-[13px] font-medium mb-3 truncate" style={{ color: "var(--theme-text-muted)" }} title={car.title}>
                        {car.title}
                    </p>

                    {car.description && (
                        <p className="text-sm leading-relaxed line-clamp-2 mb-5" style={{ color: "var(--theme-text-muted)" }}>
                            {car.description}
                        </p>
                    )}

                    <div className="flex gap-5 mb-5 pt-4" style={{ borderTop: "1px solid var(--theme-border-subtle)" }}>
                        <SpecPill icon={CalIcon} label={`${car.year}`} />
                        <SpecPill icon={OdoIcon} label={`${car.mileage.toLocaleString("nl-BE")} km`} />
                        <SpecPill icon={FuelIcon} label={car.fuel_type} />
                        {car.transmission && <SpecPill icon={GearIcon} label={car.transmission} />}
                    </div>

                    <div className="mt-auto flex items-center gap-2 text-sm font-bold transition-colors duration-200 group-hover:text-[#d91c1c]" style={{ color: "var(--theme-text)" }}>
                        {commonDict.viewDetails}
                        <span className={`transition-transform duration-200 ${hovered ? "translate-x-1" : ""}`}>
                            {ArrowIcon}
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-[3px]"
            style={{
                background: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
                borderRadius: "18px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div
                className="relative overflow-hidden"
                style={{ height: "clamp(200px, 22vw, 260px)", background: "var(--theme-skeleton)", borderRadius: "18px 18px 0 0" }}
            >
                {imgError && <ImageFallback />}

                <Image
                    src={img1}
                    alt={car.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    quality={80}
                    onError={() => setImgError(true)}
                    className={`object-cover transition-all duration-700 ${hovered && img2 ? "opacity-0" : "opacity-100"} ${hovered ? "scale-[1.04]" : "scale-100"}`}
                />

                {img2 && (
                    <Image
                        src={img2}
                        alt={`${car.title} – 2`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                        quality={80}
                        className={`object-cover transition-opacity duration-700 ${hovered ? "opacity-100" : "opacity-0"}`}
                    />
                )}

                <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.18), transparent)" }} />

                {car.sold && <SoldOverlay label={commonDict.sold} />}
                {!car.sold && car.reserved && <ReservedBadge label={commonDict.reserved} />}

                <div className="absolute top-3.5 left-3.5 flex gap-2 z-10">
                    {car.year > 2023 && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1.5 rounded-full backdrop-blur-md"
                            style={{ background: "rgba(10,10,15,0.65)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)" }}>
                            {commonDict.newBadge}
                        </span>
                    )}
                    {car.price > 100000 && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1.5 rounded-full backdrop-blur-md"
                            style={{ background: "rgba(20,16,5,0.7)", color: "#d4b678", border: "1px solid rgba(212,182,120,0.25)" }}>
                            {commonDict.premiumBadge}
                        </span>
                    )}
                </div>

                {img2 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${!hovered ? "bg-white scale-100" : "bg-white/35 scale-75"}`} />
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hovered ? "bg-white scale-100" : "bg-white/35 scale-75"}`} />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 px-6 pt-5 pb-6">
                <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-[1.2rem] font-headings font-bold leading-tight group-hover:text-[#d91c1c] transition-colors duration-200 truncate flex-1 min-w-0"
                        style={{ color: "var(--theme-text)" }}>
                        {car.brand} {car.model}
                    </h3>
                    <div className="text-base font-black shrink-0 leading-none pt-0.5" style={{ color: "var(--theme-text)" }}>
                        €{car.price.toLocaleString("nl-BE")}
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-[12px] font-medium truncate" style={{ color: "var(--theme-text-muted)" }} title={car.title}>
                        {car.title}
                    </p>
                </div>

                <div className="flex justify-between py-4"
                    style={{ borderTop: "1px solid var(--theme-border-subtle)", borderBottom: "1px solid var(--theme-border-subtle)" }}>
                    <SpecPill icon={CalIcon} label={`${car.year}`} />
                    <SpecPill icon={OdoIcon} label={`${car.mileage.toLocaleString("nl-BE")} km`} />
                    <SpecPill icon={FuelIcon} label={car.fuel_type} />
                    <SpecPill icon={GearIcon} label={car.transmission || "–"} />
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group-hover:bg-[#d91c1c] group-hover:text-white group-hover:border-[#d91c1c]"
                        style={{ background: "#ffffff", color: "var(--theme-text)", border: "1px solid #b3b3b3" }}>
                        <span>{commonDict.viewDetails}</span>
                        <span className={`transition-transform duration-200 ${hovered ? "translate-x-0.5" : ""}`}>
                            {ArrowIcon}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
