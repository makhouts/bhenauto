import { addWeeks, startOfWeek, endOfWeek } from "date-fns";
import prisma from "@/lib/prisma";
import { withCardImages } from "@/lib/cars/card-data";

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
                internalCarId: true,
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

    const carIds = [...new Set(appointments.flatMap((appointment) =>
        appointment.internalCarId ? [appointment.internalCarId] : []))];
    const cars = await withCardImages(carIds.map((id) => ({ id })), 1);
    const imagesByCar = new Map(cars.map((car) => [car.id, car.images]));

    return {
        appointments: appointments.map(({ internalCarId, ...appointment }) => ({
            ...appointment,
            internalCar: internalCarId ? { images: imagesByCar.get(internalCarId) ?? [] } : null,
        })),
        blocks,
        nowIso: now.toISOString(),
    };
}
