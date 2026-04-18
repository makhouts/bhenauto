"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Wrench, Trophy } from "lucide-react";
import whyUsBg from "@/assets/why-us.webp";
import mechanicImg from "@/assets/mechanic.webp";
import premiumImg from "@/assets/premium.webp";
import dealImg from "@/assets/deal.webp";
import type { WhyChooseUsDict } from "@/lib/dictionaries";

/* ────────────────── hooks ────────────────── */
function useCounter(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return count;
}

function useInView(threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ────────────────── card icons (positional, not translated) ────────────────── */
const CARD_ICONS = [CheckCircle, Wrench, Trophy] as const;
const CARD_IMAGES = [premiumImg, mechanicImg, dealImg] as const;
const CARD_IMG_CLASSES = ["", "", "object-contain scale-110 object-top translate-y-4"] as const;
const CARD_COUNTERS = [null, null, 15] as const;

/* ────────────────── floating particle ────────────────── */
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  speed: 0.05 + Math.random() * 0.25,
  opacity: 0.06 + Math.random() * 0.18,
}));

/* ────────────────── card ────────────────── */
function FeatureCard({
  card, index, lang, counter, icon: Icon, image, imgClass, mouseX, mouseY,
}: {
  card: WhyChooseUsDict['cards'][number];
  index: number;
  lang: string;
  counter: number | null;
  icon: typeof CARD_ICONS[number];
  image: typeof CARD_IMAGES[number];
  imgClass: string;
  mouseX: number;
  mouseY: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [localMouse, setLocalMouse] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { ref: visRef, inView } = useInView(0.15);
  const count = useCounter(counter ?? 0, 1800, inView && counter !== null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    setLocalMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  }, []);

  // 3D tilt from local mouse
  const tiltX = hovered ? (localMouse.y - 0.5) * -12 : 0;
  const tiltY = hovered ? (localMouse.x - 0.5) * 14 : 0;

  return (
    <div
      ref={visRef}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) scale(1)" : "translateY(40px) scale(0.96)",
        transition: `opacity 0.7s ease ${index * 0.14}s, transform 0.7s ease ${index * 0.14}s`,
        perspective: 800,
      }}
    >
      <div
        ref={cardRef}
        className="relative rounded-2xl overflow-hidden"
        style={{
          minHeight: 500,
          cursor: "default",
          transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${hovered ? 1.025 : 1})`,
          transition: hovered
            ? "transform 0.15s ease-out, box-shadow 0.3s ease"
            : "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.3s ease",
          boxShadow: hovered
            ? "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(217,28,28,0.3)"
            : "0 10px 40px rgba(0,0,0,0.4)",
          willChange: "transform",
          WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setLocalMouse({ x: 0.5, y: 0.5 }); }}
        onMouseMove={handleMouseMove}
      >
        {/* Bg image */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            transform: hovered ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
          }}
        >
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={imgClass || "object-cover object-center"}
          />
        </div>

        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-3/5 bg-gradient-to-t from-[#020202] to-transparent pointer-events-none" />

        {/* Specular highlight based on mouse */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${localMouse.x * 100}% ${localMouse.y * 100}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
            opacity: hovered ? 1 : 0,
          }}
        />

        {/* Red accent glow on hover */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none transition-opacity duration-500"
          style={{
            background: "linear-gradient(to top, rgba(217,28,28,0.22), transparent)",
            opacity: hovered ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-7 sm:p-8" style={{ minHeight: 500 }}>
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-black uppercase tracking-[0.22em] px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {card.tag}
            </span>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: hovered ? "#d91c1c" : "rgba(255,255,255,0.1)",
                border: `1px solid ${hovered ? "#d91c1c" : "rgba(255,255,255,0.18)"}`,
                backdropFilter: "blur(6px)",
                transform: hovered ? "rotate(15deg) scale(1.1)" : "rotate(0deg) scale(1)",
              }}
            >
              <Icon size={17} color="white" />
            </div>
          </div>

          {/* Bottom */}
          <div>
            {counter !== null && (
              <div className="flex items-end gap-1 mb-2">
                <span className="font-headings font-black leading-none text-[#d91c1c]" style={{ fontSize: "clamp(3.5rem, 7vw, 4.5rem)" }}>
                  {count}
                </span>
                <span className="font-headings font-black text-white mb-2 text-3xl">+</span>
              </div>
            )}

            <h3
              className="font-headings font-black text-white leading-tight mb-3"
              style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.3rem)", whiteSpace: "pre-line" }}
            >
              {card.title}
            </h3>

            <div
              className="h-px mb-4 transition-all duration-500 rounded-full"
              style={{ width: hovered ? 52 : 24, backgroundColor: "#d91c1c" }}
            />

            <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-6 font-medium">
              {card.body}
            </p>

            <Link
              href={`/${lang}${card.href}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2.5 text-xs font-black uppercase tracking-widest group/cta"
            >
              <span className="transition-colors duration-300" style={{ color: hovered ? "#d91c1c" : "rgba(255,255,255,0.8)" }}>
                {card.cta}
              </span>
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: hovered ? "#d91c1c" : "rgba(255,255,255,0.12)",
                  transform: hovered ? "translateX(4px)" : "translateX(0)",
                }}
              >
                <ArrowRight size={13} color="white" />
              </span>
            </Link>
          </div>
        </div>

        {/* Bottom edge streak */}
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-700"
          style={{ width: hovered ? "100%" : "0%", backgroundColor: "#d91c1c" }}
        />
      </div>
    </div>
  );
}

