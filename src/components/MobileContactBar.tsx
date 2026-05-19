"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { CarDetailDict } from "@/lib/dictionaries";

interface MobileContactBarProps {
    carSlug: string;
    locale: string;
    dict: CarDetailDict;
    whatsappUrl: string;
}

export default function MobileContactBar({ carSlug, locale, dict, whatsappUrl }: MobileContactBarProps) {
    const [isVisible, setIsVisible] = useState(true);
    const prefersReducedMotion = useReducedMotion();
    const lastScrollYRef = useRef(0);
    const directionAnchorRef = useRef(0);
    const directionRef = useRef<"up" | "down">("down");
    const frameRef = useRef<number | null>(null);
    const hideTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const TOP_SHOW_OFFSET = 32;
        const HIDE_DELAY_MS = 160;
        const MIN_SCROLL_DELTA = 6;
        const HIDE_AFTER_SCROLLING_DOWN = 96;

        const clearHideTimeout = () => {
            if (hideTimeoutRef.current !== null) {
                window.clearTimeout(hideTimeoutRef.current);
                hideTimeoutRef.current = null;
            }
        };

        const showBar = () => {
            clearHideTimeout();
            setIsVisible(true);
        };

        const hideBar = () => {
            clearHideTimeout();
            setIsVisible(false);
        };

        const scheduleHide = () => {
            if (hideTimeoutRef.current !== null) return;

            hideTimeoutRef.current = window.setTimeout(() => {
                hideTimeoutRef.current = null;
                setIsVisible(false);
            }, HIDE_DELAY_MS);
        };

        const isSectionInView = (id: string, topOffset = 0, bottomOffset = 0) => {
            const element = document.getElementById(id);
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            return rect.top <= viewportHeight - topOffset && rect.bottom >= bottomOffset;
        };

        const updateVisibility = () => {
            const currentY = window.scrollY;
            const delta = currentY - lastScrollYRef.current;
            const absDelta = Math.abs(delta);
            const atTop = currentY <= TOP_SHOW_OFFSET;
            const nearPriceSection = isSectionInView("car-detail-price-anchor", 90, 72);
            const nearOriginalContactSection = isSectionInView("car-detail-contact-section", 110, 72);

            if (atTop || nearPriceSection) {
                showBar();
                directionRef.current = delta > 0 ? "down" : "up";
                directionAnchorRef.current = currentY;
                lastScrollYRef.current = currentY;
                return;
            }

            if (nearOriginalContactSection) {
                hideBar();
                directionRef.current = delta > 0 ? "down" : "up";
                directionAnchorRef.current = currentY;
                lastScrollYRef.current = currentY;
                return;
            }

            if (absDelta < MIN_SCROLL_DELTA) {
                lastScrollYRef.current = currentY;
                return;
            }

            const nextDirection: "up" | "down" = delta > 0 ? "down" : "up";

            if (directionRef.current !== nextDirection) {
                directionRef.current = nextDirection;
                directionAnchorRef.current = currentY;
            }

            if (nextDirection === "up") {
                showBar();
            } else if (currentY - directionAnchorRef.current >= HIDE_AFTER_SCROLLING_DOWN) {
                hideBar();
            } else {
                scheduleHide();
            }

            lastScrollYRef.current = currentY;
        };

        lastScrollYRef.current = window.scrollY;
        directionAnchorRef.current = window.scrollY;
        updateVisibility();

        const handleScroll = () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }

            frameRef.current = window.requestAnimationFrame(() => {
                frameRef.current = null;
                updateVisibility();
            });
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);

        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current);
            }

            clearHideTimeout();
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    return (
        <motion.div
            initial={false}
            animate={{
                y: isVisible ? 0 : 28,
                opacity: isVisible ? 1 : 0,
                boxShadow: isVisible
                    ? "0 -12px 28px rgba(15, 23, 42, 0.12)"
                    : "0 -2px 8px rgba(15, 23, 42, 0)",
            }}
            transition={prefersReducedMotion
                ? { duration: 0.14, ease: "easeOut" }
                : {
                    type: "spring",
                    stiffness: 460,
                    damping: 38,
                    mass: 0.82,
                }}
            className="fixed bottom-0 left-0 right-0 z-50 px-3 py-1.5 safe-area-bottom lg:hidden"
            style={{
                backgroundColor: "var(--theme-overlay)",
                borderTop: "1px solid var(--theme-border)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                pointerEvents: isVisible ? "auto" : "none",
            }}
        >
            <div className="flex gap-2 max-w-lg mx-auto">
                {/* Call button */}
                <a
                    href="tel:+3225828353"
                    className="flex-1 flex h-10 items-center justify-center gap-1 theme-text font-semibold text-[11px] rounded-md hover:border-[#d91c1c] hover:text-[#d91c1c] transition-all active:scale-95"
                    style={{ backgroundColor: 'var(--theme-surface)', border: '2px solid var(--theme-border)' }}
                >
                    <Phone size={13} strokeWidth={2.5} />
                    {dict.mobileCall}
                </a>

                {/* WhatsApp button */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex h-10 items-center justify-center gap-1 bg-[#25D366] text-white font-semibold text-[11px] rounded-md hover:bg-[#1fb855] transition-all active:scale-95 shadow-lg shadow-[#25D366]/20"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {dict.mobileWhatsApp}
                </a>

                {/* Contact form button */}
                <Link
                    href={`/${locale}/contact?car=${carSlug}`}
                    className="flex-1 flex h-10 items-center justify-center gap-1 bg-[#d91c1c] text-white font-semibold text-[11px] rounded-md hover:bg-[#b91515] transition-all active:scale-95 shadow-lg shadow-[#d91c1c]/20"
                >
                    {dict.mobileContact}
                </Link>
            </div>
        </motion.div>
    );
}
