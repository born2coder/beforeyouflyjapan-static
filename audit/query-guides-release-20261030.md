# Search-question guide release — 30 October 2026 (JST)

## Scope
Ten approved initiatives implemented as 12 editorial pages: 2 new Haneda guides and 10 refreshed pages. Topics: HND arrival; T3 departures; overnight access; Tsukiji; Tokyo Tower; Asakusa/Sensoji; Shiodome; Naritasan + Narita Omotesando; Nihonbashi; NRT + KIX arrival. Existing photographs and licensed credits retained. No synthetic location imagery added.

## Editorial decisions
- Begin with the actual search question before flight planning.
- Distinguish official hours/fees from editorial visit and journey allowances.
- HND T3 overnight eligibility, T2 international hours, and landside/airside access are explicit.
- NRT official at-least-two-hour guidance is separate from the site's conservative three-hour model.
- NRT T3 13-minute station walk excludes counter procedures; KIX T2 7–9 minutes is the shuttle ride only.
- All worked 21:00 departures subtract 180 + 90 + 20 minutes to reach 16:10 sightseeing end, with an explicit extra detour if bags are elsewhere.
- The 31 October 00:30 example correctly produces 30 October 21:30 airport-ready and 19:40 sightseeing end.
- Airport CTA parameters fixed: HND/NRT/KIX, not an empty airport.
- Homepage and guide directory link to all 12 pages. Both new URLs are in the sitemap (58 URLs total). 56 plan URLs remain noindex.
- Removed stale T3 PDF link after direct 404. Use current official interactive map. Narita translated tourism page showed a translation-system error; use JNTO's working English page instead.

## Verification
- Full pre-release suite: 23 tests passed, 0 failed.
- Existing plan checks: 499 assertions for 10 added routes; 20 simulated UX personas; 70 further scenarios; 40 destination guides and 44 context-prefilled routes; 56 base and 118 personalized duration labels.
- New checks: 12 article schemas/anchor sets, 5 airport CTA values, midnight planner submissions for HND/NRT/KIX.
- Real browser: T3 and overnight desktop layout, overnight-guide CTA -> HND selected with user dates blank.
- Responsive browser rendering: all 12 pages in 375px frames (360px content with scrollbar); document scrollWidth equals clientWidth, and every comparison table fits its container.
- These are technical checks and simulated traveller scenarios, not interviews with actual travellers or measured satisfaction.
- Source checks: 35 currently linked official URLs; 32 direct HTTP 200, 3 KIX automated-fetch 403. KIX content was separately retrieved through web search; no claim of a user-facing broken link.

Source manifest: query-guides-manifest.json. Source HTTP evidence: query-source-link-check.json.
No ranking or traffic improvement is claimed at publication time.
