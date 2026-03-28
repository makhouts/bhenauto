import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import CarsTableClient from "@/components/admin/CarsTableClient";

export const metadata = {
    title: "Voertuigvoorraad | bhenauto Admin",
};

export default async function AdminCarsPage() {
    const cars = await prisma.car.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            images: {
                take: 1
            }
        }
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">Voertuigvoorraad</h1>
                    <p className="text-slate-500 font-medium text-sm">Beheer uw premium collectie, werk details bij en wijzig status.</p>
                </div>
                <Link
                    href="/admin/cars/new"
                    className="flex items-center bg-[#d91c1c] hover:bg-[#b91515] text-white px-6 py-3 font-bold uppercase tracking-widest text-sm transition-all shadow-md shadow-[#d91c1c]/20 rounded-lg shrink-0"
                >
                    <Plus size={18} className="mr-2" />
                    Voertuig Toevoegen
                </Link>
            </div>

            <CarsTableClient cars={cars} />
        </div>
    );
}

