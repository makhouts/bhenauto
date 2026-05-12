"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitContact } from "@/app/actions/contact";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import type { ContactDict } from "@/lib/dictionaries";

interface ContactFormProps {
    dark?: boolean;
    dict: ContactDict;
    locale?: string;
}

export default function ContactForm({ dark = false, dict, locale }: ContactFormProps) {
    const searchParams = useSearchParams();
    const carRef = searchParams.get("car");

    // ── Turnstile ──────────────────────────────────────────────────────────────
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [awaitingToken, setAwaitingToken] = useState(false);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileWidgetId = useRef<string | null>(null);
    const pendingFormData = useRef<FormData | null>(null);

    // Always-fresh ref — avoids stale closure in Turnstile callback
    const doSubmitRef = useRef<(formData: FormData) => Promise<void>>(async () => {});

    useEffect(() => {
        // Load Turnstile script once
        if (!document.getElementById("cf-turnstile-script")) {
            const script = document.createElement("script");
            script.id = "cf-turnstile-script";
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
        if (!siteKey || !turnstileRef.current) return;

        const tryRender = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any;
            if (w.turnstile && turnstileRef.current) {
                turnstileWidgetId.current = w.turnstile.render(turnstileRef.current, {
                    sitekey: siteKey,
                    callback: (token: string) => {
                        setTurnstileToken(token);
                        setAwaitingToken(false);
                        // If a submit was waiting for a fresh token, proceed now
                        if (pendingFormData.current) {
                            const fd = pendingFormData.current;
                            pendingFormData.current = null;
                            doSubmitRef.current(fd);
                        }
                    },
                    "expired-callback": () => setTurnstileToken(null),
                    "error-callback": () => {
                        setTurnstileToken(null);
                        setAwaitingToken(false);
                        pendingFormData.current = null;
                    },
                    size: "flexible",
                    appearance: "interaction-only",
                });
            } else {
                setTimeout(tryRender, 300);
            }
        };
        tryRender();
    }, []);

    // ── Wrap submitContact to inject Turnstile token + locale ─────────────────
    const submitFn = useCallback(
        async (formData: FormData) => {
            if (locale) formData.set("locale", locale);
            return submitContact(formData);
        },
        [locale]
    );
    const { isSubmitting, error, success, handleSubmit: baseHandleSubmit, reset } = useFormSubmit(submitFn);

    // Keep ref fresh on every render so Turnstile callback always has live state
    doSubmitRef.current = async (formData: FormData) => {
        formData.set("cf-turnstile-response", turnstileToken ?? "");
        if (locale) formData.set("locale", locale);
        const result = await submitContact(formData);
        // Re-use the hook's dispatch indirectly by triggering a synthetic submit
        // We call baseHandleSubmit's underlying logic via a custom path below
        // Instead: dispatch result through a local state update
        if ("error" in result && result.error) {
            setPendingError(result.error);
        } else {
            setPendingSuccess(true);
        }
        // Reset widget for next use
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        if (turnstileWidgetId.current) w.turnstile?.reset(turnstileWidgetId.current);
    };

    // Local state for the pending-submit path (bypasses useFormSubmit)
    const [pendingError, setPendingError] = useState<string | null>(null);
    const [pendingSuccess, setPendingSuccess] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);

    // Combine states: either the hook is submitting, or we're waiting for token, or we're in the pending path
    const busy = isSubmitting || awaitingToken || isWaiting;
    const showSuccess = success || pendingSuccess;
    const showError = error || pendingError || null;

    // ── Custom submit handler — waits for token if not ready ──────────────────
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPendingError(null);

        const formData = new FormData(e.currentTarget);

        if (turnstileToken) {
            // Token ready — use it immediately, then reset widget
            formData.set("cf-turnstile-response", turnstileToken);
            setTurnstileToken(null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any;
            if (turnstileWidgetId.current) w.turnstile?.reset(turnstileWidgetId.current);
            // Submit via the hook
            baseHandleSubmit(e);
        } else {
            // No token yet — queue the submission and trigger Turnstile
            pendingFormData.current = formData;
            setAwaitingToken(true);
            setIsWaiting(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const w = window as any;
            if (turnstileWidgetId.current) {
                w.turnstile?.reset(turnstileWidgetId.current);
            }
        }
    };

    // ── Reset handler ──────────────────────────────────────────────────────────
    const handleReset = () => {
        reset();
        setPendingError(null);
        setPendingSuccess(false);
        setIsWaiting(false);
        setAwaitingToken(false);
        pendingFormData.current = null;
    };

    // ── shared input style ──
    const inputBase = dark
        ? "w-full bg-white/6 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-all placeholder-slate-600 font-medium disabled:opacity-40"
        : "w-full px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 font-medium theme-text"
            + " placeholder:theme-text-faint";

    const labelBase = dark
        ? "block text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-2"
        : "block text-xs font-bold theme-text-muted uppercase tracking-widest mb-2";

    if (showSuccess) {
        return (
            <div className={`p-8 text-center animate-fade-in relative overflow-hidden rounded-2xl flex flex-col items-center justify-center h-full min-h-[300px] ${dark ? "bg-white/4 border border-white/8" : "shadow-sm"}`} style={!dark ? { backgroundColor: 'var(--theme-surface)', border: '1px solid var(--theme-border)' } : {}}>
                {dark && <div className="absolute inset-0 bg-[#d91c1c]/5 blur-3xl rounded-full" />}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${dark ? "bg-green-500/15 border border-green-500/20" : ""}`} style={!dark ? { backgroundColor: 'var(--theme-icon-bg)' } : {}}>
                    <CheckCircle2 size={36} className="text-green-500" />
                </div>
                <h3 className={`text-2xl font-headings font-black mb-3 ${dark ? "text-white" : "theme-text"}`}>
                    {dict.successTitle}
                </h3>
                <p className={`text-sm leading-relaxed max-w-xs ${dark ? "text-slate-400" : "theme-text-muted font-medium"}`}>
                    {dict.successBody}
                </p>
                <button
                    onClick={handleReset}
                    className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 ${dark ? "border border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/6" : "theme-text-secondary shadow-sm"}`}
                    style={!dark ? { border: '1px solid var(--theme-border)', backgroundColor: 'var(--theme-surface)' } : {}}
                >
                    <RotateCcw size={14} />
                    {dict.successReset}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {showError && (
                <div className={`p-4 text-sm animate-fade-in rounded-xl border ${dark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-500/10 border-red-500 text-red-500"}`}>
                    {showError}
                </div>
            )}

            {carRef && (
                <div className={`p-4 rounded-xl mb-2 ${dark ? "bg-white/6 border border-white/10" : ""}`} style={!dark ? { backgroundColor: 'var(--theme-badge-bg)', border: '1px solid var(--theme-border)' } : {}}>
                    <p className={`text-sm font-medium ${dark ? "text-slate-300" : "theme-text-muted"}`}>
                        <span className="text-[#d91c1c] font-black uppercase tracking-wider text-xs mr-2">{dict.infoRequestLabel}</span>
                        {carRef.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </p>
                    <input type="hidden" name="car_reference" value={carRef} />
                </div>
            )}

            {/* Honeypot */}
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {/* Name + Phone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                    <label htmlFor="name" className={labelBase}>
                        {dict.fieldName} <span className="text-[#d91c1c]">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        disabled={busy}
                        className={inputBase}
                        style={!dark ? { backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)' } : {}}
                        placeholder={dict.placeholderName}
                    />
                </div>
                <div>
                    <label htmlFor="phone" className={labelBase}>
                        {dict.fieldPhone}
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        disabled={busy}
                        className={inputBase}
                        style={!dark ? { backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)' } : {}}
                        placeholder={dict.placeholderPhone}
                    />
                </div>
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className={labelBase}>
                    {dict.fieldEmail} <span className="text-[#d91c1c]">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    disabled={busy}
                    className={inputBase}
                    style={!dark ? { backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)' } : {}}
                    placeholder={dict.placeholderEmail}
                />
            </div>

            {/* Message */}
            <div>
                <label htmlFor="message" className={labelBase}>
                    {dict.fieldMessage} <span className="text-[#d91c1c]">*</span>
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    disabled={busy}
                    className={`${inputBase} resize-none`}
                    style={!dark ? { backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)' } : {}}
                    placeholder={dict.placeholderMessage}
                />
            </div>

            {/* Cloudflare Turnstile — invisible widget */}
            <div ref={turnstileRef} className="hidden" aria-hidden="true" />

            {/* Submit */}
            <button
                type="submit"
                disabled={busy}
                className="group w-full bg-[#d91c1c] hover:bg-[#b91515] text-white py-3.5 font-black rounded-xl uppercase tracking-widest text-sm flex justify-center items-center gap-2 transition-all duration-300 shadow-lg shadow-[#d91c1c]/20 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#d91c1c]/30 hover:-translate-y-0.5 relative overflow-hidden"
            >
                {/* shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
                <span className="relative flex items-center gap-2">
                    {awaitingToken ? (
                        <>
                            <ShieldCheck size={16} className="animate-pulse" />
                            {dict.verifying}
                        </>
                    ) : busy ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            {dict.submitting}
                        </>
                    ) : (
                        <>
                            {dict.submit}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                    )}
                </span>
            </button>
        </form>
    );
}
