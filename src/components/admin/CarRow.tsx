"use client";

import { useState } from "react";
import Link from "next/link";
import { type Car } from "@prisma/client";
import { toggleFeatured, toggleSold, deleteCar } from "@/app/actions/cars";
import { Star, CheckCircle, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";

export default function CarRow({ car }: { car: Car }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleToggleFeatured = async () => {
        setIsUpdating(true);
        await toggleFeatured(car.id, !car.featured);
        setIsUpdating(false);
    };

    const handleToggleSold = async () => {
        setIsUpdating(true);
        await toggleSold(car.id, !car.sold);
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        setIsUpdating(true);
        await deleteCar(car.id);
        // Row will unmount via Next.js revalidatePath
    };

    return (
        <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors relative">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{car.brand} {car.model}</span>
                    <span className="text-xs text-slate-500 font-medium">{car.year} • {car.mileage.toLocaleString()} mi</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">
                ${car.price.toLocaleString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={handleToggleFeatured}
                    disabled={isUpdating}
                    className={`flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors border ${car.featured
                        ? "border-[#d91c1c] text-[#d91c1c] bg-[#d91c1c]/10 hover:bg-[#d91c1c]/20"
                        : "border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400"
                        } disabled:opacity-50`}
                >
                    <Star size={14} className="mr-1.5" />
                    {car.featured ? "Featured" : "Regular"}
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={handleToggleSold}
                    disabled={isUpdating}
                    className={`flex items-center text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors border ${car.sold
                        ? "border-red-500 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                        : "border-green-500 text-green-500 bg-green-500/10 hover:bg-green-500/20"
                        } disabled:opacity-50`}
                >
                    <CheckCircle size={14} className="mr-1.5" />
                    {car.sold ? "Sold" : "Available"}
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="flex items-center justify-end space-x-3">
                    <Link
                        href={`/admin/cars/${car.id}/edit`}
                        className="text-slate-400 hover:text-[#d91c1c] transition-colors p-2 rounded-lg border border-transparent hover:border-[#d91c1c]/30 hover:bg-[#d91c1c]/10"
                        title="Edit Vehicle"
                    >
                        <Edit size={16} />
                    </Link>

                    <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        disabled={isUpdating}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                        title="Delete Vehicle"
                    >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                </div>

                {/* Delete Confirmation Popover */}
                {showDeleteConfirm && (
                    <div className="absolute right-8 top-12 z-10 w-64 bg-white border border-red-200 p-4 rounded-xl shadow-xl text-left animate-fade-in">
                        <div className="flex items-start text-red-600 mb-3">
                            <AlertTriangle size={20} className="mr-2 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">Are you sure you want to delete this vehicle permanently?</p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-xs text-slate-500 font-bold hover:text-slate-900 transition-colors uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold transition-colors uppercase tracking-wider rounded-lg shadow-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
}
