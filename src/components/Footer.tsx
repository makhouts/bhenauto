import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8 text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="text-[#d91c1c]">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
                                    <circle cx="7.5" cy="14.5" r="1.5" />
                                    <circle cx="16.5" cy="14.5" r="1.5" />
                                </svg>
                            </div>
                            <Link href="/" className="text-xl font-headings font-black text-slate-900 tracking-tighter uppercase mr-12">
                                BHEN<span className="text-[#d91c1c]">AUTO</span>
                            </Link>
                        </div>
                        <p className="text-sm mt-4 leading-relaxed text-slate-500">
                            Premium automotive showroom en expert carrosserie gevestigd in België. Uitmuntendheid in elk detail sinds 1998.
                        </p>
                        <div className="flex space-x-4 pt-4">
                            <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#d91c1c] hover:text-white hover:border-[#d91c1c] transition-all"><Facebook size={16} /></a>
                            <a href="#" className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#d91c1c] hover:text-white hover:border-[#d91c1c] transition-all"><Instagram size={16} /></a>
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Diensten</h3>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><Link href="/inventory" className="hover:text-[#d91c1c] transition-colors">Autoverkoop</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Carrosserie</Link></li>
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Restauratie</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Taxatie</Link></li>
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Detailing</Link></li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Bedrijf</h3>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Over Ons</Link></li>
                            <li><Link href="/" className="hover:text-[#d91c1c] transition-colors">Onze Showroom</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Contact</Link></li>
                            <li><Link href="/" className="hover:text-[#d91c1c] transition-colors">Carrières</Link></li>
                            <li><Link href="/terms" className="hover:text-[#d91c1c] transition-colors">Juridische Info</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Nieuwsbrief</h3>
                        <p className="text-sm mb-4 text-slate-500">Blijf op de hoogte van onze nieuwste voorraad en nieuws.</p>
                        <div className="flex">
                            <input type="email" placeholder="E-mailadres" className="bg-slate-50 border border-slate-200 border-r-0 rounded-l py-2 px-4 w-full focus:ring-1 focus:ring-[#d91c1c] focus:outline-none text-slate-900 text-sm" />
                            <button className="bg-[#d91c1c] text-white px-4 py-2 rounded-r hover:bg-[#b91515] transition-colors flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.01 21L23 12L2.01 3L2 10l15 2l-15 2z" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
                    <p>&copy; {new Date().getFullYear()} bhenauto. Alle rechten voorbehouden.</p>
                    <div className="flex space-x-8 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-[#d91c1c] transition-colors">Privacybeleid</Link>
                        <Link href="/terms" className="hover:text-[#d91c1c] transition-colors">Servicevoorwaarden</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
