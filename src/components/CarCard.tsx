"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CarImage {
    url: string;
}

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
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";

/* ── shared stat pill helper ────────────────────────────────── */
function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            {icon}
            <span>{label}</span>
        </div>
    );
}

const CalendarIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const MileageIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const FuelIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const GearIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const PowerIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const ColorIcon = (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

export default function CarCard({ car, listView = false }: CarCardProps) {
    const [hovered, setHovered] = useState(false);
    const [imgError, setImgError] = useState(false);

    const img1 = car.images[0]?.url ?? PLACEHOLDER;
    const img2 = car.images[1]?.url ?? null;

    const ImageFallback = () => (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center z-[5]">
            <svg className="w-16 h-16 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.1 10.9c-1.1-2.9-3.2-5.9-6.9-5.9H11.8c-3.7 0-5.8 3-6.9 5.9C3.6 11.2 2 12 2 13.5V19h2v2h2v-2h12v2h2v-2h2v-5.5c0-1.5-1.6-2.3-2.9-2.6zM6.5 17c-1.4 0-2.5-1.1-2.5-2.5S5.1 12 6.5 12 9 13.1 9 14.5 7.9 17 6.5 17zm11 0c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5S18.9 17 17.5 17z" />
            </svg>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BhenAuto</span>
        </div>
    );

    /* ── LIST VIEW ─────────────────────────────────────────────── */
    if (listView) {
        return (
            <div
                className="group flex flex-row bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image — fixed width */}
                <Link href={`/cars/${car.slug}`} className="relative w-72 shrink-0 overflow-hidden block bg-slate-100">
                    {imgError && <ImageFallback />}
                    <Image
                        src={img1}
                        alt={car.title}
                        fill
                        onError={() => setImgError(true)}
                        className={`object-cover transition-opacity duration-500 group-hover:scale-105 transition-transform ${hovered && img2 ? "opacity-0" : "opacity-100"}`}
                    />
                    {img2 && (
                        <Image
                            src={img2}
                            alt={`${car.title} – 2`}
                            fill
                            className={`object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
                        />
                    )}
                    {/* Status */}
                    {car.sold && (
                        <div className="absolute top-3 left-3 bg-[#d91c1c] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">Verkocht</div>
                    )}
                    {!car.sold && car.reserved && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />Gereserveerd
                        </div>
                    )}
                </Link>

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 min-w-0">
                    {/* Top row: brand / price */}
                    <div className="flex items-start justify-between gap-4 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{car.brand}</span>
                        <span className="text-2xl font-black text-[#d91c1c] shrink-0 leading-none">
                            €{car.price.toLocaleString('nl-BE')}
                        </span>
                    </div>

                    {/* Title */}
                    <Link href={`/cars/${car.slug}`}>
                        <h3 className="text-xl font-headings font-bold text-slate-900 mb-3 hover:text-[#d91c1c] transition-colors leading-tight">
                            {car.brand} {car.model}
                        </h3>
                    </Link>

                    {/* Description */}
                    {car.description && (
                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                            {car.description}
                        </p>
                    )}

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-3" />

                    {/* Rich spec grid — 3 cols */}
                    <div className="grid grid-cols-3 gap-x-6 gap-y-2.5 mb-4">
                        <Stat icon={CalendarIcon} label={`${car.year}`} />
                        <Stat icon={MileageIcon} label={`${car.mileage.toLocaleString('nl-BE')} km`} />
                        <Stat icon={FuelIcon} label={car.fuel_type} />
                        {car.transmission && <Stat icon={GearIcon} label={car.transmission} />}
                        {car.horsepower > 0 && <Stat icon={PowerIcon} label={`${car.horsepower} pk`} />}
                        {car.color && <Stat icon={ColorIcon} label={car.color} />}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto flex items-center gap-3">
                        <Link
                            href={`/cars/${car.slug}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d91c1c] text-white font-bold hover:bg-[#b91515] transition-all rounded text-sm"
                        >
                            Bekijk Details
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                        {car.price > 100000 && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded">Premium</span>
                        )}
                        {car.featured && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#d91c1c] bg-red-50 px-2.5 py-1.5 rounded">In de kijker</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ── GRID VIEW (default) ────────────────────────────────────── */
    return (
        <div
            className="group flex flex-col bg-white border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-lg shadow-sm"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image Container */}
            <Link href={`/cars/${car.slug}`} className="relative h-64 md:h-72 w-full overflow-hidden block bg-slate-100">

                {imgError && <ImageFallback />}
                <Image
                    src={img1}
                    alt={car.title}
                    fill
                    onError={() => setImgError(true)}
                    className={`object-cover transition-opacity duration-500 ${hovered && img2 ? "opacity-0" : "opacity-100"}`}
                />

                {/* Secondary image — fades in on hover */}
                {img2 && (
                    <Image
                        src={img2}
                        alt={`${car.title} – vue 2`}
                        fill
                        className={`object-cover transition-opacity duration-500 ${hovered ? "opacity-100" : "opacity-0"}`}
                    />
                )}

                {/* Sold badge */}
                {car.sold && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/20 shadow-lg z-10">
                        Verkocht
                    </div>
                )}

                {/* Reserved badge */}
                {!car.sold && car.reserved && (
                    <div className="absolute top-4 right-4 bg-amber-500/70 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-300/30 shadow-lg z-10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        Gereserveerd
                    </div>
                )}

                {/* Year / Premium tags */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {car.year > 2023 && (
                        <span className="bg-[#d91c1c] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                            Nieuw
                        </span>
                    )}
                    {car.price > 100000 && (
                        <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                            Premium
                        </span>
                    )}
                </div>

                {/* Subtle image-count indicator */}
                {img2 && (
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm z-10 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${!hovered ? "bg-white" : "bg-white/40"}`} />
                        <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${hovered ? "bg-white" : "bg-white/40"}`} />
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{car.brand}</div>
                <div className="flex justify-between items-start mb-4">
                    <Link href={`/cars/${car.slug}`}>
                        <h3 className="text-xl font-headings font-bold text-slate-900 leading-tight pr-4">{car.model}</h3>
                    </Link>
                    <div className="text-xl font-black text-[#d91c1c] shrink-0">
                        €{car.price.toLocaleString('nl-BE')}
                    </div>
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium py-5 px-2 mt-auto border-t border-slate-50">
                    {/* Year — calendar */}
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {car.year}
                    </div>
                    {/* Mileage — road */}
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeWidth={2} d="M4 20L11 4" />
                            <path strokeLinecap="round" strokeWidth={2} d="M20 20L13 4" />
                            <path strokeLinecap="round" strokeWidth={1.5} strokeDasharray="2 2" d="M12 18V6" />
                        </svg>
                        {car.mileage.toLocaleString('nl-BE')} KM
                    </div>
                    {/* Fuel — engine */}
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h10a2 2 0 012 2v1h1a2 2 0 012 2v2a2 2 0 01-2 2h-1v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h4" />
                        </svg>
                        {car.fuel_type}
                    </div>
                    {/* Transmission — gearbox */}
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <circle cx="5" cy="6" r="2" strokeWidth={2} />
                            <circle cx="12" cy="6" r="2" strokeWidth={2} />
                            <circle cx="19" cy="6" r="2" strokeWidth={2} />
                            <circle cx="5" cy="18" r="2" strokeWidth={2} />
                            <circle cx="12" cy="18" r="2" strokeWidth={2} />
                            <line x1="5" y1="8" x2="5" y2="16" strokeWidth={2} strokeLinecap="round" />
                            <line x1="12" y1="8" x2="12" y2="16" strokeWidth={2} strokeLinecap="round" />
                            <line x1="19" y1="8" x2="19" y2="13" strokeWidth={2} strokeLinecap="round" />
                        </svg>
                        {car.transmission || '–'}
                    </div>
                </div>

                <Link
                    href={`/cars/${car.slug}`}
                    className="w-full py-3 bg-[#d91c1c] text-white text-center font-bold hover:bg-[#b91515] transition-all rounded flex items-center justify-center gap-2"
                >
                    Bekijk Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
            </div>
        </div>
    );
}
