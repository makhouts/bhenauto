"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, CalendarDays, Gauge, Fuel } from "lucide-react";
import { useLocale } from "@/components/LocaleContext";
import type { CarouselDict, CommonDict, HomeDict } from "@/lib/dictionaries";

interface CarouselCar {
  id: string;
  title: string;
  slug: string;
  brand: string;
  model: string;
  price: number;
  year: number;
  mileage: number;
  horsepower: number;
  fuel_type: string;
  image: string;
  sold: boolean;
}

const AUTO_PLAY_MS = 5000;

export default function LatestOccasionsCarousel({
  cars,
  dict,
  homeDict,
  commonDict,
}: {
  cars: CarouselCar[];
  dict: CarouselDict;
  homeDict: HomeDict;
  commonDict: CommonDict;
}) {
  const { locale } = useLocale();
  const [visible, setVisible] = useState(3);
  const [gap, setGap] = useState(40);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) { setVisible(3); setGap(40); }
      else if (window.innerWidth >= 768) { setVisible(2); setGap(28); }
      else { setVisible(1); setGap(20); }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize();
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = cars.length;
  const maxIndex = Math.max(0, total - visible);

  const resetAutoPlay = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      setIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, AUTO_PLAY_MS);
  }, [maxIndex]);

  useEffect(() => {
    resetAutoPlay();
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [index, resetAutoPlay]);

  const goTo = useCallback((next: number) => {
    if (isAnimating) return;
    const clamped = Math.max(0, Math.min(next, maxIndex));
    setIndex(clamped);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 450);
    resetAutoPlay();
  }, [isAnimating, maxIndex, resetAutoPlay]);

  const prev = () => goTo(index === 0 ? maxIndex : index - 1);
  const next = () => goTo(index >= maxIndex ? 0 : index + 1);

  const onDragStart = (x: number) => {
    setDragging(true);
    setDragStart(x);
    setDragDelta(0);
    if (autoRef.current) clearTimeout(autoRef.current);
  };
  const onDragMove = (x: number) => {
    if (!dragging) return;
    setDragDelta(x - dragStart);
  };
  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = 60;
    if (dragDelta < -threshold) next();
    else if (dragDelta > threshold) prev();
    else resetAutoPlay();
    setDragDelta(0);
  };

  if (!cars.length) return null;

  return (
    <section className="py-16 sm:py-24 theme-bg overflow-hidden">
      {/* Standard boxed container to align with website layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-6 h-0.5 rounded-full"
                style={{ backgroundColor: '#d91c1c' }}
              />
              <p className="text-[10px] sm:text-xs tracking-[0.3em] font-bold text-[#d91c1c] uppercase">
                {homeDict.latestLabel}
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-headings font-black theme-text leading-none">
              {homeDict.latestTitle}
            </h2>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Pill dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Ga naar positie ${i + 1}`}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === index ? 24 : 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: i === index ? '#d91c1c' : 'var(--theme-border)',
                  }}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 opacity-20" style={{ backgroundColor: 'var(--theme-text)' }} />

            {/* Arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Vorige"
                className="group w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[#d91c1c] hover:border-[#d91c1c] hover:text-white theme-text-muted"
                style={{ border: '1.5px solid var(--theme-border)' }}
              >
                <ChevronLeft size={17} className="transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={next}
                aria-label="Volgende"
                className="group w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[#d91c1c] hover:border-[#d91c1c] hover:text-white theme-text-muted"
                style={{ border: '1.5px solid var(--theme-border)' }}
              >
                <ChevronRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Track ── */}
        <div
          className="relative overflow-hidden select-none"
          onMouseDown={e => onDragStart(e.clientX)}
          onMouseMove={e => onDragMove(e.clientX)}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={e => onDragStart(e.touches[0].clientX)}
          onTouchMove={e => onDragMove(e.touches[0].clientX)}
          onTouchEnd={onDragEnd}
        >
          <div
            ref={trackRef}
            className="flex"
            style={{
              gap: gap,
              transform: `translateX(calc(-${index * (100 / visible)}% - ${index * (gap / visible)}px + ${dragging ? dragDelta : 0}px))`,
              transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
          >
            {cars.map((car) => (
              <div
                key={car.id}
                className="shrink-0"
                style={{
                  width: `calc(${100 / visible}% - ${gap * ((visible - 1) / visible)}px)`,
                  minWidth: 0,
                }}
              >
                <Link
                  href={`/${locale}/cars/${car.slug}`}
                  draggable={false}
                  className="group block theme-surface rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    border: '1px solid var(--theme-border)',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* ── Image ── */}
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: '16/10', backgroundColor: 'var(--theme-skeleton)' }}
                  >
                    <Image
                      src={car.image}
                      alt={car.title}
                      fill
                      draggable={false}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      quality={80}
                    />

                    {/* Bottom scrim for price readability */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

                    {/* Sold badge */}
                    {car.sold && (
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                      >
                        {commonDict.sold}
                      </div>
                    )}

                    {/* Price */}
                    <div className="absolute bottom-3 left-4">
                      <span className="text-xl sm:text-2xl font-black text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                        €{car.price.toLocaleString('nl-BE')}
                      </span>
                    </div>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="p-5 sm:p-6">

                    {/* Brand + Model */}
                    <div className="mb-4">
                      <h3 className="text-lg sm:text-xl font-headings font-black theme-text leading-tight line-clamp-1">
                        {car.brand} {car.model}
                      </h3>
                    </div>

                    {/* Specs — 3-column split */}
                    <div
                      className="flex items-stretch mb-5 rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--theme-border)' }}
                    >
                      {[
                        { icon: CalendarDays, label: dict.specYear, value: car.year.toString() },
                        { icon: Gauge, label: dict.specMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                        { icon: Fuel, label: dict.specFuel, value: car.fuel_type },
                      ].map((spec, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-center gap-1 py-3.5 px-2 relative"
                          style={{ backgroundColor: 'var(--theme-bg-alt)' }}
                        >
                          {/* Divider between columns */}
                          {i > 0 && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-px"
                              style={{ backgroundColor: 'var(--theme-border)' }}
                            />
                          )}
                          {/* Label row with icon */}
                          <div className="flex items-center gap-1">
                            <spec.icon size={11} style={{ color: '#d91c1c' }} className="shrink-0" />
                            <span
                              className="text-[9px] font-bold uppercase tracking-widest leading-none"
                              style={{ color: '#d91c1c' }}
                            >
                              {spec.label}
                            </span>
                          </div>
                          {/* Value */}
                          <span className="text-sm font-extrabold theme-text leading-none text-center">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px mb-4" style={{ backgroundColor: 'var(--theme-border)' }} />

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold theme-text-faint uppercase tracking-widest group-hover:text-[#d91c1c] transition-colors duration-200">
                        {dict.viewDetails}
                      </span>
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 group-hover:bg-[#d91c1c] group-hover:text-white theme-text-faint"
                        style={{ border: '1px solid var(--theme-border)' }}
                      >
                        <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </span>
                    </div>

                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Mobile dots + View All ── */}
        <div className="flex items-center justify-between mt-6 sm:hidden">
          <div className="flex gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? '#d91c1c' : 'var(--theme-border)',
                }}
              />
            ))}
          </div>
          <Link
            href={`/${locale}/inventory`}
            className="flex items-center gap-1.5 text-xs font-bold theme-text-muted hover:text-[#d91c1c] transition-colors"
          >
            {dict.viewAllMobile}
            <ArrowRight size={13} className="transition-transform" />
          </Link>
        </div>

        {/* ── Desktop View All ── */}
        <div className="hidden sm:flex justify-center mt-12">
          <Link
            href={`/${locale}/inventory`}
            className="group inline-flex items-center gap-3 px-8 py-3.5 font-bold text-sm uppercase tracking-widest theme-text-secondary hover:text-[#d91c1c] transition-colors rounded-xl"
            style={{ border: '1.5px solid var(--theme-border)' }}
          >
            {dict.viewAll}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}
