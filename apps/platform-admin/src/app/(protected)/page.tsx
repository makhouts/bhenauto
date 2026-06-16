import type { Metadata } from "next";
import TenantOnboardingForm from "@/components/TenantOnboardingForm";
import prisma from "@core/db/prisma";

export const metadata: Metadata = {
  title: "Client Onboarding",
};

type TenantListItem = {
  id: string;
  slug: string;
  displayName: string | null;
  primaryDomain: string | null;
  createdAt: Date;
  features: Array<{ key: string; enabled: boolean }>;
};

function hasPrismaCode(error: unknown, codes: string[]) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    codes.includes((error as { code: string }).code)
  );
}

async function getTenants(): Promise<{
  tenantInfrastructureReady: boolean;
  tenants: TenantListItem[];
}> {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        features: {
          select: { key: true, enabled: true },
          orderBy: { key: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      tenantInfrastructureReady: true,
      tenants,
    };
  } catch (error) {
    if (hasPrismaCode(error, ["P2021", "P2022"])) {
      return {
        tenantInfrastructureReady: false,
        tenants: [],
      };
    }

    throw error;
  }
}

export default async function HomePage() {
  const { tenantInfrastructureReady, tenants } = await getTenants();
  const enabledFeatureCount = tenants.reduce(
    (count, tenant) => count + tenant.features.filter((feature) => feature.enabled).length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(155deg,rgba(20,32,43,0.98),rgba(20,32,43,0.86))] p-6 text-white shadow-[0_30px_80px_rgba(20,32,43,0.12)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">
            Client Factory
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-none text-white sm:text-5xl">
            One backend platform. Different frontend identity for every dealer.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
            This app owns tenant creation and scaffolding. The dealer runtime stays clean,
            and every new client starts from the same operational base instead of a
            copy-paste project.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [`${tenants.length}`, "Clients registered"],
              [`${enabledFeatureCount}`, "Enabled feature flags"],
              [tenantInfrastructureReady ? "Ready" : "Pending", "Tenant tables status"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-[24px] border border-white/10 bg-white/7 px-4 py-4 backdrop-blur"
              >
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_70px_rgba(20,32,43,0.06)] backdrop-blur sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--teal)]">
            New Client Flow
          </p>
          <h2 className="mt-3 text-2xl font-black text-[var(--ink)]">
            What happens after you press create
          </h2>
          <div className="mt-6 space-y-3">
            {[
              "Creates the Tenant row and feature package in the database.",
              "Scaffolds packages/dealers/<slug> from the template package.",
              "Writes client.blueprint.json for design and delivery notes.",
              "You finish the custom public UI inside the new dealer package.",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[var(--muted)]">{step}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <TenantOnboardingForm tenantInfrastructureReady={tenantInfrastructureReady} />

        <div className="space-y-6">
          <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_70px_rgba(20,32,43,0.06)] backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              Existing Clients
            </p>
            <h2 className="mt-3 text-2xl font-black text-[var(--ink)]">
              Tenant registry
            </h2>

            <div className="mt-6 space-y-4">
              {tenantInfrastructureReady ? (
                tenants.length > 0 ? (
                  tenants.map((tenant) => (
                    <article
                      key={tenant.id}
                      className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black text-[var(--ink)]">
                            {tenant.displayName || tenant.slug}
                          </h3>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                            {tenant.slug}
                          </p>
                          <p className="mt-3 text-sm text-[var(--muted)]">
                            {tenant.primaryDomain || "No primary domain"}
                          </p>
                        </div>

                        <span className="rounded-full bg-[rgba(15,118,110,0.12)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--teal)]">
                          {tenant.features.filter((feature) => feature.enabled).length} enabled
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {tenant.features.map((feature) => (
                          <span
                            key={feature.key}
                            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                              feature.enabled
                                ? "bg-[rgba(180,83,9,0.12)] text-[var(--accent)]"
                                : "bg-[rgba(90,102,117,0.10)] text-[var(--muted)]"
                            }`}
                          >
                            {feature.key}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-strong)] px-5 py-6 text-sm leading-6 text-[var(--muted)]">
                    No clients onboarded yet. Create the first one from the form.
                  </div>
                )
              ) : (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-6 text-sm leading-6 text-amber-900">
                  Tenant tables are missing in the database. Run the migration first, then
                  reload this page.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_70px_rgba(20,32,43,0.06)] backdrop-blur sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--teal)]">
              Delivery Rule
            </p>
            <h2 className="mt-3 text-2xl font-black text-[var(--ink)]">
              Keep dealer UI custom, keep backend standardized.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Shared business logic stays in `packages/core` and the root dealer runtime.
              Dealer-specific public styling, copy, and layout live in
              `packages/dealers/&lt;slug&gt;`.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
