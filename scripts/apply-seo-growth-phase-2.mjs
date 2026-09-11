import fs from "node:fs";

const pages = {
  "how-early-arrive-haneda-airport/index.html": {
    title: "How Early to Arrive at Haneda for an International Flight",
    description: "Flying internationally from Haneda? See the 3-hour planning target, terminal checks, luggage timing and a Tokyo leave-by example.",
    related: [["/places/haneda-airport/", "What to do after arriving early at Haneda"], ["/before-late-flight-tokyo/", "Plan a late-flight day in Tokyo"]],
  },
  "after-hotel-checkout-tokyo/index.html": {
    title: "What to Do After Hotel Checkout in Tokyo Before a Flight",
    description: "Compare hotel storage, station lockers and luggage pickup buffers, then choose a safe 3-, 5- or 7-hour Tokyo plan before Haneda or Narita.",
    related: [["/before-late-flight-tokyo/", "Use a late-flight day without rushing"], ["/how-early-arrive-haneda-airport/", "How early to arrive at Haneda"]],
  },
  "before-late-flight-tokyo/index.html": {
    title: "What to Do Before a Late Flight from Tokyo | Timed Plan",
    description: "Turn a late Tokyo departure into a safe final day with a luggage plan, airport-ready target, exact leave-by time and Haneda/Narita options.",
    related: [["/after-hotel-checkout-tokyo/", "Plan the hours after hotel checkout"], ["/how-early-arrive-haneda-airport/", "Set your Haneda airport-arrival target"]],
  },
  "guides/index.html": {
    title: "Japan Departure-Day Guides: Luggage, Timing & Last Stops",
    description: "Make a safer Japan departure-day plan: calculate luggage pickup, airport buffers and the last Tokyo stop that fits before your flight.",
  },
  "places/haneda-airport/index.html": {
    title: "What to Do at Haneda Airport Before Your Flight",
    description: "Arriving early at Haneda? Decide when to finish check-in, whether to stay landside or airside, and how to use terminal food, shops and views safely.",
    quick: "If you reach Haneda early, confirm the correct terminal and complete airline procedures first. Then choose one nearby meal, shop or observation area on the same side of security as your next step.",
    related: [["/how-early-arrive-haneda-airport/", "How early to arrive at Haneda for an international flight"], ["/before-late-flight-tokyo/", "What to do before a late flight from Tokyo"]],
  },
  "places/tsukiji-outer-market/index.html": {
    title: "Tsukiji Outer Market Before a Haneda Flight | Time Guide",
    description: "See when Tsukiji Outer Market fits before Haneda, including a 200-minute minimum window, morning timing, luggage risk and a firm leave-by plan.",
    quick: "Choose Tsukiji only for a morning or early-lunch stop with at least 200 minutes before your protected Haneda airport-ready time. Store large luggage and limit the visit to one or two food priorities.",
    related: [["/after-hotel-checkout-tokyo/", "Choose a luggage plan after hotel checkout"], ["/how-early-arrive-haneda-airport/", "Set your Haneda arrival target"]],
  },
  "places/tokyo-tower/index.html": {
    title: "Tokyo Tower Before a Haneda Flight | Time-Safe Visit",
    description: "Decide if Tokyo Tower fits before Haneda with a 250-minute minimum window, deck-queue risk, luggage guidance and a fixed turnaround time.",
    quick: "Tokyo Tower can fit before Haneda when you have at least 250 minutes before the protected airport-ready time. Pick either the exterior-and-Zojoji view or a deck visit, not both when queues are uncertain.",
    related: [["/before-late-flight-tokyo/", "Build a timed plan before a late Tokyo flight"], ["/how-early-arrive-haneda-airport/", "How early to arrive at Haneda"]],
  },
  "places/omotesando/index.html": {
    title: "Omotesando Before a Haneda Flight | Shopping & Timing",
    description: "Plan one focused Omotesando stop before Haneda, with a 290-minute minimum window, luggage advice, shopping cutoff and airport leave-by time.",
    quick: "Omotesando works best before Haneda when you already start near Harajuku or Shibuya and have at least 290 minutes before airport-ready time. Choose one store or one-direction avenue walk.",
    related: [["/after-hotel-checkout-tokyo/", "Avoid luggage backtracking after checkout"], ["/before-late-flight-tokyo/", "Plan your final Tokyo stop by leave-by time"]],
  },
  "places/shiodome/index.html": {
    title: "Shiodome Before a Haneda Flight | Short Walk Guide",
    description: "Use Shiodome for a short elevated-deck walk before Haneda, with luggage cautions, station-navigation risk and a clear route toward the airport.",
    quick: "Shiodome is a compact pre-Haneda walk when you are already near Shinbashi or Hamamatsucho. Stay on one pedestrian level, choose one landmark and keep the airport route simple.",
    related: [["/before-late-flight-tokyo/", "Plan a late-flight day from Tokyo"], ["/#planner", "Calculate a safe Haneda leave-by time"]],
  },
  "places/nihonbashi/index.html": {
    title: "Nihonbashi Before a Flight | Shopping & Leave-By Guide",
    description: "Fit Nihonbashi into a Tokyo departure day with a 180-minute minimum window, one-store strategy, luggage buffer and a direct Haneda route.",
    quick: "Nihonbashi can fit before Haneda with at least 180 minutes before airport-ready time. Choose the historic bridge plus one store or food-hall stop, then continue without crossing the district again.",
    related: [["/after-hotel-checkout-tokyo/", "Plan luggage and usable time after checkout"], ["/how-early-arrive-haneda-airport/", "Protect your Haneda arrival time"]],
  },
  "places/naritasan-shinshoji/index.html": {
    title: "Naritasan Shinshoji Before a Narita Flight | Time Guide",
    description: "Visit Naritasan Shinshoji before a Narita flight with a 225-minute minimum window, stored luggage, uphill return time and missed-train margin.",
    quick: "Naritasan Shinshoji is a strong final cultural stop when you have at least 225 minutes before Narita airport-ready time, luggage stored near the station and a confirmed return train.",
    related: [["/after-hotel-checkout-tokyo/", "Compare Haneda and Narita after checkout"], ["/#planner", "Calculate a Narita leave-by time"]],
  },
  "places/toyosu/index.html": {
    title: "Toyosu Before a Haneda Flight | Market & Timing Guide",
    description: "Check whether Toyosu fits before Haneda with a 275-minute minimum window, market calendar, local-transfer allowance and luggage guidance.",
    quick: "Toyosu fits best as an early-day stop before Haneda with at least 275 minutes before airport-ready time. Confirm the market calendar and choose either the market or waterfront, not a cross-district visit.",
    related: [["/before-late-flight-tokyo/", "Use a long final day without losing the flight buffer"], ["/how-early-arrive-haneda-airport/", "Set your Haneda airport-arrival target"]],
  },
  "places/shinagawa/index.html": {
    title: "Shinagawa Before Haneda | Low-Risk Last Stop Guide",
    description: "Use Shinagawa for a low-risk meal or pause before Haneda with a 150-minute minimum window, simple luggage handling and a direct airport corridor.",
    quick: "Shinagawa is a low-risk last stop before Haneda when you have at least 150 minutes before airport-ready time. Stay station-side, choose one meal or shop and avoid changing exits unnecessarily.",
    related: [["/how-early-arrive-haneda-airport/", "How early to arrive at Haneda"], ["/after-hotel-checkout-tokyo/", "Choose where to keep luggage after checkout"]],
  },
  "places/asakusa-sensoji/index.html": {
    title: "Asakusa Before Haneda or Narita | Time & Luggage Guide",
    description: "Plan Asakusa before Haneda or Narita with minimum time windows, temple and shop-hour differences, luggage advice and a firm station return time.",
    quick: "Asakusa can work before Haneda with at least 225 minutes, or before Narita with at least 250 minutes, before the protected airport-ready time. Keep the visit to Sensoji and one nearby street.",
    related: [["/after-hotel-checkout-tokyo/", "Plan luggage after hotel checkout"], ["/before-late-flight-tokyo/", "Set a hard end time for sightseeing"]],
  },
};

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function replaceOnce(html, pattern, replacement, label) {
  const next = html.replace(pattern, replacement);
  if (next === html) throw new Error(`Could not update ${label}`);
  return next;
}

