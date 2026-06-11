"use client";

import { differenceInCalendarDays } from "date-fns";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toggleFeatured, deleteCar, retryCarAutoscoutSync, updateCarStatus } from "@/app/actions/cars";
import { Star, Edit, Trash2, Loader2, ChevronDown, CheckCircle, Clock, XCircle, X, RefreshCcw, MoreHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl, getThumbnailImageUrl } from "@/lib/image-url";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { tpl } from "@/lib/admin-i18n";
import { isAutoScoutSourceOfTruth } from "@/lib/autoscout24/source-of-truth";

type Status = "beschikbaar" | "gereserveerd" | "verkocht";

export type AdminCarRow = {
    id: string;
    slug: string;
    createdAt: Date | string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
    fuel_type?: string;
    color?: string;
    featured: boolean;
    sold: boolean;
    reserved: boolean;
    sourceOfTruth?: string | null;
    autoscoutListingId?: string | null;
    autoscoutSyncStatus?: string | null;
    autoscoutSyncError?: string | null;
    detailViewsCount?: number;
    detailViewsLast30dCount?: number;
    uniqueViewersLast30dCount?: number;
    images?: { url: string }[];
};

// Derive the 3-state status from the car's boolean fields
function getStatus(car: { sold: boolean; reserved: boolean }): Status {
    if (car.sold) return "verkocht";
    if (car.reserved) return "gereserveerd";
    return "beschikbaar";
}

const STATUS_CONFIG = {
    beschikbaar: {
        icon: CheckCircle,
        className: "border-green-500 text-green-600 bg-green-50",
        dotClass: "bg-green-500",
    },
    gereserveerd: {
        icon: Clock,
        className: "border-amber-500 text-amber-600 bg-amber-50",
        dotClass: "bg-amber-500",
    },
    verkocht: {
        icon: XCircle,
        className: "border-red-500 text-red-600 bg-red-50",
        dotClass: "bg-red-500",
    },
} as const;

function getDaysOnline(createdAt: Date | string) {
    const publishedAt = new Date(createdAt);
    if (Number.isNaN(publishedAt.getTime())) return null;
    return Math.max(1, differenceInCalendarDays(new Date(), publishedAt) + 1);
}

export type AutoScoutSyncState = "synced" | "pending" | "not-synced";

export function isAutoScoutSynced(car: AdminCarRow) {
    if (car.autoscoutSyncStatus === "synced") return true;
    if (car.sold && car.autoscoutSyncStatus === "deleted") return true;
    return Boolean(car.autoscoutListingId && !car.autoscoutSyncStatus);
}

export function isAutoScoutPending(status: string | null | undefined) {
    return status === "pending" || status === "pending-delete";
}

export function getAutoScoutSyncState(car: AdminCarRow): AutoScoutSyncState {
    if (isAutoScoutPending(car.autoscoutSyncStatus)) return "pending";
    if (isAutoScoutSynced(car)) return "synced";
    return "not-synced";
}

