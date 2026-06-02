"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, CarFront, CheckCircle2, Search, ShieldAlert, Star } from "lucide-react";
import CarRow, { getAutoScoutSyncState, type AdminCarRow } from "@/components/admin/CarRow";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { tpl } from "@/lib/admin-i18n";
import { AdminBadge, AdminInputWrap, AdminToolbar } from "@/components/admin/admin-ui";

type SortKey = "vehicle" | "price" | "visibility" | "status" | "online" | "autoscout";
type SortDirection = "asc" | "desc";
type QuickFilter = "all" | "available" | "sold" | "featured" | "autoscout-problem";

function getStatusPriority(car: AdminCarRow) {
    if (car.sold) return 2;
    if (car.reserved) return 1;
    return 0;
}

function getCreatedAtTime(createdAt: AdminCarRow["createdAt"]) {
    const timestamp = new Date(createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getAutoScoutPriority(car: AdminCarRow) {
    const state = getAutoScoutSyncState(car);
    if (state === "not-synced") return 0;
    if (state === "pending") return 1;
    return 2;
}

function getDefaultDirection(key: SortKey): SortDirection {
    switch (key) {
        case "visibility":
        case "online":
            return "desc";
        case "autoscout":
            return "asc";
        default:
            return "asc";
    }
}

export default function CarsTableClient({ cars }: { cars: AdminCarRow[] }) {
    const { dict } = useAdminI18n();
    const [rows, setRows] = useState(cars);
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("status");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

    useEffect(() => {
        setRows(cars);
    }, [cars]);

    const updateRow = useCallback((id: string, patch: Partial<AdminCarRow>) => {
        setRows((current) => current.map((car) => (
            car.id === id ? { ...car, ...patch } : car
        )));
    }, []);

    const toggleQuickFilter = (next: QuickFilter) => {
        setQuickFilter((current) => current === next ? "all" : next);
    };

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
            case "autoscout":
                return (getAutoScoutPriority(a) - getAutoScoutPriority(b)) * direction;
            default:
                return 0;
        }
    };

    const filtered = rows
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
        .filter((car) => {
            switch (quickFilter) {
                case "available":
                    return !car.sold && !car.reserved;
                case "sold":
                    return car.sold;
                case "featured":
                    return car.featured;
                case "autoscout-problem":
                    return getAutoScoutSyncState(car) === "not-synced";
                default:
                    return true;
            }
        })
        .slice()
        .sort((a, b) => {
            const primary = compareCars(a, b);
            if (primary !== 0) return primary;

            const statusFallback = getStatusPriority(a) - getStatusPriority(b);
            if (statusFallback !== 0) return statusFallback;

            return getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt);
        });

    const availableCount = rows.filter((car) => !car.sold && !car.reserved).length;
    const soldCount = rows.filter((car) => car.sold).length;
    const featuredCount = rows.filter((car) => car.featured).length;
    const autoscoutProblemCount = rows.filter((car) => getAutoScoutSyncState(car) === "not-synced").length;

    const filterBadgeClass = (value: QuickFilter) => (
        quickFilter === value
            ? "border-current/35 ring-2 ring-current/18 ring-offset-2 ring-offset-white shadow-[0_12px_24px_rgba(15,23,42,0.10)]"
            : "opacity-92 hover:opacity-100"
    );

    const filterButtonClass = (value: QuickFilter) => (
        `cursor-pointer rounded-full transition-all duration-200 ease-out ${
            quickFilter === value
                ? "-translate-y-0.5 scale-[1.02]"
                : "hover:-translate-y-0.5 hover:scale-[1.01]"
        }`
    );

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
            <div className="px-5 py-5 sm:px-6">
                <AdminToolbar>
                    <div className="min-w-0">
                        <AdminInputWrap className="max-w-xl">
                            <Search size={18} className="shrink-0 text-slate-400" />
                            <input
                                type="text"
                                placeholder={dict.carsTable.searchPlaceholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                            />
                        </AdminInputWrap>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <button type="button" onClick={() => setQuickFilter("all")} aria-pressed={quickFilter === "all"} className={filterButtonClass("all")}>
                            <AdminBadge tone="blue" className={filterBadgeClass("all")}>
                                <CarFront size={13} />
                                {tpl(dict.dashboard.inventory.total, { count: rows.length })}
                            </AdminBadge>
                        </button>
                        <button type="button" onClick={() => toggleQuickFilter("available")} aria-pressed={quickFilter === "available"} className={filterButtonClass("available")}>
                            <AdminBadge tone="green" className={filterBadgeClass("available")}>
                                <CheckCircle2 size={13} />
                                {availableCount} {dict.carRow.statuses.available.toLowerCase()}
                            </AdminBadge>
                        </button>
                        <button type="button" onClick={() => toggleQuickFilter("sold")} aria-pressed={quickFilter === "sold"} className={filterButtonClass("sold")}>
                            <AdminBadge tone="red" className={filterBadgeClass("sold")}>
                                <ShieldAlert size={13} />
                                {soldCount} {dict.carRow.statuses.sold.toLowerCase()}
                            </AdminBadge>
                        </button>
                        <button type="button" onClick={() => toggleQuickFilter("featured")} aria-pressed={quickFilter === "featured"} className={filterButtonClass("featured")}>
                            <AdminBadge tone="violet" className={filterBadgeClass("featured")}>
                                <Star size={13} />
                                {featuredCount} {dict.carRow.featured.active.toLowerCase()}
                            </AdminBadge>
                        </button>
                        {autoscoutProblemCount > 0 ? (
                            <button type="button" onClick={() => toggleQuickFilter("autoscout-problem")} aria-pressed={quickFilter === "autoscout-problem"} className={filterButtonClass("autoscout-problem")}>
                                <AdminBadge tone="red" className={filterBadgeClass("autoscout-problem")}>
                                    <ShieldAlert size={13} />
                                    {autoscoutProblemCount} {dict.carRow.autoscoutSync.notSyncedShort}
                                </AdminBadge>
                            </button>
                        ) : null}
                    </div>
                </AdminToolbar>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-[1120px] w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="border-b border-slate-200 bg-slate-50/95 text-xs uppercase tracking-widest text-slate-500 backdrop-blur">
                            {renderSortButton("vehicle", dict.carsTable.columns.vehicle)}
                            {renderSortButton("price", dict.carsTable.columns.price)}
                            {renderSortButton("visibility", dict.carsTable.columns.visibility)}
                            {renderSortButton("status", dict.carsTable.columns.status)}
                            {renderSortButton("online", dict.carsTable.columns.online)}
                            {renderSortButton("autoscout", dict.carsTable.columns.autoscout)}
                            <th className="px-5 py-4 font-semibold text-right" scope="col">{dict.carsTable.columns.actions}</th>
                        </tr>
                    </thead>
                    <tbody key={`${quickFilter}:${query}`} className="motion-safe:animate-[fadeIn_220ms_ease-out]">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center text-slate-500 font-medium">
                                    {query ? (
                                        <p>{tpl(dict.carsTable.noMatch, { query })}</p>
                                    ) : (
                                        <p>{dict.carsTable.empty}</p>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((car) => (
                                <CarRow key={car.id} car={car} onAutoscoutChange={updateRow} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
                <p className="text-xs font-medium text-slate-400">
                    {query
                        ? tpl(dict.carsTable.found, { filtered: filtered.length, total: rows.length })
                        : tpl(dict.carsTable.found, { filtered: rows.length, total: rows.length })}
                </p>
            </div>
        </>
    );
}
