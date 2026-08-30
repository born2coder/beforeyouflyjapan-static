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

The site is deployed as a Cloudflare Worker with Static Assets. The Worker serves the repository's public HTML and handles the protected contact endpoint at `/api/contact`.

## Contact form configuration

The contact page intentionally remains unavailable until all production bindings are configured. No receiving address is stored in HTML or committed source.

1. Onboard `beforeyouflyjapan.com` in Cloudflare Email Service and verify the private destination address.
2. Create a managed Turnstile widget for `beforeyouflyjapan.com` and `www.beforeyouflyjapan.com`.
3. In the Worker settings, add `TURNSTILE_SITE_KEY` as a variable.
4. Add `TURNSTILE_SECRET_KEY`, `CONTACT_TO`, and `CONTACT_FROM` as encrypted secrets.
5. Keep the `CONTACT_EMAIL` send-email binding and `CONTACT_RATE_LIMITER` Durable Object binding defined in `wrangler.jsonc`.
6. Deploy with `npx wrangler deploy`, then test one real submission and its reply-to behavior.

`CONTACT_FROM` must use the onboarded sending domain. `CONTACT_TO` must be a verified Cloudflare Email Service destination. The form sends no automatic reply to visitors.

## Important files

- `index.html` — homepage and planner
- `assets/planner-data.js` — public planner dataset
- `assets/plan-context.js` — detail-page time personalization
- `sitemap.xml` — canonical static sitemap
- `_redirects` — legacy URL redirects
- `_headers` — static security headers
- `contact/index.html` and `assets/contact.js` — English contact form
- `src/worker.js` — Turnstile verification, validation, rate limiting, and email delivery
- `src/contact-core.mjs` — testable input and email-body rules

## Recovery note

The original WordPress installation and database should be retained as an offline backup until the static deployment and DNS cutover have been fully verified.
