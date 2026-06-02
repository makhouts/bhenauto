"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { runManualAutoScoutImport } from "@/app/actions/cars";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { toast } from "sonner";

export default function AutoScoutImportButton() {
    const { dict, locale } = useAdminI18n();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isRunning, setIsRunning] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);
    const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null);
    const importWasRunning = useRef(false);
    const pollNowRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const scheduleNextPoll = (delayMs: number) => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                void pollImportStatus();
            }, delayMs);
        };

        const pollImportStatus = async () => {
            try {
                const response = await fetch("/api/admin/autoscout-import/status", {
                    cache: "no-store",
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    if (!cancelled) timeoutId = setTimeout(pollImportStatus, 10000);
                    return;
                }

                const next = await response.json() as {
                    running?: boolean;
                    configured?: boolean;
                    lastCompletedAt?: string | null;
                    lastError?: string | null;
                };
                const running = Boolean(next.running);

                if (!cancelled) {
                    setIsRunning(running);
                    setIsConfigured(next.configured !== false);
                    setLastCompletedAt(next.lastCompletedAt ?? null);

                    if (importWasRunning.current && !running) {
                        if (next.lastError) {
                            toast.error(dict.carsTable.manualSyncFailed);
                        } else {
                            toast.success(dict.carsTable.manualSyncCompleted);
                        }
                        router.refresh();
                    }

                    importWasRunning.current = running;
                    scheduleNextPoll(running ? 3000 : 60000);
                }
            } catch {
                if (!cancelled) scheduleNextPoll(10000);
            }
        };

        pollNowRef.current = () => {
            if (timeoutId) clearTimeout(timeoutId);
            void pollImportStatus();
        };

        void pollImportStatus();

        return () => {
            cancelled = true;
            pollNowRef.current = null;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [dict.carsTable.manualSyncCompleted, dict.carsTable.manualSyncFailed, router]);

    const handleImport = () => {
        startTransition(async () => {
            const result = await runManualAutoScoutImport();

            if (!result || "error" in result) {
                toast.error(result?.error ?? "AutoScout24 import failed.");
                return;
            }

            setIsRunning(true);
            importWasRunning.current = true;
            toast.info(result.started ? dict.carsTable.manualSyncQueued : dict.carsTable.manualSyncAlreadyRunning);
            pollNowRef.current?.();
        });
    };

    const busy = isPending || isRunning;
    const formattedLastSync = lastCompletedAt
        ? new Intl.DateTimeFormat(locale === "fr" ? "fr-BE" : "nl-BE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(lastCompletedAt))
        : null;

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-500">
                {formattedLastSync
                    ? `${dict.carsTable.manualSyncLastSynced}: ${formattedLastSync}`
                    : dict.carsTable.manualSyncNeverSynced}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] ${
                !isConfigured
                    ? "border-red-200 bg-red-50 text-red-700"
                    : busy
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}>
                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {busy
                    ? dict.carsTable.manualSyncStatusRunning
                    : isConfigured
                        ? dict.carsTable.manualSyncStatusIdle
                        : dict.carsTable.manualSyncUnavailable}
            </span>
            <button
                type="button"
                onClick={handleImport}
                disabled={busy || !isConfigured}
                title={isConfigured ? undefined : dict.carsTable.manualSyncUnavailable}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-[#d91c1c] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_20px_rgba(217,28,28,0.16)] transition-colors hover:bg-[#c31818] disabled:cursor-wait disabled:bg-[#d91c1c]/75"
            >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCcw size={15} />}
                {busy ? dict.carsTable.manualSyncRunning : isConfigured ? dict.carsTable.manualSync : dict.carsTable.manualSyncUnavailable}
            </button>
        </div>
    );
}
