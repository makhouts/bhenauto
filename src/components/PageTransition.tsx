"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || "";
    // Match /inventory or /{lang}/inventory (and legacy /aanbod)
    const isTargetPage = /^\/(nl|fr|en)?\/?inventory(\/|$)/.test(pathname) || /^\/(nl|fr|en)?\/?aanbod(\/|$)/.test(pathname);

    const [animateOut, setAnimateOut] = useState(!isTargetPage);
    const [showOverlay, setShowOverlay] = useState(isTargetPage);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = () => {
        setAnimateOut(true);
        setTimeout(() => setShowOverlay(false), 400);
    };

    useEffect(() => {
        if (!isTargetPage) return;

        // Only play the transition once per session
        const hasSeenIntro = sessionStorage.getItem("hasSeenTransitions");
        if (hasSeenIntro) {
            setAnimateOut(true);
            setShowOverlay(false);
            return;
        }

        setShowOverlay(true);
        setAnimateOut(false);
        sessionStorage.setItem("hasSeenTransitions", "true");

        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.play().catch(() => {
                fallbackRef.current = setTimeout(dismiss, 300);
            });
        }

        // Hard cap: dismiss after exactly 0.3 seconds regardless of video length
        fallbackRef.current = setTimeout(dismiss, 300);

        return () => {
            if (fallbackRef.current) clearTimeout(fallbackRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, isTargetPage]);

    if (!isTargetPage) {
        return <>{children}</>;
    }

    return (
        <>
            {/* Video Transition Overlay */}
            {showOverlay && (
                <div
                    className={`fixed inset-0 z-[60] bg-white flex items-center justify-center transition-opacity ease-in-out ${
                        animateOut ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}
                    style={{ transitionDuration: "400ms" }}
                >
                    <video
                        ref={videoRef}
                        src="/assets/video.mp4"
                        className="w-[50vw] max-w-[480px] h-auto object-contain rounded-lg"
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        onEnded={dismiss}
                    />
                </div>
            )}

            {/* Underlying page with subtle reveal */}
            <div
                className={`transition-all duration-500 ease-out ${
                    animateOut ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
            >
                {children}
            </div>
        </>
    );
}
