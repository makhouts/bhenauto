"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { WerkplaatsDict } from "@/lib/dictionaries";
import mechanic from "@/assets/mechanic-wallpaper.webp";

export default function WerkplaatsHero({ dict }: { dict: WerkplaatsDict }) {
  const scrollToWizard = () => {
    document.getElementById("afspraak-wizard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[680px] w-full overflow-hidden lg:min-h-[82svh]">
        {/* Background image */}
        <Image
          src={mechanic}
          alt={dict.heroTitle}
          fill
          sizes="100vw"
          quality={70}
          className="object-cover"
          style={{ filter: "grayscale(45%) brightness(0.48)" }}
          priority
        />

        {/* Gradient vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,8,12,.9) 0%, rgba(8,8,12,.5) 52%, rgba(8,8,12,.2) 100%)",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 mx-auto flex w-full max-w-[1600px] flex-col justify-end px-4 pb-16 pt-32 sm:px-6 sm:pb-20 lg:justify-center lg:px-10 lg:pb-0 xl:px-12">
          {/* Label */}
          <p
            className="brand-kicker mb-6"
          >
            {dict.heroLabel}
          </p>

          {/* Headline */}
          <h1
            className="brand-display mb-7 max-w-4xl text-white"
          >
            {dict.heroTitle}
          </h1>

          {/* Subtitle */}
          <p
            className="mb-8 max-w-lg border-l border-white/30 pl-5 text-base font-medium leading-7 text-white/70"
          >
            {dict.heroSubtitle}
          </p>

          {/* CTA */}
          <div>
            <button
              onClick={scrollToWizard}
              className="brand-button-primary group gap-3"
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
