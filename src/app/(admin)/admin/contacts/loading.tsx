export default function AdminContactsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <div className="h-8 w-52 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-80 bg-slate-100 rounded" />
                </div>
                <div className="h-8 w-36 bg-slate-100 rounded-xl" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-white border border-slate-200 rounded-lg" />
                ))}
            </div>

            {/* Contact cards */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-36 bg-slate-200 rounded" />
                                        <div className="h-4 w-16 bg-slate-100 rounded-full" />
                                    </div>
                                    <div className="h-3 w-48 bg-slate-100 rounded" />
                                    <div className="h-3 w-full max-w-lg bg-slate-50 rounded" />
                                </div>
                            </div>
                            <div className="h-3 w-20 bg-slate-100 rounded shrink-0" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
