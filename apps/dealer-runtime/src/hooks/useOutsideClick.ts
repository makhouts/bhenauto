import { useEffect, type RefObject } from "react";

/**
 * Calls `handler` when a click/touch happens outside the element referenced by `ref`.
 * Replaces the repeated useEffect + mousedown pattern across the project.
 */
export function useOutsideClick<T extends HTMLElement>(
    ref: RefObject<T | null>,
    handler: () => void,
    enabled = true
) {
    useEffect(() => {
        if (!enabled) return;

        const listener = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handler();
            }
        };

        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);

        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler, enabled]);
}
