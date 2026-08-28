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
    return core.totalMinutes(fit.steps) <= available;
  });
}

const cases = [
  { name: "Tokyo Station short window with local storage", input: { airport: "HND", start: "Tokyo Station", luggage: "store_near_stop", available: 150 }, expect: /Tokyo Station Last Souvenir/ },
  { name: "Shinagawa 2-hour window with local storage", input: { airport: "HND", start: "Shinagawa", luggage: "store_near_stop", available: 120 }, expect: /Shinagawa Short Stop/ },
  { name: "Ginza hotel return", input: { airport: "HND", start: "Ginza", luggage: "return_elsewhere", luggageArea: "Ginza", available: 210 }, expect: /Ginza|Shiodome/ },
  { name: "Shinjuku start and Shibuya luggage return", input: { airport: "HND", start: "Shinjuku", luggage: "return_elsewhere", luggageArea: "Shibuya", available: 260 }, expect: /Shibuya|Shinjuku|Meiji/ },
  { name: "Far Tokyo luggage gets a larger allowance", input: { airport: "HND", start: "Ueno", luggage: "return_elsewhere", luggageArea: "Shinagawa", available: 420 }, expect: /Ueno|Asakusa|Tokyo Station/ },
  { name: "Already at Haneda", input: { airport: "HND", start: "Haneda Airport", luggage: "store_near_stop", available: 75 }, expect: /Haneda Terminal Mini/ },
  { name: "Namba storage near the stop", input: { airport: "KIX", start: "Namba", luggage: "store_near_stop", available: 220 }, expect: /Namba Last Stop|Dotonbori/ },
  { name: "Umeda hotel return", input: { airport: "KIX", start: "Umeda", luggage: "return_elsewhere", luggageArea: "Umeda", available: 250 }, expect: /Umeda Before/ },
  { name: "Already at KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "store_near_stop", available: 75 }, expect: /KIX Terminal Mini/ },
  { name: "Rinku from KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "none", available: 150 }, expect: /Rinku Town Quick Stop/ },
];

for (const testCase of cases) {
  const results = candidates(testCase.input);
  if (testCase.expectNone) assert.equal(results.length, 0, `${testCase.name}: expected no plan, got ${results.map((plan) => plan.name).join(", ")}`);
  else assert.ok(results.some((plan) => testCase.expect.test(plan.name)), `${testCase.name}: got ${results.map((plan) => plan.name).join(", ")}`);
}

const localStorage = core.withLuggageStep(data.plans.find((plan) => plan.id === 89), "store_near_stop", "", "Tokyo Station");
assert.equal(localStorage.pickupMinutes, 10);
assert.ok(localStorage.steps[0].isStorageDrop);
assert.ok(localStorage.steps.some((step) => step.isPickup));
assert.ok(localStorage.steps.findIndex((step) => step.isPickup) < localStorage.steps.findIndex((step) => /Travel to Haneda Airport/.test(step.label)));
assert.ok(!localStorage.steps.some((step) => /airport departure (?:point|route)/i.test(step.label)));

const sameAreaPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 34), "return_elsewhere", "Namba", "Namba");
assert.equal(sameAreaPickup.pickupMinutes, 25);
assert.ok(sameAreaPickup.steps.some((step) => step.isPickup && /Namba/.test(step.label)));
assert.ok(sameAreaPickup.steps.findIndex((step) => step.isPickup) < sameAreaPickup.steps.findIndex((step) => /Travel to Kansai Airport/.test(step.label)));

const nearbyPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 35), "return_elsewhere", "Namba", "Umeda");
assert.equal(nearbyPickup.pickupMinutes, 40);

const farTokyoPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 252), "return_elsewhere", "Shinagawa", "Ueno");
assert.equal(farTokyoPickup.pickupMinutes, 60);
assert.equal(farTokyoPickup.compatible, true);

const crossRegionPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 252), "return_elsewhere", "Namba", "Ueno");
assert.equal(crossRegionPickup.compatible, false);

const legacyMode = core.withLuggageStep(data.plans.find((plan) => plan.id === 26), "with_me", "", "Ginza");
assert.equal(legacyMode.mode, "store_near_stop");

console.log(`Passed ${cases.length} traveler patterns and redesigned luggage timeline assertions.`);
