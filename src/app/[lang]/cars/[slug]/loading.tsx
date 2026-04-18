export default function CarDetailLoading() {
    return (
        <div className="min-h-screen bg-[#f8f6f6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

                {/* Breadcrumb skeleton */}
                <div className="flex items-center gap-2 mb-6 animate-pulse">
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                    <span className="text-slate-300">/</span>
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                    <span className="text-slate-300">/</span>
                    <div className="h-3 w-32 bg-slate-300 rounded" />
                </div>

                {/* Gallery skeleton */}
                <div className="flex gap-2.5 h-[380px] md:h-[520px] mb-10 animate-pulse">
                    <div className="flex-1 bg-slate-200 rounded-2xl" />
                    <div className="hidden md:flex flex-col gap-2 w-[28%] shrink-0">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex-1 bg-slate-200 rounded-xl" />
                        ))}
                    </div>
                </div>

                {/* Thumbnail strip skeleton */}
                <div className="flex gap-2 mb-10 animate-pulse">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 w-24 bg-slate-200 rounded-lg shrink-0" />
                    ))}
                </div>

                {/* Main content grid */}
                <div className="flex flex-col lg:flex-row gap-10 animate-pulse">
                    {/* Left — specs */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* Title */}
                        <div className="h-10 w-80 bg-slate-200 rounded-lg" />
                        <div className="h-5 w-64 bg-slate-100 rounded" />

                        {/* Price */}
                        <div className="h-10 w-36 bg-slate-200 rounded-lg" />

                        {/* Quick stats bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`flex flex-col px-5 py-4 ${i < 3 ? "border-r border-slate-100" : ""}`}>
                                    <div className="h-3 w-16 bg-slate-100 rounded mb-2" />
                                    <div className="h-4 w-20 bg-slate-200 rounded" />
                                </div>
                            ))}
                        </div>

                        {/* Specs card */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 space-y-4">
                            <div className="h-6 w-56 bg-slate-200 rounded mb-4" />
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex justify-between py-3 border-b border-slate-100">
                                    <div className="h-4 w-24 bg-slate-100 rounded" />
                                    <div className="h-4 w-20 bg-slate-200 rounded" />
                                </div>
                            ))}
                        </div>

                        {/* Description card */}
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 space-y-3">
                            <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-full bg-slate-100 rounded" />
                            <div className="h-4 w-3/4 bg-slate-100 rounded" />
                        </div>
                    </div>

                    {/* Right — contact sidebar */}
                    <div className="w-full lg:w-[380px] shrink-0 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 space-y-4">
                            <div className="h-6 w-40 bg-slate-200 rounded" />
                            <div className="h-12 w-full bg-slate-100 rounded-lg" />
                            <div className="h-12 w-full bg-slate-100 rounded-lg" />
                            <div className="h-12 w-full bg-[#d91c1c]/10 rounded-lg" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-7 space-y-3">
                            <div className="h-5 w-32 bg-slate-200 rounded" />
                            <div className="h-4 w-48 bg-slate-100 rounded" />
                            <div className="h-4 w-44 bg-slate-100 rounded" />
                            <div className="h-4 w-40 bg-slate-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
