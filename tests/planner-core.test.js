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
  { name: "Shinagawa short window with local storage", input: { airport: "HND", start: "Shinagawa", luggage: "store_near_stop", available: 135 }, expect: /Shinagawa Short Stop/ },
  { name: "Ginza hotel return", input: { airport: "HND", start: "Ginza", luggage: "return_elsewhere", luggageArea: "Ginza", available: 210 }, expect: /Ginza|Shiodome/ },
  { name: "Shinjuku start and Shibuya luggage return", input: { airport: "HND", start: "Shinjuku", luggage: "return_elsewhere", luggageArea: "Shibuya", available: 260 }, expect: /Shibuya|Shinjuku|Meiji/ },
  { name: "Far Tokyo luggage gets a larger allowance", input: { airport: "HND", start: "Ueno", luggage: "return_elsewhere", luggageArea: "Shinagawa", available: 420 }, expect: /Ueno|Asakusa|Tokyo Station/ },
  { name: "Already at Haneda", input: { airport: "HND", start: "Haneda Airport", luggage: "store_near_stop", available: 75 }, expect: /Haneda Terminal Mini/ },
  { name: "Namba storage near the stop", input: { airport: "KIX", start: "Namba", luggage: "store_near_stop", available: 220 }, expect: /Namba Last Stop|Dotonbori/ },
  { name: "Umeda hotel return", input: { airport: "KIX", start: "Umeda", luggage: "return_elsewhere", luggageArea: "Umeda", available: 250 }, expect: /Umeda Before/ },
  { name: "Already at KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "store_near_stop", available: 75 }, expect: /KIX Terminal Mini/ },
  { name: "Rinku from KIX", input: { airport: "KIX", start: "Kansai Airport", luggage: "none", available: 150 }, expect: /Rinku Town Quick Stop/ },
  { name: "Asakusa short cultural window", input: { airport: "HND", start: "Asakusa", luggage: "none", available: 240 }, expect: /Asakusa & Sensoji/ },
  { name: "Ueno with Tokyo Station luggage return", input: { airport: "HND", start: "Ueno", luggage: "return_elsewhere", luggageArea: "Tokyo Station", available: 330 }, expect: /Ueno|Asakusa|Jimbocho/ },
  { name: "Roppongi with local storage", input: { airport: "HND", start: "Roppongi", luggage: "store_near_stop", available: 180 }, expect: /Shiodome|Shinagawa|Ginza/ },
  { name: "Odaiba start keeps an Odaiba plan", input: { airport: "HND", start: "Odaiba", luggage: "none", available: 260 }, expect: /Odaiba Waterfront/ },
  { name: "Narita Airport short window", input: { airport: "NRT", start: "Narita Airport", luggage: "none", available: 150 }, expect: /Last Japanese Meal|Stay Near Narita/ },
  { name: "Narita same-area luggage return", input: { airport: "NRT", start: "Narita", luggage: "return_elsewhere", luggageArea: "Narita", available: 190 }, expect: /Last Japanese Meal|Stay Near Narita/ },
  { name: "Tokyo Station before Narita", input: { airport: "NRT", start: "Tokyo Station", luggage: "none", available: 300 }, expect: /Tokyo Station & Marunouchi/ },
  { name: "Namba short Osaka window", input: { airport: "KIX", start: "Namba", luggage: "none", available: 190 }, expect: /Namba Last Stop|Dotonbori/ },
  { name: "Umeda short Osaka window", input: { airport: "KIX", start: "Umeda", luggage: "none", available: 220 }, expect: /Umeda Before/ },
  { name: "Tokyo window too short for city sightseeing", input: { airport: "HND", start: "Tokyo", luggage: "store_near_stop", available: 100 }, expectNone: true },
];

for (const testCase of cases) {
  const results = candidates(testCase.input);
  if (testCase.expectNone) assert.equal(results.length, 0, `${testCase.name}: expected no plan, got ${results.map((plan) => plan.name).join(", ")}`);
  else assert.ok(results.some((plan) => testCase.expect.test(plan.name)), `${testCase.name}: got ${results.map((plan) => plan.name).join(", ")}`);
}

const localStorage = core.withLuggageStep(data.plans.find((plan) => plan.id === 89), "store_near_stop", "", "Tokyo Station");
assert.equal(localStorage.pickupMinutes, 15);
assert.equal(localStorage.dropMinutes, 20);
assert.ok(localStorage.steps[0].isStorageDrop);
assert.match(localStorage.steps[0].label, /Tokyo Station/);
assert.ok(localStorage.steps.some((step) => step.isPickup));
assert.ok(localStorage.steps.findIndex((step) => step.isPickup) < localStorage.steps.findIndex((step) => /Travel to Haneda Airport/.test(step.label)));
assert.ok(!localStorage.steps.some((step) => /airport departure (?:point|route)/i.test(step.label)));

