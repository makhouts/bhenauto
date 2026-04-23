"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Home, Search } from "lucide-react";
import type { NotFoundDict } from "@/lib/dictionaries";
import logo from "@/assets/logo.webp";

/* ── Floating particle dot ─────────────────────────────────── */
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, backgroundColor: "#d91c1c" }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 0.15, 0], scale: [0, 1.2, 0], y: [0, -60, -120] }}
      transition={{
        duration: 4 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3,
        ease: "easeOut",
      }}
    />
  );
}

/* ── Animated track line ────────────────────────────────────── */
function TrackLine() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-px overflow-hidden"
      style={{ background: "linear-gradient(to right, transparent, #d91c1c33, transparent)" }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full w-1/3"
        style={{ background: "linear-gradient(to right, transparent, #d91c1c, transparent)" }}
        animate={{ x: ["-100%", "400%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
      />
    </motion.div>
  );
}

/* ── SVG Car ────────────────────────────────────────────────── */
function CarSVG() {
  return (
    <motion.div
      animate={{ x: [0, 8, 0, -8, 0], rotate: [0, 0.5, 0, -0.5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 220 80" className="w-full max-w-[280px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.ellipse
          cx="110" cy="72" rx="80" ry="5" fill="rgba(0,0,0,0.08)"
          animate={{ rx: [80, 84, 80] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="20" y="38" width="180" height="28" rx="5" fill="#1e293b" />
        <path d="M60 38 L80 18 L148 18 L168 38Z" fill="#d91c1c" />
        <path d="M84 22 L90 38 L130 38 L136 22Z" fill="#a5b4c8" opacity="0.5" />
        <path d="M84 22 L90 38 L95 38 L100 22Z" fill="white" opacity="0.08" />
        <rect x="175" y="42" width="18" height="12" rx="3" fill="#374151" />
        <motion.rect
          x="193" y="45" width="6" height="6" rx="1" fill="#fde68a"
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <rect x="15" y="44" width="10" height="8" rx="2" fill="#374151" />
        <motion.rect
          x="10" y="46" width="6" height="4" rx="1" fill="#d91c1c"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <circle cx="60" cy="66" r="10" fill="#0f172a" stroke="#374151" strokeWidth="2" />
        <circle cx="60" cy="66" r="5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <circle cx="155" cy="66" r="10" fill="#0f172a" stroke="#374151" strokeWidth="2" />
        <circle cx="155" cy="66" r="5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <text x="92" y="54" fontFamily="Arial" fontWeight="700" fontSize="7" fill="#94a3b8" letterSpacing="1">BHENAUTO</text>
        <rect x="20" y="52" width="180" height="2" rx="1" fill="#d91c1c" opacity="0.6" />
      </svg>
    </motion.div>
  );
}

/* ── Road dashes ────────────────────────────────────────────── */
function RoadDashes() {
  return (
    <div className="relative w-full max-w-[280px] h-4 overflow-hidden mt-1">
      <div className="flex gap-3 items-center h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-0.5 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0"
            style={{ width: 20 }}
            animate={{ x: [-60 * (i % 2 === 0 ? 1 : -1), 60 * (i % 2 === 0 ? 1 : -1)] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: i * 0.05 }}
          />
        ))}
      </div>
    </div>
  );
}

const PARTICLES = Array.from({ length: 14 }).map((_, i) => ({
  key: i, delay: i * 0.4, x: 5 + (i * 7) % 90, y: 10 + (i * 13) % 70, size: 3 + (i % 3) * 2,
}));

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function NotFoundClient({ dict, locale }: { dict: NotFoundDict; locale: string }) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a0f1e 0%, #0f172a 60%, #1a0a0a 100%)" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, #d91c1c 0%, transparent 70%)", opacity: 0.12 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{ background: "linear-gradient(to top, rgba(217,28,28,0.08), transparent)" }} />
      </div>

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map(p => <Particle key={p.key} delay={p.delay} x={p.x} y={p.y} size={p.size} />)}
      </div>

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-10">
          <Link href={`/${locale}`} className="inline-block">
            <div
              className="px-6 py-3 rounded-2xl"
              style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Image
                src={logo}
                alt="BhenAuto"
                height={52}
                className="h-[52px] w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </motion.div>

        {/* 404 */}
        <motion.div variants={fadeUp} className="relative mb-4 select-none">
          <span
            className="text-[130px] sm:text-[170px] font-black leading-none"
            style={{
              fontFamily: "var(--font-inter)",
              background: "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.35) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.04em",
            }}
          >
            4<span style={{ WebkitTextFillColor: "#d91c1c" }}>0</span>4
          </span>
          <TrackLine />
        </motion.div>

        {/* Car */}
        <motion.div variants={fadeUp} className="mb-2 w-full flex flex-col items-center">
          <CarSVG />
          <RoadDashes />
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-black mt-8 mb-3"
          style={{ color: "#f1f5f9", fontFamily: "var(--font-inter)", letterSpacing: "-0.02em" }}
        >
          {dict.headline}
        </motion.h1>

        {/* Subline */}
        <motion.p
          variants={fadeUp}
          className="text-base mb-10 leading-relaxed max-w-sm"
          style={{ color: "#94a3b8" }}
        >
          {dict.subline}
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/${locale}`}
            className="group relative flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 overflow-hidden"
            style={{ background: "#d91c1c" }}
            onMouseEnter={() => setHoveredBtn("home")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, #ff3232, #b91515)" }}
              animate={{ opacity: hoveredBtn === "home" ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)" }}
              animate={hoveredBtn === "home" ? { x: ["-100%", "100%"] } : { x: "-100%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <Home size={15} className="relative z-10" />
            <span className="relative z-10">{dict.backHome}</span>
          </Link>

          <Link
            href={`/${locale}/inventory`}
            className="relative flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 overflow-hidden"
            style={{
              color: "var(--theme-text-secondary)",
              border: "1.5px solid var(--theme-border)",
              background: "var(--theme-surface)",
            }}
            onMouseEnter={() => setHoveredBtn("inv")}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Search size={15} />
            {dict.browseInventory}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{ backgroundColor: "#d91c1c" }}
              animate={{ scaleX: hoveredBtn === "inv" ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />
          </Link>
        </motion.div>

        {/* Back link */}
        <motion.button
          variants={fadeUp}
          onClick={() => window.history.back()}
          className="mt-6 flex items-center gap-2 text-sm font-medium transition-colors duration-200"
          style={{ color: "var(--theme-text-faint)" }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={14} />
          <span style={{ color: "var(--theme-text-faint)" }}
            className="hover:text-[#d91c1c] transition-colors"
          >{dict.goBack}</span>
        </motion.button>
      </motion.div>

      {/* Footer watermark */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-[0.3em] uppercase pointer-events-none whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.25)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        © BhenAuto — Premium Automotive
      </motion.div>
    </div>
  );
}
