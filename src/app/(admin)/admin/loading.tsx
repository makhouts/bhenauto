export default function AdminLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
                <div>
                    <div className="h-8 w-52 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-80 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-40 bg-slate-100 rounded" />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                        <div className="h-8 w-12 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Calendar */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-5 w-40 bg-slate-200 rounded" />
                        <div className="h-4 w-20 bg-slate-100 rounded" />
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-8 bg-slate-100 rounded mx-auto" />
                                <div className="h-24 bg-slate-50 rounded-lg border border-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent contacts */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="h-5 w-44 bg-slate-200 rounded" />
                        <div className="h-4 w-16 bg-slate-100 rounded" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                                <div className="w-9 h-9 bg-slate-100 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-slate-200 rounded" />
                                    <div className="h-3 w-48 bg-slate-100 rounded" />
                                </div>
                                <div className="h-3 w-12 bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Upcoming appointments row */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="h-5 w-52 bg-slate-200 rounded mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-slate-100 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-slate-200 rounded" />
                                <div className="h-5 w-14 bg-slate-100 rounded-full" />
                            </div>
                            <div className="h-3 w-36 bg-slate-100 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
