import { useState, useEffect } from "react";

/**
 * Returns `true` when the page has scrolled past `threshold` pixels.
 * Used by Header for glassmorphism transition.
 */
export function useScrollState(threshold = 20): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > threshold);
        handleScroll(); // fire initially
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [threshold]);

    return scrolled;
}
