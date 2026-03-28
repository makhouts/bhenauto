"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    // Add scroll listener for glassmorphism effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        // Fire initially
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Voorraad", href: "/inventory" },
        { name: "Carrosserie", href: "/carrosserie" },
        { name: "Over Ons", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/85 backdrop-blur-md border-b border-slate-200/50 shadow-sm py-0" : "bg-white/40 backdrop-blur-sm py-2"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2 group cursor-pointer z-50">
                        <div className="text-[#d91c1c] group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
                                <circle cx="7.5" cy="14.5" r="1.5" />
                                <circle cx="16.5" cy="14.5" r="1.5" />
                            </svg>
                        </div>
                        <Link href="/" onClick={() => setIsOpen(false)} className="text-xl font-headings font-black text-slate-900 tracking-tighter uppercase mr-12 group-hover:text-[#d91c1c] transition-colors duration-300">
                            BHEN<span className="text-[#d91c1c]">AUTO</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`relative text-sm font-bold transition-colors duration-300 py-2 group ${
                                        isActive ? "text-[#d91c1c]" : "text-slate-700 hover:text-[#d91c1c]"
                                    }`}
                                >
                                    {link.name}
                                    <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#d91c1c] origin-left transition-transform duration-300 ${
                                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                                    }`} />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center z-50 relative">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-800 hover:text-[#d91c1c] focus:outline-none transition-colors"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                    {/* Desktop Book Now & Search */}
                    <div className="hidden lg:flex items-center gap-6">
                        <button className="text-slate-700 hover:text-[#d91c1c] transition-colors hover:scale-110 duration-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <Link href="/contact" className="bg-[#d91c1c] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#b91515] transition-all duration-300 hover:shadow-lg hover:shadow-[#d91c1c]/30 hover:-translate-y-0.5">
                            Boek Nu
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl absolute w-full left-0 top-full pb-4">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 text-base font-bold transition-all duration-200 rounded-lg ${
                                        isActive 
                                        ? "text-[#d91c1c] bg-red-50 border-l-4 border-[#d91c1c]" 
                                        : "text-slate-600 hover:text-[#d91c1c] hover:bg-slate-50 border-l-4 border-transparent"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                        <div className="px-1 pt-4">
                            <Link href="/contact" onClick={() => setIsOpen(false)} className="flex justify-center w-full bg-[#d91c1c] text-white px-6 py-3.5 rounded-lg font-bold text-sm hover:bg-[#b91515] transition-all shadow-lg shadow-[#d91c1c]/20 active:scale-95">
                                Boek Nu
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
