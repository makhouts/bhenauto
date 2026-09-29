"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { appointmentWindowSchema, calendarDateWhere, type AppointmentWindowRequest } from "@/lib/appointment-window";
import { pageWindow } from "@/lib/admin-list-query";

export async function getAdminAppointmentData(input: AppointmentWindowRequest) {
  await requireAdmin();
  const { ranges, pendingPage } = appointmentWindowSchema.parse(input);
  const groups = await prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } });
  const counts = {
    pending: groups.find((group) => group.status === "pending")?._count._all ?? 0,
    confirmed: groups.find((group) => group.status === "confirmed")?._count._all ?? 0,
    total: groups.reduce((total, group) => total + group._count._all, 0),
  };
  const pagination = pageWindow(pendingPage, counts.pending);
  const select = {
    id: true, date: true, timeSlot: true, kind: true, name: true, email: true, phone: true,
    service: true, notes: true, internalCarId: true, internalCarLabel: true, internalKeyNumber: true,
    status: true, durationHours: true, createdAt: true, updatedAt: true,
  } as const;
  const orderBy = [{ date: "asc" }, { timeSlot: "asc" }, { id: "asc" }] as const;
  const [calendar, pending, blocks] = await Promise.all([
    prisma.appointment.findMany({ where: { OR: calendarDateWhere(ranges), status: { not: "cancelled" } }, select, orderBy: [...orderBy] }),
    prisma.appointment.findMany({ where: { status: "pending" }, select, orderBy: [...orderBy], skip: pagination.skip, take: pagination.take }),
    prisma.blockedDate.findMany({ where: { OR: calendarDateWhere(ranges) }, select: { id: true, date: true, timeSlot: true, reason: true }, orderBy: [{ date: "asc" }, { id: "asc" }] }),
  ]);
  return {
    appointments: [...new Map([...calendar, ...pending].map((appointment) => [appointment.id, appointment])).values()],
    blocks, pendingIds: pending.map((appointment) => appointment.id), counts,
    pendingPagination: { page: pagination.page, pages: pagination.pages, total: counts.pending },
  };
}

export type AdminAppointmentData = Awaited<ReturnType<typeof getAdminAppointmentData>>;
