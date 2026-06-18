"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    addWeeks,
    eachDayOfInterval,
    endOfWeek,
    format,
    isToday,
    startOfWeek,
    subWeeks,
} from "date-fns";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Hash,
    Lock,
    Car,
    Wrench,
} from "lucide-react";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
import { getAdminDateFnsLocale, getAdminServiceLabel, tpl } from "@/lib/admin-i18n";
import { getThumbnailImageUrl } from "@/lib/image-url";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

type WorkshopAppointment = {
    id: string;
    date: Date;
    timeSlot: string;
    kind: "customer" | "internal";
    name: string;
    service: string;
    notes: string | null;
    status: "pending" | "confirmed" | "cancelled";
    durationHours: number;
    internalCarLabel: string | null;
    internalKeyNumber: string | null;
    internalCar: {
        images: Array<{ url: string }>;
    } | null;
};

type WorkshopBlock = {
    id: string;
    date: Date;
    timeSlot: string | null;
    reason: string | null;
};

type AgendaEntry =
    | { kind: "appointment"; id: string; startMinutes: number; appointment: WorkshopAppointment }
    | { kind: "blocked"; id: string; startMinutes: number; block: WorkshopBlock & { timeSlot: string } };

function isInternalBooking(appointment: WorkshopAppointment) {
    return appointment.kind === "internal";
}

function getAppointmentTitle(appointment: WorkshopAppointment) {
    return isInternalBooking(appointment)
        ? appointment.internalCarLabel ?? appointment.name
        : appointment.name;
}

function slotToMinutes(timeSlot: string) {
    const [hours, minutes] = timeSlot.split(":").map(Number);
    return hours * 60 + minutes;
}

function formatRange(timeSlot: string, durationHours: number) {
    const startMinutes = slotToMinutes(timeSlot);
    const endMinutes = startMinutes + durationHours * 60;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endRemainder = endMinutes % 60;
    return `${timeSlot} - ${String(endHours).padStart(2, "0")}:${String(endRemainder).padStart(2, "0")}`;
}

function buildAgendaEntries(
    appointments: WorkshopAppointment[],
    blocks: WorkshopBlock[]
): AgendaEntry[] {
    return [
        ...appointments.map((appointment) => ({
            kind: "appointment" as const,
            id: appointment.id,
            startMinutes: slotToMinutes(appointment.timeSlot),
            appointment,
        })),
        ...blocks
            .filter((block): block is WorkshopBlock & { timeSlot: string } => block.timeSlot !== null)
            .map((block) => ({
                kind: "blocked" as const,
                id: block.id,
                startMinutes: slotToMinutes(block.timeSlot),
                block,
            })),
    ].sort((left, right) => {
        if (left.startMinutes !== right.startMinutes) {
            return left.startMinutes - right.startMinutes;
        }
        if (left.kind === right.kind) {
            return 0;
        }
        return left.kind === "appointment" ? -1 : 1;
    });
}

function getStatusTone(appointment: WorkshopAppointment) {
    if (isInternalBooking(appointment)) {
        return {
            card: "border-sky-200 bg-sky-50/80",
            dot: "bg-sky-500",
            badge: "border-sky-200 bg-white text-sky-700",
        };
    }

    if (appointment.status === "pending") {
        return {
            card: "border-amber-200 bg-amber-50/80",
            dot: "bg-amber-400",
            badge: "border-amber-200 bg-white text-amber-700",
        };
    }

    return {
        card: "border-emerald-200 bg-emerald-50/80",
        dot: "bg-emerald-500",
        badge: "border-emerald-200 bg-white text-emerald-700",
    };
}

