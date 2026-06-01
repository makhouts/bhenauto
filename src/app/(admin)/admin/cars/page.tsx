import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import CarsTableClient from "@/components/admin/CarsTableClient";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.carsPage.title} | bhenauto Admin`,
    };
}

export default async function AdminCarsPage() {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const cars = await prisma.car.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            images: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                take: 1,
            }
        }
    });

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.cars}
                title={dict.carsPage.title}
                description={dict.carsPage.description}
                actions={(
                    <Link
                        href="/admin/cars/new"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d91c1c] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(217,28,28,0.18)] transition-colors hover:bg-[#b91515]"
                    >
                        <Plus size={18} />
                        {dict.carsPage.add}
                    </Link>
                )}
            />

            <AdminSurface padded={false}>
                <CarsTableClient cars={cars} />
            </AdminSurface>
        </AdminPage>
    );
}
