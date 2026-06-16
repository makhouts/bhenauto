# Dealers

Each folder in `packages/dealers/<slug>` should contain only dealer-specific code.

Expected split:
- `packages/core`: shared data/auth/tenant/runtime logic
- `packages/admin`: shared admin UI/logic
- `packages/dealers/<slug>`: branding, public UI, copy, assets, feature defaults

New dealer process:
1. Start `npm run platform:dev`
2. Open monorepo app at `/Users/cap/Documents/react/bhenauto/apps/platform-admin`
3. Log in with `ADMIN_PASSWORD`
4. Open `http://localhost:3001`
5. Create the client from the onboarding UI
6. Fill dealer package config/assets/UI in `packages/dealers/<slug>`
7. Point domain to app and restart the dealer runtime

CLI fallback:
- `npm run create:dealer -- --slug acme-auto --name "Acme Auto"`
