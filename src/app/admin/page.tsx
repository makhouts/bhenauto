import prisma from "@/lib/prisma";
import { Car, CheckCircle, Star, MessageSquare } from "lucide-react";

export const metadata = {
    title: "Admin Dashboard | bhenauto",
};

export default async function AdminDashboardPage() {
    const [totalCars, soldCars, featuredCars, totalInquiries] = await Promise.all([
        prisma.car.count(),
        prisma.car.count({ where: { sold: true } }),
        prisma.car.count({ where: { featured: true } }),
        prisma.contact.count(),
    ]);

    const stats = [
        {
            name: "Total Fleet",
            value: totalCars,
            icon: Car,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
        },
        {
            name: "Sold Vehicles",
            value: soldCars,
            icon: CheckCircle,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            borderColor: "border-green-500/20",
        },
        {
            name: "Featured Cars",
            value: featuredCars,
            icon: Star,
            color: "text-[#d91c1c]",
            bgColor: "bg-[#d91c1c]/10",
            borderColor: "border-[#d91c1c]/20",
        },
        {
            name: "Total Inquiries",
            value: totalInquiries,
            icon: MessageSquare,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
        },
    ];

    return (
        <div>
            <h1 className="text-3xl font-headings text-slate-900 mb-8 font-black">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className={`bg-white border ${stat.borderColor} p-6 rounded-2xl shadow-sm flex items-center hover:shadow-md transition-shadow`}
                    >
                        <div className={`w-14 h-14 rounded-full ${stat.bgColor} flex items-center justify-center mr-4 shrink-0`}>
                            <stat.icon className={stat.color} size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">{stat.name}</p>
                            <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                <h2 className="text-xl font-headings text-slate-900 mb-4 font-bold">Welcome to bhenauto Admin Portal</h2>
                <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">
                    Use the side navigation to manage your vehicle inventory, update car details, track incoming customer inquiries, and curate the featured vehicles displayed on the home page.
                </p>
            </div>
        </div>
    );
}
