"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from "lucide-react";
import { useGallery } from "@/hooks/useGallery";
import { getImageUrl } from "@/lib/image-url";

interface ImageGalleryProps {
    images: { id: string; url: string }[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    // Resolve all image URLs once (R2 keys → full CDN URLs)
    const resolvedImages = useMemo(() =>
        images.map(img => ({ ...img, url: getImageUrl(img.url) })),
        [images]
    );

    const {
        state: { activeIndex, direction, lightboxOpen, isZoomed, mousePos },
        refs: { thumbStripRef, lightboxThumbRef },
        actions: { goTo, goNext, goPrev, openLightbox, closeLightbox, toggleZoom },
        handlers: { handleTouchStart, handleTouchEnd, handleMouseMove },
    } = useGallery(resolvedImages.length);

    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
    };

    if (!resolvedImages || resolvedImages.length === 0) {
        return (
            <div className="flex gap-3 h-[420px] md:h-[500px]">
                <div className="flex-1 relative rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-skeleton)' }}>
                    <span className="theme-text-faint uppercase tracking-widest text-sm font-bold">Geen afbeeldingen beschikbaar</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ── GALLERY GRID ── */}
            <div className="flex gap-2.5 h-[380px] md:h-[520px]">

                {/* ── Main Hero Image ── */}
                <div
                    className="relative flex-1 overflow-hidden rounded-2xl cursor-pointer group"
                    style={{ backgroundColor: 'var(--theme-skeleton)' }}
                    onClick={openLightbox}
                    onMouseMove={handleMouseMove}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={activeIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={resolvedImages[activeIndex].url}
                                alt={`${title} - Foto ${activeIndex + 1}`}
                                fill
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                priority
                                sizes="(max-width: 768px) 100vw, 70vw"
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                    {/* Zoom icon */}
                    <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-100 scale-75">
                        <Maximize2 size={18} strokeWidth={2.5} />
                    </div>

                    {/* Image counter pill */}
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                        <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3.5 py-2 rounded-full">
                            {activeIndex + 1} / {resolvedImages.length}
                        </span>
                    </div>

                    {/* Nav arrows on main image */}
                    {activeIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Vorige foto"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {activeIndex < resolvedImages.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Volgende foto"
                        >
                            <ChevronRight size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                {/* ── Right Thumbnail Column ── */}
                {resolvedImages.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 w-[28%] shrink-0">
                        {resolvedImages.slice(1, 5).map((img, i) => {
                            const realIndex = i + 1;
                            const isLast = i === 3 && resolvedImages.length > 5;
                            return (
                                <button
                                    key={img.id}
                                    onClick={() => isLast ? openLightbox() : goTo(realIndex)}
                                    className={`relative flex-1 overflow-hidden rounded-xl cursor-pointer transition-all duration-300 group/thumb
                                        ${activeIndex === realIndex && !isLast ? "ring-2 ring-[#d91c1c] ring-offset-2 shadow-lg" : "hover:ring-1 hover:ring-slate-300 hover:ring-offset-1"}`}
                                >
                                    <Image
                                        src={img.url}
                                        alt={`${title} thumbnail ${realIndex + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                                        sizes="20vw"
                                    />
                                    {/* Show "View All" overlay on last thumbnail */}
                                    {isLast && (
                                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group-hover/thumb:bg-black/40">
                                            <ZoomIn size={22} className="text-white" strokeWidth={2} />
                                            <span className="text-white text-xs font-bold tracking-wide">+{resolvedImages.length - 5} meer</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Thumbnail Strip (Below gallery on mobile, below gallery on desktop for quick nav) ── */}
            {resolvedImages.length > 1 && (
                <div className="mt-3">
                    <div
                        ref={thumbStripRef}
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {resolvedImages.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => goTo(i)}
                                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all duration-300
                                    ${activeIndex === i
                                        ? "ring-2 ring-[#d91c1c] ring-offset-1 opacity-100 shadow-md"
                                        : "opacity-50 hover:opacity-80 hover:ring-1 hover:ring-slate-300"
                                    }`}
                            >
                                <Image src={img.url} alt={`${title} - miniatuur ${i + 1}`} fill className="object-cover" sizes="96px" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════
                ║         FULLSCREEN LIGHTBOX             ║
                ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
                        onClick={closeLightbox}
                    >
                        {/* ── Top Bar ── */}
                        <div className="flex items-center justify-between px-6 py-4 relative z-20"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                                <span className="text-white/90 text-sm font-bold">
                                    {activeIndex + 1} <span className="text-white/40">/ {resolvedImages.length}</span>
                                </span>
                                <span className="text-white/30 text-sm hidden sm:inline">|</span>
                                <span className="text-white/50 text-sm hidden sm:inline truncate max-w-[200px]">{title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleZoom}
                                    className={`text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all ${isZoomed ? 'bg-white/15 text-white' : ''}`}
                                    title={isZoomed ? "Uitzoomen" : "Inzoomen"}
                                >
                                    <ZoomIn size={20} />
                                </button>
                                <button
                                    onClick={closeLightbox}
                                    className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
                                >
                                    <X size={22} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* ── Main Image Area ── */}
                        <div
                            className="flex-1 relative flex items-center justify-center px-4 sm:px-16 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            onMouseMove={isZoomed ? handleMouseMove : undefined}
                        >
                            <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                <motion.div
                                    key={activeIndex}
                                    custom={direction}
                                    variants={{
                                        enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0, scale: 0.95 }),
                                        center: { x: 0, opacity: 1, scale: 1 },
                                        exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0, scale: 0.95 }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div
                                        className={`relative w-full h-full transition-transform duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                        onClick={toggleZoom}
                                        style={isZoomed ? {
                                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                                            transform: 'scale(2)',
                                        } : {}}
                                    >
                                        <Image
                                            src={resolvedImages[activeIndex].url}
                                            alt={`${title} - Foto ${activeIndex + 1}`}
                                            fill
                                            className="object-contain"
                                            sizes="100vw"
                                            priority
                                        />
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Nav arrows */}
                            {activeIndex > 0 && !isZoomed && (
                                <button
                                    onClick={goPrev}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-90"
                                    aria-label="Vorige foto"
                                >
                                    <ChevronLeft size={24} strokeWidth={2} />
                                </button>
                            )}
                            {activeIndex < resolvedImages.length - 1 && !isZoomed && (
                                <button
                                    onClick={goNext}
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-90"
                                    aria-label="Volgende foto"
                                >
                                    <ChevronRight size={24} strokeWidth={2} />
                                </button>
                            )}
                        </div>

                        {/* ── Bottom Thumbnail Strip ── */}
                        {!isZoomed && (
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 30, opacity: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="px-6 py-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <div
                                    ref={lightboxThumbRef}
                                    className="flex justify-center gap-2 overflow-x-auto scrollbar-none"
                                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                                >
                                    {resolvedImages.map((img, i) => (
                                        <button
                                            key={img.id}
                                            onClick={() => goTo(i)}
                                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-300
                                                ${activeIndex === i
                                                    ? "ring-2 ring-white opacity-100 scale-105 shadow-lg shadow-white/10"
                                                    : "opacity-35 hover:opacity-65 hover:scale-105"
                                                }`}
                                        >
                                            <Image src={img.url} alt={`${title} - miniatuur ${i + 1}`} fill className="object-cover" sizes="80px" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
