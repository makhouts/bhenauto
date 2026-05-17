import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import AppointmentsClient from "@/components/admin/AppointmentsClient";
import { getBlocks } from "@/app/actions/admin-appointments";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminDictionary, tpl } from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";

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

    const pendingCount = appointments.filter((a) => a.status === "pending").length;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">{dict.appointmentsPage.title}</h1>
                    <p className="text-slate-500 font-medium text-sm">{dict.appointmentsPage.description}</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-amber-700 font-bold text-sm">
                            {tpl(pendingCount === 1 ? dict.appointmentsPage.pendingSingular : dict.appointmentsPage.pendingPlural, { count: pendingCount })}
                        </span>
                    </div>
                )}
            </div>

            <AppointmentsClient appointments={appointments} blocks={blocks} />
        </div>
    );
}
