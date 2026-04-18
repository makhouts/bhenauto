import prisma from "@/lib/prisma";
import { CalendarCheck } from "lucide-react";
import AppointmentsClient from "@/components/admin/AppointmentsClient";
import { getBlocks } from "@/app/actions/admin-appointments";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = {
    title: "Afspraken | bhenauto Admin",
};

export default async function AppointmentsAdminPage() {
    await requireAdmin();
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
                    <h1 className="text-3xl font-headings text-slate-900 mb-2 font-black">Afspraken</h1>
                    <p className="text-slate-500 font-medium text-sm">Beheer en bevestig inkomende afspraakverzoeken voor de Carrosserie dienst.</p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-amber-700 font-bold text-sm">
                            {pendingCount} openstaande {pendingCount === 1 ? "aanvraag" : "aanvragen"}
                        </span>
                    </div>
                )}
            </div>

            <AppointmentsClient appointments={appointments} blocks={blocks} />
        </div>
    );
}
