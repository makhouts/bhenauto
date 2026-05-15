import { isBefore, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { Prisma } from "@/generated/prisma/client";
import { APPOINTMENT_CONFIG, generateDaySlots } from "@/lib/appointmentConfig";

const TZ = APPOINTMENT_CONFIG.timezone;

export type AppointmentConflict =
  | "invalidDate"
  | "invalidSlot"
  | "invalidDuration"
  | "pastDate"
  | "notWorkingDay"
  | "blocked"
  | "unavailable";

export function parseAppointmentDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);

  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    return null;
  }

  return fromZonedTime(localDate, TZ);
}

export function getAppointmentDayRange(utcDate: Date): { dayStart: Date; dayEnd: Date } {
  return {
    dayStart: utcDate,
    dayEnd: new Date(utcDate.getTime() + 24 * 60 * 60 * 1000),
  };
}

export function getCoveredSlots(timeSlot: string, durationHours = 1): string[] | null {
  const duration = Math.trunc(durationHours);
  if (duration < 1 || duration > 8) return null;

  const allSlots = generateDaySlots();
  const startIndex = allSlots.indexOf(timeSlot);
  if (startIndex < 0) return null;

  const covered = allSlots.slice(startIndex, startIndex + duration);
  return covered.length === duration ? covered : null;
}

export function validateAppointmentDate(utcDate: Date): AppointmentConflict | null {
  const zonedNow = toZonedTime(new Date(), TZ);
  const todayLocal = startOfDay(zonedNow);
  const tomorrowLocal = new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000);
  const localSelectedDay = toZonedTime(utcDate, TZ);

  if (isBefore(startOfDay(localSelectedDay), tomorrowLocal)) return "pastDate";

  const dayOfWeek = localSelectedDay.getDay();
  if (!(APPOINTMENT_CONFIG.workingDays as number[]).includes(dayOfWeek)) return "notWorkingDay";

  return null;
}

export async function getAppointmentConflict(
  tx: Prisma.TransactionClient,
  input: {
    date: Date;
    timeSlot: string;
    durationHours?: number;
    excludeAppointmentId?: string;
  }
): Promise<AppointmentConflict | null> {
  const coveredSlots = getCoveredSlots(input.timeSlot, input.durationHours ?? 1);
  if (!coveredSlots) return "invalidSlot";

  const { dayStart, dayEnd } = getAppointmentDayRange(input.date);

  const blockedEntry = await tx.blockedDate.findFirst({
    where: {
      date: { gte: dayStart, lt: dayEnd },
      OR: [{ timeSlot: null }, { timeSlot: { in: coveredSlots } }],
    },
    select: { id: true },
  });
  if (blockedEntry) return "blocked";

  const existing = await tx.appointment.findMany({
    where: {
      ...(input.excludeAppointmentId ? { id: { not: input.excludeAppointmentId } } : {}),
      date: { gte: dayStart, lt: dayEnd },
      status: { in: ["pending", "confirmed"] },
    },
    select: { timeSlot: true, durationHours: true },
  });

  const occupancy = new Map<string, number>();
  for (const apt of existing) {
    const aptSlots = getCoveredSlots(apt.timeSlot, apt.durationHours ?? 1) ?? [apt.timeSlot];
    for (const slot of aptSlots) {
      if (!coveredSlots.includes(slot)) continue;
      occupancy.set(slot, (occupancy.get(slot) ?? 0) + 1);
    }
  }

  return coveredSlots.some((slot) => (occupancy.get(slot) ?? 0) >= APPOINTMENT_CONFIG.maxBookingsPerSlot)
    ? "unavailable"
    : null;
}
