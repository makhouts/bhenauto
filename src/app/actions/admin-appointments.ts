"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { fromZonedTime } from "date-fns-tz";
import { generateDaySlots, APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";

const TZ = APPOINTMENT_CONFIG.timezone;

export async function getAppointments() {
  await requireAdmin();
  return prisma.appointment.findMany({
    orderBy: [
      { status: "asc" },
      { date: "asc" },
      { timeSlot: "asc" },
    ],
  });
}

export async function confirmAppointment(
  id: string,
  durationHours = 1
): Promise<{ success: boolean } | { error: string }> {
  await requireAdmin();
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: "confirmed", durationHours },
    });
    revalidatePath("/admin/appointments");
    revalidatePath("/werkplaats");
    return { success: true };
  } catch {
    return { error: "Kon de afspraak niet bevestigen." };
  }
}

export async function cancelAppointment(id: string): Promise<{ success: boolean } | { error: string }> {
  await requireAdmin();
  try {
    // Fetch the appointment first so we can clean up related blocks
    const apt = await prisma.appointment.findUnique({ where: { id } });
    if (!apt) return { error: "Afspraak niet gevonden." };

    await prisma.$transaction(async (tx) => {
      // Clean up any stale "Gereserveerd ·" block records from old duration-based blocking
      if ((apt.durationHours ?? 1) > 1) {
        const allSlots = generateDaySlots();
        const startIdx = allSlots.indexOf(apt.timeSlot);
        const followSlots = allSlots.slice(startIdx + 1, startIdx + (apt.durationHours ?? 1));
        if (followSlots.length > 0) {
          await tx.blockedDate.deleteMany({
            where: {
              date: apt.date,
              timeSlot: { in: followSlots },
              reason: { startsWith: "Gereserveerd ·" },
            },
          });
        }
      }
      // Delete the appointment itself
      await tx.appointment.delete({ where: { id } });
    });

    revalidatePath("/admin/appointments");
    revalidatePath("/werkplaats");
    return { success: true };
  } catch {
    return { error: "Kon de afspraak niet verwijderen." };
  }
}

export async function getPendingAppointmentCount(): Promise<number> {
  await requireAdmin();
  return prisma.appointment.count({ where: { status: "pending" } });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

type SlotInput = { dateStr: string; timeSlot: string };

function parseUtcDate({ dateStr }: { dateStr: string }): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return fromZonedTime(new Date(year, month - 1, day), TZ);
}

