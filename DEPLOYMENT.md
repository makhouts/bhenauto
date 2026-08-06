# BHEN Auto production checklist

## Before deployment

- Use Node.js 22.12 or newer.
- Configure every required value from `.env.example` in the deployment platform.
- Set `NEXT_PUBLIC_SITE_URL=https://bhenauto.com` and configure a permanent `www.bhenauto.com` redirect at the proxy or DNS layer.
- Generate unique production secrets; never reuse the example values.
- Run `npm ci`, `npm run db:migrate:deploy`, `npm run build`, and `npm run test:autoscout24`.
- Confirm the database has automated backups and a tested restore procedure.

## Integration checks

- Submit the contact form and confirm both delivery and failure handling.
- Complete a workshop appointment with Turnstile enabled.
- Upload, reorder, and delete a vehicle image in Cloudflare R2.
- Confirm AutoScout24 import and outbound synchronization with a non-critical listing.
- Call each cron endpoint with the production bearer token and confirm unauthorized requests return `401` or `503`.
- Verify admin and workshop routes remain inaccessible without valid credentials.

## SEO and launch checks

- Confirm the branded automotive social image renders correctly in the sharing debuggers used by Facebook, LinkedIn, and X.
- Validate a homepage and vehicle URL with Google Rich Results Test and Schema.org Validator.
- Run PageSpeed Insights on mobile and desktop after CDN caches are warm.
- Submit `https://bhenauto.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Check canonical, hreflang, Open Graph, and Twitter metadata on all three locales.
- Confirm filtered inventory URLs emit `noindex, follow` and canonicalize to the main inventory page.
- Monitor Search Console indexing, Core Web Vitals, crawl errors, and structured-data warnings after launch.
