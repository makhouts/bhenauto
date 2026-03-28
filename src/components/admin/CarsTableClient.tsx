"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import CarRow from "@/components/admin/CarRow";

export default function CarsTableClient({ cars }: { cars: any[] }) {
    const [query, setQuery] = useState("");

    const statusPriority = (car: any) => {
        if (car.sold) return 2;       // verkocht — last
        if (car.reserved) return 1;   // gereserveerd — middle
        return 0;                     // beschikbaar — first
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
        .sort((a, b) => statusPriority(a) - statusPriority(b));

    return (
        <>
            {/* Search bar */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Zoek op merk, model, jaar, kleur..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#d91c1c]/20 focus:border-[#d91c1c] transition-all placeholder:text-slate-400"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                            <th className="px-5 py-4 font-semibold">Voertuig</th>
                            <th className="px-5 py-4 font-semibold">Prijs</th>
                            <th className="px-5 py-4 font-semibold">Zichtbaarheid</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                            <th className="px-5 py-4 font-semibold text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                    {query ? (
                                        <p>Geen voertuigen gevonden voor <strong>"{query}"</strong>.</p>
                                    ) : (
                                        <p>Uw voorraad is momenteel leeg.</p>
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
                    {filtered.length} van {cars.length} voertuigen gevonden
                </p>
            )}
        </>
    );
}
