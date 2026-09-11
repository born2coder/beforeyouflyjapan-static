const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "assets/planner-data.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "assets/planner-core.js"), "utf8"), context);

const core = context.window.BYFPlannerCore;
const data = core.enhanceData(context.window.BYF_STATIC_DATA);
const defaultFlightAt = "2026-09-15T21:00:00+09:00";

const cases = [
  ["HND-01", "HND", "Shinjuku", 180, "none", "", "Culture", "2026-09-15T14:00:00+09:00"],
  ["HND-02", "HND", "Shinjuku", 300, "return_elsewhere", "Shinjuku", "Food", "2026-09-15T23:00:00+09:00"],
  ["HND-03", "HND", "Ginza", 180, "none", "", "Shopping"],
  ["HND-04", "HND", "Ginza", 300, "return_elsewhere", "Ginza", "Food"],
  ["HND-05", "HND", "Asakusa", 300, "store_near_stop", "", "Classic Tokyo"],
  ["HND-06", "HND", "Tokyo Station", 180, "none", "", "Shopping"],
  ["HND-07", "HND", "Tokyo Station", 300, "return_elsewhere", "Tokyo Station", "Food"],
  ["HND-08", "HND", "Shinagawa", 180, "store_near_stop", "", "Relax"],
  ["NRT-01", "NRT", "Ueno", 180, "none", "", "Food", "2026-09-15T14:00:00+09:00"],
  ["NRT-02", "NRT", "Ueno", 300, "store_near_stop", "", "Shopping"],
  ["NRT-03", "NRT", "Asakusa", 300, "return_elsewhere", "Asakusa", "Culture"],
  ["NRT-04", "NRT", "Tokyo Station", 300, "none", "", "Classic Tokyo"],
  ["NRT-05", "NRT", "Narita", 300, "store_near_stop", "", "Culture"],
  ["NRT-06", "NRT", "Narita Airport", 180, "none", "", "Food"],
  ["KIX-01", "KIX", "Namba", 180, "none", "", "Food", "2026-09-15T14:00:00+09:00"],
  ["KIX-02", "KIX", "Namba", 300, "store_near_stop", "", "Shopping"],
  ["KIX-03", "KIX", "Umeda", 300, "return_elsewhere", "Umeda", "Relax"],
  ["KIX-04", "KIX", "Rinku Town", 180, "none", "", "Shopping"],
  ["KIX-05", "KIX", "Kansai Airport", 180, "none", "", "Food"],
  ["KIX-06", "KIX", "Namba", 300, "return_elsewhere", "Umeda", "Food"],
];

function format(date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo", hour: "numeric", minute: "2-digit",
  }).format(date);
}

function rank([id, airport, start, available, luggage, luggageArea, interest, flightAt = defaultFlightAt]) {
  const flight = new Date(flightAt);
  const recommended = new Date(flight.getTime() - data.airports[airport].buffer * 60000);
  const free = new Date(recommended.getTime() - available * 60000);
  const results = data.plans.map((plan) => {
    if (plan.airport !== airport || !core.areaMatches(plan, start)) return null;
    const fit = core.withLuggageStep(plan, luggage, luggageArea, start);
    if (!fit.compatible) return null;
    const total = core.totalMinutes(fit.steps);
    const window = core.planWindow(free, recommended, total, plan);
    if (total > available || !window.valid) return null;
    return {
      plan, fit, total, window,
      score: core.scorePlan(plan, {
        startArea: start, interest, luggageMode: core.normalizeLuggageMode(luggage),
        luggageArea, total, available,
      }),
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score || Math.abs(available - a.total) - Math.abs(available - b.total));

  const top = results[0];
  if (!top) return { id, input: { airport, start, availableMinutes: available, luggage, luggageArea, interest, flightAt }, result: "SAFE_FALLBACK" };
  const timing = core.timingFacts(top.fit.steps, top.window.latest, top.plan.airportPlan);
  return {
    id,
    input: { airport, start, availableMinutes: available, luggage, luggageArea, interest, flightAt },
    result: "PLAN",
    recommendedPlan: top.plan.name,
    shownPlaces: top.plan.area ? [top.plan.area] : [],
    leaveBy: format(timing.leaveAt || top.window.latest),
    airportArrival: format(timing.airportArrivalAt || recommended),
    link: top.plan.url,
    displayedMinutes: top.total,
    cta: "View this plan",
  };
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceCommit: process.env.BYF_SOURCE_COMMIT || null,
  defaultFlight: new Date(defaultFlightAt).toISOString(),
  cases: cases.map(rank),
};

const target = process.argv[2];
if (target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
}
console.log(JSON.stringify(output, null, 2));
