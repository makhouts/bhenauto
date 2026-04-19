import CarCardSkeleton from "@/components/CarCardSkeleton";

export default function InventoryLoading() {
  return (
    <main className="min-h-screen theme-bg flex flex-col pt-8">
      {/* Header band */}
      <header className="theme-bg py-16" style={{ borderBottom: "1px solid var(--theme-border)" }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-32 rounded mb-4 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="h-12 w-80 rounded mb-3 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="h-5 w-96 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">
        {/* Filter sidebar skeleton */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="rounded-lg p-6 animate-pulse space-y-6" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
            <div className="h-6 w-24 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              ))}
            </div>
            <div className="h-px" style={{ backgroundColor: "var(--theme-border)" }} />
            <div className="space-y-3">
              <div className="h-4 w-20 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-6 w-full rounded-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
            <div className="h-px" style={{ backgroundColor: "var(--theme-border)" }} />
            <div className="space-y-3">
              <div className="h-4 w-20 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-6 w-full rounded-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
          </div>
        </aside>

        {/* Car grid skeleton */}
        <section className="flex-1 w-full min-w-0">
          <div className="flex justify-between mb-6">
            <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-8 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
