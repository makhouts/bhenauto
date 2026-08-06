"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { normalizeVehicleDescription } from "@/lib/autoscout24/presentation-format";

const COLLAPSED_HEIGHT = 168;

export default function ExpandableDescription({
  description,
  showMoreLabel,
  showLessLabel,
}: {
  description: string;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const innerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const normalizedDescription = normalizeVehicleDescription(description);

  useEffect(() => {
    const content = innerRef.current;
    if (!content) return;

    const measure = () => {
      const height = content.scrollHeight;
      setContentHeight(height);
      setNeedsToggle(height > COLLAPSED_HEIGHT + 16);
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [normalizedDescription]);

  const paragraphs = normalizedDescription.split("\n").filter(Boolean);

  return (
    <div className="max-w-3xl">
      <div
        id={contentId}
        className="relative overflow-hidden motion-reduce:transition-none"
        style={{
          maxHeight: expanded || !needsToggle ? contentHeight + 8 : COLLAPSED_HEIGHT,
          transition: "max-height 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          ref={innerRef}
          className="max-w-[72ch] space-y-3 text-[15px] leading-7 theme-text-secondary"
        >
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 transition-opacity duration-200 motion-reduce:transition-none"
          style={{
            opacity: expanded || !needsToggle ? 0 : 1,
            background: "linear-gradient(to bottom, transparent, var(--theme-bg) 92%)",
          }}
        />
      </div>

      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="group mt-5 flex min-h-12 w-full items-center justify-between border-y border-[var(--theme-border)] py-3 text-left transition-colors duration-200 hover:border-[#d91c1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d91c1c]"
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <span className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#d91c1c] transition-[width] duration-200 group-hover:w-10 motion-reduce:transition-none" aria-hidden="true" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] theme-text">
              {expanded ? showLessLabel : showMoreLabel}
            </span>
          </span>
          <span className="flex size-8 items-center justify-center border border-[var(--theme-border)] text-[#d91c1c] transition-colors duration-200 group-hover:border-[#d91c1c]">
            <ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
