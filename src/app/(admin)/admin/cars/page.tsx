import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import CarsTableClient from "@/components/admin/CarsTableClient";
import AutoScoutImportButton from "@/components/admin/AutoScoutImportButton";
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
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
                            {dict.carsPage.autoscoutHint}
                        </div>
                        <AutoScoutImportButton />
                    </div>
                )}
            />

            <AdminSurface padded={false}>
                <CarsTableClient cars={cars} />
            </AdminSurface>
        </AdminPage>
    );
}
