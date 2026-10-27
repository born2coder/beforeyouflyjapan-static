# Search and departure-day experience release — 27 October 2026

## Delivered scope

- 40 place guides: distinct search titles/H1s/descriptions, a named compact visit, access and baggage decisions, map links, one attributed photograph each, and page anchors.
- 44 airport/start combinations link into the planner with a destination preference. The preference changes ranking only among feasible candidates. Users still supply flight dates, free time and luggage.
- All 40 places appear in a static airport directory. The main Tokyo guides link to airport, Osaka and luggage questions. All 56 sitemap targets are reachable from the homepage through HTML links.
- 53 editorial URLs have updated sitemap modification dates. Self-canonicals, the 56-URL sitemap and the 56 intentionally excluded plan pages are retained.
- Existing Google-tag custom events now use the supported event command. Additional events record guide-to-planner/map transitions without sending flight/free-time values as custom event parameters.
- Source and audit directories are excluded from the static asset upload.

## Source and image limits

- Local storage prices are stated only where an operator or official tourism listing supports them. Old listing dates are shown where relevant. Other pages identify the location/operator and explicitly leave unverified fees unspecified.
- Metro prices are for the specific Metro station and listed compartments, not a blanket price for nearby JR stations. Shinagawa usage prices and the separate reservation fee are distinguished.
- Wikimedia files retain author, source and license attribution. Captions state that images are not live views. General area views are identified; the Kamigata museum page uses a clearly labeled photograph of neighboring Hozenji, not a claimed museum-interior photograph.
- Some operator sources return 403/503 or no readable content to the source collector. Those pages are not marked as freshly verified. Existing facility/calendar review dates remain separate from the new access/content review.

## Validation before publication

- Full test suite: 22 tests passed, 0 failed.
- Existing ten-plan time audit: 499 assertions, including 1-minute boundaries, luggage variants, hours, holidays, extra family/rest time and JST.
- Existing 20 simulated traveller situations and 70 additional planner scenarios passed. These are simulations, not interviews or measured user satisfaction.
- New DOM tests: all 40 guides, 44 planner-entry routes, all 56 HTML-reachable search targets, requested-visit priority, closed/unverified gallery dates, urgent fallback and custom-event command dispatch.
- Unique anchors, one photograph and one shared analytics loader on every place page.
- Browser preview: Shinagawa guide → prefilled planner → 30 October 21:00 Haneda flight, 12:00 free time, no luggage → 16:10 plan start, 17:15 airport departure, 18:00 airport-ready target.
- Browser mobile frames: 375/390/412-pixel outer widths, matching document/viewport widths without horizontal overflow on old and new guide templates. Image and attribution display inspected.

Search-engine registration and ranking are external outcomes. Deployment checks and indexing-request results are recorded separately after publication. Dispatch tests do not prove Analytics-property receipt.
