"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { submitContact } from "@/app/actions/contact";
import { useTurnstile } from "@/hooks/useTurnstile";
import type { CarDetailDict } from "@/lib/dictionaries";

interface CarInlineContactFormProps {
    carSlug: string;
    carTitle: string;
    dict: CarDetailDict;
    locale: string;
    securityError?: string;
}

export default function CarInlineContactForm({
    carSlug,
    carTitle,
    dict,
    locale,
    securityError,
}: CarInlineContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const {
        containerRef: turnstileRef,
        execute: executeTurnstile,
        reset: resetTurnstile,
        isVerifying,
    } = useTurnstile({ action: "car-contact", cData: carSlug.slice(0, 255) });

    const busy = isSubmitting || isVerifying;
    const genericError =
        locale === "fr"
            ? "Une erreur inattendue s'est produite. Veuillez réessayer."
            : locale === "en"
                ? "Something went wrong. Please try again."
                : "Er is een onverwachte fout opgetreden. Probeer opnieuw.";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (busy) return;
        setError(null);
        const form = e.currentTarget;
        const formData = new FormData(e.currentTarget);

        try {
            setIsSubmitting(true);
            let token: string;
            try {
                token = await executeTurnstile();
            } catch {
                setError(securityError ?? "Security check failed. Please refresh the page and try again.");
                return;
            }
            if (token) formData.set("cf-turnstile-response", token);
            formData.set("locale", locale);

            const result = await submitContact(formData);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
                form.reset();
            }
        } catch {
            setError(genericError);
        } finally {
            resetTurnstile();
            setIsSubmitting(false);
        }
    };

    const reset = () => {
        setSuccess(false);
        setError(null);
        resetTurnstile();
    };

    const inputBase =
        "w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors font-medium theme-text placeholder:theme-text-faint disabled:opacity-50";

    const labelBase = "block text-[10px] font-black theme-text-muted uppercase tracking-[0.18em] mb-1.5";

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 px-4 animate-fade-in">
                <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: "var(--theme-icon-bg)" }}
                >
                    <CheckCircle2 size={30} className="text-green-500" />
                </div>
                <h3 className="text-xl font-headings font-black theme-text mb-2">{dict.formSuccessTitle}</h3>
                <p className="theme-text-muted text-sm leading-relaxed max-w-xs">
                    {dict.formSuccessBody} <span className="font-bold theme-text">{carTitle}</span>.
                </p>
                <button
                    onClick={reset}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest theme-text-secondary transition-all duration-300 hover:theme-text"
                    style={{ border: "1px solid var(--theme-border)", backgroundColor: "var(--theme-surface)" }}
                >
                    <RotateCcw size={12} />
                    {dict.formSuccessReset}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="car_reference" value={carSlug} />
                <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                {error && (
                    <div className="p-3 text-xs rounded-xl border bg-red-500/10 border-red-500/30 text-red-500 animate-fade-in">
                        {error}
                    </div>
                )}

                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium theme-text-muted"
                    style={{ backgroundColor: "var(--theme-badge-bg)", border: "1px solid var(--theme-border)" }}
                >
                    <span className="text-[#d91c1c] font-black uppercase tracking-wider text-[9px]">{dict.formVehicleLabel}</span>
                    <span className="theme-text font-bold truncate">{carTitle}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="cf-name" className={labelBase}>
                            {dict.formFieldName} <span className="text-[#d91c1c]">*</span>
                        </label>
                        <input
                            type="text"
                            id="cf-name"
                            name="name"
                            required
                            disabled={busy}
                            className={inputBase}
                            style={{ backgroundColor: "var(--theme-input-bg)", border: "1px solid var(--theme-input-border)" }}
                            placeholder={dict.formPlaceholderName}
                        />
                    </div>
                    <div>
                        <label htmlFor="cf-phone" className={labelBase}>{dict.formFieldPhone}</label>
                        <input
                            type="tel"
                            id="cf-phone"
                            name="phone"
                            disabled={busy}
                            className={inputBase}
                            style={{ backgroundColor: "var(--theme-input-bg)", border: "1px solid var(--theme-input-border)" }}
                            placeholder={dict.formPlaceholderPhone}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="cf-email" className={labelBase}>
                        {dict.formFieldEmail} <span className="text-[#d91c1c]">*</span>
                    </label>
                    <input
                        type="email"
                        id="cf-email"
                        name="email"
                        required
                        disabled={busy}
                        className={inputBase}
                        style={{ backgroundColor: "var(--theme-input-bg)", border: "1px solid var(--theme-input-border)" }}
                        placeholder={dict.formPlaceholderEmail}
                    />
                </div>

                <div>
                    <label htmlFor="cf-message" className={labelBase}>
                        {dict.formFieldMessage} <span className="text-[#d91c1c]">*</span>
                    </label>
                    <textarea
                        id="cf-message"
                        name="message"
                        rows={4}
                        required
                        disabled={busy}
                        className={`${inputBase} resize-none`}
                        style={{ backgroundColor: "var(--theme-input-bg)", border: "1px solid var(--theme-input-border)" }}
                        placeholder={`${dict.ctaAskQuestion}: ${carTitle}...`}
                    />
                </div>

                <button
                    type="submit"
                    disabled={busy}
                    className="group relative w-full bg-[#d91c1c] hover:bg-[#b91515] text-white py-3 font-black rounded-xl uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all duration-300 shadow-lg shadow-[#d91c1c]/20 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#d91c1c]/30 hover:-translate-y-0.5 overflow-hidden"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
                    <span className="relative flex items-center gap-2">
                        {isVerifying ? (
                            <><ShieldCheck size={14} className="animate-pulse" /> {dict.formVerifying}</>
                        ) : isSubmitting ? (
                            <><Loader2 className="animate-spin" size={14} /> {dict.formSubmitting}</>
                        ) : (
                            <>{dict.formSubmit} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" /></>
                        )}
                    </span>
                </button>
            </form>
            <div ref={turnstileRef} className="relative flex justify-center" />
        </div>
    );
}
