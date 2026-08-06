"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const COLLAPSED_FEATURE_COUNT = 10;

export default function ExpandableFeatures({
  features,
  showMoreLabel,
  showLessLabel,
}: {
  features: string[];
  showMoreLabel: string;
  showLessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const hasMore = features.length > COLLAPSED_FEATURE_COUNT;
  const visibleFeatures = expanded ? features : features.slice(0, COLLAPSED_FEATURE_COUNT);
  const hiddenCount = features.length - COLLAPSED_FEATURE_COUNT;

  return (
    <div>
      <motion.div
        id={contentId}
        layout
        className="grid grid-cols-1 border-t border-[var(--theme-border)] sm:grid-cols-2 sm:gap-x-12"
        transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleFeatures.map((feature, index) => (
            <motion.div
              layout
              key={feature}
              initial={index >= COLLAPSED_FEATURE_COUNT ? { opacity: 0, y: -6 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex min-h-14 items-center gap-4 border-b border-[var(--theme-border)] text-sm font-semibold theme-text-secondary motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span className="size-1.5 shrink-0 bg-[#d91c1c]" aria-hidden="true" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="group mt-5 flex min-h-12 w-full items-center justify-between border-y border-[var(--theme-border)] py-3 text-left transition-colors duration-200 hover:border-[#d91c1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d91c1c]"
        >
          <span className="flex items-center gap-3">
            <span className="h-px w-7 bg-[#d91c1c] transition-[width] duration-200 group-hover:w-10 motion-reduce:transition-none" aria-hidden="true" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] theme-text">
              {expanded ? showLessLabel : showMoreLabel}
            </span>
          </span>
          <span className="flex items-center gap-3">
            {!expanded && (
              <span className="text-[10px] font-bold tabular-nums theme-text-faint">+{hiddenCount}</span>
            )}
            <span className="flex size-8 items-center justify-center border border-[var(--theme-border)] text-[#d91c1c] transition-colors duration-200 group-hover:border-[#d91c1c]">
              <ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
