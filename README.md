# Before You Fly Japan

English departure-day guides and an in-browser planner for Haneda, Narita and KIX. Hosted by the existing Cloudflare Worker `beforeyouflyjapan-static`, deployed automatically from GitHub main. `worker.mjs` handles the protected contact endpoint; its existing secrets and bindings are unchanged.

## Current authoring workflow (17 November 2026)

117 HTML pages: 40 destination guides, 13 departure/timing/luggage articles, 56 noindex plan examples, homepage, guide directory and six support pages. The sitemap has 58 editorial/search URLs. Application plan pages stay available to users without being search landing pages.

Author and verify facts in:

- `content/editorial-tokyo.json`, `content/editorial-regions.json`: 40 reviewed destination articles.
- `content/storage-context.json`: specific facilities, prices, gate access and collection terms, with separate source dates.
- `scripts/build-guide-usefulness.py`: 13 question-led guides and auditable worked scenarios.
- `assets/planner-data.js`, `assets/planner-core.js`: authored routes, opening rules, start connections and luggage/airport allowances.
- `assets/plan-context.js`: shared static/dynamic plan presentation.
- `scripts/apply-editorial-policy.py`: support-page text, ad allowlist, publisher verification and sanitized GA page addresses.

Install isolated authoring/test dependencies, then regenerate and test:

```sh
npm install --prefix /tmp/byf-test-deps --no-save --ignore-scripts jsdom
python3 -m pip install --target /tmp/byf-author-deps beautifulsoup4
PYTHONPATH=/tmp/byf-author-deps BYF_TEST_DEPS=/tmp/byf-test-deps node scripts/rebuild-editorial.cjs
BYF_TEST_DEPS=/tmp/byf-test-deps node --test tests/*.test.*
python3 scripts/apply-editorial-policy.py --check
```

The final pipeline rebuilds plan examples, unified places, departure guides, homepage/directory and policy roles in order. Older SEO/recovery scripts are historical import tools; do not use them as the final authoring step. If one is needed, run the final pipeline afterward so old boilerplate and ad placement are not restored.

## What the calculations establish

The route engine uses editorial allowances, not live train departures or observed queues. City routes accept their named start or an explicitly authored connector; a nearby area is not a free connection. Airport-only routes use the selected starting/pickup area's allowance. A fixed 180-minute international-flight planning target is protected; an earlier airline instruction requires a separate earlier journey. Calendar-restricted visits are withheld outside reviewed dates.

All 56 public plan examples are clearly dated 10 October 2026 and show their starting area and no-luggage conditions. Their totals, timed stages and complete end are generated from the same functions used for personalization. The historical exhibition example does not claim current gallery availability. Local suggested visits in destination guides are distinguished from longer complete planner itineraries, whose actual stages are displayed.

## Ads, measurement and evidence

AdSense is loaded only on the 53 editorial articles/destination guides. Homepage, directory, 56 plan pages and support pages retain publisher ownership metadata but do not load ads. `ads.txt` lists the existing publisher. GA page_location/page_referrer omit query strings and fragments; custom event fields omit flight/free-time timestamps. This does not remove plan URLs from hosting requests, shared links or browser history. Provider-side consent/CMP and account settings are not managed by the static authoring scripts.

`audit/` records official-source research, independent review, scenario sums and release verification. These checks include simulated traveller cases and DOM/browser rendering; they are not on-site measurements or real-user interviews. Test counts and article length do not establish AdSense approval.

## Preserved infrastructure

Existing URLs/canonicals, redirects, Google search verification, licensed real photographs, GA tag, hotel POP downloads and contact API remain. Contact uses existing Resend/Turnstile secrets; never commit their values. Scripts, tests, content source data and audit files are excluded from static asset deployment by `.assetsignore`.
