"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ImageGalleryProps {
    images: { id: string; url: string }[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't intercept if user is typing in an input
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

            if (e.key === "ArrowLeft") {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === "ArrowRight") {
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
            } else if (e.key === "Escape" && lightboxOpen) {
                setLightboxOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [images.length, lightboxOpen]);

    const placeholder = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop";

    if (!images || images.length === 0) {
        return (
            <div className="flex gap-3 h-[420px] md:h-[500px]">
                <div className="flex-1 relative bg-slate-100 rounded-xl flex items-center justify-center">
                    <span className="text-slate-400 uppercase tracking-widest text-sm font-bold">Geen afbeeldingen beschikbaar</span>
                </div>
            </div>
        );
    }

    const nextImages = images.slice(1, 5);

    return (
        <>
            {/* Gallery Grid */}
            <div className="flex gap-3 h-[380px] md:h-[480px]">
                {/* Main Image */}
                <div
                    className="relative flex-1 overflow-hidden rounded-xl cursor-zoom-in group shadow-sm"
                    onClick={() => setLightboxOpen(true)}
                >
                    <Image
                        src={images[activeIndex].url}
                        alt={`${title} - Vue ${activeIndex + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                        priority
                    />
                    {/* Bottom pill badges */}
                    <div className="absolute bottom-4 left-4 flex gap-2">
                        <span className="bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                            {images.length} foto's
                        </span>
                    </div>
                </div>

                {/* Right Column: Top thumbnail + Bottom 2x2 grid card */}
                {images.length > 1 && (
                    <div className="flex flex-col gap-2 md:gap-3 w-[30%] md:w-[28%] shrink-0">
                        {/* Top half: Single thumbnail */}
                        <button
                            onClick={() => setActiveIndex(1)}
                            className={`relative flex-1 overflow-hidden rounded-[8px] md:rounded-[12px] cursor-pointer transition-all duration-200 ${activeIndex === 1 ? "ring-2 ring-[#d91c1c] ring-offset-2" : "hover:opacity-90"}`}
                        >
                            <Image
                                src={images[1].url}
                                alt={`${title} thumbnail 2`}
                                fill
                                className="object-cover"
                            />
                        </button>

                        {/* Bottom half: 2x2 Grid card with overlay */}
                        {images.length > 2 && (
                            <button
                                onClick={() => setLightboxOpen(true)}
                                className="relative flex-1 rounded-[8px] md:rounded-[12px] overflow-hidden group cursor-pointer"
                            >
                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 md:gap-[3px]">
                                    {images.slice(2, 6).map((img, i) => (
                                        <div key={img.id} className="relative w-full h-full overflow-hidden">
                                            <Image
                                                src={img.url}
                                                alt={`${title} sub-thumbnail ${i + 3}`}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                    ))}
                                    {/* Fill empty spots if less than 6 images total (so grid has 4 cells) */}
                                    {images.length < 6 && Array.from({ length: 6 - images.length }).map((_, i) => (
                                        <div key={`empty-${i}`} className="bg-slate-100 w-full h-full" />
                                    ))}
                                </div>
                                {/* "View all" overlay spanning the entire bottom card */}
                                <div className="absolute inset-0 bg-black/60 hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-1 md:gap-2">
                                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M4 6h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 12h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                                    </svg>
                                    <span className="text-white text-xs md:text-sm font-bold text-center px-2">Alle {images.length} bekijken</span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative w-full max-w-5xl h-[80vh]" onClick={e => e.stopPropagation()}>
                        <Image
                            src={images[activeIndex].url}
                            alt={`${title} - Vue ${activeIndex + 1}`}
                            fill
                            className="object-contain"
                        />
                        {/* Prev / Next */}
                        {activeIndex > 0 && (
                            <button
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-3 transition-colors"
                                onClick={() => setActiveIndex(i => i - 1)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        {activeIndex < images.length - 1 && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-3 transition-colors"
                                onClick={() => setActiveIndex(i => i + 1)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {/* Thumbstrip in lightbox */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4">
                        {images.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveIndex(i)}
                                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all ${activeIndex === i ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"}`}
                            >
                                <Image src={img.url} alt="" fill className="object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
