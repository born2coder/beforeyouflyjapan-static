const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("assets/planner-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("assets/planner-core.js", "utf8"), context);

const core = context.window.BYFPlannerCore;
const data = core.enhanceData(context.window.BYF_STATIC_DATA);

function rankedCandidates(persona) {
  const flight = new Date(persona.flight);
  const recommended = new Date(flight.getTime() - data.airports[persona.airport].buffer * 60000);
  const free = new Date(recommended.getTime() - persona.available * 60000);
  const mode = core.normalizeLuggageMode(persona.luggage);
  return data.plans.map((plan) => {
    if (plan.airport !== persona.airport || !core.areaMatches(plan, persona.start)) return null;
    const fit = core.withLuggageStep(plan, persona.luggage, persona.luggageArea, persona.start);
    if (!fit.compatible) return null;
    const total = core.totalMinutes(fit.steps);
    const window = core.planWindow(free, recommended, total, plan);
    if (total > persona.available || !window.valid) return null;
    const score = core.scorePlan(plan, {
      startArea: persona.start,
      interest: persona.interest,
      luggageMode: mode,
      luggageArea: persona.luggageArea,
      total,
      available: persona.available,
    });
    return { plan, fit, total, window, score, recommended };
  }).filter(Boolean).sort((a, b) => b.score - a.score || Math.abs(persona.available - a.total) - Math.abs(persona.available - b.total));
}

for (const plan of data.plans) {
  assert.ok(plan.name && plan.hook.length >= 30, `weak name or hook: ${plan.id}`);
  assert.doesNotMatch(plan.hook, /^a focused experience of/i, `generic hook: ${plan.id}`);
  assert.ok(/^https:\/\//.test(plan.url), `non-HTTPS detail URL: ${plan.id}`);
  assert.ok(/^https:\/\//.test(plan.live), `non-HTTPS live URL: ${plan.id}`);
  assert.match(plan.checked, /^20\d\d-\d\d-\d\d$/, `invalid checked date: ${plan.id}`);
  assert.ok(plan.steps.length >= 2, `too few steps: ${plan.id}`);
  assert.ok(core.totalMinutes(plan.steps) > 0, `zero duration: ${plan.id}`);
  assert.ok(core.onJstDate(new Date("2026-09-15T09:00:00+09:00"), plan.startMin) <= core.onJstDate(new Date("2026-09-15T09:00:00+09:00"), plan.startMax), `invalid start hours: ${plan.id}`);
  if (!plan.airportPlan) assert.ok(plan.steps.some(core.isAirportTransferStep), `city plan lacks airport transfer: ${plan.id}`);
  if (plan.airportPlan) {
    const alreadyThere = core.prepareSteps(plan, plan.area);
    assert.ok(!alreadyThere.some(core.isAirportTransferStep), `airport-start plan repeats airport trip: ${plan.id}`);
  }
}

const airportStarts = {
  HND: ["Tokyo Station", "Shinjuku", "Shibuya", "Ueno", "Haneda Airport", "Roppongi"],
  NRT: ["Narita", "Narita Airport", "Tokyo Station", "Ueno"],
  KIX: ["Namba", "Umeda", "Kansai Airport", "Rinku Town"],
};
const nearbyStorage = {
  "Tokyo Station": "Ginza", Shinjuku: "Shibuya", Shibuya: "Shinjuku", Ueno: "Tokyo Station",
  "Haneda Airport": "Haneda Airport", Roppongi: "Shibuya", Narita: "Narita", "Narita Airport": "Narita Airport",
  Namba: "Umeda", Umeda: "Namba", "Kansai Airport": "Kansai Airport", "Rinku Town": "Rinku Town",
};
const variants = [
  { luggage: "none", interest: "Culture", available: 180 },
  { luggage: "store_near_stop", interest: "Food", available: 240 },
  { luggage: "return_elsewhere", interest: "Relax", available: 330 },
  { luggage: "none", interest: "Shopping", available: 540 },
  { luggage: "store_near_stop", interest: "Modern Tokyo", available: 720 },
];

const personas = [];
for (const [airport, starts] of Object.entries(airportStarts)) {
  for (const start of starts) {
    for (const variant of variants) {
      personas.push({
        airport,
        start,
        ...variant,
        luggageArea: variant.luggage === "return_elsewhere" ? nearbyStorage[start] : "",
        flight: "2026-09-15T21:00:00+09:00",
      });
    }
  }
}

let planResults = 0;
let safeFallbacks = 0;
for (const persona of personas) {
  const ranked = rankedCandidates(persona);
  if (!ranked.length) {
    safeFallbacks += 1;
    continue;
  }
  planResults += 1;
  for (const candidate of ranked.slice(0, 3)) {
    const { plan, fit, window, recommended } = candidate;
    assert.ok(window.earliest <= window.latest, `inverted window for ${plan.id}`);
    assert.equal(core.isStartWithinWindow(window.latest, window), true, `card/detail start mismatch risk for ${plan.id}`);
    const timing = core.timingFacts(fit.steps, window.latest, plan.airportPlan);
    assert.ok(timing.readyAt <= recommended, `plan ends after protected ready time: ${plan.id}`);
    assert.ok(timing.airportArrivalAt && timing.airportArrivalAt <= timing.readyAt, `airport arrival occurs after ready time: ${plan.id}`);
    const pickupIndex = fit.steps.findIndex((step) => step.isPickup);
    const airportIndex = fit.steps.findIndex(core.isAirportTransferStep);
    if (pickupIndex >= 0 && airportIndex >= 0) assert.ok(pickupIndex < airportIndex, `luggage pickup after airport departure: ${plan.id}`);
  }
}

assert.equal(personas.length, 70);
assert.ok(planResults >= 50, `too many safe fallbacks: ${safeFallbacks}`);

const roppongiRelax = rankedCandidates({
  airport: "HND", start: "Roppongi", luggage: "return_elsewhere", luggageArea: "Shibuya",
  interest: "Relax", available: 330, flight: "2026-09-15T21:00:00+09:00",
});
assert.equal(roppongiRelax[0].plan.id, 98, "Shibuya route should outrank a Ginza detour");

assert.equal(core.pickupMinutes("Haneda Airport", "Shinjuku"), 120);
assert.equal(core.pickupMinutes("Kansai Airport", "Namba"), 120);
assert.equal(core.pickupMinutes("Ueno", "Namba"), null);

const naritaAirport = data.plans.find((plan) => plan.id === 32);
assert.doesNotMatch(naritaAirport.hook, /temple-town/i);
assert.ok(!core.withLuggageStep(naritaAirport, "none", "", "Narita Airport").steps.some(core.isAirportTransferStep));

console.log(`Passed full-plan audit plus ${personas.length} personas (${planResults} plans, ${safeFallbacks} safe fallbacks).`);
