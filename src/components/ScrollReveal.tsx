"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "left" | "right" | "none";
}

export default function ScrollReveal({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) {
    const [hydrated, setHydrated] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Mark as hydrated on first client render to avoid SSR opacity:0 flash
    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [hydrated]);

    const transforms: Record<string, string> = {
        up: "translateY(30px)",
        left: "translateX(-30px)",
        right: "translateX(30px)",
        none: "translateY(0)",
    };

    // Before hydration: render fully visible (SSR / no-JS path)
    if (!hydrated) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0) translateX(0)" : transforms[direction],
                transition: `opacity 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms, transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
