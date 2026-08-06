export default function CarCardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden border border-[var(--theme-border)] animate-pulse theme-surface">
            {/* Image placeholder */}
            <div className="aspect-[16/10] w-full" style={{ backgroundColor: 'var(--theme-skeleton)' }} />

            {/* Content */}
            <div className="flex flex-grow flex-col gap-4 px-5 pb-0 pt-6 sm:px-6">
                {/* Brand */}
                <div className="h-3 w-20" style={{ backgroundColor: 'var(--theme-skeleton)' }} />

                {/* Model + Price row */}
                <div className="flex justify-between items-start gap-4">
                    <div className="h-10 w-40" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                    <div className="h-7 w-24" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                </div>

                {/* Stats row */}
                <div className="mt-auto grid grid-cols-2 border-y border-[var(--theme-border)]">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex min-h-12 items-center gap-2.5 px-3 py-2 ${i % 2 ? "border-l border-[var(--theme-border)]" : ""} ${i > 1 ? "border-t border-[var(--theme-border)]" : ""}`}>
                            <div className="size-4" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                            <div className="h-3 w-20" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                        </div>
                    ))}
                </div>

                <div className="h-14 w-full border-t border-[var(--theme-border)]" />
            </div>
        </div>
    );
}
