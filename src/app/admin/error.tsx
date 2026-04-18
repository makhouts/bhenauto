"use client";

import { useEffect } from "react";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Admin error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-sm">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#d91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-lg font-black text-slate-900 mb-1">Er ging iets mis</h2>
                <p className="text-sm text-slate-500 font-medium mb-6">
                    {error.message || "Er is een onverwachte fout opgetreden."}
                </p>
                <button
                    onClick={reset}
                    className="px-5 py-2.5 bg-[#d91c1c] text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#b91515] transition-colors"
                >
                    Probeer Opnieuw
                </button>
            </div>
        </div>
    );
}
