# Before You Fly Japan — Static Recovery

This repository is the recovered static version of `beforeyouflyjapan.com`.

## What is preserved

- The public design and editorial pages
- 46 flight-day plans and 30 place guides
- The original planner ranking and safety calculations
- Plan detail personalization through URL parameters
- Hotel POP downloads (PNG, A4 PDF, and A5 PDF)
- Google Analytics event calls already present in the rescued frontend
- SEO-friendly URLs, sitemap, redirects, and security headers

## Hosting

The site runs on Cloudflare Workers Static Assets. Static pages are served directly, while `worker.mjs` handles the protected contact API.

The contact form requires these Worker variables and secrets:

- `RESEND_API_KEY` (secret)
- `CONTACT_TO_EMAIL` (secret)
- `TURNSTILE_SECRET_KEY` (secret)
- `TURNSTILE_SITE_KEY` (plain variable)

## Important files

- `index.html` — homepage and planner
- `assets/planner-data.js` — public planner dataset
- `assets/plan-context.js` — detail-page time personalization
- `sitemap.xml` — canonical static sitemap
- `_redirects` — legacy URL redirects
- `_headers` — static security headers

## Recovery note

The original WordPress installation and database should be retained as an offline backup until the static deployment and DNS cutover have been fully verified.
