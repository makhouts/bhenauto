"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { adminLocales, type AdminLocale } from "@/lib/admin-i18n";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { setAdminLocale } from "@/app/actions/admin-locale";

export default function AdminLocaleSwitcher({
    compact = false,
}: {
    compact?: boolean;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { locale, dict } = useAdminI18n();

    const setLocale = (nextLocale: AdminLocale) => {
        if (nextLocale === locale) return;
        startTransition(async () => {
            await setAdminLocale(nextLocale);
            router.refresh();
        });
    };

    return (
        <div className={compact ? "inline-flex items-center gap-2" : "inline-flex items-center gap-2"}>
            {compact ? (
                <div
                    className="inline-flex h-8 w-8 items-center justify-center text-slate-400"
                    aria-hidden="true"
                    title={dict.localeSwitcher.menuLabel}
                >
                    <Globe size={15} />
                </div>
            ) : (
                <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
                    aria-hidden="true"
                    title={dict.localeSwitcher.menuLabel}
                >
                    <Globe size={16} />
                </div>
            )}
            {compact ? (
                <div className="inline-flex items-center">
                    {adminLocales.map((option, index) => (
                        <div key={option} className="inline-flex items-center">
                            {index > 0 ? (
                                <span className="mx-1.5 h-4 w-px bg-slate-300" aria-hidden="true" />
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setLocale(option)}
                                disabled={isPending}
                                aria-label={`${dict.localeSwitcher.menuLabel}: ${dict.localeSwitcher.short[option]}`}
                                className={`cursor-pointer rounded-full px-2 py-1 text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${
                                    locale === option
                                        ? "bg-[#020214] text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-900"
                                } disabled:opacity-60`}
                            >
                                {dict.localeSwitcher.short[option]}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                    {adminLocales.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setLocale(option)}
                            disabled={isPending}
                            aria-label={`${dict.localeSwitcher.menuLabel}: ${dict.localeSwitcher.short[option]}`}
                            className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
                                locale === option
                                    ? "bg-white text-[#020214]"
                                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                            } disabled:opacity-60`}
                        >
                            {dict.localeSwitcher.short[option]}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
