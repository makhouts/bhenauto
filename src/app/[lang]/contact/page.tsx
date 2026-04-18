import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import { Mail, MapPin, Phone, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bhenauto.be";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const c = dict.contact;

  const alternateLanguages: Record<string, string> = {};
  for (const l of locales) {
    alternateLanguages[l] = `${BASE_URL}/${l}/contact`;
  }

  return {
    title: "Contact",
    description: c.pageSubtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/contact`,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `Contact | BhenAuto`,
      description: c.pageSubtitle,
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const c = dict.contact;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isOpen = day >= 1 && day <= 6 && hour >= 10 && hour < 18;

  const hours = [
    { day: c.hoursMon, time: c.hoursMonTime, accent: false },
    { day: c.hoursSun, time: c.hoursSunTime, accent: true },
  ];

  const preferenceItems = [c.preferenceItem1, c.preferenceItem2, c.preferenceItem3];

  return (
    <main className="min-h-screen theme-bg relative overflow-hidden">
      <h1 className="sr-only">Contact BhenAuto</h1>

      {/* ── Subtle background accent ─────────────────────────────── */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#d91c1c]/4 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 relative z-10">

        {/* ── Hero text ────────────────────────────────────────── */}
        <div className="mb-14">
          <p className="text-[10px] font-black text-[#d91c1c] uppercase tracking-[0.25em] mb-4">
            {c.pageLabel}
          </p>
          <h2 className="font-headings font-black theme-text leading-none tracking-tight">
            <span className="text-4xl md:text-6xl lg:text-7xl block">{c.pageTitle}</span>
            <span className="text-4xl md:text-6xl lg:text-7xl block">
              <span className="text-[#d91c1c] italic">{c.pageTitleHighlight}</span>
            </span>
          </h2>
          <p className="mt-5 theme-text-muted max-w-md text-base leading-relaxed">
            {c.pageSubtitle}
          </p>
        </div>

        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: contact form (3 cols) ─────────────────── */}
          <div className="lg:col-span-3">
            <div
              className="relative theme-surface shadow-sm rounded-2xl p-7 md:p-10 overflow-hidden"
              style={{ border: "1px solid var(--theme-border)" }}
            >
              {/* top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d91c1c] to-transparent" />

              <h3 className="text-xl font-headings font-black theme-text mb-1 uppercase tracking-wide">
                {c.formTitle}
              </h3>
              <p className="theme-text-muted text-sm mb-8">{c.formRequired}</p>

              <Suspense
                fallback={
                  <div className="h-64 flex items-center justify-center theme-text-muted text-sm">
                    {c.formLoading}
                  </div>
                }
              >
                <ContactForm dict={dict.contact} />
              </Suspense>
            </div>
          </div>

          {/* ── RIGHT: info cards (2 cols) ──────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Locatie card */}
            <div
              className="group relative theme-surface shadow-sm rounded-2xl p-6 overflow-hidden hover:shadow-md transition-all duration-300"
              style={{ border: "1px solid var(--theme-border)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d91c1c]/30 to-transparent" />
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 group-hover:bg-[#d91c1c]/25 transition-colors duration-300"
                  style={{ backgroundColor: "var(--theme-icon-bg)", borderColor: "rgba(217,28,28,0.2)" }}
                >
                  <MapPin size={18} className="text-[#d91c1c]" />
                </div>
                <div>
                  <p className="text-[10px] font-black theme-text-faint uppercase tracking-[0.2em] mb-1.5">
                    {c.showroomLabel}
                  </p>
                  <p className="theme-text font-bold text-sm leading-relaxed">
                    Brusselsesteenweg 223<br />
                    1730 Asse, België
                  </p>
                  <a
                    href="https://maps.google.com/?q=Brusselsesteenweg+223+1730+Asse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[#d91c1c] text-xs font-bold uppercase tracking-widest hover:gap-2.5 transition-all duration-300"
                  >
                    {c.routePlanning} <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Direct contact card */}
            <div
              className="group relative theme-surface shadow-sm rounded-2xl p-6 overflow-hidden hover:shadow-md transition-all duration-300"
              style={{ border: "1px solid var(--theme-border)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d91c1c]/30 to-transparent" />
              <p className="text-[10px] font-black theme-text-faint uppercase tracking-[0.2em] mb-4">{c.directContactLabel}</p>
              <div className="space-y-4">
                <a href="tel:+3225828353" className="flex items-center gap-3 group/link">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: "var(--theme-badge-bg)", border: "1px solid var(--theme-border)" }}
                  >
                    <Phone size={15} className="theme-text-faint group-hover/link:text-[#d91c1c] transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider">{c.callLabel}</p>
                    <p className="theme-text font-bold text-sm">02 582 83 53</p>
                  </div>
                </a>
                <a href="mailto:info@bhenauto.be" className="flex items-center gap-3 group/link">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: "var(--theme-badge-bg)", border: "1px solid var(--theme-border)" }}
                  >
                    <Mail size={15} className="theme-text-faint group-hover/link:text-[#d91c1c] transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider">{c.emailLabel}</p>
                    <p className="theme-text font-bold text-sm">info@bhenauto.be</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Openingstijden card */}
            <div
              className="group relative theme-surface shadow-sm rounded-2xl p-6 overflow-hidden hover:shadow-md transition-all duration-300"
              style={{ border: "1px solid var(--theme-border)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d91c1c]/30 to-transparent" />
              <div className="flex items-center gap-2.5 mb-4">
                <Clock size={14} className="text-[#d91c1c]" />
                <p className="text-[10px] font-black theme-text-faint uppercase tracking-[0.2em]">{c.hoursLabel}</p>
              </div>
              <div className="space-y-3">
                {hours.map(({ day: d, time, accent }) => (
                  <div key={d} className="flex items-center justify-between">
                    <span className="theme-text-muted text-[13px] font-semibold">{d}</span>
                    <span className={`text-[13px] font-bold ${accent ? "text-[#d91c1c]" : "theme-text"}`}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--theme-border-subtle)" }}>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${isOpen ? "bg-green-400 animate-pulse" : ""}`}
                    style={!isOpen ? { backgroundColor: "var(--theme-text-faint)" } : {}}
                  />
                  <span className="text-[12px] theme-text-muted font-semibold">
                    {isOpen ? c.openNow : c.closedNow}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA card */}
            <div className="group relative bg-[#d91c1c] rounded-2xl p-6 overflow-hidden hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#d91c1c]/30 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-black/10 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-white/80 text-sm font-bold mb-2 uppercase tracking-widest">{c.preferenceLabel}</p>
                <p className="text-white font-black text-lg font-headings leading-snug mb-4">{c.preferenceTitle}</p>
                <div className="space-y-1.5">
                  {preferenceItems.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-white/80" />
                      <span className="text-white/80 text-xs font-semibold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Google Maps full-width ────────────────────────── */}
        <div
          className="mt-6 group relative theme-surface shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300"
          style={{ border: "1px solid var(--theme-border)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d91c1c]/40 to-transparent z-10" />
          <div className="h-[380px] w-full relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2516.356948124384!2d4.225758377155591!3d50.89861107168115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c3c07cb13d10cd%3A0x14ae28aebd5ab2be!2sBhenauto!5e0!3m2!1sen!2sbe!4v1774786991203!5m2!1sen!2sbe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={c.mapTitle}
            />
            {/* Location badge overlay */}
            <div
              className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5 backdrop-blur-md px-4 py-2.5 rounded-xl pointer-events-none shadow-lg"
              style={{ backgroundColor: "var(--theme-overlay)", border: "1px solid var(--theme-border)" }}
            >
              <MapPin size={14} className="text-[#d91c1c] shrink-0" />
              <div>
                <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider">Bhenauto Showroom</p>
                <p className="theme-text text-[12px] font-bold">Brusselsesteenweg 223, Asse</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
