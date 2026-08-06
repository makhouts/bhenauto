import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import { Mail, MapPin, Phone, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { PublicEmail, PublicEmailLink } from "@/components/PublicEmail";
import OpeningStatus from "@/components/OpeningStatus";
import { businessJsonLd, jsonLdScriptContent } from "@/lib/business-schema";
import { buildPageSocialMetadata, localizedAlternates, localizedUrl } from "@/lib/site-seo";

// Static content — revalidate once per hour
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "fr";
  const dict = await getDictionary(locale);
  const c = dict.contact;

  return {
    title: "Contact",
    description: c.pageSubtitle,
    alternates: {
      canonical: localizedUrl(locale, "/contact"),
      languages: localizedAlternates("/contact"),
    },
    ...buildPageSocialMetadata({
      locale,
      path: "/contact",
      title: "Contact",
      description: c.pageSubtitle,
    }),
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

  const hours = [
    { day: c.hoursMon, time: c.hoursMonTime, accent: false },
    { day: c.hoursSun, time: c.hoursSunTime, accent: true },
  ];

  const preferenceItems = [c.preferenceItem1, c.preferenceItem2, c.preferenceItem3];

  return (
    <main className="min-h-screen theme-bg relative overflow-hidden">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={jsonLdScriptContent(businessJsonLd)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-28 pb-20 relative z-10">

        {/* ── Hero text ────────────────────────────────────────── */}
        <div className="mb-10 md:mb-14">
          <p className="brand-kicker mb-5">
            {c.pageLabel}
          </p>
          <h1 className="brand-section-title max-w-4xl theme-text">
            <span className="block">{c.pageTitle}</span>
            <span className="block">
              <span className="text-[#d91c1c]">{c.pageTitleHighlight}</span>
            </span>
          </h1>
          <p className="mt-5 theme-text-muted max-w-md text-base leading-relaxed">
            {c.pageSubtitle}
          </p>
        </div>

        {/* ── Main grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: contact form (3 cols) ─────────────────── */}
          <div className="lg:col-span-3">
            <div
              className="relative overflow-hidden border-l-4 border-l-[#d91c1c] p-7 theme-surface md:p-10"
              style={{ border: "1px solid var(--theme-border)" }}
            >
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
                <ContactForm
                  dict={dict.contact}
                  locale={locale}
                  securityError={dict.errors.turnstileFailed}
                />
              </Suspense>
            </div>
          </div>

          {/* ── RIGHT: info cards (2 cols) ──────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Locatie card */}
            <div
              className="group relative border-t-2 border-t-[#d91c1c] p-6 theme-surface"
              style={{ border: "1px solid var(--theme-border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex size-10 shrink-0 items-center justify-center border transition-colors duration-300 group-hover:bg-[#d91c1c]/10"
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
              className="group relative border-t border-[var(--theme-border)] p-6 theme-surface"
              style={{ border: "1px solid var(--theme-border)" }}
            >
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
                <PublicEmailLink className="flex items-center gap-3 group/link">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: "var(--theme-badge-bg)", border: "1px solid var(--theme-border)" }}
                  >
                    <Mail size={15} className="theme-text-faint group-hover/link:text-[#d91c1c] transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-[10px] theme-text-faint font-bold uppercase tracking-wider">{c.emailLabel}</p>
                    <p className="theme-text font-bold text-sm"><PublicEmail /></p>
                  </div>
                </PublicEmailLink>
              </div>
            </div>

            {/* Openingstijden card */}
            <div
              className="group relative border-t border-[var(--theme-border)] p-6 theme-surface"
              style={{ border: "1px solid var(--theme-border)" }}
            >
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
                <OpeningStatus openLabel={c.openNow} closedLabel={c.closedNow} />
              </div>
            </div>

            {/* CTA card */}
            <div className="group relative overflow-hidden border-l-4 border-l-white bg-[#d91c1c] p-6">
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
          className="group relative mt-6 overflow-hidden border border-[var(--theme-border)] theme-surface"
          style={{ border: "1px solid var(--theme-border)" }}
        >
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
