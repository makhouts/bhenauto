import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import {
  isValidPlatformSession,
  PLATFORM_ADMIN_SESSION_COOKIE,
} from "@/lib/session";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(PLATFORM_ADMIN_SESSION_COOKIE);

  if (await isValidPlatformSession(session?.value)) {
    redirect("/");
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(180,83,9,0.20),transparent_60%)]" />
      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.18),transparent_70%)] blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[36px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(20,32,43,0.10)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-[var(--border)] bg-[linear-gradient(160deg,rgba(20,32,43,0.98),rgba(20,32,43,0.86))] px-7 py-8 text-white xl:border-b-0 xl:border-r xl:px-10 xl:py-12">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-amber-300">
            Separate Ops Layer
          </p>
          <h1 className="mt-5 max-w-md font-serif text-5xl leading-none text-white sm:text-6xl">
            Dealer onboarding belongs outside each client build.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300">
            This app is your internal control room. Create tenant records, scaffold the
            dealer package, then build the public frontend separately.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Tenant record + features"],
              ["2", "Dealer package scaffold"],
              ["3", "Design handoff blueprint"],
            ].map(([step, label]) => (
              <div
                key={step}
                className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                  Step {step}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-8 sm:px-7 xl:px-10 xl:py-12">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--accent)]">
              Access
            </p>
            <h2 className="mt-3 text-3xl font-black text-[var(--ink)]">
              Platform admin login
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Use the shared admin password from your environment. This login is separate
              from the dealer admin UI.
            </p>

            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
