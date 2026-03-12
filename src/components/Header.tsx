"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Voorraad", href: "/inventory" },
        { name: "Carrosserie", href: "/carrosserie" },
        { name: "Over Ons", href: "/about" },
        { name: "Contact", href: "/contact" },
    ];

    return (
        <header className="fixed w-full z-50 transition-all duration-300 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <div className="text-[#d91c1c]">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
                                <circle cx="7.5" cy="14.5" r="1.5" />
                                <circle cx="16.5" cy="14.5" r="1.5" />
                            </svg>
                        </div>
                        <Link href="/" className="text-xl font-headings font-black text-slate-900 tracking-tighter uppercase mr-12">
                            BHEN<span className="text-[#d91c1c]">AUTO</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-semibold text-slate-600 hover:text-[#d91c1c] transition-colors duration-200"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-600 hover:text-[#d91c1c] focus:outline-none transition-colors"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                    {/* Desktop Book Now & Search */}
                    <div className="hidden lg:flex items-center gap-6">
                        <button className="text-slate-600 hover:text-[#d91c1c] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <button className="bg-[#d91c1c] text-white px-6 py-2 rounded font-bold text-sm hover:bg-[#b91515] transition-all">
                            Boek Nu
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-slate-200 shadow-xl">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-4 text-base font-semibold text-slate-600 hover:text-[#d91c1c] hover:bg-slate-50 transition-colors rounded-lg"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="px-3 pt-4 pb-2">
                            <button className="w-full bg-[#d91c1c] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#b91515] transition-all shadow-lg shadow-[#d91c1c]/20">
                                Boek Nu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
