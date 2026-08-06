"use client";

import { ArrowRight, CheckCircle2, Microscope, PaintBucket, ShieldCheck, Wrench, Zap } from "lucide-react";
import type { WerkplaatsDict } from "@/lib/dictionaries";

const ICONS = [Wrench, PaintBucket, Microscope, ShieldCheck, Zap] as const;

export default function WerkplaatsServices({ dict }: { dict: WerkplaatsDict }) {
  const scrollToBooking = () => document.getElementById("afspraak-wizard")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="mx-auto mb-28 mt-12 max-w-7xl">
      <div className="mb-10 grid gap-5 border-b border-[var(--theme-border)] pb-8 md:grid-cols-2 md:items-end">
        <div>
          <p className="brand-kicker mb-4">{dict.servicesLabel}</p>
          <h2 className="brand-section-title theme-text">{dict.servicesTitle}</h2>
        </div>
        <p className="max-w-lg text-sm leading-7 theme-text-muted md:justify-self-end">{dict.heroSubtitle}</p>
      </div>

      <div className="grid border-l border-t border-[var(--theme-border)] md:grid-cols-2 lg:grid-cols-12">
        {dict.services.map((service, index) => {
          const Icon = ICONS[index] ?? Wrench;
          const width = index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : "lg:col-span-4";
          const checklist = "checklistItems" in service ? service.checklistItems as string[] | undefined : undefined;
          const cta = "cta" in service ? service.cta as string | undefined : undefined;
          const years = "statYearsLabel" in service ? service.statYearsLabel as string | undefined : undefined;

          return (
            <article key={service.id} className={`group relative flex min-h-[280px] flex-col border-b border-r border-[var(--theme-border)] p-6 sm:p-8 ${width} ${index === 0 ? "bg-[#111116] text-white lg:min-h-[390px]" : "theme-surface"}`}>
              <div className="mb-10 flex items-start justify-between">
                <div className={`flex size-11 items-center justify-center ${index === 0 ? "bg-[#d91c1c] text-white" : "border border-[var(--theme-border)] text-[#d91c1c]"}`}>
                  <Icon size={19} strokeWidth={1.7} />
                </div>
                <span className={`font-headings text-xl font-semibold tabular-nums ${index === 0 ? "text-white/35" : "theme-text-faint"}`}>0{index + 1}</span>
              </div>

              {years && <p className="mb-2 font-headings text-5xl font-bold leading-none text-[#d91c1c]">20+</p>}
              <h3 className={`font-headings text-3xl font-semibold uppercase leading-none sm:text-4xl ${index === 0 ? "text-white" : "theme-text"}`}>{service.title}</h3>
              <p className={`mt-4 max-w-xl text-sm leading-7 ${index === 0 ? "text-white/60" : "theme-text-muted"}`}>{service.body}</p>

              {checklist && (
                <ul className="mt-8 grid gap-3 border-t border-white/15 pt-6 sm:grid-cols-3">
                  {checklist.map((item) => <li key={item} className="flex items-center gap-2 text-xs font-semibold text-white/65"><CheckCircle2 size={14} className="text-[#d91c1c]" />{item}</li>)}
                </ul>
              )}

              {(cta || index === 3) && (
                <button onClick={scrollToBooking} className={`mt-auto inline-flex min-h-11 items-center gap-2 pt-6 text-left text-xs font-extrabold uppercase tracking-[0.14em] ${index === 0 ? "text-white" : "text-[#d91c1c]"}`}>
                  {cta ?? dict.heroCta} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>
              )}

              {years && <p className="mt-auto pt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#d91c1c]">{years} · 500+ {service.statClientsLabel}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