function validateCommon(input: {
  dateStr: string; timeSlot: string; name: string;
  email: string; phone: string; service: string;
}): string | null {
  const { dateStr, timeSlot, name, email, phone, service } = input;
  if (!dateStr || !timeSlot || !name || !email || !phone || !service)
    return "Alle verplichte velden moeten worden ingevuld.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Ongeldig e-mailadres.";
  if (!generateDaySlots().includes(timeSlot))
    return "Ongeldig tijdslot.";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create (admin — confirmed immediately)
// ─────────────────────────────────────────────────────────────────────────────

type AdminCreateInput = {
  dateStr: string; timeSlot: string;
  name: string; email: string; phone: string; service: string; notes?: string;
  durationHours?: number;
};

export async function createAdminAppointment(
  input: AdminCreateInput
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin();
  const err = validateCommon(input);
  if (err) return { error: err };

  const utcDate = parseUtcDate(input);

  try {
    const apt = await prisma.$transaction(async (tx) => {
      const dayStart = utcDate;
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = await tx.appointment.count({
        where: { date: { gte: dayStart, lt: dayEnd }, timeSlot: input.timeSlot, status: { in: ["pending", "confirmed"] } },
      });
      if (count >= APPOINTMENT_CONFIG.maxBookingsPerSlot)
        throw new Error("Dit tijdslot is al bezet. Kies een ander tijdslot.");
      return tx.appointment.create({
        data: {
          date: utcDate, timeSlot: input.timeSlot,
          name: input.name.trim(), email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(), service: input.service,
          notes: input.notes?.trim() || null, status: "confirmed",
          durationHours: input.durationHours ?? 1,
        },
      });
    });
    revalidatePath("/admin/appointments");
    return { success: true, id: apt.id };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Er is een onverwachte fout opgetreden." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Update (admin — change date, slot, status, details)
// ─────────────────────────────────────────────────────────────────────────────

type AdminUpdateInput = {
  id: string;
  dateStr: string; timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
  name: string; email: string; phone: string; service: string; notes?: string;
  durationHours?: number;
};

export async function updateAppointment(
  input: AdminUpdateInput
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  if (!input.id) return { error: "Afspraak ID ontbreekt." };

  const err = validateCommon(input);
  if (err) return { error: err };

  if (!["pending", "confirmed", "cancelled"].includes(input.status))
    return { error: "Ongeldige status." };

  const utcDate = parseUtcDate(input);

  try {
    await prisma.$transaction(async (tx) => {
      // Skip slot check when cancelling
      if (input.status !== "cancelled") {
        const dayStart = utcDate;
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const count = await tx.appointment.count({
          where: {
            id: { not: input.id }, // exclude this record
            date: { gte: dayStart, lt: dayEnd },
            timeSlot: input.timeSlot,
            status: { in: ["pending", "confirmed"] },
          },
        });
        if (count >= APPOINTMENT_CONFIG.maxBookingsPerSlot)
          throw new Error("Dit tijdslot is al bezet door een andere afspraak.");
      }

      await tx.appointment.update({
        where: { id: input.id },
        data: {
          date: utcDate, timeSlot: input.timeSlot, status: input.status,
          name: input.name.trim(), email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(), service: input.service,
          notes: input.notes?.trim() || null,
          ...(input.durationHours !== undefined ? { durationHours: input.durationHours } : {}),
        },
      });
    });
    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Er is een onverwachte fout opgetreden." };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Update duration (drag-to-resize from calendar)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateAppointmentDuration(
  id: string,
  durationHours: number
): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  if (durationHours < 1 || durationHours > 8) return { error: "Ongeldige duur." };

  try {
    await prisma.appointment.update({ where: { id }, data: { durationHours } });
    revalidatePath("/admin/appointments");
    revalidatePath("/werkplaats");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Er is een onverwachte fout opgetreden." };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Blocked dates management
// ─────────────────────────────────────────────────────────────────────────────

export type BlockedDateEntry = {
  id: string;
  date: Date;
  timeSlot: string | null;
  reason: string | null;
};

export async function getBlocks(): Promise<BlockedDateEntry[]> {
  await requireAdmin();
  return prisma.blockedDate.findMany({
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    select: { id: true, date: true, timeSlot: true, reason: true },
  });
}

/** Block an entire day (timeSlot = null) or a specific slot */
export async function blockSlot(input: {
  dateStr: string;   // "YYYY-MM-DD"
  timeSlot?: string | null;  // null/undefined = full day block
  reason?: string;
}): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin();
  const { dateStr, timeSlot = null, reason } = input;
  if (!dateStr) return { error: "Datum is verplicht." };

  const [year, month, day] = dateStr.split("-").map(Number);
  const utcDate = fromZonedTime(new Date(year, month - 1, day), TZ);

  try {
    const entry = await prisma.blockedDate.create({
      data: { date: utcDate, timeSlot: timeSlot || null, reason: reason?.trim() || null },
    });
    revalidatePath("/admin/appointments");
    revalidatePath("/werkplaats");
    return { success: true, id: entry.id };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.toLowerCase().includes("unique")) {
      return { error: "Dit tijdslot / deze dag is al geblokkeerd." };
    }
    return { error: "Kon het tijdslot niet blokkeren." };
  }
}

/** Remove a block by ID */
export async function unblockSlot(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin();
  try {
    await prisma.blockedDate.delete({ where: { id } });
    revalidatePath("/admin/appointments");
    revalidatePath("/werkplaats");
    return { success: true };
  } catch {
    return { error: "Kon de blokkering niet verwijderen." };
  }
}
