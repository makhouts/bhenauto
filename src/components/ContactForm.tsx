"use client";

import { useState } from "react";
import { submitContact } from "@/app/actions/contact";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export default function ContactForm() {
    const searchParams = useSearchParams();
    const carRef = searchParams.get("car");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const result = await submitContact(formData);

        if (result.error) {
            setError(result.error);
        } else if (result.success) {
            setSuccess(true);
            (e.target as HTMLFormElement).reset();
        }

        setIsSubmitting(false);
    };

    if (success) {
        return (
            <div className="bg-green-50/50 border border-green-200 p-8 text-center animate-fade-in shadow-sm rounded-2xl relative overflow-hidden group h-full flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-green-400/5 blur-3xl rounded-full"></div>
                <CheckCircle2 size={64} className="text-green-500 mb-6" />
                <h3 className="text-3xl font-headings text-slate-900 mb-4 font-bold">Bericht Ontvangen</h3>
                <p className="text-slate-600 font-medium leading-relaxed max-w-sm">
                    Bedankt voor uw contact met bhenauto. Ons team heeft uw aanvraag ontvangen en zal spoedig contact met u opnemen om u van dienst te zijn.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-8 px-6 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors uppercase tracking-widest text-sm font-bold shadow-sm"
                >
                    Stuur Nog Een Aanvraag
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 text-sm animate-fade-in">
                    {error}
                </div>
            )}

            {carRef && (
                <div className="p-4 bg-slate-50 border border-slate-200 mb-6 rounded-lg">
                    <p className="text-sm text-slate-600 font-medium">
                        <span className="text-[#d91c1c] font-bold uppercase tracking-wider text-xs mr-2">Informatieaanvraag Over:</span>
                        {carRef.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                    </p>
                    <input type="hidden" name="car_reference" value={carRef} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Volledige Naam <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        disabled={isSubmitting}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 font-medium placeholder-slate-400"
                        placeholder="John Doe"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Telefoonnummer</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        disabled={isSubmitting}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 font-medium placeholder-slate-400"
                        placeholder="+1 (555) 000-0000"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">E-mailadres <span className="text-red-500">*</span></label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 font-medium placeholder-slate-400"
                    placeholder="john@example.com"
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Aanvraagdetails <span className="text-red-500">*</span></label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded-lg focus:outline-none focus:border-[#d91c1c] focus:ring-1 focus:ring-[#d91c1c] transition-colors disabled:opacity-50 resize-y font-medium placeholder-slate-400"
                    placeholder="Hoe kunnen we u vandaag helpen?"
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d91c1c] hover:bg-[#b91515] text-white py-4 font-bold rounded-lg uppercase tracking-widest text-sm flex justify-center items-center transition-all duration-300 shadow-md shadow-[#d91c1c]/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Verzenden...
                    </>
                ) : (
                    <>
                        <Send className="mr-2" size={18} />
                        Verstuur Bericht
                    </>
                )}
            </button>
        </form>
    );
}
