"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from "lucide-react";
import { useGallery } from "@/hooks/useGallery";
import { getImageUrl, getImageVariantUrl } from "@/lib/image-url";

interface ImageGalleryProps {
    images: { id: string; url: string }[];
    title: string;
}

const GALLERY_IMAGE_QUALITY = 80;
const LIGHTBOX_IMAGE_QUALITY = 80;
const LIGHTBOX_IMAGE_SIZES = "100vw";
const MAIN_GALLERY_IMAGE_SIZES = "(max-width: 768px) 100vw, (max-width: 1280px) 68vw, 880px";
const MAIN_GALLERY_TRANSITION = { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };
const MAIN_GALLERY_HOVER_TRANSITION = { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const };
const LIGHTBOX_GALLERY_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const THUMBNAIL_IMAGE_QUALITY = 50;
const PRELOAD_BEHIND = 1;
const PRELOAD_AHEAD = 1;
type ImageFetchPriority = "high" | "low" | "auto";
type GalleryImage = {
    id: string;
    url: string;
    thumbUrl: string;
    galleryUrl: string;
    lightboxUrl: string;
};

function getGalleryPreloadKey(image: GalleryImage, src: string) {
    return `gallery:${image.id}:${src}`;
}

function getLightboxPreloadKey(image: GalleryImage, src: string) {
    return `lightbox:${image.id}:${src}`;
}

