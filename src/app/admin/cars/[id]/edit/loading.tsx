export default function EditCarLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-6">
                <div className="h-8 w-8 bg-slate-200 rounded" />
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-72 bg-slate-100 rounded" />
                </div>
            </div>

            {/* Form skeleton — 2 column grid */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-8">
                {/* Image upload area */}
                <div className="h-48 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl" />

                {/* Form fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                            <div className="h-10 w-full bg-slate-50 border border-slate-200 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* Description textarea */}
                <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-32 w-full bg-slate-50 border border-slate-200 rounded-lg" />
                </div>

                {/* Features */}
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="flex flex-wrap gap-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-slate-100 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <div className="h-11 w-40 bg-slate-200 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
