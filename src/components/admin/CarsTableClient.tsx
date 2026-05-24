"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import CarRow, { type AdminCarRow } from "@/components/admin/CarRow";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { tpl } from "@/lib/admin-i18n";

type SortKey = "vehicle" | "price" | "visibility" | "status" | "online";
type SortDirection = "asc" | "desc";

function getStatusPriority(car: AdminCarRow) {
    if (car.sold) return 2;
    if (car.reserved) return 1;
    return 0;
}

function getCreatedAtTime(createdAt: AdminCarRow["createdAt"]) {
    const timestamp = new Date(createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getDefaultDirection(key: SortKey): SortDirection {
    switch (key) {
        case "visibility":
        case "online":
            return "desc";
        default:
            return "asc";
    }
}

export default function CarsTableClient({ cars }: { cars: AdminCarRow[] }) {
    const { dict } = useAdminI18n();
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(key);
        setSortDirection(getDefaultDirection(key));
    };

    const compareCars = (a: AdminCarRow, b: AdminCarRow) => {
        const direction = sortDirection === "asc" ? 1 : -1;

        switch (sortKey) {
            case "vehicle": {
                const vehicleA = `${a.brand} ${a.model}`.trim();
                const vehicleB = `${b.brand} ${b.model}`.trim();
                return vehicleA.localeCompare(vehicleB, undefined, { sensitivity: "base" }) * direction;
            }
            case "price":
                return (a.price - b.price) * direction;
            case "visibility":
                return ((Number(a.featured) - Number(b.featured)) * direction);
            case "status":
                return (getStatusPriority(a) - getStatusPriority(b)) * direction;
            case "online":
                return (getCreatedAtTime(a.createdAt) - getCreatedAtTime(b.createdAt)) * direction;
            default:
                return 0;
        }
    };

    const filtered = cars
        .filter((car) => {
            if (!query.trim()) return true;
            const q = query.toLowerCase();
            return (
                car.brand?.toLowerCase().includes(q) ||
                car.model?.toLowerCase().includes(q) ||
                String(car.year).includes(q) ||
                car.fuel_type?.toLowerCase().includes(q) ||
                car.color?.toLowerCase().includes(q)
            );
        })
        .slice()
        .sort((a, b) => {
            const primary = compareCars(a, b);
            if (primary !== 0) return primary;

            const statusFallback = getStatusPriority(a) - getStatusPriority(b);
            if (statusFallback !== 0) return statusFallback;

            return getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt);
        });

    const renderSortButton = (key: SortKey, label: string) => {
        const isActive = sortKey === key;
        const Icon = !isActive ? ArrowUpDown : sortDirection === "asc" ? ArrowUp : ArrowDown;
        const ariaSort = isActive
            ? sortDirection === "asc"
                ? "ascending"
                : "descending"
            : "none";

        return (
            <th aria-sort={ariaSort} className="px-5 py-4 font-semibold" scope="col">
                <button
                    type="button"
                    onClick={() => handleSort(key)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 transition-colors ${isActive ? "text-slate-800" : "hover:text-slate-700"}`}
                >
                    <span>{label}</span>
                    <Icon size={13} className={isActive ? "text-[#d91c1c]" : "text-slate-400"} />
                </button>
            </th>
        );
    };

    return (
        <>
            {/* Search bar */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder={dict.carsTable.searchPlaceholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d91c1c]/20 focus:border-[#d91c1c] transition-all placeholder:text-slate-400"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                            {renderSortButton("vehicle", dict.carsTable.columns.vehicle)}
                            {renderSortButton("price", dict.carsTable.columns.price)}
                            {renderSortButton("visibility", dict.carsTable.columns.visibility)}
                            {renderSortButton("status", dict.carsTable.columns.status)}
                            {renderSortButton("online", dict.carsTable.columns.online)}
                            <th className="px-5 py-4 font-semibold text-right" scope="col">{dict.carsTable.columns.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                    {query ? (
                                        <p>{tpl(dict.carsTable.noMatch, { query })}</p>
                                    ) : (
                                        <p>{dict.carsTable.empty}</p>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((car) => (
                                <CarRow key={car.id} car={car} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {query && filtered.length > 0 && (
                <p className="text-xs text-slate-400 font-medium mt-3">
                    {tpl(dict.carsTable.found, { filtered: filtered.length, total: cars.length })}
                </p>
            )}
        </>
    );
}
