# Apps

Monorepo app split:
- `apps/dealer-runtime`: shared live website + dealer admin runtime
- `apps/platform-admin`: internal agency app for onboarding and tenant ops

Client-specific branding/UI does not live here.
Use `packages/dealers/<slug>` for tenant-specific code.
