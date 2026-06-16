export default function AdminCarsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <div className="h-8 w-56 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-96 bg-slate-100 rounded" />
                </div>
                <div className="h-11 w-52 bg-slate-200 rounded-lg" />
            </div>

            {/* Search + filters bar */}
            <div className="flex gap-4 mb-6">
                <div className="h-10 flex-1 bg-white border border-slate-200 rounded-lg" />
                <div className="h-10 w-32 bg-white border border-slate-200 rounded-lg" />
            </div>

            {/* Table skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-3 w-14 bg-slate-200 rounded" />
                    <div className="h-3 w-14 bg-slate-200 rounded" />
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                    <div className="h-3 w-12 bg-slate-200 rounded" />
                </div>

                {/* Table rows */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-slate-50 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-12 bg-slate-100 rounded-lg shrink-0" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-4 w-28 bg-slate-200 rounded" />
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                        <div className="h-4 w-12 bg-slate-100 rounded" />
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                        <div className="h-5 w-16 bg-slate-100 rounded-full" />
                        <div className="flex gap-2">
                            <div className="h-8 w-8 bg-slate-100 rounded" />
                            <div className="h-8 w-8 bg-slate-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