function preloadResponsiveImage(
    imageProps: { src: string; srcSet?: string; sizes?: string },
    fetchPriority: ImageFetchPriority = "low"
) {
    const preloadImage = new window.Image();
    const priorityImage = preloadImage as HTMLImageElement & { fetchPriority?: ImageFetchPriority };

    priorityImage.fetchPriority = fetchPriority;
    preloadImage.decoding = "async";
    if (imageProps.srcSet) preloadImage.srcset = imageProps.srcSet;
    if (imageProps.sizes) preloadImage.sizes = imageProps.sizes;
    preloadImage.src = imageProps.src;

    return preloadImage;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
    const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(() => new Set());
    const [failedVariantKeys, setFailedVariantKeys] = useState<Set<string>>(() => new Set());
    const preloadedAssetKeys = useRef<Set<string>>(new Set());
    const preloadedImageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

    // Resolve all image URLs once (R2 keys → full CDN URLs)
    const resolvedImages = useMemo(() =>
        images.map(img => ({
            ...img,
            url: getImageUrl(img.url),
            thumbUrl: getImageVariantUrl(img.url, "thumb"),
            galleryUrl: getImageVariantUrl(img.url, "gallery"),
            lightboxUrl: getImageVariantUrl(img.url, "lightbox"),
        })),
        [images]
    );

    const getVariantFailureKey = useCallback((image: GalleryImage, variant: "thumb" | "gallery" | "lightbox") => `${variant}:${image.id}`, []);
    const getThumbSrc = useCallback((image: GalleryImage) => (
        failedVariantKeys.has(getVariantFailureKey(image, "thumb")) ? image.url : image.thumbUrl
    ), [failedVariantKeys, getVariantFailureKey]);
    const getGallerySrc = useCallback((image: GalleryImage) => (
        failedVariantKeys.has(getVariantFailureKey(image, "gallery")) ? image.url : image.galleryUrl
    ), [failedVariantKeys, getVariantFailureKey]);
    const getLightboxSrc = useCallback((image: GalleryImage) => (
        failedVariantKeys.has(getVariantFailureKey(image, "lightbox")) ? image.url : image.lightboxUrl
    ), [failedVariantKeys, getVariantFailureKey]);
    const markVariantFailed = useCallback((image: GalleryImage, variant: "thumb" | "gallery" | "lightbox") => {
        const failureKey = getVariantFailureKey(image, variant);
        const failedSrc = variant === "gallery"
            ? image.galleryUrl
            : variant === "lightbox"
                ? image.lightboxUrl
                : image.thumbUrl;

        if (variant !== "thumb") {
            const preloadKey = variant === "gallery"
                ? getGalleryPreloadKey(image, failedSrc)
                : getLightboxPreloadKey(image, failedSrc);
            preloadedAssetKeys.current.delete(preloadKey);
            preloadedImageRefs.current.delete(preloadKey);
        }

        setFailedVariantKeys((current) => {
            if (current.has(failureKey)) return current;
            const next = new Set(current);
            next.add(failureKey);
            return next;
        });
    }, [getVariantFailureKey]);
    const getWindowIndexes = useCallback((index: number) =>
        [index, index - PRELOAD_BEHIND, index + PRELOAD_AHEAD]
            .filter((candidate, position, array) =>
                candidate >= 0 &&
                candidate < resolvedImages.length &&
                array.indexOf(candidate) === position
            ), [resolvedImages.length]);
    const preloadFullSizeAt = useCallback((index: number) => {
        const image = resolvedImages[index];
        if (!image) return;
        const gallerySrc = getGallerySrc(image);

        const galleryKey = getGalleryPreloadKey(image, gallerySrc);
        if (preloadedAssetKeys.current.has(galleryKey) || loadedImageIds.has(image.id)) {
            preloadedAssetKeys.current.add(galleryKey);
            return;
        }

        const galleryImage = getImageProps({
            src: gallerySrc,
            alt: "",
            width: 1200,
            height: 800,
            sizes: MAIN_GALLERY_IMAGE_SIZES,
            quality: GALLERY_IMAGE_QUALITY,
        }).props;

        preloadedImageRefs.current.set(galleryKey, preloadResponsiveImage(galleryImage, "low"));
        preloadedAssetKeys.current.add(galleryKey);
    }, [getGallerySrc, loadedImageIds, resolvedImages]);
    const preloadLightboxAt = useCallback((index: number) => {
        const image = resolvedImages[index];
        if (!image) return;
        const lightboxSrc = getLightboxSrc(image);

        const lightboxKey = getLightboxPreloadKey(image, lightboxSrc);
        if (preloadedAssetKeys.current.has(lightboxKey)) return;

        const lightboxImage = getImageProps({
            src: lightboxSrc,
            alt: "",
            width: 1600,
            height: 1200,
            sizes: LIGHTBOX_IMAGE_SIZES,
            quality: LIGHTBOX_IMAGE_QUALITY,
        }).props;

        preloadedImageRefs.current.set(lightboxKey, preloadResponsiveImage(lightboxImage, "low"));
        preloadedAssetKeys.current.add(lightboxKey);
    }, [getLightboxSrc, resolvedImages]);
    const preloadSelectionWindow = useCallback((index: number, includeLightbox = false) => {
        const windowIndexes = getWindowIndexes(index);
        windowIndexes.forEach(preloadFullSizeAt);
        if (includeLightbox) windowIndexes.forEach(preloadLightboxAt);
    }, [getWindowIndexes, preloadFullSizeAt, preloadLightboxAt]);
    const handleNavigateIntent = useCallback((index: number, nextLightboxOpen: boolean) => {
        preloadSelectionWindow(index, nextLightboxOpen);
    }, [preloadSelectionWindow]);
    const {
        state: { activeIndex, direction, lightboxOpen, isZoomed, mousePos },
        refs: { thumbStripRef, lightboxThumbRef },
        actions: { goTo, openLightbox, closeLightbox, toggleZoom },
        handlers: { handleTouchStart, handleTouchEnd, handleMouseMove },
    } = useGallery(resolvedImages.length, { onNavigateIntent: handleNavigateIntent });
    const currentIndex = resolvedImages.length > 0
        ? Math.min(activeIndex, resolvedImages.length - 1)
        : 0;
    const activeImage = resolvedImages[currentIndex];
    const activeGallerySrc = activeImage ? getGallerySrc(activeImage) : "";
    const activeLightboxSrc = activeImage ? getLightboxSrc(activeImage) : "";
    const isActiveImageLoaded = activeImage ? loadedImageIds.has(activeImage.id) : false;
    const showActiveImage = currentIndex === 0 || isActiveImageLoaded;
    const adjacentPreloadIndexes = useMemo(
        () => [currentIndex - PRELOAD_BEHIND, currentIndex + PRELOAD_AHEAD]
            .filter((index, position, array) =>
                index >= 0 &&
                index < resolvedImages.length &&
                index !== currentIndex &&
                array.indexOf(index) === position
            ),
        [currentIndex, resolvedImages.length]
    );
    const goToPreloaded = (index: number, includeLightbox = lightboxOpen) => {
        if (resolvedImages.length === 0) return;
        const targetIndex = Math.min(Math.max(index, 0), resolvedImages.length - 1);

        preloadSelectionWindow(targetIndex, includeLightbox);
        goTo(targetIndex);
    };
    const openLightboxPreloaded = () => {
        preloadSelectionWindow(currentIndex, true);
        openLightbox();
    };

    useEffect(() => {
        if (resolvedImages.length > 0 && activeIndex >= resolvedImages.length) {
            goTo(resolvedImages.length - 1);
        }
    }, [activeIndex, goTo, resolvedImages.length]);

    useEffect(() => {
        for (const index of adjacentPreloadIndexes) {
            preloadFullSizeAt(index);

            if (!lightboxOpen) continue;
            preloadLightboxAt(index);
        }
        if (lightboxOpen) preloadLightboxAt(currentIndex);
    }, [adjacentPreloadIndexes, currentIndex, lightboxOpen, preloadFullSizeAt, preloadLightboxAt]);

    const slideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 40 : -40,
            opacity: 0,
            scale: 1.01,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        hover: {
            scale: 1.025,
            transition: MAIN_GALLERY_HOVER_TRANSITION,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -40 : 40,
            opacity: 0,
            scale: 0.995,
        }),
    };

    const lightboxSlideVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 56 : -56,
            opacity: 0,
            scale: 1.01,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -56 : 56,
            opacity: 0,
            scale: 0.995,
        }),
    };

    if (!activeImage) {
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
                    onClick={openLightboxPreloaded}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial={currentIndex === 0 ? false : "enter"}
                            animate="center"
                            exit="exit"
                            transition={MAIN_GALLERY_TRANSITION}
                            whileHover="hover"
                            className="absolute inset-0 will-change-transform"
                        >
                            {!showActiveImage && (
                                <div
                                    className="absolute inset-0 animate-pulse rounded-2xl"
                                    style={{
                                        background: "linear-gradient(90deg, var(--theme-skeleton-subtle) 0%, var(--theme-skeleton) 50%, var(--theme-skeleton-subtle) 100%)",
                                    }}
                                />
                            )}
                            <Image
                                src={activeGallerySrc}
                                alt={`${title} - Foto ${currentIndex + 1}`}
                                fill
                                className={`object-contain object-center md:object-cover transform-gpu transition-opacity duration-500 ease-out motion-reduce:transition-opacity ${
                                    showActiveImage ? "opacity-100" : "opacity-0"
                                }`}
                                priority={currentIndex === 0}
                                loading="eager"
                                fetchPriority="high"
                                sizes={MAIN_GALLERY_IMAGE_SIZES}
                                quality={GALLERY_IMAGE_QUALITY}
                                decoding={currentIndex === 0 ? "sync" : "async"}
                                onError={() => markVariantFailed(activeImage, "gallery")}
                                onLoad={() => {
                                    preloadedAssetKeys.current.add(getGalleryPreloadKey(activeImage, activeGallerySrc));
                                    setLoadedImageIds((current) => {
                                        if (current.has(activeImage.id)) return current;
                                        const next = new Set(current);
                                        next.add(activeImage.id);
                                        return next;
                                    });
                                }}
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
                            {currentIndex + 1} / {resolvedImages.length}
                        </span>
                    </div>

                    {/* Nav arrows on main image */}
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPreloaded(currentIndex - 1, false);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
                            aria-label="Vorige foto"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </button>
                    )}
                    {currentIndex < resolvedImages.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPreloaded(currentIndex + 1, false);
                            }}
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
                            const preloadIndex = isLast ? currentIndex : realIndex;
                            return (
                                <button
                                    key={img.id}
                                    onPointerDown={() => preloadSelectionWindow(preloadIndex, isLast)}
                                    onFocus={() => preloadSelectionWindow(preloadIndex, isLast)}
                                    onClick={() => isLast ? openLightboxPreloaded() : goToPreloaded(realIndex)}
                                    className={`relative flex-1 overflow-hidden rounded-xl cursor-pointer transition-all duration-300 group/thumb bg-slate-100
                                        ${currentIndex === realIndex && !isLast ? "ring-2 ring-[#d91c1c] ring-offset-2 shadow-lg" : "hover:ring-1 hover:ring-slate-300 hover:ring-offset-1"}`}
                                >
                                    <Image
                                        src={getThumbSrc(img)}
                                        alt={`${title} thumbnail ${realIndex + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                                        sizes="20vw"
                                        quality={THUMBNAIL_IMAGE_QUALITY}
                                        loading="eager"
                                        fetchPriority="low"
                                        decoding="async"
                                        onError={() => markVariantFailed(img, "thumb")}
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

            {/* ── Thumbnail Strip (quick nav) ── */}
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
                                onPointerDown={() => preloadSelectionWindow(i)}
                                onFocus={() => preloadSelectionWindow(i)}
                                onClick={() => goToPreloaded(i, false)}
                                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-300
                                    ${currentIndex === i
                                        ? "border-[#d91c1c] opacity-100 shadow-md"
                                        : "border-transparent opacity-50 hover:border-slate-300 hover:opacity-80"
                                    }`}
                            >
                                <Image
                                    src={getThumbSrc(img)}
                                    alt={`${title} - miniatuur ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    quality={THUMBNAIL_IMAGE_QUALITY}
                                    loading="eager"
                                    fetchPriority="low"
                                    decoding="async"
                                    onError={() => markVariantFailed(img, "thumb")}
                                />
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
                                    {currentIndex + 1} <span className="text-white/40">/ {resolvedImages.length}</span>
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
                                    key={currentIndex}
                                    custom={direction}
                                    variants={lightboxSlideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={LIGHTBOX_GALLERY_TRANSITION}
                                    className="absolute inset-0 flex items-center justify-center will-change-transform"
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
                                            src={activeLightboxSrc}
                                            alt={`${title} - Foto ${currentIndex + 1}`}
                                            fill
                                            className="object-contain"
                                            sizes={LIGHTBOX_IMAGE_SIZES}
                                            quality={LIGHTBOX_IMAGE_QUALITY}
                                            loading="eager"
                                            fetchPriority={lightboxOpen ? "high" : "auto"}
                                            decoding="async"
                                            onError={() => markVariantFailed(activeImage, "lightbox")}
                                        />
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Nav arrows */}
                            {currentIndex > 0 && !isZoomed && (
                                <button
                                    onClick={() => goToPreloaded(currentIndex - 1, true)}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-200 hover:scale-110 active:scale-90"
                                    aria-label="Vorige foto"
                                >
                                    <ChevronLeft size={24} strokeWidth={2} />
                                </button>
                            )}
                            {currentIndex < resolvedImages.length - 1 && !isZoomed && (
                                <button
                                    onClick={() => goToPreloaded(currentIndex + 1, true)}
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
                                            onPointerDown={() => preloadSelectionWindow(i, true)}
                                            onFocus={() => preloadSelectionWindow(i, true)}
                                            onClick={() => goToPreloaded(i, true)}
                                            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all duration-300
                                                ${currentIndex === i
                                                    ? "ring-2 ring-white opacity-100 scale-105 shadow-lg shadow-white/10"
                                                    : "opacity-35 hover:opacity-65 hover:scale-105"
                                            }`}
                                        >
                                            <Image
                                                src={getThumbSrc(img)}
                                                alt={`${title} - miniatuur ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                                quality={THUMBNAIL_IMAGE_QUALITY}
                                                loading="eager"
                                                fetchPriority="low"
                                                decoding="async"
                                                onError={() => markVariantFailed(img, "thumb")}
                                            />
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
