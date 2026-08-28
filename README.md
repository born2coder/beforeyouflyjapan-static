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

The site is designed for Cloudflare Pages with no build step. Publish the repository root as the output directory.

## Important files

- `index.html` — homepage and planner
- `assets/planner-data.js` — public planner dataset
- `assets/plan-context.js` — detail-page time personalization
- `sitemap.xml` — canonical static sitemap
- `_redirects` — legacy URL redirects
- `_headers` — static security headers

## Recovery note

The original WordPress installation and database should be retained as an offline backup until the static deployment and DNS cutover have been fully verified.
