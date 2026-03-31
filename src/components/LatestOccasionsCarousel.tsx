"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselCar {
  id: string;
  title: string;
  slug: string;
  price: number;
  year: number;
  mileage: number;
  fuel_type: string;
  image: string;
  sold: boolean;
}

export default function LatestOccasionsCarousel({ cars }: { cars: CarouselCar[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container || container.scrollWidth <= container.clientWidth) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const cardWidth = container.firstElementChild?.clientWidth || 400;
      const gap = 16;

      let nextScroll = container.scrollLeft + cardWidth + gap;

      if (container.scrollLeft >= maxScroll - 10) {
        nextScroll = 0;
      }

      container.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? -320 : 320;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <section className="py-12 sm:py-20 md:py-24 bg-[#f8f6f6] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-[10px] sm:text-xs tracking-[0.2em] font-bold text-slate-400 uppercase mb-1.5 sm:mb-2">
            Nieuw Binnen
          </p>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-headings font-black text-slate-900">
              Laatste Occasions
            </h3>
            <div className="hidden sm:flex gap-2">
              <button
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                aria-label="Previous"
                onClick={() => scroll('left')}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                aria-label="Next"
                onClick={() => scroll('right')}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative -mx-4 sm:mx-0">
          <div
            id="occasions-carousel"
            ref={containerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-4 sm:pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {cars.map((car) => (
              <Link
                href={`/cars/${car.slug}`}
                key={car.id}
                className="group snap-start shrink-0 w-[300px] sm:w-[310px] md:w-[330px] xl:w-[340px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-100"
              >
                {/* Card Image */}
                <div className="relative h-[175px] sm:h-[200px] md:h-[220px] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={car.image}
                    alt={car.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 330px"
                  />
                  {car.sold && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-900 uppercase rounded-full shadow-sm">
                      VERKOCHT
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4 sm:p-5">
                  <h4 className="text-[15px] sm:text-base md:text-lg font-headings font-bold text-slate-900 truncate mb-1">
                    {car.title}
                  </h4>
                  <p className="text-lg sm:text-xl font-black text-[#d91c1c] mb-2">
                    € {car.price.toLocaleString('nl-NL')}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-medium">
                    <span>{car.year}</span>
                    <span className="text-slate-300">•</span>
                    <span>{car.mileage.toLocaleString('nl-NL')} km</span>
                    <span className="text-slate-300">•</span>
                    <span>{car.fuel_type}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile "View All" link */}
        <div className="mt-4 flex justify-center sm:hidden">
          <Link href="/inventory" className="flex items-center text-sm font-bold text-slate-900 group">
            Alle voertuigen bekijken <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