function BlockedSlotCard({
    timeSlot,
    reason,
    compact = false,
}: {
    timeSlot: string;
    reason?: string | null;
    compact?: boolean;
}) {
    const { dict } = useAdminI18n();

    return (
        <article className={`rounded-[20px] border border-slate-200 bg-slate-100/90 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
            <div className="flex items-center gap-3">
                <span className={`flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-slate-500 shadow-sm ${compact ? "h-10 w-10" : "h-11 w-11"}`}>
                    <Lock size={compact ? 15 : 16} />
                </span>
                <div className="min-w-0">
                    <p className={`${compact ? "text-[10px]" : "text-[11px]"} font-black uppercase tracking-[0.14em] text-slate-500`}>
                        {timeSlot}
                    </p>
                    <p className={`${compact ? "text-sm" : "text-base"} font-black text-slate-900`}>
                        {dict.appointments.calendar.blockedLegend}
                    </p>
                    {reason ? (
                        <p className={`${compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs"} text-slate-500`}>
                            {reason}
                        </p>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function AppointmentCard({
    appointment,
    compact = false,
    showNotes = true,
}: {
    appointment: WorkshopAppointment;
    compact?: boolean;
    showNotes?: boolean;
}) {
    const { locale, dict } = useAdminI18n();
    const tone = getStatusTone(appointment);
    const imageUrl = appointment.internalCar?.images[0]?.url
        ? getThumbnailImageUrl(appointment.internalCar.images[0].url)
        : "";
    const label = getAppointmentTitle(appointment);
    const metaLabel = isInternalBooking(appointment)
        ? appointment.internalKeyNumber
            ? `${dict.appointments.modals.internalBadge} · #${appointment.internalKeyNumber}`
            : dict.appointments.modals.internalBadge
        : getAdminServiceLabel(appointment.service, locale);
    const compactMetaLabel = isInternalBooking(appointment)
        ? dict.appointments.modals.internalBadge
        : metaLabel;

    return (
        <article className={`h-full overflow-hidden rounded-[20px] border shadow-[0_10px_24px_rgba(15,23,42,0.05)] ${tone.card} ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
            <div className={`flex h-full ${compact ? "items-center gap-2.5" : "items-start gap-3"}`}>
                {isInternalBooking(appointment) ? (
                    imageUrl ? (
                        <div className={`relative shrink-0 overflow-hidden rounded-[16px] border border-white/80 bg-white shadow-sm ${compact ? "h-12 w-12" : "h-[3.5rem] w-[3.5rem]"}`}>
                            <Image
                                src={imageUrl}
                                alt={label}
                                fill
                                sizes={compact ? "48px" : "56px"}
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className={`flex shrink-0 items-center justify-center rounded-[16px] border border-white/80 bg-white text-slate-400 shadow-sm ${compact ? "h-12 w-12" : "h-[3.5rem] w-[3.5rem]"}`}>
                            <Car size={compact ? 18 : 20} />
                        </div>
                    )
                ) : null}

                <div className="min-w-0 flex-1">
                    {compact ? (
                        <div className="flex h-full min-w-0 flex-col justify-center">
                            <div className="flex items-center justify-between gap-2">
                                <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 shadow-sm">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                                    <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                                        {formatRange(appointment.timeSlot, appointment.durationHours ?? 1)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    {appointment.status === "pending" && !isInternalBooking(appointment) ? (
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${tone.badge}`}>
                                            <Clock3 size={10} />
                                            {dict.appointments.statuses.pending}
                                        </span>
                                    ) : null}
                                    {appointment.durationHours > 1 ? (
                                        <span className="rounded-full border border-white/80 bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-600 shadow-sm">
                                            {appointment.durationHours}h
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <h3 className="mt-1 max-w-full truncate text-[1.05rem] font-black tracking-tight text-slate-950">
                                {label}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-slate-600">
                                <span className="min-w-0 max-w-full truncate">{compactMetaLabel}</span>
                                {isInternalBooking(appointment) && appointment.internalKeyNumber ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/80 bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-700 shadow-sm">
                                        <Hash size={10} className="text-slate-400" />
                                        #{appointment.internalKeyNumber}
                                    </span>
                                ) : null}
                            </div>

                            {appointment.notes && showNotes ? (
                                <p className="mt-1 truncate text-[10px] leading-4 text-slate-500">
                                    {appointment.notes}
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                                        <p className="text-sm font-black uppercase tracking-[0.1em] text-slate-500">
                                            {formatRange(appointment.timeSlot, appointment.durationHours ?? 1)}
                                        </p>
                                    </div>
                                    <h3 className="mt-1 line-clamp-2 text-[0.98rem] font-black leading-5 tracking-tight text-slate-950">
                                        {label}
                                    </h3>
                                </div>
                                {appointment.durationHours > 1 ? (
                                    <span className="shrink-0 rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                                        {appointment.durationHours}h
                                    </span>
                                ) : null}
                            </div>

                            <p className="mt-1 text-sm font-semibold text-slate-600">
                                {metaLabel}
                            </p>

                            {appointment.notes && showNotes ? (
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                                    {appointment.notes}
                                </p>
                            ) : null}
                            <div className="mt-2.5 flex flex-wrap gap-1">
                                {isInternalBooking(appointment) && appointment.internalKeyNumber ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                                        <Hash size={12} className="text-slate-400" />
                                        #{appointment.internalKeyNumber}
                                    </span>
                                ) : null}
                                {appointment.status === "pending" && !isInternalBooking(appointment) ? (
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm ${tone.badge}`}>
                                        <Clock3 size={12} />
                                        {dict.appointments.statuses.pending}
                                    </span>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </article>
    );
}

export default function WorkshopBoardClient({
    appointments,
    blocks,
    nowIso,
    showAdminLink = true,
}: {
    appointments: WorkshopAppointment[];
    blocks: WorkshopBlock[];
    nowIso: string;
    showAdminLink?: boolean;
}) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const { locale, dict } = useAdminI18n();
    const dateLocale = getAdminDateFnsLocale(locale);
    const [now, setNow] = useState(() => new Date(nowIso));
    const serverNow = useMemo(() => new Date(nowIso), [nowIso]);
    const displayNow = now.getTime() >= serverNow.getTime() ? now : serverNow;
    const [weekAnchor, setWeekAnchor] = useState(() => serverNow);
    const [viewMode, setViewMode] = useState<"week" | "day">("week");
    const [selectedDayKey, setSelectedDayKey] = useState(() => format(serverNow, "yyyy-MM-dd"));

    useEffect(() => {
        const clockInterval = window.setInterval(() => {
            setNow(new Date());
        }, 1_000);

        const refreshInterval = window.setInterval(() => {
            setNow(new Date());
            startTransition(() => {
                router.refresh();
            });
        }, 60_000);

        return () => {
            window.clearInterval(clockInterval);
            window.clearInterval(refreshInterval);
        };
    }, [router, startTransition]);

    const currentWeekStart = useMemo(() => startOfWeek(displayNow, { weekStartsOn: 1 }), [displayNow]);
    const weekStart = useMemo(() => startOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
    const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
    const weekDays = useMemo(
        () =>
            eachDayOfInterval({ start: weekStart, end: weekEnd }).filter((day) =>
                APPOINTMENT_CONFIG.workingDays.includes(day.getDay())
            ),
        [weekEnd, weekStart]
    );

    const appointmentsByDay = useMemo(() => {
        const map: Record<string, WorkshopAppointment[]> = {};
        for (const appointment of appointments) {
            const key = format(new Date(appointment.date), "yyyy-MM-dd");
            if (!map[key]) map[key] = [];
            map[key].push(appointment);
        }
        return map;
    }, [appointments]);

    const blocksByDay = useMemo(() => {
        const map: Record<string, WorkshopBlock[]> = {};
        for (const block of blocks) {
            const key = format(new Date(block.date), "yyyy-MM-dd");
            if (!map[key]) map[key] = [];
            map[key].push(block);
        }
        return map;
    }, [blocks]);

    const todayKey = format(displayNow, "yyyy-MM-dd");
    const todaysAppointments = appointmentsByDay[todayKey] ?? [];
    const todayBlocks = blocksByDay[todayKey] ?? [];
    const fullDayBlocked = todayBlocks.some((block) => block.timeSlot === null);
    const todayMinutes = displayNow.getHours() * 60 + displayNow.getMinutes();
    const viewingCurrentWeek = currentWeekStart.getTime() === weekStart.getTime();
    const visibleWeekDayKeys = weekDays.map((day) => format(day, "yyyy-MM-dd"));
    const activeDayKey = visibleWeekDayKeys.includes(selectedDayKey) ? selectedDayKey : visibleWeekDayKeys[0] ?? todayKey;
    const activeDayDate = weekDays.find((day) => format(day, "yyyy-MM-dd") === activeDayKey) ?? weekDays[0] ?? displayNow;
    const activeDayAppointments = useMemo(
        () => appointmentsByDay[activeDayKey] ?? [],
        [activeDayKey, appointmentsByDay]
    );
    const activeDayBlocks = useMemo(
        () => blocksByDay[activeDayKey] ?? [],
        [activeDayKey, blocksByDay]
    );
    const activeDayAgendaEntries = useMemo(
        () => buildAgendaEntries(activeDayAppointments, activeDayBlocks),
        [activeDayAppointments, activeDayBlocks]
    );
    const activeDayHasFullBlock = activeDayBlocks.some((block) => block.timeSlot === null);

    const todayInternalCount = todaysAppointments.filter(isInternalBooking).length;
    const currentAppointment = todaysAppointments.find((appointment) => {
        const startMinutes = slotToMinutes(appointment.timeSlot);
        const endMinutes = startMinutes + (appointment.durationHours ?? 1) * 60;
        return todayMinutes >= startMinutes && todayMinutes < endMinutes;
    }) ?? null;

    function goToPreviousWeek() {
        setWeekAnchor((current) => {
            const nextAnchor = subWeeks(current, 1);
            const nextWeekDays = eachDayOfInterval({
                start: startOfWeek(nextAnchor, { weekStartsOn: 1 }),
                end: endOfWeek(nextAnchor, { weekStartsOn: 1 }),
            }).filter((day) => APPOINTMENT_CONFIG.workingDays.includes(day.getDay()));
            const fallbackDay = nextWeekDays[nextWeekDays.length - 1] ?? nextAnchor;
            setSelectedDayKey(format(fallbackDay, "yyyy-MM-dd"));
            return nextAnchor;
        });
    }

    function goToCurrentWeek() {
        setWeekAnchor(displayNow);
        setSelectedDayKey(todayKey);
    }

    function goToNextWeek() {
        setWeekAnchor((current) => {
            const nextAnchor = addWeeks(current, 1);
            const nextWeekDays = eachDayOfInterval({
                start: startOfWeek(nextAnchor, { weekStartsOn: 1 }),
                end: endOfWeek(nextAnchor, { weekStartsOn: 1 }),
            }).filter((day) => APPOINTMENT_CONFIG.workingDays.includes(day.getDay()));
            const fallbackDay = nextWeekDays[0] ?? nextAnchor;
            setSelectedDayKey(format(fallbackDay, "yyyy-MM-dd"));
            return nextAnchor;
        });
    }

    return (
        <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(238,243,248,0.96)_46%,_rgba(226,233,241,0.98))] text-slate-950">
            <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-3 px-4 py-3 sm:px-5 lg:px-6">
                <header className="rounded-[28px] border border-white/85 bg-white/92 px-4 py-3 shadow-[0_16px_44px_rgba(15,23,42,0.08)] backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#d91c1c]/10 bg-[#fff1f2] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#d91c1c]">
                                    <span className="h-2 w-2 rounded-full bg-[#d91c1c]" />
                                    {dict.workshopBoard.liveBadge}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                    <Clock3 size={12} className="text-slate-400" />
                                    {tpl(dict.workshopBoard.updatedAt, {
                                        time: format(displayNow, "HH:mm"),
                                    })}
                                </span>
                                {currentAppointment ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                                        <Wrench size={12} />
                                        {dict.workshopBoard.currentJob}: {currentAppointment.timeSlot}
                                    </span>
                                ) : null}
                            </div>
                            <h1 className="mt-2 text-[1.75rem] font-black tracking-tight text-slate-950 lg:text-[2rem]">
                                {dict.workshopBoard.weekTitle}
                            </h1>
                            <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                {format(weekStart, "d MMM", { locale: dateLocale })} - {format(weekEnd, "d MMM yyyy", { locale: dateLocale })}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <p className="text-right text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                {format(displayNow, "EEEE d MMMM", { locale: dateLocale })}
                            </p>
                            <p className="text-[1.95rem] font-black leading-none text-slate-950 tabular-nums lg:text-[2.15rem]">
                                {format(displayNow, "HH:mm:ss")}
                            </p>
                            {showAdminLink ? (
                                <Link
                                    href="/admin/appointments"
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-colors hover:bg-slate-800"
                                >
                                    <ArrowLeft size={14} />
                                    {dict.workshopBoard.backToAdmin}
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => setViewMode("week")}
                                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-colors ${viewMode === "week" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}
                            >
                                {dict.common.week}
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("day")}
                                className={`rounded-full px-3 py-1.5 text-[11px] font-black transition-colors ${viewMode === "day" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}
                            >
                                {dict.common.day}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={goToPreviousWeek}
                            disabled={viewingCurrentWeek}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            <ChevronLeft size={13} />
                            Semaine precedente
                        </button>
                        <button
                            type="button"
                            onClick={goToCurrentWeek}
                            disabled={viewingCurrentWeek}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Aujourd&apos;hui
                        </button>
                        <button
                            type="button"
                            onClick={goToNextWeek}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                            Semaine suivante
                            <ChevronRight size={13} />
                        </button>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            {dict.appointments.statuses.confirmed}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-bold text-sky-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                            {dict.appointments.calendar.internalLegend}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600">
                            {tpl(dict.workshopBoard.todayAppointments, { count: todaysAppointments.length })}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600">
                            {tpl(dict.workshopBoard.internalAppointments, { count: todayInternalCount })}
                        </span>
                        {fullDayBlocked ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700">
                                <Lock size={12} />
                                {dict.workshopBoard.fullDayBlocked}
                            </span>
                        ) : null}
                    </div>
                </header>

                <main className="min-h-0 flex-1">
                    {viewMode === "week" ? (
                        <div className="grid h-full gap-3 xl:grid-cols-5">
                            {weekDays.map((day) => {
                                const dayKey = format(day, "yyyy-MM-dd");
                                const dayAppointments = appointmentsByDay[dayKey] ?? [];
                                const dayBlocks = blocksByDay[dayKey] ?? [];
                                const dayAgendaEntries = buildAgendaEntries(dayAppointments, dayBlocks);
                                const dayHasFullBlock = dayBlocks.some((block) => block.timeSlot === null);
                                const today = isToday(day);
                                const selected = activeDayKey === dayKey;
                                const weekCompact = dayAgendaEntries.length >= 5;

                                return (
                                    <button
                                        type="button"
                                        key={dayKey}
                                        onClick={() => {
                                            setSelectedDayKey(dayKey);
                                            setViewMode("day");
                                        }}
                                        className={`flex min-h-0 flex-col overflow-hidden rounded-[30px] border p-3.5 text-left shadow-[0_14px_36px_rgba(15,23,42,0.07)] transition-transform hover:-translate-y-0.5 ${today ? "border-[#d91c1c]/35 bg-[linear-gradient(180deg,rgba(255,243,243,0.98),rgba(255,249,249,0.96))] ring-2 ring-[#d91c1c]/12 shadow-[0_20px_48px_rgba(217,28,28,0.08)]" : "border-white/80 bg-white/90"} ${selected ? "ring-4 ring-slate-950/10" : ""}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                            <div>
                                                {today ? (
                                                    <span className="inline-flex rounded-full bg-[#d91c1c] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
                                                        {dict.common.today}
                                                    </span>
                                                ) : null}
                                                <p className={`${today ? "mt-2" : "mt-0"} text-[11px] font-black uppercase tracking-[0.22em] ${today ? "text-[#d91c1c]" : "text-slate-400"}`}>
                                                    {format(day, "EEEE", { locale: dateLocale })}
                                                </p>
                                                <div className="mt-2 flex items-end gap-2">
                                                    <p className={`font-black leading-none ${today ? "text-[2.35rem] text-[#d91c1c]" : "text-[2rem] text-slate-950"}`}>
                                                        {format(day, "d", { locale: dateLocale })}
                                                    </p>
                                                    <p className={`pb-1 text-sm font-semibold ${today ? "text-[#d91c1c]/80" : "text-slate-500"}`}>
                                                        {format(day, "MMMM", { locale: dateLocale })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${today ? "border border-[#d91c1c]/15 bg-white text-[#d91c1c]" : "border border-slate-200 bg-white text-slate-500"}`}>
                                                {dayAppointments.length}
                                            </span>
                                        </div>

                                        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                                            {dayAgendaEntries.length === 0 ? (
                                                dayHasFullBlock ? (
                                                    <div className="rounded-[24px] border border-slate-200 bg-slate-100 px-4 py-4 text-left shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-slate-500 shadow-sm">
                                                                <Lock size={16} />
                                                            </span>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                                                    {dict.workshopBoard.blockedMoments}
                                                                </p>
                                                                <p className="text-base font-black text-slate-900">
                                                                    {dict.workshopBoard.fullDayBlocked}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`flex h-full items-center justify-center rounded-[24px] border px-4 py-6 text-center text-sm font-semibold ${today ? "border-[#d91c1c]/20 bg-white text-[#d91c1c]/70" : "border-dashed border-slate-200 bg-slate-50 text-slate-400"}`}>
                                                        {dict.workshopBoard.freeDay}
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex h-full min-h-0 flex-col gap-2">
                                                    {dayHasFullBlock ? (
                                                        <div className="rounded-[20px] border border-slate-200 bg-slate-100/90 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                                                            {dict.workshopBoard.fullDayBlocked}
                                                        </div>
                                                    ) : null}
                                                    {dayAgendaEntries.map((entry) => {
                                                        if (entry.kind === "appointment") {
                                                            return (
                                                                <AppointmentCard
                                                                    key={entry.id}
                                                                    appointment={entry.appointment}
                                                                    compact
                                                                    showNotes={!weekCompact && dayAgendaEntries.length <= 3}
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <BlockedSlotCard
                                                                key={entry.id}
                                                                timeSlot={entry.block.timeSlot}
                                                                reason={entry.block.reason}
                                                                compact
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-full min-h-0 flex-col gap-3">
                            <div className="grid gap-2 md:grid-cols-5">
                                {weekDays.map((day) => {
                                    const dayKey = format(day, "yyyy-MM-dd");
                                    const isSelected = dayKey === activeDayKey;
                                    const today = isToday(day);
                                    return (
                                        <button
                                            key={dayKey}
                                            type="button"
                                            onClick={() => setSelectedDayKey(dayKey)}
                                            className={`rounded-[22px] border px-4 py-2.5 text-left shadow-sm transition-colors ${isSelected ? "border-slate-950 bg-slate-950 text-white" : today ? "border-[#d91c1c]/25 bg-[#fff2f2] text-[#d91c1c]" : "border-white/80 bg-white/90 text-slate-800"}`}
                                        >
                                            <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${isSelected ? "text-white/70" : today ? "text-[#d91c1c]/70" : "text-slate-400"}`}>
                                                {format(day, "EEE", { locale: dateLocale })}
                                            </p>
                                            <p className="mt-2 text-2xl font-black leading-none">
                                                {format(day, "d")}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            <section className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border p-4 shadow-[0_16px_42px_rgba(15,23,42,0.08)] ${isToday(activeDayDate) ? "border-[#d91c1c]/35 bg-[linear-gradient(180deg,rgba(255,245,245,0.98),rgba(255,250,250,0.96))] ring-2 ring-[#d91c1c]/12" : "border-white/85 bg-white/92"}`}>
                                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                                    <div>
                                        {isToday(activeDayDate) ? (
                                            <span className="inline-flex rounded-full bg-[#d91c1c] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
                                                {dict.common.today}
                                            </span>
                                        ) : null}
                                        <h2 className="mt-2 text-[1.95rem] font-black tracking-tight text-slate-950">
                                            {format(activeDayDate, "EEEE d MMMM yyyy", { locale: dateLocale })}
                                        </h2>
                                    </div>
                                    <span className={`rounded-full px-3 py-1.5 text-sm font-black shadow-sm ${isToday(activeDayDate) ? "border border-[#d91c1c]/20 bg-white text-[#d91c1c]" : "border border-slate-200 bg-white text-slate-600"}`}>
                                        {activeDayAppointments.length} rendez-vous
                                    </span>
                                </div>

                                <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                                    {activeDayAgendaEntries.length === 0 ? (
                                        activeDayHasFullBlock ? (
                                            <div className="rounded-[24px] border border-slate-200 bg-slate-100 px-4 py-4 text-left shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-slate-500 shadow-sm">
                                                        <Lock size={18} />
                                                    </span>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                                            {dict.workshopBoard.blockedMoments}
                                                        </p>
                                                        <p className="text-lg font-black text-slate-900">
                                                            {dict.workshopBoard.fullDayBlocked}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-400">
                                                {dict.workshopBoard.freeDay}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex h-full min-h-0 flex-col gap-2.5">
                                            {activeDayHasFullBlock ? (
                                                <div className="rounded-[20px] border border-slate-200 bg-slate-100/90 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
                                                    {dict.workshopBoard.fullDayBlocked}
                                                </div>
                                            ) : null}
                                            {activeDayAgendaEntries.map((entry) => {
                                                if (entry.kind === "appointment") {
                                                    return (
                                                        <AppointmentCard
                                                            key={entry.id}
                                                            appointment={entry.appointment}
                                                            compact={activeDayAgendaEntries.length >= 5}
                                                            showNotes={activeDayAgendaEntries.length <= 4}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <BlockedSlotCard
                                                        key={entry.id}
                                                        timeSlot={entry.block.timeSlot}
                                                        reason={entry.block.reason}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
