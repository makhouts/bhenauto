"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "";
    // Trigger animation only on admin or inventory/aanbod pages
    // Animate only on the main admin entry page and on aanbod/inventory
    const isTargetPage = pathname === '/admin' || pathname.startsWith('/inventory') || pathname.startsWith('/aanbod');

    const [animateOut, setAnimateOut] = useState(!isTargetPage);
    const [showOverlay, setShowOverlay] = useState(isTargetPage);

    useEffect(() => {
        if (!isTargetPage) return;

        // Reset state when hitting a target page
        setShowOverlay(true);
        setAnimateOut(false);

        // Keeps the overlay visible as a solid state for ~150ms before fading
        // This makes it act as a brief "flash" loader
        const fadeTimer = setTimeout(() => {
            setAnimateOut(true);
        }, 150);

        // Completely unmount the overlay to restore pointer events
        // 150ms delay + 400ms CSS transition duration
        const unmountTimer = setTimeout(() => {
            setShowOverlay(false);
        }, 550);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(unmountTimer);
        };
    }, [pathname, isTargetPage]);

    if (!isTargetPage) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Transition Overlay */}
            {showOverlay && (
                <div
                    className={`fixed inset-0 z-[60] bg-white flex items-center justify-center transition-all duration-400 ease-in-out ${
                        animateOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
                    }`}
                    style={{ transitionDuration: '400ms' }}
                >
                    <div className="flex items-center gap-2">
                        <div className="text-[#d91c1c]">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.92 6c-.2-.58-.76-1-1.42-1h-11c-.66 0-1.22.42-1.42 1L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-6zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
                                <circle cx="7.5" cy="14.5" r="1.5" />
                                <circle cx="16.5" cy="14.5" r="1.5" />
                            </svg>
                        </div>
                        <div className="text-3xl font-headings font-black text-slate-900 tracking-tighter uppercase mr-2">
                            BHEN<span className="text-[#d91c1c]">AUTO</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Underlying Page Content with a subtle slide-up and fade-in */}
            <div className={`transition-all duration-500 ease-out ${animateOut ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                {children}
            </div>
        </>
    );
}
