export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen theme-bg">
      {/* Hero skeleton */}
      <div className="relative h-screen flex items-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-slate-800 animate-pulse" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto flex flex-col items-start pt-20">
          <div className="h-16 w-3/4 bg-slate-700 rounded-lg mb-4 animate-pulse" />
          <div className="h-16 w-1/2 bg-slate-700 rounded-lg mb-8 animate-pulse" />
          <div className="h-5 w-96 bg-slate-700 rounded mb-10 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-12 w-40 bg-red-800/50 rounded animate-pulse" />
            <div className="h-12 w-40 bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Carousel skeleton */}
      <div className="py-24 theme-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded mb-4 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="h-12 w-72 rounded mb-14 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
                <div className="h-52 w-full" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                <div className="p-6 space-y-3">
                  <div className="h-6 w-3/4 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-10 w-full rounded mt-4" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