/* ────────────────── main ────────────────── */
export default function WhyChooseUs({ lang, dict }: { lang: string; dict: WhyChooseUsDict }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouseX, setMouseX] = useState(0.5);
  const [mouseY, setMouseY] = useState(0.5);
  const { ref: headRef, inView: headInView } = useInView(0.1);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    setMouseX((e.clientX - r.left) / r.width);
    setMouseY((e.clientY - r.top) / r.height);
  }, []);

  const mx = mouseX - 0.5;
  const my = mouseY - 0.5;

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-36 overflow-hidden"
      style={{ isolation: "isolate" }}
      onMouseMove={handleMouseMove}
    >
      {/* ══ BACKGROUND IMAGE ══ */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <Image
          src={whyUsBg}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* ══ DARK GRADIENT OVERLAY ══ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom,
            rgba(0,0,0,0.50) 0%,
            rgba(0,0,0,0.20) 35%,
            rgba(0,0,0,0.25) 65%,
            rgba(0,0,0,0.88) 100%
          )`,
        }}
      />

      {/* ══ DARK BASE COLOUR ══ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: "rgba(8,8,14,0.55)" }}
      />

      {/* ══ EDGE VIGNETTE ══ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.60) 100%)",
        }}
      />

      {/* ══ RED BOTTOM RIM ══ */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "30%",
          background: "linear-gradient(to top, rgba(217,28,28,0.15) 0%, transparent 100%)",
        }}
      />

      {/* ══ MOUSE SPECULAR ══ */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, rgba(255,255,255,0.04) 0%, transparent 55%)`,
        }}
      />

      {/* ══ CONTENT ══ */}
      <div className="relative z-10 max-w-[105rem] mx-auto px-4 sm:px-8 xl:px-16">
        {/* Header */}
        <div
          ref={headRef}
          className="text-center mb-16"
          style={{
            opacity: headInView ? 1 : 0,
            transform: headInView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <p className="text-lg sm:text-xl font-black uppercase tracking-[0.3em] text-[#d91c1c] mb-4">
            {dict.sectionLabel}
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-headings font-black text-white mb-6 leading-[1.1] drop-shadow-2xl">
            {dict.sectionTitle}
          </h2>
          <div className="w-16 h-1 bg-[#d91c1c] mx-auto mb-6 rounded-full" />
          <p className="text-white/75 max-w-2xl mx-auto leading-relaxed text-base sm:text-lg font-medium">
            {dict.sectionSubtitle}
          </p>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-14 xl:gap-20"
          style={{
            transform: `translateX(${mx * -6}px) translateY(${my * -4}px)`,
            transition: "transform 0.12s ease-out",
          }}
        >
          {dict.cards.map((card, i) => (
            <FeatureCard
              key={card.tag}
              card={card}
              index={i}
              lang={lang}
              counter={CARD_COUNTERS[i] ?? null}
              icon={CARD_ICONS[i]}
              image={CARD_IMAGES[i]}
              imgClass={CARD_IMG_CLASSES[i]}
              mouseX={mouseX}
              mouseY={mouseY}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
