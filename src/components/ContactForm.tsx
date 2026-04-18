"use client";

import { useCallback } from "react";
import { submitContact } from "@/app/actions/contact";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { useFormSubmit } from "@/hooks/useFormSubmit";
import type { ContactDict } from "@/lib/dictionaries";

interface ContactFormProps {
    dark?: boolean;
    dict: ContactDict;
}

export default function ContactForm({ dark = false, dict }: ContactFormProps) {
    const searchParams = useSearchParams();
    const carRef = searchParams.get("car");

    const submitFn = useCallback(
        async (formData: FormData) => submitContact(formData),
        []
    );
    const { isSubmitting, error, success, handleSubmit, reset } = useFormSubmit(submitFn);

    // ── shared input style ──
    const inputBase = dark
        ? "w-full bg-white/6 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-all placeholder-slate-600 font-medium disabled:opacity-40"
        : "w-full px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 font-medium theme-text"
            + " placeholder:theme-text-faint";

    const labelBase = dark
        ? "block text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] mb-2"
        : "block text-xs font-bold theme-text-muted uppercase tracking-widest mb-2";

    if (success) {
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
                    onClick={reset}
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
            {error && (
                <div className={`p-4 text-sm animate-fade-in rounded-xl border ${dark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-500/10 border-red-500 text-red-500"}`}>
                    {error}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                    className={`${inputBase} resize-none`}
                    style={!dark ? { backgroundColor: 'var(--theme-input-bg)', border: '1px solid var(--theme-input-border)' } : {}}
                    placeholder={dict.placeholderMessage}
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full bg-[#d91c1c] hover:bg-[#b91515] text-white py-3.5 font-black rounded-xl uppercase tracking-widest text-sm flex justify-center items-center gap-2 transition-all duration-300 shadow-lg shadow-[#d91c1c]/20 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-xl hover:shadow-[#d91c1c]/30 hover:-translate-y-0.5 relative overflow-hidden"
            >
                {/* shimmer */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
                <span className="relative flex items-center gap-2">
                    {isSubmitting ? (
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
