export default function ContactLoading() {
  return (
    <main className="min-h-screen theme-bg pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 animate-pulse space-y-4">
          <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="h-12 w-80 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          <div className="h-5 w-96 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
                <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-5 w-40 rounded" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Form skeleton */}
          <div className="rounded-2xl p-8 animate-pulse space-y-5" style={{ backgroundColor: "var(--theme-surface)", border: "1px solid var(--theme-border)" }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-11 rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              <div className="h-11 rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            </div>
            <div className="h-11 w-full rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-32 w-full rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="h-12 w-full rounded-xl" style={{ backgroundColor: "var(--theme-skeleton)" }} />
          </div>
        </div>
      </div>
    </main>
  );
}
