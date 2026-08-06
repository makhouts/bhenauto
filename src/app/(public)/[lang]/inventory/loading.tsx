import CarCardSkeleton from "@/components/CarCardSkeleton";

export default function InventoryLoading() {
  return (
    <main className="flex min-h-screen flex-col theme-bg">
      <header className="bg-[#111116] pb-16 pt-16 sm:pb-20 sm:pt-20 md:pt-[154px] lg:pb-24">
        <div className="mx-auto grid max-w-[1720px] grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-10 xl:px-12">
          <div className="lg:col-span-8">
            <div className="mb-7 h-3 w-32 animate-pulse bg-white/10" />
            <div className="h-24 w-3/4 max-w-3xl animate-pulse bg-white/10 sm:h-36" />
          </div>
          <div className="flex flex-col justify-end border-l border-white/10 lg:col-span-4 lg:pl-10">
            <div className="mb-3 h-4 w-full animate-pulse bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse bg-white/10" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 items-start gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:px-10 xl:gap-14 xl:px-12">
        {/* Filter sidebar skeleton */}
        <aside className="w-full lg:col-span-3">
          <div className="space-y-6 border border-[var(--theme-border)] p-6 animate-pulse" style={{ backgroundColor: "var(--theme-surface)" }}>
            <div className="h-6 w-24" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="size-5" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-4 w-28" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              ))}
            </div>
            <div className="h-px" style={{ backgroundColor: "var(--theme-border)" }} />
            <div className="space-y-3">
              <div className="h-4 w-20" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-6 w-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
            <div className="h-px" style={{ backgroundColor: "var(--theme-border)" }} />
            <div className="space-y-3">
              <div className="h-4 w-20" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-6 w-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
          </div>
        </aside>

        {/* Car grid skeleton */}
        <section className="w-full min-w-0 lg:col-span-9">
          <div className="flex justify-between mb-6">
            <div className="h-5 w-32 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-8 w-28 rounded animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <CarCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
