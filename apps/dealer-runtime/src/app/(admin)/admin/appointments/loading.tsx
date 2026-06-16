export default function AdminAppointmentsLoading() {
    return (
        <div className="animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
                <div>
                    <div className="h-8 w-44 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-72 bg-slate-100 rounded" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-28 bg-slate-100 rounded-lg" />
                    <div className="h-10 w-28 bg-slate-100 rounded-lg" />
                </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-2 mb-6">
                <div className="h-9 w-20 bg-white border border-slate-200 rounded-lg" />
                <div className="h-9 w-24 bg-white border border-slate-200 rounded-lg" />
            </div>

            {/* Calendar skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                {/* Week header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="h-5 w-48 bg-slate-200 rounded" />
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-slate-100 rounded" />
                        <div className="h-8 w-8 bg-slate-100 rounded" />
                    </div>
                </div>

                {/* Day columns */}
                <div className="grid grid-cols-5 gap-4">
                    {[...Array(5)].map((_, day) => (
                        <div key={day} className="space-y-3">
                            {/* Day header */}
                            <div className="text-center space-y-1">
                                <div className="h-3 w-6 bg-slate-100 rounded mx-auto" />
                                <div className="h-8 w-8 bg-slate-100 rounded-full mx-auto" />
                            </div>
                            {/* Time slots */}
                            {[...Array(3)].map((_, slot) => (
                                <div key={slot} className="h-20 bg-slate-50 rounded-lg border border-slate-100" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
