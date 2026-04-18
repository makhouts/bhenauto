"use client";

import { useRef, ReactNode } from "react";
import {
  Wrench,
  ShieldCheck,
  PaintBucket,
  Zap,
  Microscope,
  CheckCircle2,
  ArrowRight,
  Star,
} from "lucide-react";
import type { WerkplaatsDict } from "@/lib/dictionaries";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "motion/react";

/* ─────────────────────────────────────────────
   Animation variants
───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const, delay },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/* ─────────────────────────────────────────────
   Tilt-on-hover card wrapper
───────────────────────────────────────────── */
function TiltCard({
  children,
  className,
  style,
  delay = 0,
  tiltAmount = 3,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  tiltAmount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const springCfg = { stiffness: 240, damping: 26 };
  const sX = useSpring(rotX, springCfg);
  const sY = useSpring(rotY, springCfg);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    rotX.set(-dy * tiltAmount);
    rotY.set(dx * tiltAmount);
  };

  const onLeave = () => { rotX.set(0); rotY.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, rotateX: sX, rotateY: sY, transformStyle: "preserve-3d" }}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ scale: 1.016 }}
      transition={{ scale: { duration: 0.22, ease: "easeOut" } }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Small tag pill
───────────────────────────────────────────── */
function ServiceTag({ label, dark = false }: { label: string; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.14em] uppercase"
      style={
        dark
          ? { background: "rgba(217,28,28,0.18)", color: "#f87171" }
          : { background: "rgba(217,28,28,0.08)", color: "#d91c1c" }
      }
    >
      <Star size={9} fill="currentColor" />
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function WerkplaatsServices({ dict }: { dict: WerkplaatsDict }) {
  const svc = (id: string) => dict.services.find((s) => s.id === id) ?? dict.services[0];

  const maintenance   = svc("Onderhoud");
  const carrosserie   = svc("Carrosserie");
  const diagnose      = svc("Diagnose");
  const tech          = svc("Technische Controle");
  const repairs       = svc("Herstellingen");

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* Ambient gradient drifts on scroll */
  const gradX = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);

  return (
    <section
      ref={sectionRef}
      className="relative mb-28 mt-12 px-3 md:px-6 max-w-7xl mx-auto"
      style={{ perspective: "1400px" }}
    >
      {/* ── Ambient red haze (very subtle) ── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-x-32 top-10 h-[400px] rounded-full blur-[140px] opacity-[0.04]"
        style={{
          background: "radial-gradient(ellipse at center, #d91c1c 0%, transparent 70%)",
          x: gradX,
        }}
      />

      {/* ── Section header ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <motion.p
            variants={fadeUp}
            custom={0}
            className="text-[10px] font-black uppercase tracking-[0.22em] mb-3 text-[#d91c1c]"
          >
            {dict.servicesLabel}
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={0.06}
            className="text-4xl md:text-5xl font-headings font-black tracking-tight"
            style={{ color: "var(--theme-text)" }}
          >
            {dict.servicesTitle}
          </motion.h2>
        </div>
        <motion.div
          variants={fadeUp}
          custom={0.12}
          className="hidden md:block h-px flex-1 mx-8 max-w-[180px]"
          style={{ background: "linear-gradient(to right, rgba(217,28,28,0.3), transparent)" }}
        />
      </motion.div>

      {/* ══════════════════════════════════════
          BENTO GRID
          lg layout:
            [col 1-2] Onderhoud  |  [col 3-4] Carrosserie
            [col 1-2] Onderhoud  |  [col 3] Diagnose  [col 4] Herstell.
            [col 1-4] Technische Controle (full width)
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* ════════════════════════════════════
            1. ONDERHOUD — Large hero card (light/white)
        ════════════════════════════════════ */}
        <TiltCard
          delay={0}
          tiltAmount={2}
          className="group relative flex flex-col overflow-hidden rounded-2xl
                     md:col-span-2 lg:col-span-2 lg:row-span-2
                     min-h-[460px] lg:min-h-[580px] cursor-pointer"
          style={{ background: "#020214" }}
        >
          {/* Layered depth gradients */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 90% 0%, rgba(217,28,28,0.2) 0%, transparent 50%)," +
                "radial-gradient(ellipse at 5% 100%, rgba(10,15,80,0.7) 0%, transparent 60%)," +
                "linear-gradient(135deg, rgba(2,2,30,0) 0%, rgba(2,2,20,0.5) 100%)",
            }}
          />
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Top shimmer line */}
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-20"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)" }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col p-7 lg:p-9 h-full">
            <div className="flex items-start justify-between mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#f87171]
                         transition-all duration-500 group-hover:bg-[#d91c1c] group-hover:text-white"
                style={{ background: "rgba(217,28,28,0.15)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Wrench size={20} />
              </div>
              <ServiceTag label="Core Service" />
            </div>

            <h3
              className="font-headings font-black tracking-tight leading-tight mb-3 text-[1.8rem] lg:text-[2.1rem] text-white"
            >
              {maintenance.title}
            </h3>
            <p className="text-sm leading-relaxed max-w-sm mb-8" style={{ color: "rgba(170,185,225,0.8)" }}>
              {maintenance.body}
            </p>

            {/* Decorative divider */}
            <div className="flex-1" />
            <div
              className="h-px mb-7 transition-opacity duration-500 group-hover:opacity-100 opacity-40"
              style={{ background: "linear-gradient(to right, rgba(217,28,28,0.3), transparent)" }}
            />

            {/* Checklist items */}
            {"checklistItems" in maintenance && maintenance.checklistItems && (
              <ul className="space-y-3">
                {(maintenance.checklistItems as string[]).map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[12px] font-semibold"
                    style={{ color: "rgba(160,175,210,0.85)" }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 group-hover:bg-[#d91c1c]"
                      style={{ background: "rgba(217,28,28,0.18)" }}
                    >
                      <CheckCircle2 size={12} className="text-[#f87171] group-hover:text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bottom accent bar */}
          <div
            className="absolute bottom-0 inset-x-0 h-[3px] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(to right, #d91c1c 0%, transparent 80%)" }}
          />
        </TiltCard>

        {/* ════════════════════════════════════
            2. CARROSSERIE — Dark navy premium card
        ════════════════════════════════════ */}
        <TiltCard
          delay={0.07}
          tiltAmount={2.5}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl
                     md:col-span-2 lg:col-span-2 lg:row-span-1
                     min-h-[220px] cursor-pointer p-7 lg:p-8"
          style={{ background: "#020214" }}
        >
          {/* Layered gradients for depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 80% 0%, rgba(217,28,28,0.22) 0%, transparent 55%)," +
                "radial-gradient(ellipse at 10% 100%, rgba(10,15,60,0.8) 0%, transparent 60%)," +
                "linear-gradient(135deg, rgba(2,2,30,0) 0%, rgba(2,2,20,0.6) 100%)",
            }}
          />
          {/* Fine dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Top shimmer line */}
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-30"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)" }}
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[#f87171]
                           transition-all duration-400 group-hover:bg-[#d91c1c] group-hover:text-white"
                style={{ background: "rgba(217,28,28,0.15)" }}
              >
                <PaintBucket size={18} />
              </div>
              <ServiceTag label="Premium" dark />
            </div>
            <h3 className="text-[1.4rem] font-headings font-black text-white mb-2.5 tracking-tight">
              {carrosserie.title}
            </h3>
            <p className="text-[13px] leading-relaxed max-w-sm" style={{ color: "rgba(180,190,220,0.8)" }}>
              {carrosserie.body}
            </p>
          </div>

          <div
            className="relative z-10 pt-5 mt-5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <button
              onClick={() =>
                document.getElementById("afspraak-wizard")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 text-[#f87171] font-bold text-sm
                         hover:text-white transition-colors duration-300 group/btn"
            >
              {"cta" in carrosserie
                ? (carrosserie as { cta?: string }).cta
                : "Vraag offerte aan"}
              <ArrowRight
                size={14}
                className="group-hover/btn:translate-x-1.5 transition-transform duration-300"
              />
            </button>
            <div className="w-2 h-2 rounded-full bg-[#d91c1c] opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </TiltCard>

        {/* ════════════════════════════════════
            3. DIAGNOSE — Small mid-dark card
        ════════════════════════════════════ */}
        <TiltCard
          delay={0.12}
          tiltAmount={4}
          className="group relative flex flex-col overflow-hidden rounded-2xl
                     lg:col-span-1 lg:row-span-1
                     min-h-[240px] cursor-pointer p-7"
          style={{ background: "#04041a" }}
        >
          {/* Brand gradient glow bottom-left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 0% 100%, rgba(217,28,28,0.14) 0%, transparent 60%)," +
                "linear-gradient(to top right, rgba(2,2,28,0.9) 0%, rgba(5,5,35,0.4) 100%)",
            }}
          />
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-20"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)" }}
          />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[#f87171]
                           transition-all duration-400 group-hover:bg-[#d91c1c] group-hover:text-white"
                style={{ background: "rgba(217,28,28,0.15)" }}
              >
                <Microscope size={18} />
              </div>
              <ServiceTag label="Tech" dark />
            </div>
            <h3 className="text-[1.1rem] font-headings font-black text-white tracking-tight mb-2.5">
              {diagnose.title}
            </h3>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: "rgba(160,175,210,0.8)" }}>
              {diagnose.body}
            </p>
          </div>
          {/* Bottom accent */}
          <div
            className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(to right, #d91c1c, transparent)" }}
          />
        </TiltCard>

        {/* ════════════════════════════════════
            4. HERSTELLINGEN — Stat card (dark navy)
        ════════════════════════════════════ */}
        <TiltCard
          delay={0.16}
          tiltAmount={4}
          className="group relative flex flex-col overflow-hidden rounded-2xl
                     lg:col-span-1 lg:row-span-1
                     min-h-[240px] cursor-pointer p-7"
          style={{ background: "#02021a" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 100% 0%, rgba(217,28,28,0.12) 0%, transparent 55%)," +
                "radial-gradient(ellipse at 0% 100%, rgba(10,15,80,0.5) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-20"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)" }}
          />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[#f87171]
                           transition-all duration-400 group-hover:bg-[#d91c1c] group-hover:text-white"
                style={{ background: "rgba(217,28,28,0.15)" }}
              >
                <Zap size={18} />
              </div>
              <ServiceTag label="Experts" dark />
            </div>
            <h3 className="text-[1.1rem] font-headings font-black text-white tracking-tight mb-2.5">
              {repairs.title}
            </h3>
            <p className="text-[13px] leading-relaxed mb-6 flex-1" style={{ color: "rgba(160,175,210,0.8)" }}>
              {repairs.body}
            </p>

            {/* Stats */}
            <div
              className="grid grid-cols-2 gap-3 mt-auto pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div>
                <motion.p
                  className="text-2xl font-black text-[#f87171]"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.18 }}
                >
                  20+
                </motion.p>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.14em] mt-1"
                  style={{ color: "rgba(140,155,200,0.7)" }}
                >
                  {"statYearsLabel" in repairs
                    ? (repairs as { statYearsLabel?: string }).statYearsLabel
                    : "Jaar ervaring"}
                </p>
              </div>
              <div>
                <motion.p
                  className="text-2xl font-black text-[#f87171]"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.18 }}
                >
                  500+
                </motion.p>
                <p
                  className="text-[9px] font-black uppercase tracking-[0.14em] mt-1"
                  style={{ color: "rgba(140,155,200,0.7)" }}
                >
                  {"statClientsLabel" in repairs
                    ? (repairs as { statClientsLabel?: string }).statClientsLabel
                    : "Tevreden klanten"}
                </p>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* ════════════════════════════════════
            5. TECHNISCHE CONTROLE — Full-width dark strip
        ════════════════════════════════════ */}
        <TiltCard
          delay={0.2}
          tiltAmount={1}
          className="group relative overflow-hidden rounded-2xl
                     lg:col-span-4 lg:row-span-1
                     min-h-[160px] cursor-pointer p-7 lg:px-10 lg:py-8
                     flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          style={{ background: "#020214" }}
        >
          {/* Multi-layer gradient — richer depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 5% 50%, rgba(217,28,28,0.16) 0%, transparent 45%)," +
                "radial-gradient(ellipse at 95% 50%, rgba(20,25,100,0.5) 0%, transparent 50%)," +
                "linear-gradient(90deg, rgba(217,28,28,0.06) 0%, transparent 60%)",
            }}
          />
          {/* Horizontal shimmer lines */}
          <div
            className="absolute inset-y-0 left-0 w-[3px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{ background: "linear-gradient(to bottom, transparent, #d91c1c, transparent)" }}
          />
          <div
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none opacity-20"
            style={{ background: "linear-gradient(to right, rgba(217,28,28,0.6), transparent 40%)" }}
          />

          {/* Left: content */}
          <div className="relative z-10 flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0
                         transition-all duration-400 group-hover:bg-[#d91c1c]"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-[1.25rem] font-headings font-black text-white tracking-tight">
                  {tech.title}
                </h3>
                <ServiceTag label="Certified" dark />
              </div>
              <p
                className="text-[13px] leading-relaxed max-w-lg"
                style={{ color: "rgba(170,185,225,0.8)" }}
              >
                {tech.body}
              </p>
            </div>
          </div>

          {/* Right: CTA button */}
          <button
            onClick={() =>
              document.getElementById("afspraak-wizard")?.scrollIntoView({ behavior: "smooth" })
            }
            className="relative z-10 flex-shrink-0 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl
                       bg-[#d91c1c] text-white font-bold text-sm tracking-wide
                       hover:bg-[#b91515] transition-all duration-300 shadow-lg shadow-[#d91c1c]/20
                       hover:shadow-[#d91c1c]/40 hover:-translate-y-0.5 active:translate-y-0 group/cta"
          >
            Afspraak maken
            <ArrowRight size={15} className="group-hover/cta:translate-x-1 transition-transform duration-300" />
          </button>
        </TiltCard>

      </div>
    </section>
  );
}
