export default function CarDetailLoading() {
  return (
    <div className="min-h-screen theme-bg">
      <section className="bg-[#111116]">
        <div className="mx-auto max-w-[1720px] px-4 pb-10 pt-10 sm:px-6 sm:pt-14 md:pt-[130px] lg:px-10 xl:px-12">
          <div className="mb-10 h-3 w-64 animate-pulse bg-white/10" />

          <div className="mb-9 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="mb-5 h-3 w-40 animate-pulse bg-white/10" />
              <div className="h-24 w-4/5 animate-pulse bg-white/10 sm:h-36" />
              <div className="mt-6 h-4 w-2/3 animate-pulse bg-white/10" />
            </div>
            <div className="border-l border-white/10 lg:col-span-4 lg:pl-10">
              <div className="mb-3 h-3 w-12 animate-pulse bg-white/10" />
              <div className="h-14 w-44 animate-pulse bg-[#d91c1c]/20" />
            </div>
          </div>

          <div className="flex h-[400px] gap-2.5 md:h-[600px]">
            <div className="flex-1 animate-pulse bg-white/10" />
            <div className="hidden w-[28%] shrink-0 flex-col gap-2 md:flex">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex-1 animate-pulse bg-white/10" />
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 border-y border-white/10 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3 border-r border-white/10 px-5 py-5 last:border-r-0">
                <div className="h-2 w-16 animate-pulse bg-white/10" />
                <div className="h-4 w-24 animate-pulse bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="theme-bg">
        <div className="mx-auto grid max-w-[1720px] grid-cols-1 gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-10 xl:gap-20 xl:px-12">
          <div className="space-y-10 lg:col-span-8">
            <div className="h-12 w-2/3 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
            <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex h-16 items-center justify-between border-b border-[var(--theme-border)]">
                  <div className="h-3 w-24 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                  <div className="h-3 w-20 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="space-y-5 border border-[var(--theme-border)] border-t-2 border-t-[#d91c1c] p-8">
              <div className="h-12 w-44 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse" style={{ backgroundColor: "var(--theme-skeleton)" }} />
              ))}
              <div className="h-12 w-full animate-pulse bg-[#d91c1c]/20" />
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
