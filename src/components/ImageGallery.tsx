"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
    images: { id: string; url: string }[];
    title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="relative h-[50vh] md:h-[70vh] w-full bg-slate-100 flex items-center justify-center rounded-2xl border border-slate-200">
                <span className="text-slate-400 uppercase tracking-widest text-sm font-bold">No images available</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden rounded-2xl group shadow-sm">
                <Image
                    src={images[activeIndex].url}
                    alt={`${title} - View ${activeIndex + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setActiveIndex(index)}
                            className={`relative h-20 md:h-28 w-full overflow-hidden rounded-xl transition-all duration-300 ${activeIndex === index
                                ? "ring-2 ring-[#d91c1c] ring-offset-2 ring-offset-white opacity-100 object-cover scale-[1.02] shadow-md shadow-[#d91c1c]/10"
                                : "opacity-60 hover:opacity-100"
                                }`}
                        >
                            <Image
                                src={image.url}
                                alt={`${title} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
