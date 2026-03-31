"use client";

import { Phone } from "lucide-react";
import Link from "next/link";

interface MobileContactBarProps {
    carSlug: string;
    carTitle: string;
}

export default function MobileContactBar({ carSlug, carTitle }: MobileContactBarProps) {
    const whatsappMessage = encodeURIComponent(`Hallo, ik ben geïnteresseerd in de ${carTitle}. Is deze nog beschikbaar?`);
    const whatsappUrl = `https://wa.me/32000000000?text=${whatsappMessage}`;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-area-bottom">
            <div className="flex gap-3 max-w-lg mx-auto">
                {/* Call button */}
                <a
                    href="tel:+32000000000"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 text-slate-800 font-bold text-sm rounded-xl hover:border-[#d91c1c] hover:text-[#d91c1c] transition-all active:scale-95"
                >
                    <Phone size={16} strokeWidth={2.5} />
                    Bel Ons
                </a>

                {/* WhatsApp button */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:bg-[#1fb855] transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                </a>

                {/* Contact form button */}
                <Link
                    href={`/contact?car=${carSlug}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#d91c1c] text-white font-bold text-sm rounded-xl hover:bg-[#b91515] transition-all active:scale-95 shadow-lg shadow-[#d91c1c]/20"
                >
                    Contact
                </Link>
            </div>
        </div>
    );
}
