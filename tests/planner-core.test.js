const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("assets/planner-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("assets/planner-core.js", "utf8"), context);

const core = context.window.BYFPlannerCore;
const data = core.enhanceData(context.window.BYF_STATIC_DATA);

function candidates({ airport, start, luggage, luggageArea = "", available }) {
  return data.plans.filter((plan) => {
    if (plan.airport !== airport || !core.areaMatches(plan, start)) return false;
    const fit = core.withLuggageStep(plan, luggage, luggageArea, start);
    if (!fit.compatible) return false;
    const luggageOk = luggage === "none" || ((luggage === "stored_hotel" || luggage === "stored_locker") && plan.luggage !== "no") || (luggage === "with_me" && plan.luggage === "yes");
    return luggageOk && core.totalMinutes(fit.steps) <= available;
  });
}

const cases = [
  { name: "Tokyo Station short window", input: { airport: "HND", start: "Tokyo Station", luggage: "none", available: 150 }, expect: /Tokyo Station Last Souvenir/ },
  { name: "Shinagawa 2-hour window", input: { airport: "HND", start: "Shinagawa", luggage: "with_me", available: 120 }, expect: /Shinagawa Short Stop/ },
  { name: "Ginza nearby hotel pickup", input: { airport: "HND", start: "Ginza", luggage: "stored_hotel", luggageArea: "Ginza", available: 210 }, expect: /Ginza|Shiodome/ },
  { name: "Shinjuku and nearby Shibuya luggage", input: { airport: "HND", start: "Shinjuku", luggage: "stored_locker", luggageArea: "Shibuya", available: 260 }, expect: /Shibuya|Shinjuku|Meiji/ },
  { name: "Far Tokyo luggage rejected", input: { airport: "HND", start: "Ueno", luggage: "stored_hotel", luggageArea: "Shinagawa", available: 360 }, expectNone: true },
  { name: "Already at Haneda", input: { airport: "HND", start: "Haneda Airport", luggage: "with_me", available: 75 }, expect: /Haneda Terminal Mini/ },
  { name: "Namba same-area locker", input: { airport: "KIX", start: "Namba", luggage: "stored_locker", luggageArea: "Namba", available: 220 }, expect: /Namba Last Stop|Dotonbori/ },
  { name: "Umeda same-area hotel", input: { airport: "KIX", start: "Umeda", luggage: "stored_hotel", luggageArea: "Umeda", available: 250 }, expect: /Umeda Before/ },
  { name: "Already at KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "with_me", available: 75 }, expect: /KIX Terminal Mini/ },
  { name: "Rinku from KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "none", available: 150 }, expect: /Rinku Town Quick Stop/ },
];

for (const testCase of cases) {
  const results = candidates(testCase.input);
  if (testCase.expectNone) assert.equal(results.length, 0, `${testCase.name}: expected no plan, got ${results.map((plan) => plan.name).join(", ")}`);
  else assert.ok(results.some((plan) => testCase.expect.test(plan.name)), `${testCase.name}: got ${results.map((plan) => plan.name).join(", ")}`);
}

const sameAreaPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 34), "stored_hotel", "Namba", "Namba");
assert.equal(sameAreaPickup.pickupMinutes, 25);
assert.ok(sameAreaPickup.steps.some((step) => step.isPickup && /hotel in Namba/.test(step.label)));
assert.ok(sameAreaPickup.steps.findIndex((step) => step.isPickup) < sameAreaPickup.steps.findIndex((step) => /Travel to Kansai Airport/.test(step.label)));

const nearbyPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 35), "stored_locker", "Namba", "Umeda");
assert.equal(nearbyPickup.pickupMinutes, 40);

console.log(`Passed ${cases.length} traveler patterns and luggage timeline assertions.`);