export default function CarRow({
    car,
    onAutoscoutChange,
}: {
    car: AdminCarRow;
    onAutoscoutChange?: (id: string, patch: Partial<AdminCarRow>) => void;
}) {
    const { locale, dict } = useAdminI18n();
    const router = useRouter();
    const initialStatus = getStatus(car);
    const [rowCar, setRowCar] = useState(car);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRetryingAutoScout, setIsRetryingAutoScout] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [actionsMenuStyle, setActionsMenuStyle] = useState<CSSProperties | null>(null);
    const [thumbFailedFor, setThumbFailedFor] = useState<string | null>(null);
    // Optimistic status — updates immediately on user interaction
    const [optimisticStatus, setOptimisticStatus] = useState<Status>(initialStatus);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const actionsButtonRef = useRef<HTMLButtonElement>(null);
    const actionsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setRowCar(car);
        setOptimisticStatus(getStatus(car));
    }, [car]);

    // Close dropdown on outside click
    useOutsideClick(dropdownRef, () => setDropdownOpen(false), dropdownOpen);

    useEffect(() => {
        if (!isAutoScoutPending(rowCar.autoscoutSyncStatus)) return;

        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/admin/cars/${rowCar.id}/autoscout-sync`, {
                    cache: "no-store",
                    credentials: "same-origin",
                });
                if (response.ok) {
                    const next = await response.json() as Partial<AdminCarRow>;
                    if (!cancelled) {
                        setRowCar((current) => ({ ...current, ...next }));
                        onAutoscoutChange?.(rowCar.id, next);
                    }
                    if (!isAutoScoutPending(next.autoscoutSyncStatus)) return;
                }
            } catch (error) {
                console.warn("AutoScout24 status polling failed:", error);
            }

            if (!cancelled) {
                timeoutId = setTimeout(pollStatus, 3000);
            }
        };

        timeoutId = setTimeout(pollStatus, 1500);

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [onAutoscoutChange, rowCar.id, rowCar.autoscoutSyncStatus]);

    useEffect(() => {
        if (!showDeleteConfirm) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isUpdating) {
                setShowDeleteConfirm(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [showDeleteConfirm, isUpdating]);

    useEffect(() => {
        if (!actionsOpen) return;

        const updateMenuPosition = () => {
            if (!actionsButtonRef.current) return;

            const buttonRect = actionsButtonRef.current.getBoundingClientRect();
            const menuWidth = 224;
            const menuHeight = actionsMenuRef.current?.offsetHeight ?? 110;
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const shouldOpenUp = spaceBelow < menuHeight + 12 && spaceAbove > spaceBelow;

            const left = Math.max(12, Math.min(buttonRect.right - menuWidth, window.innerWidth - menuWidth - 12));
            const top = shouldOpenUp
                ? Math.max(12, buttonRect.top - menuHeight - 8)
                : Math.min(window.innerHeight - menuHeight - 12, buttonRect.bottom + 8);

            setActionsMenuStyle({
                position: "fixed",
                top,
                left,
                width: menuWidth,
                zIndex: 40,
            });
        };

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (actionsButtonRef.current?.contains(target)) return;
            if (actionsMenuRef.current?.contains(target)) return;
            setActionsOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActionsOpen(false);
        };

        updateMenuPosition();
        const rafId = window.requestAnimationFrame(updateMenuPosition);
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [actionsOpen]);

    const handleToggleFeatured = async () => {
        setIsUpdating(true);
        const nextFeatured = !rowCar.featured;
        const result = await toggleFeatured(rowCar.id, nextFeatured);
        if (result?.error) {
            toast.error(
                result.code === "MAX_FEATURED_CARS_REACHED"
                    ? dict.carRow.featured.maxReached
                    : dict.carRow.featured.updateError
            );
        } else {
            const patch = { featured: nextFeatured };
            setRowCar((current) => ({
                ...current,
                ...patch,
            }));
            onAutoscoutChange?.(rowCar.id, patch);
            toast.success(nextFeatured ? dict.carRow.featured.activated : dict.carRow.featured.deactivated);
        }
        setIsUpdating(false);
    };

    const handleStatusChange = async (newStatus: Status) => {
        setDropdownOpen(false);
        setOptimisticStatus(newStatus); // optimistic update
        setIsUpdating(true);
        const result = await updateCarStatus(car.id, newStatus);
        if (result?.error) {
            setOptimisticStatus(initialStatus);
            toast.error(result.error);
        } else {
            const patch = {
                sold: newStatus === "verkocht",
                reserved: newStatus === "gereserveerd",
                autoscoutSyncStatus: result?.autoscoutQueued
                    ? newStatus === "verkocht" ? "pending-delete" : "pending"
                    : rowCar.autoscoutSyncStatus,
                autoscoutSyncError: result?.autoscoutQueued ? null : rowCar.autoscoutSyncError,
            };
            setRowCar((current) => ({
                ...current,
                ...patch,
            }));
            onAutoscoutChange?.(rowCar.id, patch);
            const labels: Record<Status, string> = {
                beschikbaar: dict.carRow.statuses.available,
                gereserveerd: dict.carRow.statuses.reserved,
                verkocht: dict.carRow.statuses.sold,
            };
            if (result?.autoscoutQueued) {
                toast.info(dict.carRow.autoscoutQueued);
            } else {
                toast.success(tpl(dict.carRow.statusUpdated, { status: labels[newStatus] }));
            }
        }
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        setIsUpdating(true);
        const result = await deleteCar(car.id);
        if (result?.error) {
            toast.error(result.error);
            setIsUpdating(false);
            setShowDeleteConfirm(false);
        } else {
            toast.success(tpl(dict.carRow.deleted, { name: `${car.brand} ${car.model}` }));
        }
    };

    const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, a, input, select, textarea, label")) return;
        router.push(`/admin/cars/${car.id}/edit`);
    };

    const handleRetryAutoScoutSync = async () => {
        if (autoscoutSynced || autoscoutPending || isRetryingAutoScout) return;

        const previousStatus = rowCar.autoscoutSyncStatus;
        const previousError = rowCar.autoscoutSyncError;
        const nextStatus = rowCar.sold ? "pending-delete" : "pending";
        setIsRetryingAutoScout(true);
        setRowCar((current) => ({
            ...current,
            autoscoutSyncStatus: nextStatus,
            autoscoutSyncError: null,
        }));
        onAutoscoutChange?.(rowCar.id, {
            autoscoutSyncStatus: nextStatus,
            autoscoutSyncError: null,
        });

        const result = await retryCarAutoscoutSync(rowCar.id);
        if (result?.error) {
            const patch = {
                autoscoutSyncStatus: previousStatus,
                autoscoutSyncError: previousError ?? result.error,
            };
            setRowCar((current) => ({
                ...current,
                ...patch,
            }));
            onAutoscoutChange?.(rowCar.id, patch);
            toast.error(result.error);
        } else {
            const patch = {
                autoscoutSyncStatus: result.autoscoutSyncStatus ?? nextStatus,
                autoscoutSyncError: null,
            };
            setRowCar((current) => ({
                ...current,
                ...patch,
            }));
            onAutoscoutChange?.(rowCar.id, patch);
            toast.info(result.autoscoutQueued ? dict.carRow.autoscoutSync.retryQueued : dict.carRow.autoscoutSync.synced);
        }
        setIsRetryingAutoScout(false);
    };

    const statusConfig = STATUS_CONFIG[optimisticStatus];
    const statusLabels: Record<Status, string> = {
        beschikbaar: dict.carRow.statuses.available,
        gereserveerd: dict.carRow.statuses.reserved,
        verkocht: dict.carRow.statuses.sold,
    };
    const daysOnline = getDaysOnline(car.createdAt);

    // Format price in Euros
    const formattedPrice = new Intl.NumberFormat(locale === "fr" ? "fr-BE" : "nl-BE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(car.price);

    const primaryImage = car.images?.[0]?.url ?? null;
    const thumbnailUrl = primaryImage
        ? (thumbFailedFor === primaryImage ? getImageUrl(primaryImage) : getThumbnailImageUrl(primaryImage))
        : null;
    const autoscoutState = getAutoScoutSyncState(rowCar);
    const autoscoutSynced = autoscoutState === "synced";
    const autoscoutPending = autoscoutState === "pending";
    const autoScoutManaged = isAutoScoutSourceOfTruth(rowCar.sourceOfTruth);
    const autoscoutLabel = autoscoutPending ? dict.carRow.autoscoutSync.pending : (
        autoscoutSynced ? dict.carRow.autoscoutSync.synced : dict.carRow.autoscoutSync.notSynced
    );
    const autoscoutTitle = !autoscoutSynced && rowCar.autoscoutSyncError
        ? `${autoscoutLabel}: ${rowCar.autoscoutSyncError}`
        : autoscoutLabel;

    return (
        <tr
            onClick={handleRowClick}
            className="relative cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/60"
        >
            {/* Thumbnail + Car Info */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-[120px] h-[85px] rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt={`${car.brand} ${car.model}`}
                                width={120}
                                height={85}
                                unoptimized
                                onError={() => {
                                    if (primaryImage) setThumbFailedFor(primaryImage);
                                }}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{car.brand} {car.model}</span>
                        <span className="text-xs text-slate-500 font-medium">{car.year} • {car.mileage.toLocaleString("nl-BE")} km</span>
                    </div>
                </div>
            </td>

            {/* Euro Price */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-slate-800">
                {formattedPrice}
            </td>

            {/* Featured Toggle */}
            <td className="px-5 py-3 whitespace-nowrap">
                <button
                    onClick={handleToggleFeatured}
                    disabled={isUpdating}
                    className={`flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors border ${rowCar.featured
                        ? "border-[#d91c1c] text-[#d91c1c] bg-[#d91c1c]/10 hover:bg-[#d91c1c]/20"
                        : "border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400"
                        } disabled:opacity-50`}
                >
                    <Star size={13} className="mr-1.5" fill={rowCar.featured ? "currentColor" : "none"} />
                    {rowCar.featured ? dict.carRow.featured.active : dict.carRow.featured.inactive}
                </button>
            </td>

            {/* Status Dropdown */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={isUpdating || autoScoutManaged}
                        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 ${statusConfig.className}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dotClass}`} />
                        {statusLabels[optimisticStatus]}
                        <ChevronDown size={12} className={`ml-0.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                            {(Object.entries(STATUS_CONFIG) as [Status, typeof STATUS_CONFIG[Status]][]).map(([key, config]) => {
                                const Icon = config.icon;
                                const isActive = key === optimisticStatus;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusChange(key)}
                                        className={`flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${isActive ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                    >
                                        <Icon size={13} className="shrink-0" />
                                        {statusLabels[key]}
                                        {isActive && <CheckCircle size={12} className="ml-auto text-slate-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </td>

            {/* Days online */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-semibold text-slate-700">
                {daysOnline === null
                    ? "—"
                    : tpl(daysOnline === 1 ? dict.carRow.onlineDays.one : dict.carRow.onlineDays.other, {
                        count: daysOnline.toLocaleString(locale === "fr" ? "fr-BE" : "nl-BE"),
                    })}
            </td>

            {/* Views */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="relative inline-flex group/views">
                    <span
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                        aria-label={`${dict.carsTable.columns.views}: ${rowCar.detailViewsCount ?? 0}`}
                    >
                        <Eye size={13} className="text-slate-400" />
                        {(rowCar.detailViewsCount ?? 0).toLocaleString(locale === "fr" ? "fr-BE" : "nl-BE")}
                    </span>
                    <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-max min-w-[170px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left opacity-0 shadow-xl shadow-slate-900/10 transition-all duration-150 group-hover/views:translate-y-0 group-hover/views:opacity-100 group-focus-within/views:translate-y-0 group-focus-within/views:opacity-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            {dict.carsTable.columns.views}
                        </p>
                        <div className="mt-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">{dict.analytics.periods.last30d}</span>
                                <span className="font-black text-slate-900">
                                    {(rowCar.detailViewsLast30dCount ?? 0).toLocaleString(locale === "fr" ? "fr-BE" : "nl-BE")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                                <span className="font-medium text-slate-500">{dict.analytics.labels.unique}</span>
                                <span className="font-black text-slate-900">
                                    {(rowCar.uniqueViewersLast30dCount ?? 0).toLocaleString(locale === "fr" ? "fr-BE" : "nl-BE")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </td>

            {/* AutoScout sync */}
            <td className="px-5 py-3 whitespace-nowrap">
                {autoscoutSynced || autoscoutPending ? (
                    <span
                        title={autoscoutTitle}
                        aria-label={autoscoutTitle}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                            autoscoutSynced
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-amber-500 bg-amber-50 text-amber-700"
                        }`}
                    >
                        {autoscoutPending ? (
                            <Loader2 size={11} className="animate-spin" />
                        ) : (
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                        {autoscoutPending ? dict.carRow.autoscoutSync.pendingShort : dict.carRow.autoscoutSync.syncedShort}
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={handleRetryAutoScoutSync}
                        disabled={isRetryingAutoScout || autoScoutManaged}
                        title={autoscoutTitle}
                        aria-label={dict.carRow.autoscoutSync.retry}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-700 transition-colors hover:bg-red-100 hover:text-red-800 disabled:cursor-wait disabled:opacity-70"
                    >
                        {isRetryingAutoScout ? (
                            <Loader2 size={11} className="animate-spin" />
                        ) : (
                            <RefreshCcw size={11} />
                        )}
                        {dict.carRow.autoscoutSync.notSyncedShort}
                    </button>
                )}
            </td>

            {/* Actions */}
            <td className="px-5 py-3 whitespace-nowrap text-right text-sm">
                <div className="flex items-center justify-end">
                    <button
                        ref={actionsButtonRef}
                        type="button"
                        onClick={() => {
                            setDropdownOpen(false);
                            setActionsOpen((current) => !current);
                        }}
                        disabled={isUpdating}
                        className={`rounded-xl border p-2.5 transition-colors disabled:opacity-50 ${
                            actionsOpen
                                ? "border-slate-300 bg-white text-slate-800 shadow-sm"
                                : "border-transparent text-slate-400 hover:border-slate-300 hover:bg-white hover:text-slate-700"
                        }`}
                        title={dict.carsTable.columns.actions}
                        aria-label={dict.carsTable.columns.actions}
                        aria-expanded={actionsOpen}
                        aria-haspopup="menu"
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </td>

            {actionsOpen && actionsMenuStyle && typeof document !== "undefined" && createPortal(
                <div
                    ref={actionsMenuRef}
                    style={actionsMenuStyle}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
                    role="menu"
                >
                    <Link
                        href={`/admin/cars/${car.id}/edit`}
                        onClick={() => setActionsOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#d91c1c]"
                        title={dict.carRow.editTitle}
                        role="menuitem"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Edit size={15} className="shrink-0" />
                        </span>
                        <span>{dict.carRow.editTitle}</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                        type="button"
                        onClick={() => {
                            setActionsOpen(false);
                            setShowDeleteConfirm(true);
                        }}
                        disabled={isUpdating || autoScoutManaged}
                        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title={dict.carRow.deleteTitle}
                        role="menuitem"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                            {isUpdating ? <Loader2 size={15} className="shrink-0 animate-spin" /> : <Trash2 size={15} className="shrink-0" />}
                        </span>
                        <span>{dict.carRow.deleteTitle}</span>
                    </button>
                </div>,
                document.body,
            )}

            {/* Delete Confirmation Modal — rendered in a portal to avoid table clipping */}
            {showDeleteConfirm && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(2,2,20,0.58)", backdropFilter: "blur(6px)" }}
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !isUpdating) {
                            setShowDeleteConfirm(false);
                        }
                    }}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#020214] shadow-2xl shadow-black/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d91c1c]/12 text-[#d91c1c]">
                                    <Trash2 size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d91c1c]">
                                        {dict.common.delete}
                                    </p>
                                    <h3 className="text-lg font-black text-white">{dict.carRow.deleteHeading}</h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isUpdating}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60"
                                aria-label={dict.common.close}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <div className="mb-4 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
                                <div className="aspect-[16/9] w-full bg-[#0b0b1d]">
                                    {thumbnailUrl ? (
                                        <Image
                                            src={thumbnailUrl}
                                            alt={`${car.brand} ${car.model}`}
                                            width={120}
                                            height={85}
                                            unoptimized
                                            onError={() => {
                                                if (primaryImage) setThumbFailedFor(primaryImage);
                                            }}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-white/8 px-4 py-3">
                                    <p className="text-sm font-bold text-white">{car.brand} {car.model}</p>
                                    <p className="mt-1 text-xs font-medium text-slate-400">
                                        {car.year} • {car.mileage.toLocaleString("nl-BE")} km
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300">
                                {tpl(dict.carRow.deleteBody, { name: `${car.brand} ${car.model}` })}
                            </div>

                            <div className="mt-5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isUpdating}
                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-60"
                                >
                                    {dict.common.cancel}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isUpdating}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d91c1c] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b91515] disabled:opacity-60"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 size={15} className="animate-spin" />
                                            {dict.common.loading}
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={15} />
                                            {dict.common.delete}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </tr>
    );
}
