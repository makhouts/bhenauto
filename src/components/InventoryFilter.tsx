"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function InventoryFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            // Reset page to 1 when changing filters
            params.delete("page");
            return params.toString();
        },
        [searchParams]
    );

    const updateFilter = (name: string, value: string) => {
        router.push(`${pathname}?${createQueryString(name, value)}`);
    };

    return (
        <div className="bg-white border-b border-slate-200 sticky top-20 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Mobile Filter Toggle */}
                <div className="flex justify-between items-center md:hidden mb-4">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center text-sm font-bold uppercase tracking-wider text-slate-700 hover:text-[#d91c1c] transition-colors"
                    >
                        <SlidersHorizontal size={18} className="mr-2" />
                        {isOpen ? "Hide Filters" : "Show Filters"}
                    </button>
                </div>

                {/* Filters Container */}
                <div className={`flex flex-col md:flex-row md:items-center gap-4 ${isOpen ? 'block' : 'hidden md:flex'}`}>
                    {/* Search */}
                    <div className="relative flex-grow max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by make, model, or year..."
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#d91c1c] focus:border-[#d91c1c] sm:text-sm rounded-lg transition-colors font-medium"
                            defaultValue={searchParams.get("query")?.toString()}
                            onChange={(e) => updateFilter("query", e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 flex-grow justify-start md:justify-end">
                        {/* Make Filter */}
                        <select
                            className="block pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-[#d91c1c] focus:border-[#d91c1c] sm:text-sm rounded-lg bg-slate-50 text-slate-900 font-bold uppercase tracking-wide border min-w-[140px]"
                            value={searchParams.get("brand") || ""}
                            onChange={(e) => updateFilter("brand", e.target.value)}
                        >
                            <option value="">All Marques</option>
                            <option value="Porsche">Porsche</option>
                            <option value="Mercedes-Benz">Mercedes-Benz</option>
                            <option value="Audi">Audi</option>
                            <option value="BMW">BMW</option>
                            <option value="Ferrari">Ferrari</option>
                        </select>

                        {/* Price Filter */}
                        <select
                            className="block pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-[#d91c1c] focus:border-[#d91c1c] sm:text-sm rounded-lg bg-slate-50 text-slate-900 font-bold uppercase tracking-wide border min-w-[140px]"
                            value={searchParams.get("sort") || ""}
                            onChange={(e) => updateFilter("sort", e.target.value)}
                        >
                            <option value="">Sort By: Default</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="year_desc">Year: Newest</option>
                            <option value="mileage_asc">Mileage: Lowest</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
