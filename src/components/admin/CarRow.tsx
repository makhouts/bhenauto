"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import Link from "next/link";
import Image from "next/image";
import { toggleFeatured, deleteCar, updateCarStatus } from "@/app/actions/cars";
import { Star, Edit, Trash2, Loader2, AlertTriangle, ChevronDown, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image-url";

type Status = "beschikbaar" | "gereserveerd" | "verkocht";

// Derive the 3-state status from the car's boolean fields
function getStatus(car: { sold: boolean; reserved: boolean }): Status {
    if (car.sold) return "verkocht";
    if (car.reserved) return "gereserveerd";
    return "beschikbaar";
}

const STATUS_CONFIG = {
    beschikbaar: {
        label: "Beschikbaar",
        icon: CheckCircle,
        className: "border-green-500 text-green-600 bg-green-50",
        dotClass: "bg-green-500",
    },
    gereserveerd: {
        label: "Gereserveerd",
        icon: Clock,
        className: "border-amber-500 text-amber-600 bg-amber-50",
        dotClass: "bg-amber-500",
    },
    verkocht: {
        label: "Verkocht",
        icon: XCircle,
        className: "border-red-500 text-red-600 bg-red-50",
        dotClass: "bg-red-500",
    },
} as const;

export default function CarRow({ car }: { car: any }) {
    const initialStatus = getStatus(car);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // Optimistic status — updates immediately on user interaction
    const [optimisticStatus, setOptimisticStatus] = useState<Status>(initialStatus);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync if server re-renders with fresh props
    useEffect(() => {
        setOptimisticStatus(getStatus(car));
    }, [car.sold, car.reserved]);

    // Close dropdown on outside click
    useOutsideClick(dropdownRef, () => setDropdownOpen(false), dropdownOpen);

    const handleToggleFeatured = async () => {
        setIsUpdating(true);
        const result = await toggleFeatured(car.id, !car.featured);
        if (result?.error) {
            toast.error("Kon zichtbaarheid niet bijwerken.");
        } else {
            toast.success(car.featured ? "Voertuig ingesteld als standaard." : "Voertuig uitgelicht!");
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
            toast.error("Status bijwerken mislukt.");
        } else {
            const labels: Record<Status, string> = { beschikbaar: "Beschikbaar", gereserveerd: "Gereserveerd", verkocht: "Verkocht" };
            toast.success(`Status gewijzigd naar ${labels[newStatus]}.`);
        }
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        setIsUpdating(true);
        const result = await deleteCar(car.id);
        if (result?.error) {
            toast.error("Verwijderen mislukt. Probeer opnieuw.");
            setIsUpdating(false);
            setShowDeleteConfirm(false);
        } else {
            toast.success(`${car.brand} ${car.model} verwijderd.`);
        }
    };

    const statusConfig = STATUS_CONFIG[optimisticStatus];

    // Format price in Euros
    const formattedPrice = new Intl.NumberFormat("nl-BE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(car.price);

    const thumbnailUrl = car.images?.[0]?.url ? getImageUrl(car.images[0].url) : null;

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
                    {car.featured ? "Uitgelicht" : "Standaard"}
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
                        {statusConfig.label}
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
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
                                        {config.label}
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
                        title="Voertuig Bewerken"
                    >
                        <Edit size={15} />
                    </Link>

                    <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        disabled={isUpdating}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                        title="Voertuig Verwijderen"
                    >
                        {isUpdating ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                </div>

            </td>

            {/* Delete Confirmation Modal — rendered in a portal to avoid table clipping */}
            {showDeleteConfirm && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* Dialog */}
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-red-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-3 mb-5">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 mb-1">Voertuig verwijderen?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    <span className="font-semibold text-slate-700">{car.brand} {car.model}</span> wordt permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm text-slate-600 font-bold hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Annuleren
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                            >
                                {isUpdating && <Loader2 size={14} className="animate-spin" />}
                                Verwijderen
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </tr>
    );
}
