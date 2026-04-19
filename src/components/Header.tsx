"use client";

import { useState, useEffect, useRef } from "react";
import { useScrollState } from "@/hooks/useScrollState";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import { usePathname } from "next/navigation";
import { Menu, X, Globe } from "lucide-react";
import { useLocale } from "@/components/LocaleContext";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";
import type { NavDict } from "@/lib/dictionaries";

/**
 * Strip the locale prefix from a pathname for route matching.
 * e.g. "/nl/werkplaats" → "/werkplaats", "/fr" → "/"
 */
function stripLocale(pathname: string): string {
    const segments = pathname.split("/");
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
        const rest = "/" + segments.slice(2).join("/");
        return rest === "/" ? "/" : rest;
    }
    return pathname;
}

interface HeaderProps {
    dict: NavDict;
}

export default function Header({ dict }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const scrolled = useScrollState(20);
    const pathname = usePathname();
    const { locale, switchLocale } = useLocale();

    // Strip locale for route matching
    const strippedPath = stripLocale(pathname);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Handle closing language dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isHome = strippedPath === "/";
    const isWerkplaats = strippedPath === "/werkplaats";
    const isTransparent = (isHome || isWerkplaats) && !scrolled;

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
        if (isTransparent) return "bg-transparent text-white border-white hover:bg-white hover:text-[#020214] shadow-none";
        return "bg-[#d91c1c] text-white border-[#d91c1c] hover:bg-[#b91515] hover:border-[#b91515] shadow-lg shadow-[#d91c1c]/30";
    };

    // Locale-aware nav links — labels come from dict
    const navLinks = [
        { name: dict.home, href: `/${locale}` },
        { name: dict.inventory, href: `/${locale}/inventory` },
        { name: dict.werkplaats, href: `/${locale}/werkplaats` },
        { name: dict.contact, href: `/${locale}/contact` },
    ];

    // Language options for dropdown
    const languageOptions = locales.map(code => ({
        code,
        name: localeNames[code],
        flag: localeFlags[code],
    }));

    return (
        <>
            <header className={`fixed w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isOpen
                ? 'bg-transparent py-2'
                : isTransparent
                    ? 'bg-transparent py-6'
                    : 'bg-[#020214]/65 backdrop-blur-2xl shadow-[0_4px_30px_-10px_rgba(0,0,0,0.8)] py-2'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center" style={{ zIndex: 70 }}>
                            <Link href={`/${locale}`} onClick={() => setIsOpen(false)} className="mr-12 block hover:opacity-80 transition-opacity duration-300">
                                <Image
                                    src={logo}
                                    alt="Bhenauto"
                                    width={170}
                                    className="w-[170px] h-auto object-contain mix-blend-screen"
                                    priority
                                    fetchPriority="high"
                                />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex space-x-12" aria-label="Hoofdnavigatie">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`relative text-[12px] uppercase tracking-[0.25em] font-bold font-[family-name:var(--font-nunito)] transition-colors duration-300 py-2 group ${getNavLinkColor(isActive)}`}
                                    >
                                        {link.name}
                                        <span className={`absolute bottom-0 left-0 w-full h-[2px] ${getIndicatorColor()} transition-transform duration-300 origin-right group-hover:origin-left ${isActive ? "scale-x-100 origin-left" : "scale-x-0 group-hover:scale-x-100"
                                            }`} />
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center relative" style={{ zIndex: 70 }}>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="focus:outline-none transition-colors text-white drop-shadow-md"
                                aria-label={isOpen ? "Menu sluiten" : "Menu openen"}
                                aria-expanded={isOpen}
                            >
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>

                        {/* Desktop Right Context */}
                        <div className="hidden lg:flex items-center gap-6">
                            {/* Language Dropdown */}
                            <div className="relative" ref={langRef}>
                                <button
                                    onClick={() => setLangOpen(!langOpen)}
                                    className={`cursor-pointer flex items-center gap-1.5 font-bold text-xs tracking-widest uppercase transition-all duration-300 ${
                                        isTransparent ? 'text-white drop-shadow-md hover:text-white/80' : 'text-slate-300 hover:text-white'
                                    }`}
                                    aria-expanded={langOpen}
                                    aria-haspopup="listbox"
                                >
                                    {locale.toUpperCase()}
                                    <Globe size={14} className={`transition-transform duration-300 ${langOpen ? 'rotate-12 opacity-100' : 'opacity-60'}`} />
                                </button>

                                {/* Glass Dropdown Panel */}
                                <div
                                    role="listbox"
                                    aria-label="Taal selecteren"
                                    className={`absolute top-full right-0 mt-4 w-44 rounded-2xl overflow-hidden transition-all duration-300 origin-top-right ${
                                        langOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                    }`}
                                    style={{
                                        background: 'linear-gradient(160deg, rgba(22,22,48,0.97) 0%, rgba(10,10,28,0.99) 100%)',
                                        backdropFilter: 'blur(24px) saturate(160%)',
                                        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06) inset, 0 1px 0 rgba(255,255,255,0.14) inset',
                                    }}
                                >
                                    {/* Top shimmer line */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0,
                                        height: '1px',
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                    }} />

                                    {languageOptions.map((lang, idx) => (
                                        <div key={lang.code}>
                                            {idx > 0 && (
                                                <div style={{
                                                    height: '1px',
                                                    margin: '0 16px',
                                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                                                }} />
                                            )}
                                            <button
                                                role="option"
                                                aria-selected={locale === lang.code}
                                                onClick={() => { switchLocale(lang.code as Locale); setLangOpen(false); }}
                                                className="cursor-pointer w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-all duration-200 group relative"
                                                style={{
                                                    color: locale === lang.code ? '#fff' : 'rgba(180,190,210,1)',
                                                    background: locale === lang.code
                                                        ? 'linear-gradient(90deg, rgba(217,28,28,0.18) 0%, rgba(217,28,28,0.06) 100%)'
                                                        : 'transparent',
                                                }}
                                                onMouseEnter={e => {
                                                    if (locale !== lang.code) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                                                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (locale !== lang.code) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(180,190,210,1)';
                                                    }
                                                }}
                                            >
                                                {/* Active left accent bar */}
                                                {locale === lang.code && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: 0, top: '20%', bottom: '20%',
                                                        width: '3px',
                                                        borderRadius: '0 3px 3px 0',
                                                        background: 'linear-gradient(180deg, #ff4444 0%, #d91c1c 100%)',
                                                        boxShadow: '0 0 8px rgba(217,28,28,0.7)',
                                                    }} />
                                                )}
                                                <span className="text-lg leading-none">{lang.flag}</span>
                                                <span className="tracking-wide">{lang.name}</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Link href={`/${locale}/inventory`} className={`px-7 py-2.5 rounded-full font-black text-xs uppercase tracking-widest border-2 transition-all duration-500 hover:-translate-y-1 ${getCtaColor()}`}>
                                {dict.cta}
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation — full-screen overlay (rendered outside header) */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-[60] bg-[#020214]/85 backdrop-blur-3xl">
                    {/* Close button inside overlay */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-5 right-4 sm:right-6 z-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Menu sluiten"
                    >
                        <X size={28} />
                    </button>
                    <nav className="flex flex-col justify-center items-center h-full gap-2 px-8" aria-label="Mobiele navigatie">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block w-full text-center px-6 py-4 text-xl font-bold uppercase tracking-[0.15em] transition-all duration-300 rounded-xl ${isActive
                                        ? "text-white bg-white/10"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                        <div className="w-16 h-px bg-white/10 my-4" />

                        {/* Mobile Language Selection */}
                        <div className="flex gap-3 mb-4 w-full max-w-xs justify-center">
                            {languageOptions.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => { switchLocale(lang.code as Locale); setIsOpen(false); }}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-bold text-sm tracking-widest transition-colors ${
                                        locale === lang.code ? 'bg-[#d91c1c] text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span className="text-lg leading-none">{lang.flag}</span>
                                    {lang.code.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <Link
                            href={`/${locale}/inventory`}
                            onClick={() => setIsOpen(false)}
                            className="w-full max-w-xs bg-[#d91c1c] text-white px-8 py-4 rounded-xl font-bold text-base text-center uppercase tracking-widest hover:bg-[#b91515] transition-all shadow-lg shadow-[#d91c1c]/30 active:scale-95"
                        >
                            {dict.cta}
                        </Link>
                    </nav>
                </div>
            )}
        </>
    );
}
