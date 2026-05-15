"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { revalidateLocalizedPath } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/auth-guard";
import { generateDaySlots } from "@/lib/appointmentConfig";
import { sendAppointmentConfirmed } from "@/lib/appointment-emails";
import {
  getAppointmentConflict,
  getAppointmentDayRange,
  parseAppointmentDate,
  validateAppointmentDate,
  type AppointmentConflict,
} from "@/lib/appointment-availability";

function adminConflictMessage(conflict: AppointmentConflict): string {
  switch (conflict) {
    case "invalidDate":
      return "Ongeldige datum.";
    case "invalidSlot":
      return "Ongeldig tijdslot.";
    case "invalidDuration":
      return "Ongeldige duur.";
    case "pastDate":
      return "Afspraken kunnen niet in het verleden worden gepland.";
    case "notWorkingDay":
      return "Deze dag is geen werkdag.";
    case "blocked":
      return "Deze dag of dit tijdslot is geblokkeerd.";
    case "unavailable":
    default:
      return "Dit tijdslot overlapt met een andere afspraak.";
  }
}

function isTransactionConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function confirmAppointment(
  id: string,
  durationHours = 1
): Promise<{ success: boolean } | { error: string }> {
  await requireAdmin();
  try {
    const apt = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findUnique({ where: { id } });
      if (!existing) throw new Error("Afspraak niet gevonden.");

      const conflict = await getAppointmentConflict(tx, {
        date: existing.date,
        timeSlot: existing.timeSlot,
        durationHours,
        excludeAppointmentId: id,
      });
      if (conflict) throw new Error(adminConflictMessage(conflict));

      return tx.appointment.update({
        where: { id },
        data: { status: "confirmed", durationHours },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    revalidatePath("/admin/appointments");
    revalidateLocalizedPath("/werkplaats");

    const mailResult = await sendAppointmentConfirmed({
      name: apt.name,
      email: apt.email,
      date: apt.date,
      timeSlot: apt.timeSlot,
      service: apt.service,
      notes: apt.notes,
      locale: apt.locale,
    });
    if (!mailResult.success) {
      console.error("Appointment confirmed, but confirmation email failed", {
        appointmentId: apt.id,
        email: apt.email,
        error: mailResult.error,
      });
    }

    return { success: true };
  } catch (error) {
    if (isTransactionConflict(error)) return { error: "Dit tijdslot werd net bezet. Vernieuw en probeer opnieuw." };
    return { error: error instanceof Error ? error.message : "Kon de afspraak niet bevestigen." };
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
    revalidateLocalizedPath("/werkplaats");
    return { success: true };
  } catch {
    return { error: "Kon de afspraak niet verwijderen." };
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

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
  sendConfirmation?: boolean;
  emailLocale?: "nl" | "fr" | "en";
};

export async function createAdminAppointment(
  input: AdminCreateInput
): Promise<{ success: true; id: string } | { error: string }> {
  await requireAdmin();
  const err = validateCommon(input);
  if (err) return { error: err };

  const utcDate = parseAppointmentDate(input.dateStr);
  if (!utcDate) return { error: "Ongeldige datum." };

  const dateConflict = validateAppointmentDate(utcDate);
  if (dateConflict) return { error: adminConflictMessage(dateConflict) };

  try {
    const apt = await prisma.$transaction(async (tx) => {
      const conflict = await getAppointmentConflict(tx, {
        date: utcDate,
        timeSlot: input.timeSlot,
        durationHours: input.durationHours ?? 1,
      });
      if (conflict) throw new Error(adminConflictMessage(conflict));

      return tx.appointment.create({
        data: {
          date: utcDate, timeSlot: input.timeSlot,
          name: input.name.trim().slice(0, 100), email: input.email.trim().toLowerCase().slice(0, 254),
          phone: input.phone.trim().slice(0, 30), service: input.service,
          notes: input.notes?.trim().slice(0, 2000) || null, status: "confirmed",
          durationHours: input.durationHours ?? 1,
          locale: input.emailLocale ?? "fr",
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    revalidatePath("/admin/appointments");

    if (input.sendConfirmation) {
      const mailResult = await sendAppointmentConfirmed({
        name: apt.name,
        email: apt.email,
        date: apt.date,
        timeSlot: apt.timeSlot,
        service: apt.service,
        notes: apt.notes,
        locale: input.emailLocale ?? "fr",
      });
      if (!mailResult.success) {
        console.error("Manual appointment saved, but confirmation email failed", {
          appointmentId: apt.id,
          email: apt.email,
          error: mailResult.error,
        });
      }
    }

    return { success: true, id: apt.id };
  } catch (e: unknown) {
    if (isTransactionConflict(e)) return { error: "Dit tijdslot werd net bezet. Vernieuw en probeer opnieuw." };
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
  sendConfirmation?: boolean;
  emailLocale?: "nl" | "fr" | "en";
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

  const utcDate = parseAppointmentDate(input.dateStr);
  if (!utcDate) return { error: "Ongeldige datum." };

  const dateConflict = validateAppointmentDate(utcDate);
  if (dateConflict && input.status !== "cancelled") return { error: adminConflictMessage(dateConflict) };

  try {
    await prisma.$transaction(async (tx) => {
      // Skip slot check when cancelling
      if (input.status !== "cancelled") {
        const conflict = await getAppointmentConflict(tx, {
          date: utcDate,
          timeSlot: input.timeSlot,
          durationHours: input.durationHours ?? 1,
          excludeAppointmentId: input.id,
        });
        if (conflict) throw new Error(adminConflictMessage(conflict));
      }

      await tx.appointment.update({
        where: { id: input.id },
        data: {
          date: utcDate, timeSlot: input.timeSlot, status: input.status,
          name: input.name.trim().slice(0, 100), email: input.email.trim().toLowerCase().slice(0, 254),
          phone: input.phone.trim().slice(0, 30), service: input.service,
          notes: input.notes?.trim().slice(0, 2000) || null,
          ...(input.durationHours !== undefined ? { durationHours: input.durationHours } : {}),
        },
      });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    revalidatePath("/admin/appointments");

    if (input.sendConfirmation) {
      const mailResult = await sendAppointmentConfirmed({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        date: utcDate,
        timeSlot: input.timeSlot,
        service: input.service,
        notes: input.notes?.trim() || null,
        locale: input.emailLocale ?? "fr",
      });
      if (!mailResult.success) {
        console.error("Appointment updated, but confirmation email failed", {
          appointmentId: input.id,
          email: input.email.trim().toLowerCase(),
          error: mailResult.error,
        });
      }
    }

    return { success: true };
  } catch (e: unknown) {
    if (isTransactionConflict(e)) return { error: "Dit tijdslot werd net bezet. Vernieuw en probeer opnieuw." };
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
    await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findUnique({ where: { id } });
      if (!existing) throw new Error("Afspraak niet gevonden.");
      if (existing.status !== "cancelled") {
        const conflict = await getAppointmentConflict(tx, {
          date: existing.date,
          timeSlot: existing.timeSlot,
          durationHours,
          excludeAppointmentId: id,
        });
        if (conflict) throw new Error(adminConflictMessage(conflict));
      }
      await tx.appointment.update({ where: { id }, data: { durationHours } });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    revalidatePath("/admin/appointments");
    revalidateLocalizedPath("/werkplaats");
    return { success: true };
  } catch (e: unknown) {
    if (isTransactionConflict(e)) return { error: "Dit tijdslot werd net bezet. Vernieuw en probeer opnieuw." };
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

  const utcDate = parseAppointmentDate(dateStr);
  if (!utcDate) return { error: "Ongeldige datum." };
  if (timeSlot && !generateDaySlots().includes(timeSlot)) return { error: "Ongeldig tijdslot." };

  try {
    const { dayStart, dayEnd } = getAppointmentDayRange(utcDate);
    const duplicate = await prisma.blockedDate.findFirst({
      where: {
        date: { gte: dayStart, lt: dayEnd },
        timeSlot: timeSlot || null,
      },
      select: { id: true },
    });
    if (duplicate) return { error: "Dit tijdslot / deze dag is al geblokkeerd." };

    const entry = await prisma.blockedDate.create({
      data: { date: utcDate, timeSlot: timeSlot || null, reason: reason?.trim() || null },
    });
    revalidatePath("/admin/appointments");
    revalidateLocalizedPath("/werkplaats");
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
    revalidateLocalizedPath("/werkplaats");
    return { success: true };
  } catch {
    return { error: "Kon de blokkering niet verwijderen." };
  }
}
