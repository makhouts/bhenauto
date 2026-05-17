"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Link from "next/link";
import Image from "next/image";
import { toggleFeatured, deleteCar, updateCarStatus } from "@/app/actions/cars";
import { Star, Edit, Trash2, Loader2, ChevronDown, CheckCircle, Clock, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl, getThumbnailImageUrl } from "@/lib/image-url";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { tpl } from "@/lib/admin-i18n";

type Status = "beschikbaar" | "gereserveerd" | "verkocht";

export type AdminCarRow = {
    id: string;
    slug: string;
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

export default function CarRow({ car }: { car: AdminCarRow }) {
    const { locale, dict } = useAdminI18n();
    const initialStatus = getStatus(car);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [thumbFailedFor, setThumbFailedFor] = useState<string | null>(null);
    // Optimistic status — updates immediately on user interaction
    const [optimisticStatus, setOptimisticStatus] = useState<Status>(initialStatus);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useOutsideClick(dropdownRef, () => setDropdownOpen(false), dropdownOpen);

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

    const handleToggleFeatured = async () => {
        setIsUpdating(true);
        const result = await toggleFeatured(car.id, !car.featured);
        if (result?.error) {
            toast.error(dict.carRow.featured.updateError);
        } else {
            toast.success(car.featured ? dict.carRow.featured.deactivated : dict.carRow.featured.activated);
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
            toast.error(dict.carRow.statusUpdateError);
        } else {
            const labels: Record<Status, string> = {
                beschikbaar: dict.carRow.statuses.available,
                gereserveerd: dict.carRow.statuses.reserved,
                verkocht: dict.carRow.statuses.sold,
            };
            toast.success(tpl(dict.carRow.statusUpdated, { status: labels[newStatus] }));
        }
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        setIsUpdating(true);
        const result = await deleteCar(car.id);
        if (result?.error) {
            toast.error(dict.carRow.deleteError);
            setIsUpdating(false);
            setShowDeleteConfirm(false);
        } else {
            toast.success(tpl(dict.carRow.deleted, { name: `${car.brand} ${car.model}` }));
        }
    };

    const statusConfig = STATUS_CONFIG[optimisticStatus];
    const statusLabels: Record<Status, string> = {
        beschikbaar: dict.carRow.statuses.available,
        gereserveerd: dict.carRow.statuses.reserved,
        verkocht: dict.carRow.statuses.sold,
    };

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

    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors relative">
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
                    className={`flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors border ${car.featured
                        ? "border-[#d91c1c] text-[#d91c1c] bg-[#d91c1c]/10 hover:bg-[#d91c1c]/20"
                        : "border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400"
                        } disabled:opacity-50`}
                >
                    <Star size={13} className="mr-1.5" fill={car.featured ? "currentColor" : "none"} />
                    {car.featured ? dict.carRow.featured.active : dict.carRow.featured.inactive}
                </button>
            </td>

            {/* Status Dropdown */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={isUpdating}
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

            {/* Actions */}
            <td className="px-5 py-3 whitespace-nowrap text-right text-sm">
                <div className="flex items-center justify-end space-x-2">
                    <Link
                        href={`/admin/cars/${car.id}/edit`}
                        className="text-slate-400 hover:text-[#d91c1c] transition-colors p-2 rounded-lg border border-transparent hover:border-[#d91c1c]/30 hover:bg-[#d91c1c]/10"
                        title={dict.carRow.editTitle}
                    >
                        <Edit size={15} />
                    </Link>

                    <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        disabled={isUpdating}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                        title={dict.carRow.deleteTitle}
                    >
                        {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                </div>

            </td>

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
