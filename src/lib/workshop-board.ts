import { addWeeks, startOfWeek, endOfWeek } from "date-fns";
import prisma from "@/lib/prisma";

export async function getWorkshopBoardData() {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(addWeeks(now, 8), { weekStartsOn: 1 });

    const [appointments, blocks] = await Promise.all([
        prisma.appointment.findMany({
            where: {
                date: { gte: weekStart, lte: weekEnd },
                status: "confirmed",
            },
            orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
            select: {
                id: true,
                date: true,
                timeSlot: true,
                kind: true,
                name: true,
                service: true,
                notes: true,
                status: true,
                durationHours: true,
                internalCarLabel: true,
                internalKeyNumber: true,
                internalCar: {
                    select: {
                        images: {
                            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
                            take: 1,
                            select: { url: true },
                        },
                    },
                },
            },
        }),
        prisma.blockedDate.findMany({
            where: { date: { gte: weekStart, lte: weekEnd } },
            orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
            select: {
                id: true,
                date: true,
                timeSlot: true,
                reason: true,
            },
        }),
    ]);

    return {
        appointments,
        blocks,
        nowIso: now.toISOString(),
    };
}
