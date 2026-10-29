# Before You Fly Japan — Static Recovery

This repository is the recovered static version of `beforeyouflyjapan.com`.

## What is preserved

- The public design and editorial pages
- 56 flight-day plans and 40 place guides
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
- `content/place-practical.json` — authored visit, access, storage and photo choices
- `scripts/build-search-experience.mjs` — rebuild the site-wide search and planner-entry improvements

## Search and planner-entry release (27 October 2026)

All 40 destination guides now have a compact visit, access and baggage guidance, a map link, an attributed real photograph, and links that set an airport and starting area. The airport directory exposes all 40 guides in static HTML. The 56 personalized plan pages remain `noindex,follow` and outside the 56-URL search sitemap.

Run `node scripts/build-search-experience.mjs` after editing the practical content. Review official sources before changing prices or opening calendars. `scripts/collect-practical-sources.py` is an optional editorial collection helper and requires BeautifulSoup and Pillow; its review output deliberately retains metadata, not copies of entire source pages. Some operator sites cannot be fetched from this environment; the public page distinguishes those from freshly reviewed sources.

The timing engine is unchanged. A requested destination receives priority only after airport, start, luggage, opening dates and available-time checks pass. Unknown flight and free-time dates are never invented.

For the complete test suite with Node 24+, install the DOM test dependency outside the checkout and run:

```sh
npm install --prefix /tmp/byf-test-deps --no-save --ignore-scripts jsdom
BYF_TEST_DEPS=/tmp/byf-test-deps node --test tests/*.test.*
```

Custom analytics events use the existing Google tag through `gtag('event', ...)`. Unit tests verify dispatch, parameter limits and omission of flight/free-time timestamps from custom events. This does not by itself establish receipt in a Google Analytics property.

## Recovery note

The original WordPress installation and database should be retained as an offline backup until the static deployment and DNS cutover have been fully verified.

## Search-question guides (30 October 2026)

12 editorial pages across 10 initiatives: 2 new Haneda guides and 10 refreshed pages. 117 HTML pages; 58 sitemap URLs. Authored content and source links live in `scripts/build-query-guides.py`; run `python3 scripts/build-query-guides.py` after editing. The existing search-experience builder also reapplies this layer. Editorial examples explicitly separate local visits, complete journeys and airport-ready targets. No live timetable or universal airline deadline is claimed.
