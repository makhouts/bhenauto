export default function CarCardSkeleton() {
    return (
        <div className="flex flex-col bg-white border border-slate-100 overflow-hidden rounded-lg shadow-sm animate-pulse">
            {/* Image placeholder */}
            <div className="h-56 md:h-64 w-full bg-slate-200" />

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow gap-3">
                {/* Brand */}
                <div className="h-3 w-20 bg-slate-200 rounded" />

                {/* Model + Price row */}
                <div className="flex justify-between items-start gap-4">
                    <div className="h-6 w-36 bg-slate-200 rounded" />
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                </div>

                {/* Stats row */}
                <div className="flex justify-between py-5 px-2 mt-auto border-t border-slate-50 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 bg-slate-200 rounded" />
                            <div className="w-12 h-3 bg-slate-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* CTA button */}
                <div className="h-11 w-full bg-slate-200 rounded" />
            </div>
        </div>
    );
}
