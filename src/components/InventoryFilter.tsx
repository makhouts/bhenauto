"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

export default function InventoryFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);

    // Helpers to create query strings
    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            // Since we moved to multiple brands and types, we handle arrays:
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
                // Remove the value
                params.delete(name);
                currentValues.filter(v => v !== value).forEach(v => params.append(name, v));
            } else {
                // Add the value
                params.append(name, value);
            }

            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
        },
        [searchParams, pathname, router]
    );

    const clearFilters = () => {
        router.push(pathname);
    };

    const brands = ["Porsche", "BMW", "Mercedes-Benz", "Audi"];
    const currentBrands = searchParams.getAll("brand");

    const types = ["SUV", "Sedan", "Coupe", "Electric"];
    const currentTypes = searchParams.getAll("type");

    // Price range mock
    const currentPrice = searchParams.get("maxPrice") || "250000";

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
                        {brands.map(brand => (
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

                {/* Vehicle Type */}
                <div className="border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Voertuigtype</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {types.map(type => (
                            <button
                                key={type}
                                onClick={() => toggleMultiFilter("type", type)}
                                className={`py-2 px-3 text-sm font-medium rounded-md border text-center transition-all ${currentTypes.includes(type) ? 'border-[#d91c1c] bg-red-50 text-[#d91c1c]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                            >
                                {type === "Electric" ? "Elektrisch" : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="border-t border-slate-100 pt-8">
                    <h4 className="font-bold text-slate-900 mb-4 text-sm">Prijsklasse</h4>
                    <div className="relative pt-4 pb-2">
                        {/* Custom visual track */}
                        <div className="h-1.5 w-full bg-slate-200 rounded-full absolute top-5 left-0"></div>
                        <div
                            className="h-1.5 bg-[#d91c1c] rounded-full absolute top-5 left-0"
                            style={{ width: `${(parseInt(currentPrice) / 250000) * 100}%` }}
                        ></div>
                        <input
                            type="range"
                            min="20000"
                            max="250000"
                            step="10000"
                            value={currentPrice}
                            onChange={(e) => {
                                const val = e.target.value;
                                router.push(`${pathname}?${createQueryString("maxPrice", val)}`);
                            }}
                            className="w-full h-1.5 appearance-none bg-transparent cursor-pointer relative z-10 
                                [&::-webkit-slider-thumb]:appearance-none 
                                [&::-webkit-slider-thumb]:w-5 
                                [&::-webkit-slider-thumb]:h-5 
                                [&::-webkit-slider-thumb]:rounded-full 
                                [&::-webkit-slider-thumb]:bg-[#d91c1c]
                                [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-white
                                [&::-webkit-slider-thumb]:shadow-md"
                        />
                        <div className="flex justify-between mt-4 text-sm font-medium text-slate-500">
                            <span>€20k</span>
                            <span>€250k+</span>
                        </div>
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
