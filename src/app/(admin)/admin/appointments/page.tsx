import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import AppointmentsClient from "@/components/admin/AppointmentsClient";
import { getBlocks } from "@/app/actions/admin-appointments";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";
import { getWorkshopAccessPath } from "@/lib/workshop-access";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.appointmentsPage.title} | bhenauto Admin`,
    };
}

export default async function AppointmentsAdminPage() {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const workshopAccessPath = getWorkshopAccessPath();
    const [appointments, blocks, inventoryCars] = await Promise.all([
        prisma.appointment.findMany({
            orderBy: [
                { status: "asc" },
                { date: "asc" },
                { timeSlot: "asc" },
            ],
        }),
        getBlocks(),
        prisma.car.findMany({
            where: { sold: false },
            orderBy: [
                { reserved: "asc" },
                { year: "desc" },
                { brand: "asc" },
                { model: "asc" },
            ],
            select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                referenceNumber: true,
                reserved: true,
                images: {
                    orderBy: [
                        { sortOrder: "asc" },
                        { createdAt: "asc" },
                    ],
                    take: 1,
                    select: { url: true },
                },
            },
        }),
    ]);

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.appointments}
                title={dict.appointmentsPage.title}
                description={dict.appointmentsPage.description}
                actions={(
                    <Link
                        href={workshopAccessPath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-slate-800"
                    >
                        {dict.workshopBoard.openScreen}
                    </Link>
                )}
            />

            <AdminSurface padded={false}>
                <AppointmentsClient appointments={appointments} blocks={blocks} inventoryCars={inventoryCars} />
            </AdminSurface>
        </AdminPage>
    );
}
