import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import CarRow from "@/components/admin/CarRow";

export const metadata = {
    title: "Manage Fleet | bhenauto Admin",
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
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">Vehicle Inventory</h1>
                    <p className="text-slate-500 font-medium text-sm">Manage your premium collection, update details, and modify status.</p>
                </div>
                <Link
                    href="/admin/cars/new"
                    className="flex items-center bg-[#d91c1c] hover:bg-[#b91515] text-white px-6 py-3 font-bold uppercase tracking-widest text-sm transition-all shadow-md shadow-[#d91c1c]/20 rounded-lg shrink-0"
                >
                    <Plus size={18} className="mr-2" />
                    Add Vehicle
                </Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                            <th className="px-6 py-4 font-semibold">Vehicle</th>
                            <th className="px-6 py-4 font-semibold">Price</th>
                            <th className="px-6 py-4 font-semibold">Visibility</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cars.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                                    <p className="mb-2">Your inventory is currently empty.</p>
                                    <Link href="/admin/cars/new" className="text-[#d91c1c] font-bold hover:underline">Add your first vehicle</Link>
                                </td>
                            </tr>
                        ) : (
                            cars.map((car: any) => (
                                <CarRow key={car.id} car={car} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
