"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/logo.webp";
import { useLocale } from "@/components/LocaleContext";
import { PublicEmail, PublicEmailLink } from "@/components/PublicEmail";
import { locales, type Locale } from "@/lib/i18n";
import type { FooterDict } from "@/lib/dictionaries";

export default function Footer({ dict }: { dict: FooterDict }) {
  const { locale, switchLocale } = useLocale();

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/autobhen/" },
    { label: "Instagram", href: "https://www.instagram.com/bhen_auto" },
    { label: "TikTok", href: "https://www.tiktok.com/@garagebhenauto" },
  ];

  return (
    <footer className="relative overflow-hidden border-t-4 border-[#d91c1c] bg-[#111116] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20 xl:px-12">
        <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pr-16">
            <Link href={`/${locale}`} className="inline-block">
              <Image src={logo} alt="BhenAuto" width={180} style={{ height: "auto" }} className="w-[170px] object-contain mix-blend-screen" />
            </Link>
            <p className="mt-6 max-w-md whitespace-pre-line text-sm leading-7 text-white/65">{dict.description}</p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/65 hover:text-white">
                  {link.label} <ArrowUpRight size={13} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4">
            <nav aria-label="Site navigatie">
              <h2 className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d91c1c]">{dict.navigationLabel}</h2>
              <ul className="space-y-3 text-sm">
                <li><Link href={`/${locale}/inventory`} className="text-white/70 hover:text-white">{dict.linkInventory}</Link></li>
                <li><Link href={`/${locale}/werkplaats`} className="text-white/70 hover:text-white">{dict.linkWerkplaats}</Link></li>
                <li><Link href={`/${locale}/contact`} className="text-white/70 hover:text-white">{dict.linkContact}</Link></li>
              </ul>
            </nav>
            <nav aria-label={dict.informationLabel}>
              <h2 className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d91c1c]">{dict.informationLabel}</h2>
              <ul className="space-y-3 text-sm">
                <li><Link href={`/${locale}/legal`} className="text-white/70 hover:text-white">{dict.linkPrivacy}</Link></li>
                <li><Link href={`/${locale}/legal`} className="text-white/70 hover:text-white">{dict.linkTerms}</Link></li>
                <li><Link href={`/${locale}/site-map`} className="text-white/70 hover:text-white">{dict.linkSitemap}</Link></li>
              </ul>
            </nav>
          </div>

          <div className="lg:col-span-3">
            <h2 className="mb-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#d91c1c]">{dict.contactLabel}</h2>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-[#d91c1c]" /><span>Brusselsesteenweg 223<br />1730 Asse</span></li>
              <li><a href="tel:+3225828353" className="flex min-h-11 items-center gap-3 hover:text-white"><Phone size={17} className="shrink-0 text-[#d91c1c]" />02 582 83 53</a></li>
              <li><PublicEmailLink className="flex min-h-11 items-center gap-3 hover:text-white"><Mail size={17} className="shrink-0 text-[#d91c1c]" /><PublicEmail /></PublicEmailLink></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-7 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} BhenAuto. {dict.copyright}</p>
          <div className="flex items-center gap-1 border border-white/15 p-1" aria-label="Taal selecteren">
            {locales.map((code) => (
              <button key={code} onClick={() => switchLocale(code as Locale)} className={`min-h-9 min-w-11 px-3 text-[10px] font-extrabold uppercase tracking-widest ${locale === code ? "bg-white text-[#111116]" : "text-white/55 hover:text-white"}`}>
                {code}
              </button>
            ))}
          </div>
          <p>Designed &amp; developed by <a href="https://rakamilabs.com/" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white">RakamiLabs</a></p>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute bottom-2 right-3 font-headings text-[13vw] font-bold uppercase leading-none tracking-[-.05em] text-white/[.025]">BHENAUTO</div>
    </footer>
  );
}
