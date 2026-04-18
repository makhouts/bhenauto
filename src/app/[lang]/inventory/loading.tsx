import CarCardSkeleton from "@/components/CarCardSkeleton";

export default function InventoryLoading() {
    return (
        <main className="min-h-screen bg-[#f8f6f6] flex flex-col pt-8">
            {/* Header Banner skeleton */}
            <header className="bg-[#f8f6f6] py-16 border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-3 w-10 bg-slate-200 rounded" />
                        <span className="text-slate-300">/</span>
                        <div className="h-3 w-16 bg-slate-300 rounded" />
                    </div>
                    <div className="h-12 w-72 bg-slate-200 rounded-lg mb-4" />
                    <div className="h-5 w-[480px] max-w-full bg-slate-100 rounded" />
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8 w-full items-start">
                {/* Sidebar Filter skeleton */}
                <aside className="w-full lg:w-80 shrink-0 animate-pulse">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-6">
                        {/* Search */}
                        <div className="h-10 w-full bg-slate-100 rounded-lg" />

                        {/* Filter sections */}
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <div className="h-4 w-20 bg-slate-200 rounded" />
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="h-8 w-full bg-slate-50 rounded-lg" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA block skeleton */}
                    <div className="mt-8 bg-slate-200 rounded-xl h-56" />
                </aside>

                {/* Car Grid skeleton */}
                <section className="flex-1 w-full min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <CarCardSkeleton key={i} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
