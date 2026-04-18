"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  format,
  parseISO,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
  Wrench,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  X,
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  ShieldCheck,
  PaintBucket,
  Microscope,
  MoreHorizontal,
} from "lucide-react";
import { APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
import {
  getAvailableDates,
  getAvailableSlots,
  bookAppointment,
} from "@/app/actions/appointments";
import type { AppointmentDict } from "@/lib/dictionaries";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = "service" | "date" | "details" | "success";

interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  notes: string;
}

const EMPTY_FORM: FormData = { name: "", email: "", phone: "", service: "", notes: "" };

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayFirstDay(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
}

function stepIndex(step: WizardStep): number {
  return ({ service: 0, date: 1, details: 2, success: 3 } as Record<WizardStep, number>)[step];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppointmentBooking({ dict }: { dict: AppointmentDict }) {
  // Build services from dict to keep icons static but titles/descs dynamic
  const SERVICE_ICONS: Record<string, React.ElementType> = {
    "Onderhoud": Wrench,
    "Technische Controle": ShieldCheck,
    "Carrosserie": PaintBucket,
    "Herstellingen": Zap,
    "Diagnose": Microscope,
    "Andere": MoreHorizontal,
  };

  const SERVICES = dict.services.map(s => ({
    id: s.id,
    title: s.title,
    desc: s.desc,
    icon: SERVICE_ICONS[s.id] ?? MoreHorizontal,
  }));

  const STEPS: { id: WizardStep; label: string; num: number }[] = [
    { id: "service", label: dict.stepService, num: 1 },
    { id: "date",    label: dict.stepDate,    num: 2 },
    { id: "details", label: dict.stepDetails, num: 3 },
  ];

  // Weekday labels are locale-neutral (abbreviated Mon—Sun starting Monday)
  const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  const [step, setStep] = useState<WizardStep>("service");

  // Service
  const [selectedService, setSelectedService] = useState("");

  // Date picker
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Slot picker
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // ── Fetch dates whenever step reaches "date" or month changes ─────────────

  useEffect(() => {
    if (step !== "date") return;
    setLoadingDates(true);
    getAvailableDates(currentMonth.getFullYear(), currentMonth.getMonth())
      .then((dates) => setAvailableDates(new Set(dates)))
      .catch(() => setAvailableDates(new Set()))
      .finally(() => setLoadingDates(false));
  }, [step, currentMonth]);

  // ── Date select ───────────────────────────────────────────────────────────

  const handleDateSelect = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(dateStr);
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goForward = () => {
    if (step === "service" && selectedService) {
      setFormData((f) => ({ ...f, service: selectedService }));
      setStep("date");
    } else if (step === "date" && selectedDate && selectedSlot) {
      setStep("details");
    }
  };

  const goBack = () => {
    if (step === "date") setStep("service");
    else if (step === "details") setStep("date");
  };

  const canGoNext =
    (step === "service" && !!selectedService) ||
    (step === "date" && !!selectedDate && !!selectedSlot);

  // ── Submit ────────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errors: Partial<FormData> = {};
    if (!formData.name.trim()) errors.name = dict.errorName;
    if (!formData.email.trim()) errors.email = dict.errorEmail;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = dict.errorEmailInvalid;
    if (!formData.phone.trim()) errors.phone = dict.errorPhone;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedDate || !selectedSlot) return;
    setSubmitError(null);
    startSubmit(async () => {
      const result = await bookAppointment({
        dateStr: selectedDate,
        timeSlot: selectedSlot,
        ...formData,
        service: selectedService || formData.service,
      });
      if ("error" in result) {
        setSubmitError(result.error);
      } else {
        setStep("success");
      }
    });
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const leadingBlanks = getMondayFirstDay(startOfMonth(currentMonth));
  const currentStepIdx = stepIndex(step);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl">

      {/* ── Dark Navy Header ─────────────────────────────────────────────── */}
      <div
        className="relative px-8 pt-10 pb-8 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0f2e 0%, #111827 60%, #1a0505 100%)",
        }}
      >
        {/* Decorative glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#d91c1c]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

        {step !== "success" && (
          <>
            {/* Title */}
            <div className="relative z-10 text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-headings font-black text-white mb-2 tracking-tight">
                {dict.title}
              </h2>
              <p className="text-slate-400 text-sm font-medium max-w-md mx-auto">
                {dict.subtitle}
              </p>
            </div>

            {/* Step Indicator */}
            <div className="relative z-10 flex items-center justify-center">
              {STEPS.map((s, i) => {
                const active = i === currentStepIdx;
                const done = i < currentStepIdx;
                return (
                  <div key={s.id} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-500 ${
                          active
                            ? "bg-[#d91c1c] text-white shadow-lg shadow-[#d91c1c]/40 scale-110"
                            : done
                            ? "bg-white/20 text-white"
                            : "bg-white/5 border border-white/20 text-white/40"
                        }`}
                      >
                        {done ? <CheckCircle size={20} /> : s.num}
                      </div>
                      <span
                        className={`text-[10px] font-black tracking-[0.15em] transition-colors duration-300 ${
                          active ? "text-white" : done ? "text-white/50" : "text-white/25"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>

                    {i < STEPS.length - 1 && (
                      <div className="w-16 md:w-24 h-[2px] mx-2 mb-5 rounded-full overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-[#d91c1c] rounded-full transition-all duration-700 ease-out"
                          style={{ width: i < currentStepIdx ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── White Body ───────────────────────────────────────────────────── */}
      <div className="bg-white px-6 sm:px-8 py-8">

        {/* ── STEP 1: Service ───────────────────────────────────────────── */}
        {step === "service" && (
          <div style={{ animation: "apptSlideIn .3s ease-out" }}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {SERVICES.map((svc) => {
                const Icon = svc.icon;
                const sel = selectedService === svc.id;
                return (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc.id)}
                    className={`group relative text-left p-5 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                      sel
                        ? "border-[#d91c1c] bg-red-50 shadow-md shadow-[#d91c1c]/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-200 ${
                        sel ? "bg-[#d91c1c] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className={`font-bold text-sm mb-1 ${sel ? "text-[#d91c1c]" : "text-slate-800"}`}>
                      {svc.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{svc.desc}</p>
                    {sel && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-[#d91c1c] rounded-full flex items-center justify-center">
                        <CheckCircle size={12} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>


          </div>
        )}

        {/* ── STEP 2: Date & Slot ───────────────────────────────────────── */}
        {step === "date" && (
          <div style={{ animation: "apptSlideIn .3s ease-out" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  <Calendar size={12} /> {dict.pickDate}
                </p>

                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                    disabled={
                      currentMonth.getMonth() === today.getMonth() &&
                      currentMonth.getFullYear() === today.getFullYear()
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <p className="font-bold text-slate-800 text-sm capitalize">
                    {format(currentMonth, "MMMM yyyy", { locale: nl })}
                  </p>
                  <button
                    onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    disabled={currentMonth >= addMonths(today, 3)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAY_LABELS.map((l) => (
                    <div key={l} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                      {l}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                {loadingDates ? (
                  <div className="flex items-center justify-center py-10 text-slate-300">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: leadingBlanks }).map((_, i) => (
                      <div key={`b-${i}`} />
                    ))}
                    {daysInMonth.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isAvailable = availableDates.has(dateStr);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          disabled={!isAvailable}
                          onClick={() => handleDateSelect(dateStr)}
                          className={`aspect-square w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                            isSelected
                              ? "bg-[#d91c1c] text-white shadow-md scale-110 ring-2 ring-[#d91c1c]/25"
                              : isAvailable
                              ? "hover:bg-[#d91c1c]/10 text-slate-800 hover:text-[#d91c1c] hover:scale-105 cursor-pointer"
                              : "text-slate-300 cursor-not-allowed"
                          }`}
                        >
                          {format(day, "d")}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  {dict.availableDaysNote}
                </p>
              </div>

              {/* Slots */}
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                  <Clock size={12} /> {dict.pickSlot}
                </p>

                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-44 text-slate-300 gap-2">
                    <Calendar size={28} />
                    <p className="text-xs font-medium text-slate-400">{dict.selectDateFirst}</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center h-44 text-slate-300">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                    <Clock size={28} className="text-slate-300" />
                    <p className="text-xs font-bold">{dict.noSlots}</p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-[#d91c1c] font-bold hover:underline"
                    >
                      {dict.chooseOtherDate}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-medium text-slate-500 mb-3">
                      {format(parseISO(selectedDate), "EEEE d MMMM", { locale: nl })}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2.5 rounded-xl border-2 font-bold text-xs transition-all duration-150 ${
                            selectedSlot === slot
                              ? "border-[#d91c1c] bg-[#d91c1c] text-white shadow-md"
                              : "border-slate-200 text-slate-600 hover:border-[#d91c1c] hover:text-[#d91c1c]"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Details form ─────────────────────────────────────── */}
        {step === "details" && (
          <div style={{ animation: "apptSlideIn .3s ease-out" }}>
            {/* Summary chip */}
            <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <div className="w-6 h-6 rounded-lg bg-[#d91c1c]/10 flex items-center justify-center text-[#d91c1c]">
                  <Wrench size={12} />
                </div>
                {selectedService}
              </div>
              <div className="w-px h-4 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <div className="w-6 h-6 rounded-lg bg-[#d91c1c]/10 flex items-center justify-center text-[#d91c1c]">
                  <Calendar size={12} />
                </div>
                {selectedDate && format(parseISO(selectedDate), "d MMMM yyyy", { locale: nl })}
              </div>
              <div className="w-px h-4 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <div className="w-6 h-6 rounded-lg bg-[#d91c1c]/10 flex items-center justify-center text-[#d91c1c]">
                  <Clock size={12} />
                </div>
                {selectedSlot}
              </div>
              <button
                onClick={() => setStep("date")}
                className="ml-auto text-xs text-[#d91c1c] font-bold hover:underline"
              >
                {dict.summaryChange}
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="appt-name">
                  <User size={10} /> {dict.fieldName} *
                </label>
                <input
                  id="appt-name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 ${
                    formErrors.name ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-[#d91c1c]"
                  }`}
                  placeholder={dict.placeholderName}
                />
                {formErrors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="appt-phone">
                  <Phone size={10} /> {dict.fieldPhone} *
                </label>
                <input
                  id="appt-phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 ${
                    formErrors.phone ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-[#d91c1c]"
                  }`}
                  placeholder={dict.placeholderPhone}
                />
                {formErrors.phone && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.phone}</p>}
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="appt-email">
                  <Mail size={10} /> {dict.fieldEmail} *
                </label>
                <input
                  id="appt-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 ${
                    formErrors.email ? "border-red-400 bg-red-50/30" : "border-slate-200 focus:border-[#d91c1c]"
                  }`}
                  placeholder={dict.placeholderEmail}
                />
                {formErrors.email && <p className="text-red-500 text-[11px] mt-1 font-medium">{formErrors.email}</p>}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5" htmlFor="appt-notes">
                  <MessageSquare size={10} /> {dict.fieldNotes}{" "}
                  <span className="font-normal text-slate-400 normal-case">{dict.fieldNotesOptional}</span>
                </label>
                <textarea
                  id="appt-notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#d91c1c] text-sm font-medium text-slate-900 placeholder-slate-300 outline-none transition-all duration-200 resize-none bg-white"
                  placeholder={dict.placeholderNotes}
                />
              </div>

              {/* Error */}
              {submitError && (
                <div className="sm:col-span-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
                  <X size={15} className="shrink-0 mt-0.5" />
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="sm:col-span-2 flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex items-center gap-2 bg-[#d91c1c] text-white px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#b91515] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#d91c1c]/20 hover:shadow-[#d91c1c]/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Bezig…</>
                  ) : (
                    <>Afspraak bevestigen <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" /></>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SUCCESS ───────────────────────────────────────────────────── */}
        {step === "success" && (
          <div
            className="text-center py-12"
            style={{ animation: "apptSlideIn .4s ease-out" }}
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 ring-4 ring-green-50">
              <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-black font-headings text-slate-900 mb-3">
              {dict.successTitle}
            </h3>
            <p className="text-slate-500 font-medium mb-2 max-w-sm mx-auto">
              {dict.successBody}{" "}
              <span className="font-bold text-slate-700">
                {selectedDate && format(parseISO(selectedDate), "d MMMM yyyy", { locale: nl })}
              </span>{" "}
              {dict.successBodyAt} <span className="font-bold text-slate-700">{selectedSlot}</span> {dict.successBodyReceived}
            </p>
            <p className="text-sm text-slate-400 font-medium mb-8">
              {dict.successConfirm}
            </p>
            <button
              onClick={() => {
                setStep("service");
                setSelectedService("");
                setSelectedDate(null);
                setSelectedSlot(null);
                setFormData(EMPTY_FORM);
                setFormErrors({});
                setSubmitError(null);
              }}
              className="bg-[#d91c1c] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#b91515] transition-colors shadow-md"
            >
              {dict.successNewButton}
            </button>
          </div>
        )}
      </div>

      {/* ── Footer navigation ─────────────────────────────────────────── */}
      {step !== "success" && (
        <div className="bg-white border-t border-slate-100 px-6 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className={`flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors duration-200 ${
              step === "service" ? "invisible pointer-events-none" : ""
            }`}
          >
            <ChevronLeft size={16} />
            {dict.back}
          </button>

          {step !== "details" && (
            <button
              onClick={goForward}
              disabled={!canGoNext}
              className="group inline-flex items-center gap-2 bg-[#d91c1c] text-white px-7 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#b91515] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#d91c1c]/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              {dict.next}
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes apptSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
