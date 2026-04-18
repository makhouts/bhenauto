"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center theme-bg px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--theme-icon-bg)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#d91c1c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black theme-text mb-2">Er ging iets mis</h2>
                <p className="theme-text-muted font-medium mb-8">
                    Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te laden.
                </p>
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-[#d91c1c] text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-[#b91515] transition-colors shadow-md"
                    style={{ boxShadow: '0 4px 6px var(--theme-shadow-red)' }}
                >
                    Probeer Opnieuw
                </button>
            </div>
        </div>
    );
}
