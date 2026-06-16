import Link from "next/link";
import { LogOut, Orbit } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { requirePlatformAdmin } from "@/lib/auth-guard";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.18),transparent_58%)]" />
      <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.14),transparent_68%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.82)] px-4 py-4 shadow-[0_18px_60px_rgba(20,32,43,0.06)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link href="/" className="inline-flex items-center gap-3 text-[var(--ink)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ink)] text-white shadow-[0_14px_34px_rgba(20,32,43,0.22)]">
                  <Orbit size={20} />
                </span>
                <span className="block min-w-0">
                  <span className="block text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                    Internal Ops
                  </span>
                  <span className="mt-1 block truncate text-xl font-black">
                    Platform Admin
                  </span>
                </span>
              </Link>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Onboarding separated from dealer runtime
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-5 text-sm font-bold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
