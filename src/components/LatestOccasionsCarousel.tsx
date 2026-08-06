"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useLocale } from "@/components/LocaleContext";
import type { CarouselDict, CommonDict, HomeDict } from "@/lib/dictionaries";
import { shouldUseDirectImageDelivery } from "@/lib/image-url";

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
  imageFallback?: string;
  sold: boolean;
}

const AUTO_PLAY_MS = 4000;

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
  // Desktop is the server snapshot. Responsive CSS below controls the actual
  // first-paint card width, so hydration never changes 3 columns into 4.
  const [visible, setVisible] = useState(4);
  const [gap, setGap] = useState(28);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) { setVisible(4); setGap(28); }
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
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = cars.length;
  const maxIndex = Math.max(0, total - visible);
  const autoPlayEnabled = maxIndex > 0;

  const resetAutoPlay = useCallback(() => {
    if (autoRef.current) clearTimeout(autoRef.current);
    if (!autoPlayEnabled) return;
    autoRef.current = setTimeout(() => {
      setIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, AUTO_PLAY_MS);
  }, [autoPlayEnabled, maxIndex]);

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
    <section className="overflow-hidden border-y border-[var(--theme-border)] py-20 sm:py-28 theme-bg">
      {/* Standard boxed container to align with website layout */}
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-10 sm:mb-14">
          <div>
            <div className="mb-4">
              <p className="brand-kicker">
                {homeDict.latestLabel}
              </p>
            </div>
            <h2 className="brand-section-title theme-text">
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
                  className="relative overflow-hidden transition-all duration-300 rounded-full"
                  style={{
                    width: i === index ? 24 : 7,
                    height: 7,
                    borderRadius: 0,
                    backgroundColor: i === index ? '#d91c1c' : 'var(--theme-border)',
                  }}
                >
                  {i === index && autoPlayEnabled ? (
                    <span
                      key={`desktop-progress-${index}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-white/55"
                      style={{ animation: `carousel-progress ${AUTO_PLAY_MS}ms linear forwards` }}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 opacity-20" style={{ backgroundColor: 'var(--theme-text)' }} />

            {/* Arrow buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                aria-label="Vorige"
                className="group flex size-11 items-center justify-center border transition-colors duration-200 hover:border-[#d91c1c] hover:bg-[#d91c1c] hover:text-white theme-text-muted"
                style={{ border: '1.5px solid var(--theme-border)' }}
              >
                <ChevronLeft size={17} className="transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={next}
                aria-label="Volgende"
                className="group flex size-11 items-center justify-center border transition-colors duration-200 hover:border-[#d91c1c] hover:bg-[#d91c1c] hover:text-white theme-text-muted"
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
            className="flex gap-5 md:gap-7"
            style={{
              transform: `translateX(calc(-${index * (100 / visible)}% - ${index * (gap / visible)}px + ${dragging ? dragDelta : 0}px))`,
              transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              cursor: dragging ? 'grabbing' : 'grab',
              willChange: 'transform',
            }}
          >
            {cars.map((car) => {
              const imageSrc = failedImages.has(car.image) && car.imageFallback ? car.imageFallback : car.image;
              return (
              <div
                key={car.id}
                className="w-full min-w-0 shrink-0 md:w-[calc(50%-14px)] xl:w-[calc(25%-21px)]"
              >
                <Link
                  href={`/${locale}/cars/${car.slug}`}
                  prefetch={false}
                  draggable={false}
                  className="group flex h-full flex-col overflow-hidden border border-[var(--theme-border)] theme-surface transition-colors duration-200 hover:border-[#8f8a83]"
                  style={{
                    textDecoration: 'none',
                  }}
                >
                  {/* ── Image ── */}
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: '4/3', backgroundColor: 'var(--theme-skeleton)' }}
                  >
                    <Image
                      src={imageSrc}
                      alt={car.title}
                      fill
                      draggable={false}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      quality={75}
                      unoptimized={shouldUseDirectImageDelivery(imageSrc)}
                      onError={() => {
                        if (!car.imageFallback || failedImages.has(car.image)) return;
                        setFailedImages((current) => {
                          const next = new Set(current);
                          next.add(car.image);
                          return next;
                        });
                      }}
                    />

                    {/* Bottom scrim for price readability */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

                    {/* Sold badge */}
                    {car.sold && (
                      <div
                        className="absolute right-3 top-3 border border-white/30 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
                      >
                        {commonDict.sold}
                      </div>
                    )}

                    {/* BHEN selection marker */}
                    <div className="absolute inset-x-0 bottom-0 flex items-end px-4 pb-3 text-white">
                      <span className="border-l-2 border-[#d91c1c] pl-2 text-[9px] font-extrabold uppercase tracking-[0.22em]">BhenAuto</span>
                    </div>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="flex flex-1 flex-col px-5 pb-0 pt-5">

                    {/* Vehicle + price */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="min-w-0 font-headings text-[1.65rem] font-semibold uppercase leading-[.9] theme-text line-clamp-2">
                        {car.brand} {car.model}
                      </h3>
                      <span className="shrink-0 font-headings text-2xl font-bold leading-none tabular-nums text-[#d91c1c]">
                        €{car.price.toLocaleString('nl-BE')}
                      </span>
                    </div>

                    {/* Instrument-style data rail */}
                    <div className="mt-5 grid grid-cols-3 border-y border-[var(--theme-border)]">
                      {[
                        { label: dict.specYear, value: car.year.toString() },
                        { label: dict.specMileage, value: `${car.mileage.toLocaleString('nl-BE')} km` },
                        { label: dict.specFuel, value: car.fuel_type },
                      ].map((spec, i) => (
                        <div
                          key={i}
                          className="relative min-w-0 py-4 pr-2 pl-3 first:pl-0 last:pr-0"
                        >
                          {i > 0 && (
                            <span className="absolute bottom-3 left-0 top-3 w-px bg-[var(--theme-border)]" />
                          )}
                          <span className="mb-2 block h-[2px] w-4 bg-[#d91c1c] transition-[width] duration-200 group-hover:w-7" />
                          <span className="block text-[8px] font-extrabold uppercase leading-none tracking-[0.18em] theme-text-faint">{spec.label}</span>
                          <span className="mt-1.5 block truncate text-[12px] font-extrabold leading-none theme-text" title={spec.value}>
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto flex min-h-14 items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] theme-text-faint transition-colors duration-200 group-hover:text-[#d91c1c]">
                        {dict.viewDetails}
                      </span>
                      <span className="flex items-center gap-2 text-[#d91c1c]">
                        <span className="h-px w-5 bg-current transition-[width] duration-200 group-hover:w-9" />
                        <ArrowRight size={14} />
                      </span>
                    </div>

                  </div>
                </Link>
              </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile dots + View All ── */}
        <div className="flex items-center justify-between mt-6 sm:hidden">
          <div className="flex gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="relative overflow-hidden transition-all duration-300 rounded-full"
                style={{
                  width: i === index ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === index ? '#d91c1c' : 'var(--theme-border)',
                }}
              >
                {i === index && autoPlayEnabled ? (
                  <span
                    key={`mobile-progress-${index}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-white/55"
                    style={{ animation: `carousel-progress ${AUTO_PLAY_MS}ms linear forwards` }}
                  />
                ) : null}
              </button>
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
            className="brand-button-secondary group gap-3 theme-text-secondary hover:border-[#111116] hover:bg-[#111116] hover:text-white"
            style={{ border: '1.5px solid var(--theme-border)' }}
          >
            {dict.viewAll}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
      <style jsx>{`
        @keyframes carousel-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
