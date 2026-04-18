"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { APPOINTMENT_CONFIG, generateDaySlots } from "@/lib/appointmentConfig";
import { startOfDay, isBefore, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Simple in-memory rate limiter (per-process; for production use Redis/Upstash)
const bookingRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 booking attempts per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = bookingRateLimit.get(ip)?.filter((t) => now - t < RATE_LIMIT_WINDOW_MS) ?? [];
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  bookingRateLimit.set(ip, timestamps);
  return false;
}

const TZ = APPOINTMENT_CONFIG.timezone;

/** Convert a local date (in Brussels time) to a UTC Date at midnight Brussels. */
function toBrusselsUtcMidnight(localDate: Date): Date {
  const zoned = toZonedTime(localDate, TZ);
  const midnight = new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate());
  return fromZonedTime(midnight, TZ);
}

/** Return "YYYY-MM-DD" string in Brussels timezone for a UTC Date */
function toLocalDateString(utcDate: Date): string {
  return format(toZonedTime(utcDate, TZ), "yyyy-MM-dd");
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get available dates for a given month
// ─────────────────────────────────────────────────────────────────────────────

export async function getAvailableDates(
  year: number,
  month: number // 0-indexed (JS convention)
): Promise<string[]> {
  const now = toZonedTime(new Date(), TZ);
  const todayLocal = startOfDay(now);
  // Earliest bookable date is tomorrow — today is never available
  const tomorrowLocal = new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const [blockedDates, appointments] = await Promise.all([
    prisma.blockedDate.findMany({
      where: {
        date: { gte: fromZonedTime(firstDay, TZ), lte: fromZonedTime(lastDay, TZ) },
      },
      select: { date: true, timeSlot: true },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: fromZonedTime(firstDay, TZ), lte: fromZonedTime(lastDay, TZ) },
        status: { in: ["pending", "confirmed"] },
      },
      select: { date: true, timeSlot: true, durationHours: true },
    }),
  ]);

  const allSlots = generateDaySlots();
  const totalSlots = allSlots.length;

  // Build per-day sets: fully-blocked days and per-slot blocks
  const fullyBlockedDays = new Set<string>();
  const slotBlockedMap: Record<string, Set<string>> = {}; // dateStr → Set of blocked timeSlots

  for (const b of blockedDates) {
    const ds = toLocalDateString(b.date);
    if (b.timeSlot === null) {
      fullyBlockedDays.add(ds);
    } else {
      if (!slotBlockedMap[ds]) slotBlockedMap[ds] = new Set();
      slotBlockedMap[ds].add(b.timeSlot);
    }
  }

  // Count occupied slots per day (including follow-on slots from multi-hour appointments)
  const occupiedSlotsPerDay: Record<string, Set<string>> = {};
  for (const apt of appointments) {
    const key = toLocalDateString(apt.date);
    if (!occupiedSlotsPerDay[key]) occupiedSlotsPerDay[key] = new Set();
    occupiedSlotsPerDay[key].add(apt.timeSlot);
    const dur = apt.durationHours ?? 1;
    if (dur > 1) {
      const idx = allSlots.indexOf(apt.timeSlot);
      for (let i = 1; i < dur; i++) {
        if (allSlots[idx + i]) occupiedSlotsPerDay[key].add(allSlots[idx + i]);
      }
    }
  }

  const available: string[] = [];

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const localD = toZonedTime(fromZonedTime(d, TZ), TZ);
    const dayOfWeek = localD.getDay();

    if (!(APPOINTMENT_CONFIG.workingDays as number[]).includes(dayOfWeek)) continue;
    // Exclude today and all past days — earliest slot is tomorrow
    if (isBefore(startOfDay(localD), tomorrowLocal)) continue;

    const dateStr = format(localD, "yyyy-MM-dd");
    if (fullyBlockedDays.has(dateStr)) continue;

    // Check if all non-blocked slots are fully booked
    const occupiedCount = occupiedSlotsPerDay[dateStr]?.size ?? 0;
    const blockedSlotsCount = slotBlockedMap[dateStr]?.size ?? 0;
    const availableSlots = totalSlots - blockedSlotsCount;
    if (occupiedCount >= availableSlots * APPOINTMENT_CONFIG.maxBookingsPerSlot) continue;

    available.push(dateStr);
  }

  return available;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Get available time slots for a specific date
// ─────────────────────────────────────────────────────────────────────────────

