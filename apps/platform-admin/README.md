# Platform Admin

Separate internal app for onboarding and tenant operations.

Run:
- `npm run platform:dev`
- or `npm --prefix apps/platform-admin run dev`

Open:
- `http://localhost:3001`
- log in with `ADMIN_PASSWORD`

What this app does:
- creates `Tenant` + `TenantFeature` records
- scaffolds `packages/dealers/<slug>`
- writes `client.blueprint.json` for handoff

After onboarding a client:
1. Open the generated dealer package in `packages/dealers/<slug>`
2. Build the client-specific public UI
3. Restart the main dealer runtime
4. Point the new domain to the live app
