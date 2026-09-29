# Database egress changes

Public inventory reads now use Next.js's persistent Data Cache with a five-minute revalidation interval. The cache is shared across visitors and locales; only presentation is localized. Admin data and appointment availability remain uncached so operational decisions use fresh data.

## Reads

- Inventory returns nine cars initially. Further batches load when the visitor scrolls toward the end, with a manual button and retry after a failure. Concurrent requests are guarded, and changing filters or locale isolates in-flight results.
- Available/sold ordering is preserved. Each page computes separate offsets and limits for the two groups instead of fetching all preceding pages. Counts are cached across pages. Sorting has a deterministic ID tie-breaker.
- Cards select display fields only. Imported JSON payloads and sync metadata are excluded. Inventory descriptions use PostgreSQL `LEFT(description, 240)` and a bounded image subquery, so neither full descriptions nor entire galleries cross the database connection for cards.
- Image previews use a parameterized PostgreSQL lateral query with a database-side limit: two URL rows per inventory car, one per home/admin/related car. This avoids applying per-parent image limits after transferring all images to the application.
- Home reads one batch of twelve cars. Related-car scoring reads lightweight candidates and fetches images only for the four displayed results. Car details and both sitemaps are cached; detail metadata and page rendering also share a request-level read.
- Filter choices use database grouping. Public reference translations are cached for a day.
- Admin car tables read only summary fields. Imports read only identifiers/status/timestamps for unchanged cars, and fetch image metadata only for changed listings. Writes that do not need the saved record return just its ID.
- Contacts use 25-row pages, with search/status filters applied in the database and global counts. Search submits explicitly, avoiding a DB request on every keystroke. Pages clamp after deletions, and links do not prefetch other private lists.
- Appointments initially load the displayed week and 25 pending requests. Calendar navigation, date pickers, and confirmation dialogs request only their displayed date windows; distant dates remain separate ranges. Global totals use aggregates. Range validation caps each window at 42 days and at most eight windows per request. Brussels daylight-saving boundaries are respected. Pending requests paginate independently, and availability data reloads after mutations. Stale responses are ignored; loading/error states prevent actions on unloaded dates.
- AutoScout-managed car edit pages load a summary and one preview. Website-managed edit forms select only editable fields and minimal image data.
- Imports keep IDs for reused image rows. Price-only changes perform no image writes; reordered/changed/removed photos produce targeted updates, inserts, or deletes inside the car update.
- Admin sync status polls in batches and pauses when the tab is hidden. Import status polls less frequently while idle; workshop refreshes pause when hidden. Manual refreshes coalesce after an in-flight poll instead of overlapping it. Workshop/appointment car thumbnails are bounded inside SQL.
- The long-running server reuses a single Prisma client and a pool of at most five connections, with a five-minute idle timeout to reduce connection/type-metadata churn.
- Hover images wait for hover intent. The detail gallery preloads adjacent images instead of warming eight full-size images at startup; thumbnails load lazily.

## Invalidation and hosting

Admin changes expire the inventory cache immediately and invalidate home, inventory, detail and sitemap routes. HTTP import/cleanup jobs do the same when inventory changes, including partially successful imports. Standalone CLI imports do not run in Next.js and fall back to timed revalidation; use the authenticated HTTP cron endpoints for immediate invalidation.

Next.js stores this cache in the app server's memory/filesystem. Keep a single Coolify app instance, or configure a shared Next.js cache handler and tag invalidation before scaling to multiple independent instances. A rebuild/restart can start with cold caches. Avoid proxy rules that cache admin pages, mutation requests, or authenticated responses.

## Analytics removal and rollout

Trackers, event writes, the event endpoint, dashboard, navigation, per-car view counts, translations, environment settings, and obsolete setup documentation have been removed. Historical migrations are retained. The removal migration permanently drops stored analytics events and the enum. Two index migrations add default inventory paging and contact/pending-appointment paging indexes.

Deploy the application and run `npm run db:migrate:deploy` as part of the same maintenance rollout. Stop old application instances before dropping the analytics table so they cannot continue writing to it. The new application works before the removal/index migrations are applied, allowing application-first rollout. No production migration was run during this optimization.

## Verification (28 September 2026)

- Production build, TypeScript and ESLint pass.
- 32 tests pass, including exhaustive comparisons of page ordering for 0–40 available/sold cars at several page sizes and a deep-page bound check.
- Browser check: nine initial cars, eighteen after scrolling, no further loading while idle; selecting Audi resets to nine, then loads the final three and shows the end state. Vehicle details, related cars, and the gallery/lightbox render without browser errors.
- A read-only sample of nine existing cars: full car JSON was 118,678 bytes, all 162 image rows were 80,731 bytes, while selected card data plus 18 image URLs was 12,415 bytes (about 94% less combined JSON). This compares serialized query data, not billed wire bytes or a forecast of monthly savings.
- Three repeated warm inventory requests took 15–18 ms locally and added zero calls to the card-image database query, verified through database query counters.

After deployment, compare daily Shared Pooler Egress over similar traffic periods. PostgreSQL's buffer-cache hit rate does not mean query results avoid the database connection. Check that the large Car/Image reads and AnalyticsEvent inserts fall away; actual monthly savings depend on visitors, imports, restarts and cache reuse.

## Follow-up verification (29 September 2026)

- `npm test`: 46 tests pass, covering image reconciliation, bounded pagination/search inputs, calendar windows and daylight-saving transitions, and non-overlapping/visibility-aware polling. The standard test command now includes these regressions.
- Final production build, TypeScript, ESLint and diff whitespace checks pass.
- Browser checks against the production preview: contact tabs, database search and out-of-range page clamping; calendar month navigation, create-modal date navigation, loading guards and retry after an intentionally failed read; imported-car summary; nine initial public inventory cards. No browser JavaScript errors. These checks did not submit appointments, change contacts, or run imports.
- Read-only database checks confirmed nine card previews, at most 240 description characters and two images per card, bounded contact pages, and calendar results confined to their requested date range.
- Changes remain local. No production migrations, deployment or import was performed. The new admin paging index migration can be applied in the documented rollout; the application does not require these indexes to exist before startup.

References: [Next.js Data Cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache), [tag invalidation](https://nextjs.org/docs/app/api-reference/functions/revalidateTag), [Prisma relation loading strategies](https://www.prisma.io/blog/prisma-orm-now-lets-you-choose-the-best-join-strategy-preview).
