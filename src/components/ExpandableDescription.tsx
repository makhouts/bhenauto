"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const COLLAPSED_HEIGHT = 160; // px — roughly 5-6 lines

export default function ExpandableDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      const h = innerRef.current.scrollHeight;
      setContentHeight(h);
      setNeedsToggle(h > COLLAPSED_HEIGHT + 20);
    }
  }, [description]);

  const paragraphs = description.split("\n").filter(Boolean);

  return (
    <div>
      {/* Collapsible body */}
      <div
        className="relative overflow-hidden"
        style={{
          maxHeight: expanded || !needsToggle ? contentHeight + 32 : COLLAPSED_HEIGHT,
          transition: "max-height 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          ref={innerRef}
          className="prose max-w-none theme-text-muted leading-relaxed text-sm space-y-1"
        >
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Fade-out gradient shown when collapsed */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: expanded || !needsToggle ? 0 : 1,
            background: "linear-gradient(to bottom, transparent, var(--theme-surface, #fff))",
          }}
        />
      </div>

      {/* Full-width toggle button */}
      {needsToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex flex-col items-center justify-center gap-1.5 pt-4 pb-1 group cursor-pointer"
          aria-expanded={expanded}
        >
          {/* Animated line */}
          <div
            className="h-px transition-all duration-500 group-hover:opacity-100"
            style={{
              width: expanded ? "100%" : "40%",
              backgroundColor: "var(--theme-border)",
              opacity: 0.7,
              transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Label + icon */}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d91c1c] group-hover:opacity-75 transition-opacity py-1.5">
            <span>{expanded ? "Minder tonen" : "Meer lezen"}</span>
            <ChevronDown
              size={14}
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
        </button>
      )}
    </div>
  );
}
