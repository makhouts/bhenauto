"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import logo from "@/assets/logo.webp";
import { useLocale } from "@/components/LocaleContext";
import { useScrollState } from "@/hooks/useScrollState";
import { locales, localeNames, type Locale } from "@/lib/i18n";
import type { NavDict } from "@/lib/dictionaries";

function stripLocale(pathname: string) {
  const segments = pathname.split("/");
  if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
    return `/${segments.slice(2).join("/")}`;
  }
  return pathname;
}

export default function Header({ dict }: { dict: NavDict }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const scrolled = useScrollState(20);
  const { locale, switchLocale } = useLocale();
  const route = stripLocale(pathname);
  const overImage = (route === "/" || route === "/werkplaats") && !scrolled;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const links = [
    { label: dict.home, href: `/${locale}`, route: "/" },
    { label: dict.inventory, href: `/${locale}/inventory`, route: "/inventory" },
    { label: dict.werkplaats, href: `/${locale}/werkplaats`, route: "/werkplaats" },
    { label: dict.contact, href: `/${locale}/contact`, route: "/contact" },
  ];

  return (
    <>
      <header className={`relative md:fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200 ${
        overImage ? "md:bg-transparent border-white/20 bg-[#111116]" : "bg-[#111116] border-white/10"
      }`}>
        <div className="mx-auto flex h-[74px] max-w-[1600px] items-center px-4 sm:px-6 lg:px-10 xl:px-12">
          <Link href={`/${locale}`} onClick={() => setMenuOpen(false)} className="relative z-[70] shrink-0" aria-label="BhenAuto">
            <Image src={logo} alt="BhenAuto" width={164} priority style={{ height: "auto" }} className="w-[145px] object-contain mix-blend-screen sm:w-[164px]" />
          </Link>

          <nav className="ml-auto hidden items-stretch self-stretch md:flex" aria-label="Hoofdnavigatie">
            {links.map((link) => {
              const active = route === link.route || (link.route !== "/" && route.startsWith(`${link.route}/`));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center px-5 text-[11px] font-extrabold uppercase tracking-[0.18em] transition-colors lg:px-7 ${
                    active ? "text-white" : "text-white/65 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span className={`absolute inset-x-5 bottom-0 h-[3px] bg-[#d91c1c] transition-transform lg:inset-x-7 ${active ? "scale-x-100" : "scale-x-0"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="ml-5 hidden items-center gap-5 lg:flex">
            <div ref={languageRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                className="flex min-h-11 items-center gap-2 border-l border-white/15 pl-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/70 hover:text-white"
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                {locale.toUpperCase()} <ChevronDown size={14} className={langOpen ? "rotate-180" : ""} />
              </button>
              <div
                role="listbox"
                aria-label="Taal selecteren"
                className={`absolute right-0 top-full mt-3 w-44 border border-white/15 bg-[#111116] p-1 transition duration-150 ${
                  langOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
                }`}
              >
                {locales.map((code) => (
                  <button
                    key={code}
                    role="option"
                    aria-selected={locale === code}
                    onClick={() => { switchLocale(code as Locale); setLangOpen(false); }}
                    className={`flex min-h-11 w-full items-center justify-between px-3 text-left text-xs font-bold ${
                      locale === code ? "bg-[#d91c1c] text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {localeNames[code]} <span className="text-[10px] tracking-widest">{code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
            <Link href={`/${locale}/inventory`} className="brand-button-primary min-h-10 px-5 py-2">
              {dict.cta}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="relative z-[70] ml-auto flex size-11 items-center justify-center text-white md:hidden"
            aria-label={menuOpen ? "Menu sluiten" : "Menu openen"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] bg-[#111116] px-6 pt-28 transition duration-200 md:hidden ${
        menuOpen ? "visible opacity-100" : "invisible opacity-0"
      }`}>
        <nav className="mx-auto flex max-w-md flex-col border-t border-white/15" aria-label="Mobiele navigatie">
          {links.map((link, index) => {
            const active = route === link.route || (link.route !== "/" && route.startsWith(`${link.route}/`));
            return (
              <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="flex min-h-16 items-center border-b border-white/15">
                <span className="w-10 text-[10px] font-bold tabular-nums text-white/30">0{index + 1}</span>
                <span className={`font-headings text-3xl font-semibold uppercase tracking-wide ${active ? "text-[#d91c1c]" : "text-white"}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
          <div className="mt-8 grid grid-cols-3 border border-white/15 p-1">
            {locales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => { switchLocale(code as Locale); setMenuOpen(false); }}
                className={`min-h-11 text-xs font-extrabold uppercase tracking-[0.18em] ${locale === code ? "bg-white text-[#111116]" : "text-white/60"}`}
              >
                {code}
              </button>
            ))}
          </div>
          <Link href={`/${locale}/inventory`} onClick={() => setMenuOpen(false)} className="brand-button-primary mt-4 w-full">
            {dict.cta}
          </Link>
        </nav>
      </div>
    </>
  );
}
