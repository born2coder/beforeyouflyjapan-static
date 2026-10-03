# Departure UX and whole-site SEO release — 2026-10-03

## Scope

- Stage-aware visiting windows: Meiji monthly grounds hours; conservative daytime Kappabashi, Tsukiji and retail windows. Store holidays, market closures and exact venue hours still need live checking.
- Explicit direct-airport fallback when the planning cutoff has passed; luggage-return and direct-route deadline guidance.
- Preference mismatch labels; shorter routes with a 20-minute rest/navigation allowance for low walking or strollers. These routes are not certified step-free itineraries.
- Session condition restoration, change-condition links, copyable personalized links and print styles.
- All 30 Place pages: consistent model duration, calculated example, short visit, return route, luggage/rest guidance, alternative and connected links.
- Eight new guides: three airport hubs; Narita and KIX arrival targets; Osaka checkout and late flights; luggage storage.
- Unique metadata, canonical URLs, crawlable clusters and breadcrumb markup; 46 sitemap URLs; Plans remain noindex,follow.

## Verification

- Existing planner test: 20 traveler patterns pass.
- Existing hardening: 70 conditions, 65 plan results and 5 safe fallbacks pass.
- New regression: the original 20 UX situations, stage constraints for all 12 months, rest insertion and urgent fallback pass.
- 17 SEO/contact tests pass: 95 HTML index pages, 30 Places, 46 Plans, 117 one-hop redirects, metadata uniqueness, internal links and contact security behavior.
- Cloud browser on the pre-production version: 20 form scenarios and all 18 resulting personalized top-plan detail pages verified. Two safe fallback cases; the late Kappabashi case changes to a fitting route. Four top choices need a visible preference-mismatch explanation rather than an assertion of user satisfaction.
- Embedded responsive previews at 375, 390 and 412 pixels: home, Haneda hub and Kappabashi have no horizontal overflow. The browser reserves 15 pixels for its scrollbar. This is responsive desktop-browser verification, not physical-phone testing.
- Live production: form → short-walking Shinagawa result → personalized timeline with rest allowance and route action → copied plan link verified. Guides list reflects the new pages.
- Search tool fetched the production sitemap and confirmed 46 URLs. Re-submission to Search Console was rejected because the connection has webmasters.readonly scope; the published sitemap remains available through robots.txt and its existing URL.

## Interpretation

These are simulated persona and functional tests, not research with 20 real participants. They establish that the scenarios execute and the revised guidance appears, not a measured satisfaction score. Search visibility improvements cannot be measured on deployment day; Google must recrawl and evaluate the pages.

## Sources for new timing policies

- https://www.meijijingu.or.jp/en/visit/ — monthly grounds opening and closing table, read October 3.
- https://www.kappabashi.or.jp/en/qa/ — individual shop holidays and limited Sunday opening, read October 3.
- https://www.kappabashi.or.jp/news/1637/ — operating-hours notice; the planner uses a conservative 5 PM retail cutoff.
- https://www.narita-airport.jp/en/airportguide/inter-dep/ — airline-dependent check-in arrival timing, read October 3.

Existing source-review dates are retained unless the relevant source was checked. No ranking, indexing, locker availability or accessibility guarantee is asserted.
