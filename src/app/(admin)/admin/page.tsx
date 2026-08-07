import prisma from "@/lib/prisma";
import Link from "next/link";
import {
    Car, CheckCircle, Lock, MessageSquare, CalendarCheck,
    TrendingUp, Clock, ArrowRight, ChevronRight, Inbox,
    Circle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { requireAdmin } from "@/lib/auth-guard";
import {
    getAdminDateFnsLocale,
    getAdminDictionary,
    getAdminServiceLabel,
    tpl,
} from "@/lib/admin-i18n";
import { getAdminLocale } from "@/lib/admin-i18n.server";
import { AdminMetricCard, AdminMetricGrid, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export const metadata = { title: "Admin Dashboard | bhenauto" };

function mondayStart(d: Date) { return startOfWeek(d, { weekStartsOn: 1 }); }
function mondayEnd(d: Date) { return endOfWeek(d, { weekStartsOn: 1 }); }

const STATUS_COLOR: Record<string, string> = {
    pending: "bg-amber-400",
    confirmed: "bg-emerald-500",
    cancelled: "bg-slate-300",
};

function isInternalBooking(apt: { kind: string | null }) {
    return apt.kind === "internal";
}

function getAppointmentTitle(apt: { kind: string | null; name: string; internalCarLabel: string | null }) {
    return isInternalBooking(apt) ? apt.internalCarLabel ?? apt.name : apt.name;
}

function getAppointmentSubtitle(apt: { kind: string | null; service: string; internalKeyNumber: string | null }, locale: "nl" | "fr", dict: ReturnType<typeof getAdminDictionary>) {
    if (isInternalBooking(apt)) {
        return apt.internalKeyNumber
            ? `${dict.appointments.modals.internalBadge} · #${apt.internalKeyNumber}`
            : dict.appointments.modals.internalBadge;
    }
    return getAdminServiceLabel(apt.service, locale);
}

function getAppointmentChipStyle(apt: { kind: string | null; status: string }) {
    if (apt.status === "pending") return { background: "#fffbeb", borderColor: "#f59e0b" };
    if (isInternalBooking(apt)) return { background: "#f0f9ff", borderColor: "#0ea5e9" };
    return { background: "#f0fdf4", borderColor: "#10b981" };
}

export default async function AdminDashboardPage() {
    await requireAdmin();
    const locale = await getAdminLocale();
    const dict = getAdminDictionary(locale);
    const dateLocale = getAdminDateFnsLocale(locale);
    const now = new Date();
    const weekStart = mondayStart(now);
    const weekEnd = mondayEnd(now);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5);

    const [
        availableCars, soldCars, reservedCars,
        unreadContacts, totalContacts,
        pendingAppointments, confirmedAppointments,
        weekAppointments, recentContacts, upcomingAppointments,
    ] = await Promise.all([
        prisma.car.count({ where: { sold: false, reserved: false } }),
        prisma.car.count({ where: { sold: true } }),
        prisma.car.count({ where: { reserved: true } }),
        prisma.contact.count({ where: { read: false } }),
        prisma.contact.count(),
        prisma.appointment.count({ where: { status: "pending" } }),
        prisma.appointment.count({ where: { status: "confirmed" } }),
        prisma.appointment.findMany({
            where: { date: { gte: weekStart, lte: weekEnd }, status: { not: "cancelled" } },
            orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
        }),
        prisma.contact.findMany({
            where: { read: false },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        prisma.appointment.findMany({
            where: { date: { gte: now }, status: { in: ["pending", "confirmed"] } },
            orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
            take: 6,
        }),
    ]);

    const calMap: Record<string, typeof weekAppointments> = {};
    for (const apt of weekAppointments) {
        const k = format(apt.date, "yyyy-MM-dd");
        if (!calMap[k]) calMap[k] = [];
        calMap[k].push(apt);
    }

    const kpis = [
        {
            label: dict.dashboard.kpis.available.label, value: availableCars,
            sub: dict.dashboard.kpis.available.sub, icon: Car,
            tone: "blue" as const, trend: false,
        },
        {
            label: dict.dashboard.kpis.sold.label, value: soldCars,
            sub: dict.dashboard.kpis.sold.sub, icon: CheckCircle,
            tone: "green" as const, trend: false,
        },
        {
            label: dict.dashboard.kpis.reserved.label, value: reservedCars,
            sub: dict.dashboard.kpis.reserved.sub, icon: Lock,
            tone: "amber" as const, trend: false,
        },
        {
            label: dict.dashboard.kpis.contacts.label, value: unreadContacts,
            sub: `${totalContacts} ${dict.dashboard.kpis.contacts.total} · ${unreadContacts} ${dict.dashboard.kpis.contacts.unread}`, icon: MessageSquare,
            tone: "violet" as const, trend: unreadContacts > 0,
        },
        {
            label: dict.dashboard.kpis.appointments.label, value: pendingAppointments + confirmedAppointments,
            sub: `${pendingAppointments} ${dict.dashboard.kpis.appointments.pending} · ${confirmedAppointments} ${dict.dashboard.kpis.appointments.confirmed}`, icon: CalendarCheck,
            tone: "red" as const, trend: pendingAppointments > 0,
        },
    ];

    return (
        <AdminPage className="max-w-[1400px]">

            {/* ── Header ── */}
            <AdminPageHeader
                eyebrow={format(now, "EEEE d MMMM yyyy", { locale: dateLocale })}
                title={dict.dashboard.title}
            />

            {/* ── KPI Cards ── */}
            <AdminMetricGrid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
                {kpis.map((k) => (
                    <AdminMetricCard
                        key={k.label}
                        label={k.label}
                        value={k.value}
                        hint={k.sub}
                        tone={k.tone}
                        icon={<k.icon size={22} />}
                        trend={k.trend ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" /> : null}
                    />
                ))}
            </AdminMetricGrid>

            {/* ── Week Calendar + Upcoming ── */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

                {/* Calendar */}
                <div
                    className="overflow-hidden rounded-[3px] border border-[#d7d5cf] bg-white shadow-[0_12px_30px_rgba(17,17,22,0.045)] xl:col-span-2"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#e4e2dc] px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#d7d5cf] bg-[#f7f6f2] text-[#d91c1c]">
                                <CalendarCheck size={19} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-base leading-tight">{dict.dashboard.calendar.title}</p>
                                <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                    {format(weekStart, "d MMM", { locale: dateLocale })} – {format(weekEnd, "d MMM", { locale: dateLocale })}
                                    {weekAppointments.length > 0 && ` · ${weekAppointments.length} ${dict.layout.nav.appointments.toLowerCase()}`}
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/appointments" className="flex items-center gap-1 text-[13px] font-bold hover:underline" style={{ color: "#d91c1c" }}>
                            {dict.common.manage} <ChevronRight size={15} />
                        </Link>
                    </div>

                    {/* Day columns */}
                    <div className="grid grid-cols-5 divide-x divide-slate-100">
                        {weekDays.map((day) => {
                            const ds = format(day, "yyyy-MM-dd");
                            const apts = calMap[ds] ?? [];
                            const tod = isToday(day);
                            return (
                                <div key={ds} className="flex flex-col" style={{ minHeight: "260px", background: tod ? "rgba(217,28,28,0.018)" : "transparent" }}>
                                    {/* Day header */}
                                    <div
                                        className="px-3 py-4 text-center"
                                        style={{ borderBottom: "1px solid #f1f5f9", background: tod ? "rgba(217,28,28,0.04)" : "transparent" }}
                                    >
                                        <p
                                            className="text-[11px] font-bold uppercase tracking-wider mb-2"
                                            style={{ color: tod ? "#d91c1c" : "#94a3b8" }}
                                        >
                                            {format(day, "EEE", { locale: dateLocale })}
                                        </p>
                                        <div
                                            className="mx-auto w-9 h-9 flex items-center justify-center rounded-full"
                                            style={{ background: tod ? "#d91c1c" : "transparent" }}
                                        >
                                            <p
                                                className="text-[1.1rem] font-black leading-none"
                                                style={{ color: tod ? "#ffffff" : "#1e293b" }}
                                            >
                                                {format(day, "d")}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Appointment chips */}
                                    <div className="flex-1 p-3 space-y-2 overflow-hidden">
                                        {apts.length === 0 ? (
                                            <div className="h-full flex items-center justify-center">
                                                <p className="text-[11px] text-slate-300 font-medium">{dict.dashboard.calendar.free}</p>
                                            </div>
                                        ) : (
                                            apts.slice(0, 4).map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    className="rounded-[2px] border-l-[3px] px-2.5 py-2"
                                                    style={getAppointmentChipStyle(apt)}
                                                >
                                                    <p className="text-[12px] font-black text-slate-800 truncate leading-tight">{apt.timeSlot} {getAppointmentTitle(apt)}</p>
                                                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{getAppointmentSubtitle(apt, locale, dict)}</p>
                                                </div>
                                            ))
                                        )}
                                        {apts.length > 4 && (
                                                    <p className="text-[11px] text-slate-400 font-bold px-1">+{apts.length - 4} {dict.dashboard.calendar.more}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e4e2dc] bg-[#f7f6f2] px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-2 rounded-sm" style={{ background: "#f59e0b" }} />
                            <span className="text-[12px] text-slate-400 font-medium">{dict.dashboard.calendar.pending}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-2 rounded-sm" style={{ background: "#10b981" }} />
                            <span className="text-[12px] text-slate-400 font-medium">{dict.dashboard.calendar.confirmed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-2 rounded-sm" style={{ background: "#0ea5e9" }} />
                            <span className="text-[12px] text-slate-400 font-medium">{dict.appointments.calendar.internalLegend}</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming appointments feed */}
                <div
                    className="overflow-hidden rounded-[3px] border border-[#d7d5cf] bg-white shadow-[0_12px_30px_rgba(17,17,22,0.045)]"
                >
                    <div className="flex items-center justify-between border-b border-[#e4e2dc] px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#d7d5cf] bg-[#f7f6f2]">
                                <Clock size={18} className="text-slate-500" />
                            </div>
                            <p className="font-black text-slate-900 text-base">{dict.dashboard.upcoming.title}</p>
                        </div>
                        <Link href="/admin/appointments" className="text-[12px] font-bold text-slate-400 hover:text-[#d91c1c] flex items-center gap-1">
                            {dict.common.all} <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {upcomingAppointments.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <CheckCircle size={28} className="mx-auto mb-3 text-emerald-300" />
                                <p className="text-[13px] text-slate-400 font-medium">{dict.dashboard.upcoming.empty}</p>
                            </div>
                        ) : upcomingAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[#faf9f6]">
                                <div className="min-w-[52px] shrink-0 border border-[#dedcd6] bg-[#f7f6f2] px-3 py-2 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{format(apt.date, "MMM", { locale: dateLocale })}</p>
                                    <p className="text-xl font-black text-slate-900 leading-tight">{format(apt.date, "d")}</p>
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isInternalBooking(apt) ? "bg-sky-500" : STATUS_COLOR[apt.status]}`} />
                                        <p className="font-black text-slate-900 text-[13px] truncate">{getAppointmentTitle(apt)}</p>
                                    </div>
                                    <p className="text-[12px] text-slate-400 font-medium">{apt.timeSlot} · {getAppointmentSubtitle(apt, locale, dict)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom row: inventory breakdown + recent contacts ── */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                {/* Inventory breakdown */}
                <div
                    className="overflow-hidden rounded-[3px] border border-[#d7d5cf] bg-white shadow-[0_12px_30px_rgba(17,17,22,0.045)]"
                >
                    <div className="flex items-center justify-between border-b border-[#e4e2dc] px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#d7d5cf] bg-[#f7f6f2] text-sky-700">
                                <TrendingUp size={18} />
                            </div>
                            <p className="font-black text-slate-900 text-base">{dict.dashboard.inventory.title}</p>
                        </div>
                        <Link href="/admin/cars" className="text-[12px] font-bold text-slate-400 hover:text-[#d91c1c] flex items-center gap-1">
                            {dict.common.manage} <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="px-7 py-6 space-y-5">
                        {[
                            { label: dict.dashboard.inventory.available, count: availableCars, total: availableCars + soldCars + reservedCars, color: "#3b82f6" },
                            { label: dict.dashboard.inventory.reserved, count: reservedCars, total: availableCars + soldCars + reservedCars, color: "#f59e0b" },
                            { label: dict.dashboard.inventory.sold, count: soldCars, total: availableCars + soldCars + reservedCars, color: "#10b981" },
                        ].map(({ label, count, total, color }) => {
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                            <span className="text-[13px] font-bold text-slate-700">{label}</span>
                                        </div>
                                        <span className="text-[13px] font-black text-slate-900">
                                            {count} <span className="text-slate-400 font-medium">({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, background: color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-[12px] text-slate-400 font-medium pt-1">
                            {tpl(dict.dashboard.inventory.total, { count: availableCars + soldCars + reservedCars })}
                        </p>
                    </div>
                </div>

                {/* Recent unread contacts */}
                <div
                    className="overflow-hidden rounded-[3px] border border-[#d7d5cf] bg-white shadow-[0_12px_30px_rgba(17,17,22,0.045)]"
                >
                    <div className="flex items-center justify-between border-b border-[#e4e2dc] px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#d7d5cf] bg-[#f7f6f2] text-violet-700">
                                <Inbox size={18} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-base leading-tight">{dict.dashboard.contacts.title}</p>
                                {unreadContacts > 0 && (
                                    <p className="text-[12px] font-bold" style={{ color: "#f59e0b" }}>{tpl(dict.dashboard.contacts.unread, { count: unreadContacts })}</p>
                                )}
                            </div>
                        </div>
                        <Link href="/admin/contacts" className="text-[12px] font-bold text-slate-400 hover:text-[#d91c1c] flex items-center gap-1">
                            {dict.common.all} <ArrowRight size={13} />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentContacts.length === 0 ? (
                            <div className="px-7 py-12 text-center">
                                <CheckCircle size={28} className="mx-auto mb-3 text-emerald-300" />
                                <p className="text-[13px] text-slate-400 font-medium">{dict.dashboard.contacts.empty}</p>
                            </div>
                        ) : recentContacts.map((c) => (
                            <Link key={c.id} href="/admin/contacts" className="flex items-start gap-4 px-7 py-4 transition-colors hover:bg-[#faf9f6]">
                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-violet-200 bg-violet-50">
                                    <span className="text-[13px] font-black" style={{ color: "#8b5cf6" }}>
                                        {c.name.trim()[0].toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-slate-900 text-[13px]">{c.name}</p>
                                        <Circle size={5} className="text-amber-400 fill-amber-400 shrink-0" />
                                        <p className="text-[11px] text-slate-400 font-medium ml-auto shrink-0">
                                            {format(c.createdAt, "d MMM", { locale: dateLocale })}
                                        </p>
                                    </div>
                                    <p className="text-[12px] text-slate-500 font-medium mt-0.5 truncate leading-snug">{c.message}</p>
                                    {c.car_reference && (
                                        <p className="text-[11px] font-bold mt-0.5 truncate" style={{ color: "#d91c1c" }}>{dict.dashboard.contacts.regarding} {c.car_reference}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AdminPage>
    );
}
