"use client";

import { useEffect, useRef } from "react";
// framer-motion import removed
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
      const gap = 24; // gap-6
      
      let nextScroll = container.scrollLeft + cardWidth + gap;
      
      // Go back to start if we've reached the end
      if (container.scrollLeft >= maxScroll - 10) {
        nextScroll = 0;
      }

      container.scrollTo({ left: nextScroll, behavior: 'smooth' });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-[#f8f6f6] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[10px] sm:text-xs tracking-[0.2em] font-bold text-slate-400 uppercase mb-2">
            Nieuw Binnen
          </p>
          <div className="flex justify-between items-end">
            <h3 className="text-3xl md:text-4xl font-headings font-black text-slate-900">
              Laatste Occasions
            </h3>
            <div className="hidden sm:flex gap-2">
              <button 
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                aria-label="Previous"
                onClick={() => {
                  const container = document.getElementById('occasions-carousel');
                  if(container) container.scrollBy({ left: -400, behavior: 'smooth' });
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                aria-label="Next"
                onClick={() => {
                  const container = document.getElementById('occasions-carousel');
                  if(container) container.scrollBy({ left: 400, behavior: 'smooth' });
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="relative -mx-4 sm:mx-0">
          <div 
            id="occasions-carousel"
            ref={containerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-8 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {cars.map((car) => (
              <Link
                href={`/cars/${car.slug}`}
                key={car.id} 
                className="group cursor-pointer snap-start shrink-0 w-[85vw] sm:w-[350px] md:w-[400px] flex flex-col block"
              >
                <div className="relative h-[220px] md:h-[260px] w-full rounded-lg overflow-hidden bg-slate-200">
                  <Image
                    src={car.image}
                    alt={car.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {car.sold && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 text-[10px] font-bold tracking-wider text-slate-900 uppercase rounded-full shadow-sm">
                      VERKOCHT
                    </div>
                  )}
                </div>
                
                <div className="pt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-lg md:text-xl font-headings font-bold text-slate-900 pr-2 truncate">
                      {car.title}
                    </h4>
                    <span className="text-sm md:text-base font-bold text-[#d91c1c] shrink-0">
                      € {car.price.toLocaleString('nl-NL')}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {car.year} • {car.mileage.toLocaleString('nl-NL')} km • {car.fuel_type}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mt-4 flex justify-center sm:hidden">
          <Link href="/inventory" className="flex items-center text-sm font-bold text-slate-900 group">
            Alle voertuigen bekijken <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
