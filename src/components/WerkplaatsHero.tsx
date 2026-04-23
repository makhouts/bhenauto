"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { WerkplaatsDict } from "@/lib/dictionaries";
import mechanic from "@/assets/mechanic-wallpaper.webp";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export default function WerkplaatsHero({ dict }: { dict: WerkplaatsDict }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollToWizard = () => {
    document.getElementById("afspraak-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: "clamp(480px, 65vh, 720px)" }}>
        {/* Background image */}
        <Image
          src={mechanic}
          alt={dict.heroTitle}
          fill
          sizes="100vw"
          quality={70}
          className="object-cover"
          style={{ filter: "grayscale(60%) brightness(0.45)" }}
          priority
        />

        {/* Gradient vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(2,2,20,0.55) 0%, rgba(2,2,20,0.25) 50%, rgba(2,2,20,0.72) 100%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-20 max-w-5xl">
          {/* Label */}
          <p
            className="text-[#d91c1c] font-black text-[10px] uppercase tracking-[0.22em] mb-5 transition-all duration-700"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(10px)",
              transitionDelay: "0ms",
            }}
          >
            {dict.heroLabel}
          </p>

          {/* Headline */}
          <h1
            className="font-headings font-black text-white leading-[1.05] tracking-tight mb-6"
            style={{
              fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(18px)",
              transition: "opacity 0.75s ease, transform 0.75s ease",
              transitionDelay: "120ms",
            }}
          >
            {dict.heroTitle}
          </h1>

          {/* Subtitle */}
          <p
            className="text-slate-300 font-medium max-w-md leading-relaxed mb-8"
            style={{
              fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(14px)",
              transition: "opacity 0.75s ease, transform 0.75s ease",
              transitionDelay: "240ms",
            }}
          >
            {dict.heroSubtitle}
          </p>

          {/* CTA */}
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
              transitionDelay: "360ms",
            }}
          >
            <button
              onClick={scrollToWizard}
              className="group inline-flex items-center gap-3 bg-[#d91c1c] text-white font-bold px-7 py-3.5 rounded-lg text-sm uppercase tracking-widest hover:bg-[#b91515] transition-all duration-300 shadow-lg shadow-[#d91c1c]/30 hover:shadow-[#d91c1c]/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              {dict.heroCta}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
