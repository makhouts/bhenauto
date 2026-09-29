"use client";

import Link from "next/link";
import { useAdminI18n } from "./AdminI18nProvider";

export default function AdminPagination({ page, pages, total, href, onPage, disabled = false }: {
  page: number; pages: number; total: number;
  href?: (page: number) => string;
  onPage?: (page: number) => void;
  disabled?: boolean;
}) {
  const { locale } = useAdminI18n();
  const labels = locale === "fr"
    ? { previous: "Précédent", next: "Suivant", page: "Page", total: "résultats" }
    : { previous: "Vorige", next: "Volgende", page: "Pagina", total: "resultaten" };
  const control = (target: number, label: string, unavailable: boolean) => {
    const className = "rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40";
    return !unavailable && !disabled && href
      ? <Link href={href(target)} prefetch={false} scroll={false} className={className}>{label}</Link>
      : <button type="button" className={className} disabled={disabled || unavailable} onClick={() => onPage?.(target)}>{label}</button>;
  };
  return <nav aria-label={labels.page} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
    <p className="text-xs font-medium text-slate-500" aria-live="polite">{labels.page} {page} / {pages} · {total} {labels.total}</p>
    <div className="flex gap-2">
      {control(page - 1, labels.previous, page <= 1)}
      {control(page + 1, labels.next, page >= pages)}
    </div>
  </nav>;
}
