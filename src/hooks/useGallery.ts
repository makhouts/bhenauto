import { useReducer, useCallback, useEffect, useRef, type RefObject } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GalleryState {
    activeIndex: number;
    direction: number;
    lightboxOpen: boolean;
    isZoomed: boolean;
    mousePos: { x: number; y: number };
}

type GalleryAction =
    | { type: "GO_TO"; index: number }
    | { type: "OPEN_LIGHTBOX" }
    | { type: "CLOSE_LIGHTBOX" }
    | { type: "TOGGLE_ZOOM" }
    | { type: "SET_MOUSE_POS"; x: number; y: number };

function reducer(state: GalleryState, action: GalleryAction): GalleryState {
    switch (action.type) {
        case "GO_TO":
            if (action.index === state.activeIndex) return state;
            return {
                ...state,
                direction: action.index > state.activeIndex ? 1 : -1,
                activeIndex: action.index,
                isZoomed: false,
            };
        case "OPEN_LIGHTBOX":
            return { ...state, lightboxOpen: true };
        case "CLOSE_LIGHTBOX":
            return { ...state, lightboxOpen: false, isZoomed: false };
        case "TOGGLE_ZOOM":
            return { ...state, isZoomed: !state.isZoomed };
        case "SET_MOUSE_POS":
            return { ...state, mousePos: { x: action.x, y: action.y } };
    }
}

const INITIAL_STATE: GalleryState = {
    activeIndex: 0,
    direction: 0,
    lightboxOpen: false,
    isZoomed: false,
    mousePos: { x: 50, y: 50 },
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useGallery(imageCount: number) {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const thumbStripRef = useRef<HTMLDivElement>(null);
    const lightboxThumbRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);

    const { activeIndex, lightboxOpen, isZoomed } = state;

    const goTo = useCallback(
        (index: number) => dispatch({ type: "GO_TO", index }),
        []
    );
    const goNext = useCallback(
        () => { if (activeIndex < imageCount - 1) dispatch({ type: "GO_TO", index: activeIndex + 1 }); },
        [activeIndex, imageCount]
    );
    const goPrev = useCallback(
        () => { if (activeIndex > 0) dispatch({ type: "GO_TO", index: activeIndex - 1 }); },
        [activeIndex]
    );
    const openLightbox = useCallback(() => dispatch({ type: "OPEN_LIGHTBOX" }), []);
    const closeLightbox = useCallback(() => dispatch({ type: "CLOSE_LIGHTBOX" }), []);
    const toggleZoom = useCallback(() => dispatch({ type: "TOGGLE_ZOOM" }), []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
            if (e.key === "ArrowLeft") goPrev();
            else if (e.key === "ArrowRight") goNext();
            else if (e.key === "Escape" && lightboxOpen) closeLightbox();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev, lightboxOpen, closeLightbox]);

    // Lock body scroll when lightbox open
    useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [lightboxOpen]);

    // Auto-scroll active thumbnail into view
    useEffect(() => {
        const ref = lightboxOpen ? lightboxThumbRef : thumbStripRef;
        if (ref.current) {
            const activeThumb = ref.current.children[activeIndex] as HTMLElement;
            if (activeThumb) {
                activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    }, [activeIndex, lightboxOpen]);

    // Touch/swipe handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStart.current === null) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
        }
        touchStart.current = null;
    }, [goNext, goPrev]);

    // Zoom mouse tracking
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        dispatch({
            type: "SET_MOUSE_POS",
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    }, []);

    return {
        state,
        refs: {
            thumbStripRef: thumbStripRef as RefObject<HTMLDivElement>,
            lightboxThumbRef: lightboxThumbRef as RefObject<HTMLDivElement>,
        },
        actions: {
            goTo,
            goNext,
            goPrev,
            openLightbox,
            closeLightbox,
            toggleZoom,
        },
        handlers: {
            handleTouchStart,
            handleTouchEnd,
            handleMouseMove,
        },
    };
}