export async function getAvailableSlots(dateStr: string): Promise<string[]> {
  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  const utcDate = fromZonedTime(localDate, TZ);

  const dayStart = utcDate;
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const zonedNow = toZonedTime(new Date(), TZ);
  const todayLocal = startOfDay(zonedNow);
  const tomorrowLocal = new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000);
  const localSelectedDay = toZonedTime(utcDate, TZ);

  // Reject today and past — bookings only from tomorrow onwards
  if (isBefore(startOfDay(localSelectedDay), tomorrowLocal)) return [];

  const dayOfWeek = localSelectedDay.getDay();
  if (!(APPOINTMENT_CONFIG.workingDays as number[]).includes(dayOfWeek)) return [];

  const [blockedEntries, existingBookings] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { date: { gte: dayStart, lt: dayEnd } },
      select: { timeSlot: true },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, status: { in: ["pending", "confirmed"] } },
      select: { timeSlot: true, durationHours: true },
    }),
  ]);

  // Check for full-day block
  const hasDayBlock = blockedEntries.some((b) => b.timeSlot === null);
  if (hasDayBlock) return [];

  const blockedSlots = new Set(blockedEntries.map((b) => b.timeSlot!));

  // Build set of all occupied slots (including follow-on slots from multi-hour appointments)
  const allSlots = generateDaySlots();
  const occupiedSlots = new Set<string>();
  for (const b of existingBookings) {
    occupiedSlots.add(b.timeSlot);
    const dur = b.durationHours ?? 1;
    if (dur > 1) {
      const idx = allSlots.indexOf(b.timeSlot);
      for (let i = 1; i < dur; i++) {
        if (allSlots[idx + i]) occupiedSlots.add(allSlots[idx + i]);
      }
    }
  }

  return allSlots.filter((slot) => {
    if (blockedSlots.has(slot)) return false;
    if (occupiedSlots.has(slot)) return false;
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: Book an appointment (atomic — prevents double booking)
// ─────────────────────────────────────────────────────────────────────────────

type BookingInput = {
  dateStr: string;
  timeSlot: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  notes?: string;
};

type BookingResult = { success: true; id: string } | { error: string };

export async function bookAppointment(input: BookingInput): Promise<BookingResult> {
  const { dateStr, timeSlot, name, email, phone, service, notes } = input;

  // Rate limiting
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return { error: "Te veel verzoeken. Probeer het over een minuut opnieuw." };
  }

  if (!dateStr || !timeSlot || !name || !email || !phone || !service) {
    return { error: "Alle verplichte velden moeten worden ingevuld." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Ongeldig e-mailadres." };
  }

  if (!(APPOINTMENT_CONFIG.services as readonly string[]).includes(service)) {
    return { error: "Ongeldige service geselecteerd." };
  }

  const allSlots = generateDaySlots();
  if (!allSlots.includes(timeSlot)) {
    return { error: "Ongeldig tijdslot." };
  }

  const [year, month, day] = dateStr.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  const utcDate = fromZonedTime(localDate, TZ);

  const zonedNow = toZonedTime(new Date(), TZ);
  const todayLocal = startOfDay(zonedNow);
  const tomorrowLocal = new Date(todayLocal.getTime() + 24 * 60 * 60 * 1000);
  const localSelectedDay = toZonedTime(utcDate, TZ);

  // Reject today and past — bookings only from tomorrow onwards
  if (isBefore(startOfDay(localSelectedDay), tomorrowLocal)) {
    return { error: "Afspraken kunnen pas vanaf morgen worden gepland." };
  }

  const dayOfWeek = localSelectedDay.getDay();
  if (!(APPOINTMENT_CONFIG.workingDays as number[]).includes(dayOfWeek)) {
    return { error: "Geselecteerde dag is geen werkdag." };
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const dayStart = utcDate;
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Re-check for full-day or slot-level block
      const blockedEntry = await tx.blockedDate.findFirst({
        where: {
          date: { gte: dayStart, lt: dayEnd },
          OR: [{ timeSlot: null }, { timeSlot }],
        },
      });
      if (blockedEntry) {
        throw new Error("Dit tijdslot is niet beschikbaar.");
      }

      // Check if slot is directly booked
      const slotCount = await tx.appointment.count({
        where: {
          date: { gte: dayStart, lt: dayEnd },
          timeSlot,
          status: { in: ["pending", "confirmed"] },
        },
      });

      if (slotCount >= APPOINTMENT_CONFIG.maxBookingsPerSlot) {
        throw new Error("Dit tijdslot is zojuist geboekt door iemand anders. Kies een ander tijdslot.");
      }

      // Check if slot is covered by a multi-hour appointment starting earlier
      const allSlots = generateDaySlots();
      const slotIdx = allSlots.indexOf(timeSlot);
      const overlapping = await tx.appointment.findMany({
        where: {
          date: { gte: dayStart, lt: dayEnd },
          status: { in: ["pending", "confirmed"] },
          durationHours: { gt: 1 },
        },
        select: { timeSlot: true, durationHours: true },
      });
      for (const apt of overlapping) {
        const aptStart = allSlots.indexOf(apt.timeSlot);
        const aptEnd = aptStart + (apt.durationHours ?? 1);
        if (slotIdx >= aptStart && slotIdx < aptEnd) {
          throw new Error("Dit tijdslot is bezet door een lopende afspraak. Kies een ander tijdslot.");
        }
      }

      return tx.appointment.create({
        data: {
          date: utcDate, timeSlot,
          name: name.trim(), email: email.trim().toLowerCase(),
          phone: phone.trim(), service,
          notes: notes?.trim() || null, status: "pending",
        },
      });
    });

    revalidatePath("/admin/appointments");
    return { success: true, id: appointment.id };
  } catch (err: unknown) {
    if (err instanceof Error) return { error: err.message };
    return { error: "Er is een onverwachte fout opgetreden. Probeer opnieuw." };
  }
}
