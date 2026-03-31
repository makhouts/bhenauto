"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    const isHome = pathname === "/";
    const isTransparent = isHome && !scrolled;

    // Dynamic Colors Setup

    const getNavLinkColor = (isActive: boolean) => {
        if (isTransparent) return isActive ? "text-white font-bold drop-shadow-md" : "text-white font-bold drop-shadow-md hover:text-white/90";
        return isActive
            ? "text-white font-bold"
            : "text-slate-300 hover:text-white font-bold transition-colors";
    };

    const getIndicatorColor = () => {
        if (isTransparent) return "bg-white drop-shadow-md";
        return "bg-[#d91c1c]";
    };

    const getCtaColor = () => {
        if (isTransparent) return "bg-[#d91c1c] text-white hover:bg-[#b91515] shadow-lg border border-transparent";
        return "bg-[#d91c1c] text-white hover:bg-[#b91515] shadow-lg shadow-[#d91c1c]/20";
    };

    const mobileMenuColor = isTransparent ? "text-white drop-shadow-md" : "text-slate-300 hover:text-white";

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
        <header className={`fixed w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isTransparent
            ? 'bg-transparent py-6'
            : 'bg-[#020214]/65 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.8)] py-2'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center z-50">
                        <Link href="/" onClick={() => setIsOpen(false)} className="mr-12 block hover:opacity-80 transition-opacity duration-300">
                            <span className="text-2xl font-headings font-black tracking-wide uppercase">
                                <span className="text-[#d91c1c]">BHEN</span><span className="text-white">AUTO</span>
                            </span>
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
                                    className={`relative text-[15px] uppercase tracking-widest font-bold transition-colors duration-300 py-2 group ${getNavLinkColor(isActive)}`}
                                >
                                    {link.name}
                                    <span className={`absolute bottom-0 left-0 w-full h-[2px] ${getIndicatorColor()} transition-transform duration-300 origin-right group-hover:origin-left ${isActive ? "scale-x-100 origin-left" : "scale-x-0 group-hover:scale-x-100"
                                        }`} />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center z-50 relative">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`focus:outline-none transition-colors ${mobileMenuColor}`}
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden lg:flex items-center gap-6">
                        <Link href="/inventory" className={`px-6 py-2 rounded-md font-bold text-base tracking-wide transition-all duration-300 hover:-translate-y-0.5 ${getCtaColor()}`}>
                            Aanbod
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-[#020214]/75 backdrop-blur-2xl border-t border-white/10 shadow-xl absolute w-full left-0 top-full pb-4">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 text-base font-bold transition-all duration-200 rounded-lg ${isActive
                                        ? "text-white bg-white/10 border-l-4 border-[#d91c1c]"
                                        : "text-slate-300 hover:text-white hover:bg-white/5 border-l-4 border-transparent"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                        <div className="px-1 pt-4">
                            <Link href="/inventory" onClick={() => setIsOpen(false)} className="flex justify-center w-full bg-[#d91c1c] text-white px-6 py-3.5 rounded-lg font-bold text-sm hover:bg-[#b91515] transition-all shadow-lg shadow-[#d91c1c]/20 active:scale-95">
                                Aanbod
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
