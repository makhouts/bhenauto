import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import AppointmentsClient from "@/components/admin/AppointmentsClient";
import { getBlocks } from "@/app/actions/admin-appointments";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminPage, AdminPageHeader, AdminSurface } from "@/components/admin/admin-ui";

export async function generateMetadata(): Promise<Metadata> {
    const dict = getAdminDictionary(await getAdminLocale());
    return {
        title: `${dict.appointmentsPage.title} | bhenauto Admin`,
    };
}

export default async function AppointmentsAdminPage() {
    await requireAdmin();
    const dict = getAdminDictionary(await getAdminLocale());
    const [appointments, blocks] = await Promise.all([
        prisma.appointment.findMany({
            orderBy: [
                { status: "asc" },
                { date: "asc" },
                { timeSlot: "asc" },
            ],
        }),
        getBlocks(),
    ]);

    return (
        <AdminPage>
            <AdminPageHeader
                eyebrow={dict.layout.nav.appointments}
                title={dict.appointmentsPage.title}
                description={dict.appointmentsPage.description}
            />

            <AdminSurface padded={false}>
                <AppointmentsClient appointments={appointments} blocks={blocks} />
            </AdminSurface>
        </AdminPage>
    );
}
