"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function InventoryFilter({ availableBrands = [] }: { availableBrands?: string[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);

    // Local slider state — only pushed to URL on release
    const paramMileage = searchParams.get("maxMileage") || "200000";
    const paramPrice = searchParams.get("maxPrice") || "250000";
    const [localMileage, setLocalMileage] = useState(paramMileage);
    const [localPrice, setLocalPrice] = useState(paramPrice);
    const isDraggingMileage = useRef(false);
    const isDraggingPrice = useRef(false);

    // Keep local state in sync when URL params change externally (e.g. reset)
    // We use the param values when not actively dragging
    const displayMileage = isDraggingMileage.current ? localMileage : paramMileage;
    const displayPrice = isDraggingPrice.current ? localPrice : paramPrice;

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            params.delete("page");
            return params.toString();
        },
        [searchParams]
    );

    const toggleMultiFilter = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            const currentValues = params.getAll(name);

            if (currentValues.includes(value)) {
                params.delete(name);
                currentValues.filter(v => v !== value).forEach(v => params.append(name, v));
            } else {
                params.append(name, value);
            }

            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [searchParams, pathname, router]
    );

    const clearFilters = () => {
        setLocalMileage("200000");
        setLocalPrice("250000");
        router.push(pathname);
    };

    const currentBrands = searchParams.getAll("brand");

    // Commit slider value to URL (only on release)
    const commitMileage = (val: string) => {
        isDraggingMileage.current = false;
        router.push(`${pathname}?${createQueryString("maxMileage", val)}`);
    };

    const commitPrice = (val: string) => {
        isDraggingPrice.current = false;
        router.push(`${pathname}?${createQueryString("maxPrice", val)}`);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm font-sans flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
                <h3 className="font-headings font-black text-xl text-slate-900 flex items-center gap-2">
                    Filters
                </h3>
                <button
                    onClick={clearFilters}
                    className="text-[#d91c1c] text-sm font-bold hover:underline"
                >
                    Reset Alles
                </button>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-center py-3 border border-slate-200 text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors"
                >
                    {isOpen ? "Verberg Filters" : "Toon Filters"}
                    <SlidersHorizontal size={16} className="ml-2 text-slate-400" />
                </button>
            </div>

            {/* Filters Container */}
            <div className={`flex flex-col gap-8 ${isOpen ? 'block' : 'hidden lg:flex'}`}>

                {/* Brand */}
                <div>
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Merk</h4>
                    <div className="space-y-3">
                        {availableBrands.map(brand => (
                            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${currentBrands.includes(brand) ? 'bg-[#d91c1c] border-[#d91c1c] text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                                    {currentBrands.includes(brand) && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={currentBrands.includes(brand)}
                                    onChange={() => toggleMultiFilter("brand", brand)}
                                />
                                <span className={`text-sm ${currentBrands.includes(brand) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{brand}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Mileage Range */}
                <div className="border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Kilometerstand</h4>
                    <div className="pb-2">
                        <input
                            type="range"
                            min="0"
                            max="200000"
                            step="5000"
                            value={displayMileage}
                            onInput={(e) => {
                                isDraggingMileage.current = true;
                                setLocalMileage((e.target as HTMLInputElement).value);
                            }}
                            onChange={(e) => {
                                isDraggingMileage.current = true;
                                setLocalMileage(e.target.value);
                            }}
                            onMouseUp={(e) => commitMileage((e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => commitMileage((e.target as HTMLInputElement).value)}
                            className="slider-input w-full"
                            style={{
                                background: `linear-gradient(to right, #d91c1c 0%, #d91c1c ${(parseInt(displayMileage) / 200000) * 100}%, #e2e8f0 ${(parseInt(displayMileage) / 200000) * 100}%, #e2e8f0 100%)`
                            }}
                        />
                        <div className="flex justify-between mt-3 text-sm font-medium text-slate-500">
                            <span>0 km</span>
                            <span>200k+ km</span>
                        </div>
                    </div>
                    <div className="text-center mt-1 text-xs font-bold text-slate-700">
                        Max: {parseInt(displayMileage) >= 200000 ? "Geen limiet" : `${parseInt(displayMileage).toLocaleString('nl-NL')} km`}
                    </div>
                </div>

                {/* Price Range */}
                <div className="border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Prijsklasse</h4>
                    <div className="pb-2">
                        <input
                            type="range"
                            min="10000"
                            max="250000"
                            step="5000"
                            value={displayPrice}
                            onInput={(e) => {
                                isDraggingPrice.current = true;
                                setLocalPrice((e.target as HTMLInputElement).value);
                            }}
                            onChange={(e) => {
                                isDraggingPrice.current = true;
                                setLocalPrice(e.target.value);
                            }}
                            onMouseUp={(e) => commitPrice((e.target as HTMLInputElement).value)}
                            onTouchEnd={(e) => commitPrice((e.target as HTMLInputElement).value)}
                            className="slider-input w-full"
                            style={{
                                background: `linear-gradient(to right, #d91c1c 0%, #d91c1c ${((parseInt(displayPrice) - 10000) / 240000) * 100}%, #e2e8f0 ${((parseInt(displayPrice) - 10000) / 240000) * 100}%, #e2e8f0 100%)`
                            }}
                        />
                        <div className="flex justify-between mt-3 text-sm font-medium text-slate-500">
                            <span>€10k</span>
                            <span>€250k+</span>
                        </div>
                    </div>
                    <div className="text-center mt-1 text-xs font-bold text-slate-700">
                        Max: {parseInt(displayPrice) >= 250000 ? "Geen limiet" : `€ ${parseInt(displayPrice).toLocaleString('nl-NL')}`}
                    </div>
                </div>

                {/* Fuel Type */}
                <div className="border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Brandstof</h4>
                    <div className="relative">
                        <select
                            className="w-full appearance-none bg-white border border-slate-200 rounded-md py-2.5 pl-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#d91c1c] focus:border-[#d91c1c] cursor-pointer"
                            value={searchParams.get("fuel") || ""}
                            onChange={(e) => router.push(`${pathname}?${createQueryString("fuel", e.target.value)}`)}
                        >
                            <option value="">Alle Typen</option>
                            <option value="Benzine">Benzine</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Elektrisch">Elektrisch</option>
                            <option value="Hybride">Hybride</option>
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
