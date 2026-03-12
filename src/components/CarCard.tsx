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
    images: CarImage[];
}

interface CarCardProps {
    car: CarWithImages;
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";

export default function CarCard({ car }: CarCardProps) {
    const [hovered, setHovered] = useState(false);

    const img1 = car.images[0]?.url ?? PLACEHOLDER;
    const img2 = car.images[1]?.url ?? null;

    return (
        <div
            className="group flex flex-col bg-white border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl rounded-lg shadow-sm"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image Container */}
            <Link href={`/cars/${car.slug}`} className="relative h-56 md:h-64 w-full overflow-hidden block bg-slate-100">

                {/* Primary image — fades out on hover if second exists */}
                <Image
                    src={img1}
                    alt={car.title}
                    fill
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
                    <div className="absolute top-4 right-4 bg-[#d91c1c] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md z-10">
                        Verkocht
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
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {car.year}
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {car.mileage.toLocaleString('nl-BE')} KM
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {car.fuel_type}
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
