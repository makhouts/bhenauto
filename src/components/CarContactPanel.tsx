"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Phone, Mail, ArrowLeft } from "lucide-react";
import type { CarDetailDict } from "@/lib/dictionaries";
import { PublicEmail, PublicEmailLink } from "@/components/PublicEmail";

interface CarContactPanelProps {
    lang: string;
    carSlug: string;
    carTitle: string;
    whatsappUrl: string;
    sold: boolean;
    dict: CarDetailDict;
    securityError?: string;
}

const InlineContactForm = dynamic(() => import("@/components/CarInlineContactForm"), {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-2xl" style={{ backgroundColor: "var(--theme-bg-alt)" }} />,
});

// ── Main panel ─────────────────────────────────────────────────────────────
export default function CarContactPanel({ lang, carSlug, carTitle, whatsappUrl, sold, dict, securityError }: CarContactPanelProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div
            className="theme-surface rounded-[28px] shadow-xl relative overflow-hidden"
            style={{ border: "1px solid var(--theme-border)" }}
        >
            {/* Decorative gradient blob */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-red-50/50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />

            {/* ── FRONT: "Interesse?" ── */}
            <div
                className="transition-all duration-500 ease-in-out"
                style={{
                    opacity: showForm ? 0 : 1,
                    transform: showForm ? "translateY(-12px) scale(0.97)" : "translateY(0) scale(1)",
                    pointerEvents: showForm ? "none" : "auto",
                    position: showForm ? "absolute" : "relative",
                    inset: 0,
                    padding: "2rem",
                }}
            >
                <h3 className="text-[32px] font-headings font-black theme-text mb-8 tracking-tight text-left relative z-10">
                    {dict.contactTitle}
                </h3>

                <div className="space-y-4 mb-8 relative z-10">
                    {/* Phone */}
                    <a href="tel:+3225828353" className="group flex items-center rounded-[16px] p-4 transition-all duration-300 hover:shadow-md hover:border-[#d91c1c]/30"
                        style={{ backgroundColor: "var(--theme-bg-alt)", border: "1px solid var(--theme-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                        <div className="flex items-center justify-center text-[#d91c1c] mr-5">
                            <Phone className="w-[22px] h-[22px] transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mb-1.5">{dict.contactPhone}</p>
                            <p className="text-lg font-black theme-text tracking-tight group-hover:text-[#d91c1c] transition-colors">02 582 83 53</p>
                        </div>
                    </a>

                    {/* WhatsApp */}
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        className="group flex items-center rounded-[16px] p-4 transition-all duration-300 hover:shadow-md"
                        style={{ backgroundColor: "var(--theme-bg-alt)", border: "1px solid var(--theme-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                        <div className="flex items-center justify-center text-[#25D366] mr-5">
                            <svg className="w-[22px] h-[22px] transform group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mb-1.5">{dict.contactWhatsApp}</p>
                            <p className="text-[15px] font-bold theme-text tracking-tight group-hover:text-[#25D366] transition-colors">{dict.contactWhatsAppText}</p>
                        </div>
                    </a>

                    {/* Mail */}
                    <PublicEmailLink className="group flex items-center rounded-[16px] p-4 transition-all duration-300 hover:shadow-md"
                        style={{ backgroundColor: "var(--theme-bg-alt)", border: "1px solid var(--theme-border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                        <div className="flex items-center justify-center text-[#d91c1c] mr-5">
                            <Mail className="w-[22px] h-[22px] transform group-hover:scale-110 group-hover:translate-y-px transition-transform duration-300" strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-bold theme-text-muted uppercase tracking-widest mb-1.5">{dict.contactMail}</p>
                            <p className="text-[15px] font-bold theme-text tracking-tight group-hover:text-[#d91c1c] transition-colors"><PublicEmail /></p>
                        </div>
                    </PublicEmailLink>
                </div>

                {/* Action buttons */}
                <div className="space-y-4 relative z-10">
                    {sold ? (
                        <div className="rounded-2xl p-5 text-center"
                            style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <p className="text-white font-black text-sm uppercase tracking-[0.16em] mb-1.5">{dict.soldCardTitle}</p>
                            <p className="text-slate-400 text-[12px] leading-relaxed mb-4">{dict.soldCardBody}</p>
                            <Link href={`/${lang}/inventory`}
                                className="inline-flex items-center justify-center w-full py-3 rounded-xl text-[12px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
                                style={{ border: "1px solid rgba(255,255,255,0.18)" }}>
                                {dict.soldCardCta}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center justify-center w-full py-4.5 bg-[#e61919] hover:bg-[#b91515] active:bg-[#a01010] text-white font-black text-[13px] uppercase tracking-widest rounded-2xl transition-all duration-300 hover:shadow-[0_8px_25px_rgba(230,25,25,0.35)] hover:-translate-y-1"
                            >
                                {dict.ctaAskQuestion}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── BACK: Inline contact form ── */}
            <div
                className="transition-all duration-500 ease-in-out"
                style={{
                    opacity: showForm ? 1 : 0,
                    transform: showForm ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
                    pointerEvents: showForm ? "auto" : "none",
                    position: showForm ? "relative" : "absolute",
                    inset: 0,
                    padding: "1.75rem",
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <button
                        onClick={() => setShowForm(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center theme-text-muted hover:theme-text transition-colors shrink-0"
                        style={{ backgroundColor: "var(--theme-bg-alt)", border: "1px solid var(--theme-border)" }}
                        aria-label={dict.formBack}
                    >
                        <ArrowLeft size={14} />
                    </button>
                    <div>
                        <h3 className="text-lg font-headings font-black theme-text leading-tight">{dict.formTitle}</h3>
                        <p className="text-[11px] theme-text-muted">{dict.formSubtitle}</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px mb-5" style={{ background: "var(--theme-border-subtle)" }} />

                {showForm && (
                    <InlineContactForm
                        carSlug={carSlug}
                        carTitle={carTitle}
                        dict={dict}
                        locale={lang}
                        securityError={securityError}
                    />
                )}
            </div>
        </div>
    );
}
