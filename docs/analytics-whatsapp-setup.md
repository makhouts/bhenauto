# Analytics Setup

This app now includes:

- first-party website analytics stored in Postgres
- per-car inventory click tracking
- per-car detail page view tracking
- admin analytics dashboard at `/admin/analytics`

## 1. Database migration

Run migration before starting new app version:

```bash
npm run db:migrate:deploy
```

Then regenerate Prisma client if needed locally:

```bash
npm run db:generate
```

Coolify note:

- add migration command to deploy flow before `npm run build` or before container start
- recommended order:

```bash
npm ci
npm run db:migrate:deploy
npm run build
```

## 2. Required env vars

Existing app env still required. New optional vars:

```env
# Optional. If omitted, analytics hashing falls back to ADMIN_SESSION_SECRET.
ANALYTICS_HASH_SALT=replace-with-long-random-string

```

## 3. What gets tracked

Tracked events:

- `page_view`
- `car_detail_view`
- `car_card_click`
- `appointment_submitted`
- `contact_submitted`

Stored data is privacy-reduced:

- hashed daily visitor identifier
- page path
- locale
- referrer host
- optional related car id

Not stored:

- raw IP address
- ad-tech identifiers
- marketing cookies

## 4. Admin analytics

Open:

```text
/admin/analytics
```

Shows:

- visitors today / 7d / 30d
- page views today / 7d / 30d
- car detail views
- leads from appointments + contact forms
- top viewed cars
- inventory clicks
- top pages
- top referrers

## 5. Coolify / Hetzner notes

This repo already uses in-memory rate limiting for contact + appointment forms.

That is fine when:

- one app instance
- one container / one VM

If later you scale horizontally:

- move rate limiting to Redis or DB-backed store
- expect analytics to remain correct because events persist in Postgres

Recommended deploy notes:

- keep app behind HTTPS
- keep `DATABASE_URL` stable during deploy
- run migration before new container serves traffic
- keep outbound HTTPS access open to `api.twilio.com`

## 6. Smoke test checklist

### Analytics

1. Open public home page.
2. Open few inventory cards.
3. Open `/admin/analytics`.
4. Confirm visitor/page numbers move.
5. Confirm clicked car appears in top cars after opening detail page.

## 7. Useful commands

```bash
npm run lint
npm run build
npm run db:migrate:deploy
```
