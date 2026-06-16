"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { login, type LoginActionState } from "@/app/actions/auth";

const initialState: LoginActionState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Checking access..." : "Enter platform admin"}
      <ArrowRight size={16} />
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">
          Password
        </span>
        <div className="flex min-h-12 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 shadow-[0_10px_28px_rgba(20,32,43,0.04)] transition focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--ring)]">
          <LockKeyhole size={16} className="shrink-0 text-[var(--accent)]" />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Enter platform password"
            className="w-full bg-transparent text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-slate-400"
          />
        </div>
      </label>

      {state.error ? (
        <div
          role="alert"
          className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {state.error}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
