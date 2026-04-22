import { useReducer, useCallback, useTransition, useMemo } from "react";
import {
    format, startOfWeek, endOfWeek,
    eachDayOfInterval,
} from "date-fns";
import { toast } from "sonner";
import {
    confirmAppointment, cancelAppointment,
    createAdminAppointment, updateAppointment, updateAppointmentDuration,
    blockSlot, unblockSlot,
} from "@/app/actions/admin-appointments";
import type { BlockedDateEntry } from "@/app/actions/admin-appointments";
import { generateDaySlots, APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";

// Re-export for consumers
export type { BlockedDateEntry };

// ─── Types ─────────────────────────────────────────────────────────────────────

// We define our own Appointment type so it's decoupled from Prisma
export interface Appointment {
    id: string;
    date: Date;
    timeSlot: string;
    name: string;
    email: string;
    phone: string;
    service: string;
    notes: string | null;
    status: string;
    durationHours: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AptForm {
    name: string; email: string; phone: string; service: string;
    notes: string; dateStr: string; slot: string;
    status: "pending" | "confirmed" | "cancelled";
    durationHours: number;
}

const EMPTY_FORM: AptForm = { name: "", email: "", phone: "", service: "", notes: "", dateStr: "", slot: "", status: "confirmed", durationHours: 1 };

interface BlockForm {
    dateStr: string;
    slot: string | null;
    reason: string;
}

// ─── State ─────────────────────────────────────────────────────────────────────

interface AppointmentsState {
    // Core data
    appointments: Appointment[];
    blocks: BlockedDateEntry[];
    weekAnchor: Date;

    // Popovers
    popoverId: string | null;
    slotPopover: { dateStr: string; slot: string } | null;

    // Create modal
    createOpen: boolean;
    createForm: AptForm;
    createErrors: Partial<AptForm>;
    createError: string | null;
    createMonth: Date;

    // Edit modal
    editOpen: boolean;
    editId: string | null;
    editForm: AptForm;
    editErrors: Partial<AptForm>;
    editError: string | null;
    editMonth: Date;

    // Block modal
    blockOpen: boolean;
    blockForm: BlockForm;
    blockError: string | null;
    blockMonth: Date;

    // Confirm modal
    confirmModalId: string | null;
    confirmDuration: number;
}

// ─── Actions ───────────────────────────────────────────────────────────────────

type Action =
    // Core data
    | { type: "SET_APPOINTMENTS"; appointments: Appointment[] }
    | { type: "UPDATE_APPOINTMENT"; id: string; updates: Partial<Appointment> }
    | { type: "ADD_APPOINTMENT"; appointment: Appointment }
    | { type: "REMOVE_APPOINTMENT"; id: string }
    | { type: "SET_BLOCKS"; blocks: BlockedDateEntry[] }
    | { type: "ADD_BLOCKS"; blocks: BlockedDateEntry[] }
    | { type: "REMOVE_BLOCK"; id: string }
    | { type: "SET_WEEK_ANCHOR"; anchor: Date }
    // Popovers
    | { type: "SET_POPOVER"; id: string | null }
    | { type: "SET_SLOT_POPOVER"; popover: { dateStr: string; slot: string } | null }
    // Create modal
    | { type: "OPEN_CREATE"; dateStr?: string; slot?: string }
    | { type: "CLOSE_CREATE" }
    | { type: "SET_CREATE_FORM"; form: AptForm }
    | { type: "SET_CREATE_ERRORS"; errors: Partial<AptForm> }
    | { type: "SET_CREATE_ERROR"; error: string | null }
    | { type: "SET_CREATE_MONTH"; month: Date }
    // Edit modal
    | { type: "OPEN_EDIT"; id: string; form: AptForm; month: Date }
    | { type: "CLOSE_EDIT" }
    | { type: "SET_EDIT_FORM"; form: AptForm }
    | { type: "SET_EDIT_ERRORS"; errors: Partial<AptForm> }
    | { type: "SET_EDIT_ERROR"; error: string | null }
    | { type: "SET_EDIT_MONTH"; month: Date }
    // Block modal
    | { type: "OPEN_BLOCK"; dateStr?: string; slot?: string | null }
    | { type: "CLOSE_BLOCK" }
    | { type: "SET_BLOCK_FORM"; form: BlockForm }
    | { type: "SET_BLOCK_ERROR"; error: string | null }
    | { type: "SET_BLOCK_MONTH"; month: Date }
    // Confirm modal
    | { type: "OPEN_CONFIRM"; id: string }
    | { type: "CLOSE_CONFIRM" }
    | { type: "SET_CONFIRM_DURATION"; duration: number }
    // Edit duration (from drag or modal picker)
    | { type: "SET_EDIT_DURATION"; duration: number };

function reducer(state: AppointmentsState, action: Action): AppointmentsState {
    switch (action.type) {
        // Core data
        case "SET_APPOINTMENTS":
            return { ...state, appointments: action.appointments };
        case "UPDATE_APPOINTMENT":
            return {
                ...state,
                appointments: state.appointments.map(a =>
                    a.id === action.id ? { ...a, ...action.updates } : a
                ),
            };
        case "ADD_APPOINTMENT":
            return { ...state, appointments: [...state.appointments, action.appointment] };
        case "REMOVE_APPOINTMENT":
            return { ...state, appointments: state.appointments.filter(a => a.id !== action.id) };
        case "SET_BLOCKS":
            return { ...state, blocks: action.blocks };
        case "ADD_BLOCKS":
            return {
                ...state,
                blocks: [
                    ...state.blocks,
                    ...action.blocks.filter(nb =>
                        !state.blocks.some(b =>
                            format(b.date, "yyyy-MM-dd") === format(nb.date, "yyyy-MM-dd") && b.timeSlot === nb.timeSlot
                        )
                    ),
                ],
            };
        case "REMOVE_BLOCK":
            return { ...state, blocks: state.blocks.filter(b => b.id !== action.id) };
        case "SET_WEEK_ANCHOR":
            return { ...state, weekAnchor: action.anchor };

        // Popovers
        case "SET_POPOVER":
            return { ...state, popoverId: action.id };
        case "SET_SLOT_POPOVER":
            return { ...state, slotPopover: action.popover };

        // Create modal
        case "OPEN_CREATE":
            return {
                ...state,
                createOpen: true,
                createForm: { ...EMPTY_FORM, dateStr: action.dateStr ?? "", slot: action.slot ?? "" },
                createErrors: {},
                createError: null,
                createMonth: action.dateStr ? new Date(action.dateStr) : new Date(),
            };
        case "CLOSE_CREATE":
            return { ...state, createOpen: false };
        case "SET_CREATE_FORM":
            return { ...state, createForm: action.form };
        case "SET_CREATE_ERRORS":
            return { ...state, createErrors: action.errors };
        case "SET_CREATE_ERROR":
            return { ...state, createError: action.error };
        case "SET_CREATE_MONTH":
            return { ...state, createMonth: action.month };

        // Edit modal
        case "OPEN_EDIT":
            return {
                ...state,
                editOpen: true,
                editId: action.id,
                editForm: action.form,
                editErrors: {},
                editError: null,
                editMonth: action.month,
                popoverId: null,
            };
        case "CLOSE_EDIT":
            return { ...state, editOpen: false };
        case "SET_EDIT_FORM":
            return { ...state, editForm: action.form };
        case "SET_EDIT_ERRORS":
            return { ...state, editErrors: action.errors };
        case "SET_EDIT_ERROR":
            return { ...state, editError: action.error };
        case "SET_EDIT_MONTH":
            return { ...state, editMonth: action.month };

        // Block modal
        case "OPEN_BLOCK":
            return {
                ...state,
                blockOpen: true,
                blockForm: { dateStr: action.dateStr ?? "", slot: action.slot ?? null, reason: "" },
                blockError: null,
                blockMonth: action.dateStr ? new Date(action.dateStr) : new Date(),
                slotPopover: null,
            };
        case "CLOSE_BLOCK":
            return { ...state, blockOpen: false };
        case "SET_BLOCK_FORM":
            return { ...state, blockForm: action.form };
        case "SET_BLOCK_ERROR":
            return { ...state, blockError: action.error };
        case "SET_BLOCK_MONTH":
            return { ...state, blockMonth: action.month };

        // Confirm modal
        case "OPEN_CONFIRM":
            return { ...state, confirmModalId: action.id, confirmDuration: 1 };
        case "CLOSE_CONFIRM":
            return { ...state, confirmModalId: null };
        case "SET_CONFIRM_DURATION":
            return { ...state, confirmDuration: action.duration };
        case "SET_EDIT_DURATION":
            return { ...state, editForm: { ...state.editForm, durationHours: action.duration } };
    }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

const ALL_SLOTS = generateDaySlots();

export function useAppointmentsReducer(
    init: Appointment[],
    initBlocks: BlockedDateEntry[]
) {
    const [state, dispatch] = useReducer(reducer, {
        appointments: init,
        blocks: initBlocks,
        weekAnchor: new Date(),
        popoverId: null,
        slotPopover: null,
        createOpen: false,
        createForm: EMPTY_FORM,
        createErrors: {},
        createError: null,
        createMonth: new Date(),
        editOpen: false,
        editId: null,
        editForm: EMPTY_FORM,
        editErrors: {},
        editError: null,
        editMonth: new Date(),
        blockOpen: false,
        blockForm: { dateStr: "", slot: null, reason: "" },
        blockError: null,
        blockMonth: new Date(),
        confirmModalId: null,
        confirmDuration: 1,
    });

    const [isPending, startT] = useTransition();
    const [createSub, startCreate] = useTransition();
    const [editSub, startEdit] = useTransition();
    const [blockSub, startBlock] = useTransition();
    const [confirmSub, startConfirm] = useTransition();

    // ── Derived data ──────────────────────────────────────────────────────────

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const weekStart = startOfWeek(state.weekAnchor, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(state.weekAnchor, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).slice(0, 5);

    const pendingApts = useMemo(() =>
        state.appointments
            .filter(a => a.status === "pending")
            .sort((a, b) => a.date.getTime() - b.date.getTime() || a.timeSlot.localeCompare(b.timeSlot)),
        [state.appointments]
    );

    // Build lookup maps
    const calData = useMemo(() => {
        const map: Record<string, Record<string, Appointment[]>> = {};
        for (const a of state.appointments) {
            if (a.status === "cancelled") continue;
            const k = format(a.date, "yyyy-MM-dd");
            if (!map[k]) map[k] = {};
            if (!map[k][a.timeSlot]) map[k][a.timeSlot] = [];
            map[k][a.timeSlot].push(a);
        }
        return map;
    }, [state.appointments]);

    const { blockedDays, blockedSlots } = useMemo(() => {
        const days = new Set<string>();
        const slots: Record<string, Set<string>> = {};
        for (const b of state.blocks) {
            const ds = format(b.date, "yyyy-MM-dd");
            if (b.timeSlot === null) {
                days.add(ds);
            } else {
                if (!slots[ds]) slots[ds] = new Set();
                slots[ds].add(b.timeSlot);
            }
        }
        return { blockedDays: days, blockedSlots: slots };
    }, [state.blocks]);

    const isSlotBlocked = useCallback((dateStr: string, slot: string) => {
        return blockedDays.has(dateStr) || (blockedSlots[dateStr]?.has(slot) ?? false);
    }, [blockedDays, blockedSlots]);

    const getBlockId = useCallback((dateStr: string, slot: string | null): string | null => {
        return state.blocks.find(b => format(b.date, "yyyy-MM-dd") === dateStr && b.timeSlot === slot)?.id ?? null;
    }, [state.blocks]);

    const weekTotal = useMemo(() =>
        state.appointments.filter(a => a.date >= weekStart && a.date <= weekEnd && a.status !== "cancelled").length,
        [state.appointments, weekStart, weekEnd]
    );

    // Slot availability helpers for modals
    const availCreate = useMemo(() => {
        const booked = state.createForm.dateStr ? (calData[state.createForm.dateStr] ?? {}) : {};
        return ALL_SLOTS.filter(s =>
            (booked[s] ?? []).length < APPOINTMENT_CONFIG.maxBookingsPerSlot && !isSlotBlocked(state.createForm.dateStr, s)
        );
    }, [state.createForm.dateStr, calData, isSlotBlocked]);

    const availEdit = useMemo(() => {
        const booked = state.editForm.dateStr ? (calData[state.editForm.dateStr] ?? {}) : {};
        return ALL_SLOTS.filter(s => {
            const others = (booked[s] ?? []).filter(a => a.id !== state.editId).length;
            return others < APPOINTMENT_CONFIG.maxBookingsPerSlot;
        });
    }, [state.editForm.dateStr, state.editId, calData]);

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = useCallback((f: AptForm, setErrors: (errors: Partial<AptForm>) => void): boolean => {
        const e: Partial<AptForm> = {};
        if (!f.name.trim()) e.name = "Naam is verplicht";
        if (!f.email.trim()) e.email = "E-mail is verplicht";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Ongeldig e-mailadres";
        if (!f.phone.trim()) e.phone = "Telefoon is verplicht";
        if (!f.service) e.service = "Selecteer een dienst";
        if (!f.dateStr) e.dateStr = "Selecteer een datum";
        if (!f.slot) e.slot = "Selecteer een tijdslot";
        setErrors(e);
        return Object.keys(e).length === 0;
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const openConfirm = useCallback((id: string) => dispatch({ type: "OPEN_CONFIRM", id }), []);

    const handleConfirmSubmit = useCallback(() => {
        if (!state.confirmModalId) return;
        const capturedId = state.confirmModalId;
        const capturedDuration = state.confirmDuration;

        startConfirm(async () => {
            const r = await confirmAppointment(capturedId, capturedDuration);
            if ("error" in r) { toast.error(r.error); return; }
            dispatch({ type: "UPDATE_APPOINTMENT", id: capturedId, updates: { status: "confirmed", durationHours: capturedDuration } });
            dispatch({ type: "CLOSE_CONFIRM" });
            toast.success(`Afspraak bevestigd${capturedDuration > 1 ? ` · ${capturedDuration}u` : ""}.`);
        });
    }, [state.confirmModalId, state.confirmDuration, state.appointments]);

    const handleCancel = useCallback((id: string) => startT(async () => {
        // Capture appointment info before deletion for block cleanup
        const apt = state.appointments.find(a => a.id === id);
        const r = await cancelAppointment(id);
        if ("error" in r) toast.error(r.error);
        else {
            dispatch({ type: "REMOVE_APPOINTMENT", id });
            // Also remove any stale "Gereserveerd" blocks from local state
            if (apt && (apt.durationHours ?? 1) > 1) {
                const slots = generateDaySlots();
                const idx = slots.indexOf(apt.timeSlot);
                const followSlots = new Set(slots.slice(idx + 1, idx + (apt.durationHours ?? 1)));
                const ds = format(apt.date, "yyyy-MM-dd");
                state.blocks
                    .filter(b => format(b.date, "yyyy-MM-dd") === ds && b.timeSlot && followSlots.has(b.timeSlot) && b.reason?.startsWith("Gereserveerd"))
                    .forEach(b => dispatch({ type: "REMOVE_BLOCK", id: b.id }));
            }
            toast.success("Afspraak verwijderd.");
        }
    }), [state.appointments, state.blocks]);

    const openCreate = useCallback((dateStr = "", slot = "") => {
        dispatch({ type: "OPEN_CREATE", dateStr, slot });
    }, []);

    const openEdit = useCallback((apt: Appointment) => {
        const ds = format(apt.date, "yyyy-MM-dd");
        dispatch({
            type: "OPEN_EDIT",
            id: apt.id,
            form: {
                name: apt.name, email: apt.email, phone: apt.phone,
                service: apt.service, notes: apt.notes ?? "", dateStr: ds,
                slot: apt.timeSlot, status: apt.status as "pending" | "confirmed" | "cancelled",
                durationHours: apt.durationHours ?? 1,
            },
            month: new Date(ds),
        });
    }, []);

    const openBlock = useCallback((dateStr = "", slot: string | null = null) => {
        dispatch({ type: "OPEN_BLOCK", dateStr, slot });
    }, []);

    const handleCreateSubmit = useCallback((ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate(state.createForm, (errs) => dispatch({ type: "SET_CREATE_ERRORS", errors: errs }))) return;
        dispatch({ type: "SET_CREATE_ERROR", error: null });

        startCreate(async () => {
            const dur = state.createForm.durationHours ?? 1;
            const r = await createAdminAppointment({
                dateStr: state.createForm.dateStr, timeSlot: state.createForm.slot,
                name: state.createForm.name, email: state.createForm.email,
                phone: state.createForm.phone, service: state.createForm.service,
                notes: state.createForm.notes, durationHours: dur,
            });
            if ("error" in r) { dispatch({ type: "SET_CREATE_ERROR", error: r.error }); return; }
            const [y, m, d] = state.createForm.dateStr.split("-").map(Number);
            const newDate = new Date(y, m - 1, d);
            // Block follow-on slots optimistically
            if (dur > 1) {
                const slots = generateDaySlots();
                const idx = slots.indexOf(state.createForm.slot);
                const newBlocks = slots.slice(idx + 1, idx + dur).map((s, i) => ({
                    id: `tmp-${r.id}-${i}`, date: newDate, timeSlot: s,
                    reason: `Gereserveerd · ${state.createForm.name}`,
                }));
                dispatch({ type: "ADD_BLOCKS", blocks: newBlocks });
            }
            dispatch({
                type: "ADD_APPOINTMENT",
                appointment: {
                    id: r.id, date: newDate, timeSlot: state.createForm.slot,
                    name: state.createForm.name.trim(), email: state.createForm.email.trim().toLowerCase(),
                    phone: state.createForm.phone.trim(), service: state.createForm.service,
                    notes: state.createForm.notes.trim() || null, status: "confirmed",
                    durationHours: dur, createdAt: new Date(), updatedAt: new Date(),
                },
            });
            dispatch({ type: "CLOSE_CREATE" });
            toast.success(`Afspraak aangemaakt${dur > 1 ? ` · ${dur}u` : ""}.`);
        });
    }, [state.createForm, validate]);

    const handleEditSubmit = useCallback((ev: React.FormEvent) => {
        ev.preventDefault();
        if (!state.editId || !validate(state.editForm, (errs) => dispatch({ type: "SET_EDIT_ERRORS", errors: errs }))) return;
        dispatch({ type: "SET_EDIT_ERROR", error: null });
        const capturedEditId = state.editId;

        startEdit(async () => {
            const r = await updateAppointment({
                id: capturedEditId, dateStr: state.editForm.dateStr, timeSlot: state.editForm.slot,
                status: state.editForm.status, name: state.editForm.name, email: state.editForm.email,
                phone: state.editForm.phone, service: state.editForm.service, notes: state.editForm.notes,
                durationHours: state.editForm.durationHours,
            });
            if ("error" in r) { dispatch({ type: "SET_EDIT_ERROR", error: r.error }); return; }
            const [y, m, d] = state.editForm.dateStr.split("-").map(Number);
            // Re-compute follow-on blocks for the new duration
            const slots = generateDaySlots();
            const idx = slots.indexOf(state.editForm.slot);
            const newBlocks = state.editForm.durationHours > 1
                ? slots.slice(idx + 1, idx + state.editForm.durationHours).map((s, i) => ({
                    id: `tmp-${capturedEditId}-${i}`, date: new Date(y, m - 1, d), timeSlot: s,
                    reason: `Gereserveerd · ${state.editForm.name}`,
                }))
                : [];
            dispatch({
                type: "UPDATE_APPOINTMENT",
                id: capturedEditId,
                updates: {
                    date: new Date(y, m - 1, d), timeSlot: state.editForm.slot,
                    status: state.editForm.status, name: state.editForm.name.trim(),
                    email: state.editForm.email.trim().toLowerCase(), phone: state.editForm.phone.trim(),
                    service: state.editForm.service, notes: state.editForm.notes.trim() || null,
                    durationHours: state.editForm.durationHours, updatedAt: new Date(),
                },
            });
            dispatch({ type: "CLOSE_EDIT" });
            toast.success("Afspraak bijgewerkt.");
        });
    }, [state.editId, state.editForm, validate]);

    const handleBlockSubmit = useCallback((ev: React.FormEvent) => {
        ev.preventDefault();
        if (!state.blockForm.dateStr) { dispatch({ type: "SET_BLOCK_ERROR", error: "Selecteer een datum." }); return; }
        dispatch({ type: "SET_BLOCK_ERROR", error: null });

        startBlock(async () => {
            const r = await blockSlot({
                dateStr: state.blockForm.dateStr,
                timeSlot: state.blockForm.slot || null,
                reason: state.blockForm.reason,
            });
            if ("error" in r) { dispatch({ type: "SET_BLOCK_ERROR", error: r.error }); return; }
            const [y, m, d] = state.blockForm.dateStr.split("-").map(Number);
            dispatch({
                type: "ADD_BLOCKS",
                blocks: [{
                    id: r.id, date: new Date(y, m - 1, d),
                    timeSlot: state.blockForm.slot, reason: state.blockForm.reason.trim() || null,
                }],
            });
            dispatch({ type: "CLOSE_BLOCK" });
            toast.success(state.blockForm.slot ? "Tijdslot geblokkeerd." : "Dag geblokkeerd.");
        });
    }, [state.blockForm]);

    const handleUnblock = useCallback((id: string) => startT(async () => {
        const r = await unblockSlot(id);
        if ("error" in r) toast.error(r.error);
        else {
            dispatch({ type: "REMOVE_BLOCK", id });
            toast.success("Blokkering verwijderd.");
        }
    }), []);

    const handleResizeDrag = useCallback((aptId: string, newDuration: number) => {
        // Optimistic update
        dispatch({ type: "UPDATE_APPOINTMENT", id: aptId, updates: { durationHours: newDuration } });
        startT(async () => {
            const r = await updateAppointmentDuration(aptId, newDuration);
            if ("error" in r) {
                toast.error(r.error);
                // Revert — reload from DB would require a full refresh, so just notify
            } else {
                toast.success(`Duur bijgewerkt naar ${newDuration}u.`);
            }
        });
    }, []);

    return {
        state,
        dispatch,
        isPending,
        createSub,
        editSub,
        blockSub,
        confirmSub,
        derived: {
            today,
            weekStart,
            weekEnd,
            weekDays,
            pendingApts,
            calData,
            blockedDays,
            blockedSlots,
            weekTotal,
            availCreate,
            availEdit,
            isSlotBlocked,
            getBlockId,
        },
        handlers: {
            openConfirm,
            handleConfirmSubmit,
            handleCancel,
            openCreate,
            openEdit,
            openBlock,
            handleCreateSubmit,
            handleEditSubmit,
            handleBlockSubmit,
            handleUnblock,
            handleResizeDrag,
        },
    };
}
