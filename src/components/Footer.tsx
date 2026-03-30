import Link from "next/link";
import { Globe, Share2, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer 
            className="relative bg-[#020214] pt-12 pb-6 text-white overflow-hidden"
            style={{ clipPath: "polygon(0 0, 100% 2vw, 100% 100%, 0 100%)" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 box-border mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12 lg:mb-16">
                    {/* Brand Info */}
                    <div className="space-y-4 lg:col-span-5 pr-4">
                        <Link href="/" className="inline-block text-3xl md:text-4xl font-headings font-bold text-[#d91c1c] tracking-tighter hover:text-[#b91515] transition-colors duration-300">
                            Bhenauto
                        </Link>
                        <p className="text-sm leading-relaxed text-white/90">
                            Uw partner in exclusieve automobielen.<br />
                            Wij cureren alleen de allerbeste<br />
                            voertuigen voor onze gewaardeerde<br />
                            clientèle.
                        </p>
                        <div className="flex space-x-3 pt-1">
                            <button className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white hover:border-white transition-all duration-300 hover:scale-105 group" aria-label="Web">
                                <Globe size={16} className="text-[#d91c1c] group-hover:text-[#020214]" />
                            </button>
                            <button className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white hover:border-white transition-all duration-300 hover:scale-105 group" aria-label="Share">
                                <Share2 size={16} className="text-[#d91c1c] group-hover:text-[#020214]" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="lg:col-span-2">
                        <h3 className="text-[#d91c1c] font-bold mb-4 text-xs tracking-widest uppercase">Navigatie</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/inventory" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Voorraad</Link></li>
                            <li><Link href="/contact" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Carrosserie</Link></li>
                            <li><Link href="/about" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Over Ons</Link></li>
                            <li><Link href="/contact" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Information */}
                    <div className="lg:col-span-2">
                        <h3 className="text-[#d91c1c] font-bold mb-4 text-xs tracking-widest uppercase">Informatie</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/privacy" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Privacybeleid</Link></li>
                            <li><Link href="/terms" className="text-white hover:text-white/70 transition-colors duration-300 hover:translate-x-1 inline-block">Algemene Voorwaarden</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="lg:col-span-3">
                        <h3 className="text-[#d91c1c] font-bold mb-4 text-xs tracking-widest uppercase">Contact</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2 group">
                                <MapPin className="w-4 h-4 text-[#d91c1c] shrink-0 mt-0.5 group-hover:scale-110 transition-all duration-300" />
                                <span className="text-white group-hover:text-white/80 transition-colors duration-300">Brusselsesteenweg 223, 1730 Asse</span>
                            </li>
                            <li className="flex items-center gap-2 group">
                                <Phone className="w-4 h-4 text-[#d91c1c] shrink-0 group-hover:scale-110 transition-all duration-300" />
                                <a href="tel:+310201234567" className="text-white group-hover:text-white/80 transition-colors duration-300">+31 (0)20 123 4567</a>
                            </li>
                            <li className="flex items-center gap-2 group">
                                <Mail className="w-4 h-4 text-[#d91c1c] shrink-0 group-hover:scale-110 transition-all duration-300" />
                                <a href="mailto:info@bhenauto.nl" className="text-white group-hover:text-white/80 transition-colors duration-300">info@bhenauto.nl</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end pt-6 relative z-10 w-full text-xs text-white/50 border-t border-white/10">
                    <p>&copy; {new Date().getFullYear()} Bhenauto. Premium Automotive Excellence.</p>
                </div>

                {/* Large Watermark Text */}
                <div className="absolute bottom-[-10%] left-4 sm:left-6 lg:left-8 pointer-events-none select-none z-0">
                    <span className="text-[14vw] md:text-[8rem] lg:text-[10rem] font-headings font-black tracking-tighter text-white/[0.04] uppercase leading-none">
                        BHENAUTO
                    </span>
                </div>
            </div>
            
        </footer>
    );
}
