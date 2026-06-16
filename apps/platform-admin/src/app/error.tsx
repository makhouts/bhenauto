"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-8 shadow-[0_24px_80px_rgba(20,32,43,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          Platform Admin
        </p>
        <h1 className="mt-4 text-3xl font-black text-[var(--ink)]">
          Something broke while loading the admin app.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {error.message || "Unexpected platform admin error."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
