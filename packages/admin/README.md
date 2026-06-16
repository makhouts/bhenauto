# Admin Package

Move shared admin-only code here over time:
- admin navigation
- admin page shells
- reusable admin widgets
- admin-only feature modules

Notes:
- dealer-facing admin still runs inside `apps/dealer-runtime`
- client onboarding UI now lives in `apps/platform-admin`
- dealer packages should not duplicate this layer
