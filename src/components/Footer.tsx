import Link from "next/link";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8 text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block text-2xl font-headings font-black text-slate-900 tracking-tighter">
                            bhen<span className="text-[#d91c1c]">auto</span>
                        </Link>
                        <p className="text-sm mt-4 leading-relaxed">
                            Gecureerde collectie van premium en luxe tweedehands voertuigen. Ervaar compromisloze kwaliteit en service.
                        </p>
                        <div className="flex space-x-4 pt-4">
                            <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#d91c1c] hover:text-white hover:border-[#d91c1c] transition-all"><Instagram size={18} /></a>
                            <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#d91c1c] hover:text-white hover:border-[#d91c1c] transition-all"><Facebook size={18} /></a>
                            <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#d91c1c] hover:text-white hover:border-[#d91c1c] transition-all"><Twitter size={18} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Bedrijf</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Over Ons</Link></li>
                            <li><Link href="/" className="hover:text-[#d91c1c] transition-colors">Onze Showroom</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Contact</Link></li>
                            <li><Link href="/" className="hover:text-[#d91c1c] transition-colors">Carrières</Link></li>
                            <li><Link href="/terms" className="hover:text-[#d91c1c] transition-colors">Juridische Info</Link></li>
                        </ul>
                    </div>

                    {/* Inventory */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Diensten</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/inventory" className="hover:text-[#d91c1c] transition-colors">Autoverkoop</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Carrosserie</Link></li>
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Restauratie</Link></li>
                            <li><Link href="/contact" className="hover:text-[#d91c1c] transition-colors">Taxatie</Link></li>
                            <li><Link href="/about" className="hover:text-[#d91c1c] transition-colors">Detailing</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-slate-900 font-bold mb-6">Nieuwsbrief</h3>
                        <p className="text-sm mb-4">Blijf op de hoogte van onze laatste voorraad en nieuws.</p>
                        <div className="flex">
                            <input type="email" placeholder="E-mailadres" className="bg-slate-100 border-none rounded-l-lg py-3 px-4 w-full focus:ring-1 focus:ring-[#d91c1c] focus:outline-none text-slate-900" />
                            <button className="bg-[#d91c1c] text-white px-4 rounded-r-lg hover:bg-[#b91515] transition-colors">
                                <Mail size={18} />
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
