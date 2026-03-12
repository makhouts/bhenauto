"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
    images: { id: string; url: string }[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

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

    // Right column shows up to 2 thumbnails
    const firstThumb = images[1] ?? null;
    const secondThumb = images[2] ?? null;
    const remainingCount = images.length - 3;

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
                            Exterieur
                        </span>
                        <span className="bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                            {images.length} foto's
                        </span>
                    </div>
                </div>

                {/* Right Thumbnails Column */}
                {images.length > 1 && (
                    <div className="flex flex-col gap-3 w-[38%] md:w-[32%] shrink-0">
                        {/* Thumb 1 */}
                        {firstThumb && (
                            <button
                                onClick={() => setActiveIndex(1)}
                                className={`relative flex-1 overflow-hidden rounded-xl transition-all duration-200 ${activeIndex === 1 ? "ring-2 ring-[#d91c1c] ring-offset-2" : "hover:opacity-90"}`}
                            >
                                <Image
                                    src={firstThumb.url}
                                    alt={`${title} thumbnail 2`}
                                    fill
                                    className="object-cover"
                                />
                            </button>
                        )}

                        {/* Thumb 2 with "View all" overlay */}
                        {secondThumb && (
                            <button
                                onClick={() => setLightboxOpen(true)}
                                className="relative flex-1 overflow-hidden rounded-xl hover:opacity-90 transition-all duration-200"
                            >
                                <Image
                                    src={secondThumb.url}
                                    alt={`${title} thumbnail 3`}
                                    fill
                                    className="object-cover"
                                />
                                {/* "View all N" overlay */}
                                {images.length > 3 && (
                                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
                                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4 6h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 12h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                                        </svg>
                                        <span className="text-white text-base font-bold">Alle {images.length} bekijken</span>
                                    </div>
                                )}
                            </button>
                        )}

                        {/* If only 2 images total, show mini-thumbnails for the second */}
                        {!firstThumb && images.length === 1 && null}
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
