export default function WerkplaatsLoading() {
  return (
    <div className="min-h-screen theme-bg">
      {/* Hero skeleton */}
      <div className="relative h-[70vh] flex items-center bg-slate-900 overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-slate-800" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full pt-20">
          <div className="h-4 w-24 rounded mb-4 bg-slate-700" />
          <div className="h-14 w-2/3 rounded mb-4 bg-slate-700" />
          <div className="h-5 w-96 rounded mb-8 bg-slate-700" />
          <div className="flex gap-4">
            <div className="h-12 w-40 rounded bg-red-800/50" />
            <div className="h-12 w-40 rounded bg-slate-700" />
          </div>
        </div>
      </div>

      {/* Services grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-8 animate-pulse space-y-4" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
              <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-6 w-3/4 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-4 w-5/6 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
