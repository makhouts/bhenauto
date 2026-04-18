export default function HomeLoading() {
    return (
        <main className="flex flex-col min-h-screen theme-bg">
            {/* Hero skeleton */}
            <section className="relative h-screen flex items-center bg-slate-900 animate-pulse">
                <div className="relative z-10 px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto pt-20">
                    <div className="h-16 w-80 bg-white/10 rounded-xl mb-2" />
                    <div className="h-16 w-64 bg-white/10 rounded-xl mb-6" />
                    <div className="h-5 w-96 bg-white/5 rounded mb-2" />
                    <div className="h-5 w-72 bg-white/5 rounded mb-10" />
                    <div className="flex gap-4">
                        <div className="h-12 w-52 bg-white/10 rounded" />
                        <div className="h-12 w-64 bg-white/5 rounded border border-white/10" />
                    </div>
                </div>
            </section>

            {/* Carousel skeleton */}
            <section className="py-12 sm:py-20 md:py-24 theme-bg">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 sm:mb-8 animate-pulse">
                        <div className="h-3 w-24 rounded mb-3" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                        <div className="h-9 w-64 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                    </div>
                    <div className="flex gap-4 sm:gap-6 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="shrink-0 w-[300px] sm:w-[310px] md:w-[330px] theme-surface rounded-xl overflow-hidden shadow-sm animate-pulse" style={{ border: '1px solid var(--theme-border)' }}>
                                <div className="h-[200px]" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                                <div className="p-4 sm:p-5 space-y-3">
                                    <div className="h-5 w-48 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                                    <div className="h-6 w-24 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                                    <div className="flex gap-2">
                                        <div className="h-3 w-10 rounded" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                                        <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                                        <div className="h-3 w-14 rounded" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose skeleton */}
            <section className="py-24 theme-surface" style={{ borderTop: '1px solid var(--theme-border)', borderBottom: '1px solid var(--theme-border)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-pulse">
                    <div className="h-8 w-80 rounded mx-auto mb-4" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                    <div className="h-4 w-96 rounded mx-auto mb-16" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                                <div className="h-5 w-36 rounded mb-3" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                                <div className="h-3 w-48 rounded mb-1" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                                <div className="h-3 w-40 rounded" style={{ backgroundColor: 'var(--theme-skeleton-subtle)' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
