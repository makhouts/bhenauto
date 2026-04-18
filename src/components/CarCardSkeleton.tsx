export default function CarCardSkeleton() {
    return (
        <div className="flex flex-col theme-surface overflow-hidden rounded-lg shadow-sm animate-pulse" style={{ border: '1px solid var(--theme-border)' }}>
            {/* Image placeholder */}
            <div className="h-56 md:h-64 w-full" style={{ backgroundColor: 'var(--theme-skeleton)' }} />

            {/* Content */}
            <div className="p-6 flex flex-col flex-grow gap-3">
                {/* Brand */}
                <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />

                {/* Model + Price row */}
                <div className="flex justify-between items-start gap-4">
                    <div className="h-6 w-36 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                    <div className="h-6 w-20 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                </div>

                {/* Stats row */}
                <div className="flex justify-between py-5 px-2 mt-auto gap-4" style={{ borderTop: '1px solid var(--theme-border-subtle)' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                            <div className="w-12 h-3 rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
                        </div>
                    ))}
                </div>

                {/* CTA button */}
                <div className="h-11 w-full rounded" style={{ backgroundColor: 'var(--theme-skeleton)' }} />
            </div>
        </div>
    );
}
