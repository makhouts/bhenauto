import { useReducer, useCallback, useEffect, useTransition } from "react";
import { getAvailableDates, getAvailableSlots, bookAppointment } from "@/app/actions/appointments";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "date" | "slot" | "form" | "success";

interface FormData {
    name: string;
    email: string;
    phone: string;
    service: string;
    notes: string;
}

const EMPTY_FORM: FormData = { name: "", email: "", phone: "", service: "", notes: "" };

interface WizardState {
    open: boolean;
    step: Step;
    currentMonth: Date;
    availableDates: Set<string>;
    loadingDates: boolean;
    selectedDate: string | null;
    availableSlots: string[];
    loadingSlots: boolean;
    selectedSlot: string | null;
    formData: FormData;
    formErrors: Partial<FormData>;
    submitError: string | null;
}

type WizardAction =
    | { type: "OPEN" }
    | { type: "CLOSE" }
    | { type: "SET_STEP"; step: Step }
    | { type: "SET_MONTH"; month: Date }
    | { type: "DATES_LOADING" }
    | { type: "DATES_LOADED"; dates: Set<string> }
    | { type: "SELECT_DATE"; dateStr: string }
    | { type: "SLOTS_LOADING" }
    | { type: "SLOTS_LOADED"; slots: string[] }
    | { type: "SELECT_SLOT"; slot: string }
    | { type: "SET_FORM_FIELD"; field: keyof FormData; value: string }
    | { type: "SET_FORM_ERRORS"; errors: Partial<FormData> }
    | { type: "SET_SUBMIT_ERROR"; error: string | null }
    | { type: "SUBMIT_SUCCESS" }
    | { type: "RESET" };

const INITIAL_STATE: WizardState = {
    open: false,
    step: "date",
    currentMonth: new Date(),
    availableDates: new Set(),
    loadingDates: false,
    selectedDate: null,
    availableSlots: [],
    loadingSlots: false,
    selectedSlot: null,
    formData: EMPTY_FORM,
    formErrors: {},
    submitError: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case "OPEN":
            return { ...state, open: true };
        case "CLOSE":
            return { ...state, open: false };
        case "SET_STEP":
            return { ...state, step: action.step };
        case "SET_MONTH":
            return { ...state, currentMonth: action.month };
        case "DATES_LOADING":
            return { ...state, loadingDates: true };
        case "DATES_LOADED":
            return { ...state, loadingDates: false, availableDates: action.dates };
        case "SELECT_DATE":
            return { ...state, selectedDate: action.dateStr, selectedSlot: null, loadingSlots: true, step: "slot" };
        case "SLOTS_LOADING":
            return { ...state, loadingSlots: true };
        case "SLOTS_LOADED":
            return { ...state, loadingSlots: false, availableSlots: action.slots };
        case "SELECT_SLOT":
            return { ...state, selectedSlot: action.slot, step: "form" };
        case "SET_FORM_FIELD":
            return { ...state, formData: { ...state.formData, [action.field]: action.value } };
        case "SET_FORM_ERRORS":
            return { ...state, formErrors: action.errors };
        case "SET_SUBMIT_ERROR":
            return { ...state, submitError: action.error };
        case "SUBMIT_SUCCESS":
            return { ...state, step: "success" };
        case "RESET":
            return {
                ...state,
                step: "date",
                selectedDate: null,
                selectedSlot: null,
                formData: EMPTY_FORM,
                formErrors: {},
                submitError: null,
            };
    }
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useBookingWizard() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const [submitting, startSubmit] = useTransition();

    // Fetch available dates when modal opens or month changes
    const fetchDates = useCallback(async (month: Date) => {
        dispatch({ type: "DATES_LOADING" });
        try {
            const dates = await getAvailableDates(month.getFullYear(), month.getMonth());
            dispatch({ type: "DATES_LOADED", dates: new Set(dates) });
        } catch {
            dispatch({ type: "DATES_LOADED", dates: new Set() });
        }
    }, []);

    useEffect(() => {
        if (state.open) fetchDates(state.currentMonth);
    }, [state.open, state.currentMonth, fetchDates]);

    // Fetch slots when a date is selected
    const handleDateSelect = useCallback(async (dateStr: string) => {
        dispatch({ type: "SELECT_DATE", dateStr });
        try {
            const slots = await getAvailableSlots(dateStr);
            dispatch({ type: "SLOTS_LOADED", slots });
        } catch {
            dispatch({ type: "SLOTS_LOADED", slots: [] });
        }
    }, []);

    const handleSlotSelect = useCallback((slot: string) => {
        dispatch({ type: "SELECT_SLOT", slot });
    }, []);

    const setFormField = useCallback((field: keyof FormData, value: string) => {
        dispatch({ type: "SET_FORM_FIELD", field, value });
    }, []);

    const setStep = useCallback((step: Step) => {
        dispatch({ type: "SET_STEP", step });
    }, []);

    const setMonth = useCallback((updater: Date | ((prev: Date) => Date)) => {
        dispatch({
            type: "SET_MONTH",
            month: typeof updater === "function" ? updater(state.currentMonth) : updater,
        });
    }, [state.currentMonth]);

    const validateForm = useCallback((): boolean => {
        const { formData } = state;
        const errors: Partial<FormData> = {};
        if (!formData.name.trim()) errors.name = "Naam is verplicht";
        if (!formData.email.trim()) errors.email = "E-mail is verplicht";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Ongeldig e-mailadres";
        if (!formData.phone.trim()) errors.phone = "Telefoon is verplicht";
        if (!formData.service) errors.service = "Selecteer een dienst";
        dispatch({ type: "SET_FORM_ERRORS", errors });
        return Object.keys(errors).length === 0;
    }, [state.formData]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm() || !state.selectedDate || !state.selectedSlot) return;
        dispatch({ type: "SET_SUBMIT_ERROR", error: null });

        startSubmit(async () => {
            const result = await bookAppointment({
                dateStr: state.selectedDate!,
                timeSlot: state.selectedSlot!,
                ...state.formData,
            });

            if ("error" in result) {
                dispatch({ type: "SET_SUBMIT_ERROR", error: result.error });
            } else {
                dispatch({ type: "SUBMIT_SUCCESS" });
            }
        });
    }, [validateForm, state.selectedDate, state.selectedSlot, state.formData]);

    const open = useCallback(() => dispatch({ type: "OPEN" }), []);

    const resetAndClose = useCallback(() => {
        dispatch({ type: "CLOSE" });
        setTimeout(() => dispatch({ type: "RESET" }), 300);
    }, []);

    const resetForNew = useCallback(() => {
        dispatch({ type: "RESET" });
    }, []);

    return {
        state,
        submitting,
        handlers: {
            open,
            resetAndClose,
            resetForNew,
            handleDateSelect,
            handleSlotSelect,
            handleSubmit,
            setFormField,
            setStep,
            setMonth,
        },
    };
}
