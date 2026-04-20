export default function CarDetailLoading() {
  return (
    <div className="min-h-screen theme-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:pt-24 pb-20">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-3 w-12 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <span className="theme-text-faint">/</span>
          <div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <span className="theme-text-faint">/</span>
          <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        </div>

        {/* Gallery skeleton */}
        <div className="flex gap-2.5 h-[380px] md:h-[520px] mb-10">
          <div className="flex-1 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="hidden md:flex flex-col gap-2 w-[28%] shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-xl animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: specs */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="h-9 w-3/4 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-5 w-1/2 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-10 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />

            {/* Stats bar */}
            <div className="grid grid-cols-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-4 animate-pulse space-y-2" style={{ backgroundColor: "var(--theme-surface)" }}>
                  <div className="h-3 w-12 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-4 w-16 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              ))}
            </div>

            {/* Specs card */}
            <div className="rounded-xl p-7 animate-pulse space-y-4" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
              <div className="h-6 w-36 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between py-2" style={{ borderBottom: "1px solid var(--theme-border-subtle)" }}>
                  <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: contact panel */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
            <div className="rounded-[28px] p-8 animate-pulse space-y-6" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
              <div className="h-8 w-40 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-2xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              ))}
              <div className="h-14 w-full rounded-2xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
