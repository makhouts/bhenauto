"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Layers3, Rocket, Sparkles, TriangleAlert } from "lucide-react";
import { createTenantOnboarding } from "@/app/actions/tenant-onboarding";
import {
  TENANT_THEME_PRESETS,
  type TenantOnboardingActionState,
} from "@core/tenant/onboarding";

const initialState: TenantOnboardingActionState = {
  status: "idle",
  message: null,
};

const featureOptions = [
  ["feature_contacts", "Contacts inbox"],
  ["feature_appointments", "Workshop appointments"],
  ["feature_autoscout24", "AutoScout24 sync"],
  ["feature_imageAnalysis", "AI image analysis"],
] as const;

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 sm:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-black text-[var(--ink)]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
        {label}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-12 w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(20,32,43,0.03)] outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
    >
      <Rocket size={16} />
      {pending ? "Creating client..." : "Create client"}
    </button>
  );
}

function ActionBanner({ state }: { state: TenantOnboardingActionState }) {
  if (state.status === "idle" || !state.message) {
    return null;
  }

  const success = state.status === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live="polite"
      className={`rounded-[26px] border px-5 py-4 text-sm ${
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {success ? (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        ) : (
          <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        )}
        <div className="space-y-2">
          <p className="font-semibold">{state.message}</p>
          {success ? (
            <div className="space-y-1 text-xs font-semibold">
              {state.tenantId ? <p>Tenant ID: {state.tenantId}</p> : null}
              {state.packageDir ? <p>Package: {state.packageDir}</p> : null}
              {state.blueprintPath ? <p>Blueprint: {state.blueprintPath}</p> : null}
              {state.requiresRestart ? (
                <p>Restart the main dealer runtime before the new domain goes live.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TenantOnboardingForm({
  tenantInfrastructureReady,
}: {
  tenantInfrastructureReady: boolean;
}) {
  const [state, formAction] = useActionState(createTenantOnboarding, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_70px_rgba(20,32,43,0.06)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              Create Client
            </p>
            <h2 className="mt-3 text-3xl font-black text-[var(--ink)]">
              Onboarding wizard
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Build the tenant record, assign paid feature flags, and scaffold the dealer
              package from one internal UI.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Tenant DB record", "Feature package", "Dealer scaffold"].map((label) => (
              <span
                key={label}
                className="rounded-full bg-[rgba(15,118,110,0.12)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--teal)]"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {!tenantInfrastructureReady ? (
            <div className="rounded-[26px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              Tenant migration is still missing in the database. Apply the tenant migration
              first, then use this wizard.
            </div>
          ) : null}

          <ActionBanner state={state} />

          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <Section eyebrow="Identity" title="Client and domain">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Client name" name="name" placeholder="Acme Auto" disabled={!tenantInfrastructureReady} />
                  <Field label="Slug" name="slug" placeholder="acme-auto" disabled={!tenantInfrastructureReady} />
                  <Field label="Display name" name="displayName" placeholder="Acme Auto" disabled={!tenantInfrastructureReady} />
                  <Field label="Admin name" name="adminDisplayName" placeholder="Acme Auto Admin" disabled={!tenantInfrastructureReady} />
                  <Field label="Legal name" name="legalName" placeholder="Acme Auto BV" disabled={!tenantInfrastructureReady} />
                  <Field label="Primary domain" name="primaryDomain" placeholder="acme-auto.be" disabled={!tenantInfrastructureReady} />
                  <Field label="Site URL" name="siteUrl" placeholder="https://acme-auto.be" type="url" disabled={!tenantInfrastructureReady} />
                  <Field label="Support email" name="supportEmail" placeholder="info@acme-auto.be" type="email" disabled={!tenantInfrastructureReady} />
                </div>
              </Section>

              <Section eyebrow="Operations" title="Contact and storage">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Phone" name="phone" placeholder="+32 2 000 00 00" disabled={!tenantInfrastructureReady} />
                  <Field label="WhatsApp number" name="whatsappNumber" placeholder="32470000000" disabled={!tenantInfrastructureReady} />
                  <Field label="Address line" name="addressLine" placeholder="Main Street 10" disabled={!tenantInfrastructureReady} />
                  <Field label="Postal code" name="postalCode" placeholder="1000" disabled={!tenantInfrastructureReady} />
                  <Field label="City" name="city" placeholder="Brussels" disabled={!tenantInfrastructureReady} />
                  <Field label="Region" name="region" placeholder="Brussels" disabled={!tenantInfrastructureReady} />
                  <Field label="Country code" name="countryCode" defaultValue="BE" placeholder="BE" disabled={!tenantInfrastructureReady} />
                  <Field label="Time zone" name="timeZone" defaultValue="Europe/Brussels" placeholder="Europe/Brussels" disabled={!tenantInfrastructureReady} />
                  <Field label="Currency" name="currency" defaultValue="EUR" placeholder="EUR" disabled={!tenantInfrastructureReady} />
                  <Field label="R2 prefix" name="r2KeyPrefix" placeholder="acme-auto" disabled={!tenantInfrastructureReady} />
                  <Field label="Session context" name="sessionContext" placeholder="acme-auto-admin-session-v1" disabled={!tenantInfrastructureReady} />
                </div>
              </Section>
            </div>

            <div className="space-y-5">
              <Section eyebrow="Commercial" title="Paid features">
                <div className="space-y-3">
                  {featureOptions.map(([name, label], index) => (
                    <label
                      key={name}
                      className="flex min-h-12 items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
                    >
                      <input
                        type="checkbox"
                        name={name}
                        defaultChecked={index === 0}
                        disabled={!tenantInfrastructureReady}
                        className="h-4 w-4 rounded border-slate-300 accent-[var(--accent)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </Section>

              <Section eyebrow="Design Direction" title="Theme preset">
                <div className="space-y-3">
                  {TENANT_THEME_PRESETS.map((preset, index) => (
                    <label
                      key={preset.value}
                      className="flex gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4 text-sm"
                    >
                      <input
                        type="radio"
                        name="themePreset"
                        value={preset.value}
                        defaultChecked={index === 0}
                        disabled={!tenantInfrastructureReady}
                        className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>
                        <span className="block font-black text-[var(--ink)]">{preset.label}</span>
                        <span className="mt-1 block leading-6 text-[var(--muted)]">
                          {preset.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </Section>

              <Section eyebrow="Handoff" title="Internal notes">
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    rows={7}
                    disabled={!tenantInfrastructureReady}
                    placeholder="Design direction, required extras, launch constraints, integration notes..."
                    className="w-full rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)] shadow-[0_10px_24px_rgba(20,32,43,0.03)] outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-white focus:ring-4 focus:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </Section>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.80),rgba(244,237,226,0.96))] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                <Layers3 size={14} />
                Scaffolds shared structure
              </div>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Creates the tenant record now. Public UI work still happens after this inside
                the new dealer package.
              </p>
            </div>
            <SubmitButton disabled={!tenantInfrastructureReady} />
          </div>
        </div>
      </section>
    </form>
  );
}