for (const [file, config] of Object.entries(pages)) {
  let html = fs.readFileSync(file, "utf8");
  const title = config.title;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`, `${file} title`);
  html = replaceOnce(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(config.description)}">`, `${file} description`);
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(config.title)}">`, `${file} og:title`);
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(config.description)}">`, `${file} og:description`);
  html = html.replace('/assets/seo.css?v=20260908-1', '/assets/seo.css?v=20260911-1');

  if (config.quick) {
    html = replaceOnce(html, /<p class="byf-verdict-lead"><b>Best for:<\/b>[\s\S]*?<\/p>/, `<p class="byf-verdict-lead"><b>Quick answer:</b> ${config.quick}</p>`, `${file} quick answer`);
  }

  if (file === "places/haneda-airport/index.html") {
    html = html.replace("<dd>Use the planner for your exact route</dd>", "<dd>180 minutes before protected airport-ready time</dd>");
    html = html.replace("<dt>Haneda suitability</dt><dd>Not currently a verified planner route</dd>", "<dt>Haneda suitability</dt><dd>HND supported — lowest transfer risk after terminal confirmation</dd>");
  }
  if (file === "places/nihonbashi/index.html") html = html.replace("<dd>625 minutes before protected airport-ready time</dd>", "<dd>180 minutes before protected airport-ready time</dd>");
  if (file === "places/omotesando/index.html") {
    html = html.replace("<dd>Use the planner for your exact route</dd>", "<dd>290 minutes before protected airport-ready time</dd>");
    html = html.replace("<dt>Haneda suitability</dt><dd>Not currently a verified planner route</dd>", "<dt>Haneda suitability</dt><dd>HND supported from Harajuku-area starts</dd>");
  }
  if (file === "places/naritasan-shinshoji/index.html") {
    html = html.replace("<dd>Use the planner for your exact route</dd>", "<dd>225 minutes before protected airport-ready time</dd>");
    html = html.replace("<dt>Narita suitability</dt><dd>Not currently a verified planner route</dd>", "<dt>Narita suitability</dt><dd>NRT supported — confirm the return train before starting</dd>");
  }
  if (file === "places/asakusa-sensoji/index.html") {
    html = html.replace("<dd>455 minutes before protected airport-ready time</dd>", "<dd>225 minutes for HND; 250 minutes for NRT</dd>");
    html = html.replace("<dt>Narita suitability</dt><dd>Not currently a verified planner route</dd>", "<dt>Narita suitability</dt><dd>NRT supported — allow for the longer airport transfer</dd>");
  }

  if (config.related && !html.includes("byf-primary-links")) {
    const links = config.related.map(([href, label]) => `<li><a href="${href}">${label} →</a></li>`).join("");
    const block = `<aside class="byf-primary-links" aria-label="Related departure-day guidance"><p class="byf-kicker">NEXT DECISION</p><h2>Continue planning your departure day</h2><ul>${links}</ul></aside>`;
    if (file.startsWith("places/")) html = replaceOnce(html, `<section class="byf-plan-fit">`, `${block}<section class="byf-plan-fit">`, `${file} related links`);
    else html = replaceOnce(html, `<div class="byf-source">`, `${block}<div class="byf-source">`, `${file} related links`);
  }

  if (["how-early-arrive-haneda-airport/index.html", "after-hotel-checkout-tokyo/index.html", "before-late-flight-tokyo/index.html"].includes(file)) {
    html = html.replace(/Last checked: 2026-09-08/g, "Last checked: 2026-09-11");
  }
  fs.writeFileSync(file, html);
}

console.log(`Updated ${Object.keys(pages).length} Primary SEO Pages.`);
