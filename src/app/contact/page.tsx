import { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Contact | bhenauto",
    description: "Neem contact op met ons conciërgeteam om een bezichtiging in te plannen of te informeren naar onze premium voertuigencollectie.",
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-background-light">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Contact Info Sidebar */}
                    <div className="space-y-12 pr-0 lg:pr-8">
                        <div>
                            <h2 className="text-2xl font-headings text-slate-900 mb-8 uppercase tracking-wide border-b border-slate-200 pb-4 inline-block font-bold">Bezoek Onze Showroom</h2>
                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mr-6 shrink-0 border border-slate-200 shadow-sm">
                                        <MapPin size={24} className="text-[#d91c1c]" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-2">Locatie</h3>
                                        <p className="text-slate-600 leading-relaxed font-medium">123 Luxury Avenue<br />Beverly Hills, CA 90210<br />Verenigde Staten</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mr-6 shrink-0 border border-slate-200 shadow-sm">
                                        <Phone size={24} className="text-[#d91c1c]" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-2">Directe Lijn</h3>
                                        <p className="text-slate-600 leading-relaxed font-medium">+1 (555) 123-4567</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mr-6 shrink-0 border border-slate-200 shadow-sm">
                                        <Mail size={24} className="text-[#d91c1c]" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-2">E-mail</h3>
                                        <p className="text-slate-600 leading-relaxed font-medium">concierge@bhenauto.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mr-6 shrink-0 border border-slate-200 shadow-sm">
                                        <Clock size={24} className="text-[#d91c1c]" />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold uppercase tracking-widest text-sm mb-2">Openingstijden</h3>
                                        <p className="text-slate-600 leading-relaxed font-medium">
                                            Ma - Vrij: 09:00 - 19:00<br />
                                            Zaterdag: 10:00 - 17:00<br />
                                            Zondag: Enkel op afspraak
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 md:p-12 border border-slate-200 shadow-xl rounded-3xl relative">
                        {/* Subtle decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-[#d91c1c]/20 -ml-10 -mt-2 rounded-tr-3xl"></div>

                        <h2 className="text-3xl font-headings text-slate-900 font-bold mb-2">Stuur een Aanvraag</h2>
                        <p className="text-slate-500 font-medium mb-8">Wij streven ernaar om alle aanvragen binnen twee uur te beantwoorden tijdens reguliere kantooruren.</p>

                        <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Formulier laden...</div>}>
                            <ContactForm />
                        </Suspense>
                    </div>

                </div>
            </div>
        </div>
    );
}
