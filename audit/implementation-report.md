# Before You Fly Japan — restructuring report

Date: 2026-09-08

Baseline commit: `46168f9`

Scope: all 87 public HTML endpoints in the recovered static site

## Outcome

The site is now split into a compact indexable SEO layer and a complete, non-indexable Planner application layer. All 46 itinerary results remain accessible and retain their detailed timelines, but are excluded from the sitemap and marked `noindex,follow`. The 30 destination guides remain indexable and now carry explicit decision-support verdicts.

## Original URL classification (87 URLs)

| Action | Count | Treatment |
|---|---:|---|
| KEEP | 32 | 24 already-clean Places plus 8 indexable core/guide/trust pages |
| MERGE | 0 | No true same-intent article cluster was found; the plan pages are distinct itineraries |
| REDIRECT | 29 | Current numbered `-5` URLs moved to clean canonical slugs |
| NOINDEX | 3 | Contact, privacy policy, disclaimer |
| APP-STATE | 23 | Already-clean plan endpoints retained as Planner results |
| **Total** | **87** | |

After the numbered sources redirect, the application layer contains 46 clean plan endpoints. The SEO layer contains 38 sitemap URLs: the homepage, seven indexable core/guide pages, and 30 Places.

## Redirects and canonicalization

- `_redirects` contains 117 permanent, single-hop rules.
- 116 numbered variants (`-2` through `-5`) resolve directly to 29 clean plan/place URLs.
- `/wp-sitemap.xml` resolves directly to `/sitemap.xml`.
- Every retained HTML endpoint has a unique title, unique description, one H1, and a self-referencing canonical.
- Internal links point directly to final URLs and do not consume a redirect hop.

The complete machine-readable redirect list is stored in `/_redirects`.

## Planner regression

- 20 fixed traveler cases compared before and after restructuring.
- Ranking, eligibility, timing, risk result, and fallback behavior changes: **0**.
- Canonical result-link changes: **7**, all limited to removing `-5` from the destination URL.
- Full data audit: 70 additional personas, producing 65 plan selections and 5 safe fallbacks.
- Result links now jump to `#your-timeline`, and plan pages add a personalized situation banner when query parameters are present.

Raw evidence is in `before-planner-snapshot.json`, `after-planner-snapshot.json`, and `planner-comparison.json`.

## Content and trust improvements

- All 30 Places now show minimum useful time, airport suitability, time/luggage/walking/transfer risk, best-fit audience, avoidance conditions, and a Planner CTA.
- Rebuilt the late-flight, Haneda-arrival, and post-checkout guides around a quick answer, decision criteria, usable-time calculation, example timeline, failure modes, safer alternatives, official sources, and a review date.
- Expanded How We Check with source hierarchy, buffer components, risk-label definitions, live-information precedence, and a correction policy.
- Removed WordPress/Twenty Twenty metadata, scripts, styles, oEmbed/RSS links, and static `wp-content`/`wp-includes` dependencies.
- Legacy WordPress endpoints return HTTP 410 with `X-Robots-Tag: noindex, nofollow`.

## Verification

- Automated tests: 15 passed, 0 failed.
- Internal links: all local targets resolve; no internal redirect hops.
- Redirect graph: no chains; all targets exist.
- Metadata: no duplicates; exactly one H1 per page.
- Planner: 20 before/after cases unchanged, plus 70-persona hardening suite passed.

## Recovery and residual items

- The exact pre-change static site is recoverable from Git commit `46168f9`.
- This repository is a static recovery and does not contain the original WordPress database. Any separately archived WordPress database should remain offline until production verification and search recrawling are complete.
- AdSense resubmission is intentionally not performed by this change. Search Console should be used to request recrawling only after production deployment is verified; resubmission should wait until duplicate/legacy URLs have visibly settled.
