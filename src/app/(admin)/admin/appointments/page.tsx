import prisma from "@/lib/prisma";
import { withCardImages } from "@/lib/cars/card-data";
import type { Metadata } from "next";
import Link from "next/link";
import AppointmentsClient from "@/components/admin/AppointmentsClient";
import { getAdminAppointmentData } from "@/app/actions/admin-appointment-data";
import { calendarWeek } from "@/lib/appointment-window";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
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
    const initialDay = formatInTimeZone(new Date(), APPOINTMENT_CONFIG.timezone, "yyyy-MM-dd");
    const initialRequest = { ranges: [calendarWeek(parseISO(initialDay))], pendingPage: 1 };
    const [initialData, inventoryCars] = await Promise.all([
        getAdminAppointmentData(initialRequest),
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

            },
        }).then((cars) => withCardImages(cars, 1)),
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
                <AppointmentsClient initialData={initialData} initialDay={initialDay} initialRequest={initialRequest} inventoryCars={inventoryCars} />
            </AdminSurface>
        </AdminPage>
    );
}