const destinationStorage = core.withLuggageStep(data.plans.find((plan) => plan.id === 98), "store_near_stop", "", "Roppongi");
assert.equal(destinationStorage.storageArea, "Shibuya");
assert.equal(destinationStorage.dropMinutes, 25);
assert.equal(destinationStorage.steps[0].label, "Reach Shibuya Station");
assert.ok(destinationStorage.steps[1].isStorageDrop);
assert.match(destinationStorage.steps[1].label, /Store your luggage in Shibuya/);
assert.ok(destinationStorage.steps.some((step) => step.isPickup && /in Shibuya/.test(step.label)));
assert.ok(!destinationStorage.steps.some((step) => /return to Roppongi/i.test(step.label)));

const shinjukuToUenoStorage = core.withLuggageStep(data.plans.find((plan) => plan.id === 252), "store_near_stop", "", "Shinjuku");
assert.equal(shinjukuToUenoStorage.storageArea, "Ueno");
assert.match(shinjukuToUenoStorage.steps[0].label, /Travel to Ueno/);
assert.match(shinjukuToUenoStorage.steps[1].label, /Store your luggage in Ueno/);
assert.ok(shinjukuToUenoStorage.steps.some((step) => step.isPickup && /in Ueno/.test(step.label)));
assert.ok(!shinjukuToUenoStorage.steps.some((step) => /return to Shinjuku/i.test(step.label)));
assert.equal(core.totalMinutes(shinjukuToUenoStorage.steps), core.totalMinutes(data.plans.find((plan) => plan.id === 252).steps) + 25);

const sameAreaPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 34), "return_elsewhere", "Namba", "Namba");
assert.equal(sameAreaPickup.pickupMinutes, 35);
assert.ok(sameAreaPickup.steps.some((step) => step.isPickup && /Namba/.test(step.label)));
assert.ok(sameAreaPickup.steps.findIndex((step) => step.isPickup) < sameAreaPickup.steps.findIndex((step) => /Travel to Kansai Airport/.test(step.label)));

const nearbyPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 35), "return_elsewhere", "Namba", "Umeda");
assert.equal(nearbyPickup.pickupMinutes, 60);

const farTokyoPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 252), "return_elsewhere", "Shinagawa", "Ueno");
assert.equal(farTokyoPickup.pickupMinutes, 90);
assert.equal(farTokyoPickup.compatible, true);

const crossRegionPickup = core.withLuggageStep(data.plans.find((plan) => plan.id === 252), "return_elsewhere", "Namba", "Ueno");
assert.equal(crossRegionPickup.compatible, false);

const legacyMode = core.withLuggageStep(data.plans.find((plan) => plan.id === 26), "with_me", "", "Ginza");
assert.equal(legacyMode.mode, "store_near_stop");

const airportReturn = core.withLuggageStep(data.plans.find((plan) => plan.id === 28), "return_elsewhere", "Shinjuku", "Shinjuku");
assert.equal(airportReturn.compatible, true);
assert.equal(airportReturn.pickupMinutes, 35);
assert.ok(airportReturn.steps[0].isPickup);
assert.ok(core.isAirportTransferStep(airportReturn.steps[1]));

const terminalReturn = core.withLuggageStep(data.plans.find((plan) => plan.id === 2801), "return_elsewhere", "Shinjuku", "Haneda Airport");
assert.equal(terminalReturn.compatible, false);

const naritaNearAirport = core.withLuggageStep(data.plans.find((plan) => plan.id === 31), "return_elsewhere", "Narita", "Narita");
assert.equal(naritaNearAirport.compatible, true);
assert.ok(naritaNearAirport.steps[0].isPickup);
assert.ok(core.isAirportTransferStep(naritaNearAirport.steps[1]));

const eveningPlan = data.plans.find((plan) => plan.id === 257);
const overnightFree = new Date("2026-08-17T17:00:00+09:00");
const overnightArrival = new Date("2026-08-17T21:30:00+09:00");
const overnightWindow = core.planWindow(overnightFree, overnightArrival, core.totalMinutes(eveningPlan.steps), eveningPlan);
assert.equal(overnightWindow.valid, true);
assert.equal(overnightWindow.latest.toISOString(), "2026-08-17T08:35:00.000Z");
assert.equal(core.isStartWithinWindow(new Date("2026-08-17T17:35:00+09:00"), overnightWindow), true);

const openingHoursPlan = data.plans.find((plan) => plan.id === 250);
const longFreeWindow = new Date("2026-08-13T07:30:00+09:00");
const lateRecommendedArrival = new Date("2026-08-13T20:00:00+09:00");
const openingWindow = core.planWindow(longFreeWindow, lateRecommendedArrival, core.totalMinutes(openingHoursPlan.steps), openingHoursPlan);
assert.equal(openingWindow.latest.toISOString(), "2026-08-13T06:30:00.000Z");

console.log(`Passed ${cases.length} traveler patterns and redesigned luggage timeline assertions.`);
