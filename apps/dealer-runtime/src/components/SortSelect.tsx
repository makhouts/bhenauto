"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { buildPathWithQuery, updateSearchParams } from "@/lib/search-params";

interface SortDict {
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortMileageAsc: string;
}

export default function SortSelect({ dict }: { dict: SortDict }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.push(
            buildPathWithQuery(
                pathname,
                updateSearchParams(searchParams.toString(), { sort: e.target.value })
            ),
            { scroll: false }
        );
    };

    return (
        <div className="relative">
            <label htmlFor="sort-select" className="sr-only">
                {dict.sortNewest}
            </label>
            <select
                id="sort-select"
                title={dict.sortNewest}
                name="sort"
                className="appearance-none bg-transparent font-bold text-sm theme-text pr-4 cursor-pointer focus:outline-none"
                defaultValue={searchParams.get("sort") || ""}
                onChange={handleSortChange}
            >
                <option value="">{dict.sortNewest}</option>
                <option value="price_asc">{dict.sortPriceAsc}</option>
                <option value="price_desc">{dict.sortPriceDesc}</option>
                <option value="mileage_asc">{dict.sortMileageAsc}</option>
            </select>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none theme-text">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
        </div>
    );
}
