(function () {
  "use strict";

  function initializePlanContext() {
  const core = window.BYFPlannerCore;
  const source = window.BYF_STATIC_DATA;
  if (!source || !core || !Array.isArray(source.plans)) return;
  const data = core.enhanceData(source);
  const params = new URLSearchParams(window.location.search);
  const requestedId = Number(params.get("plan_id"));
  const path = window.location.pathname.replace(/\/+$/, "/");
  const plan = data.plans.find((item) => {
    if (requestedId && item.id !== requestedId) return false;
    try {
      return new URL(item.url).pathname.replace(/\/+$/, "/") === path;
    } catch {
      return false;
    }
  });
  if (!plan) return;

  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" });
  const timeOnly = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" });
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));

  const planGuidance = {
    28: {
      choose: ["You want the lowest-complexity Haneda option and are satisfied with one airport experience.", "You will confirm the departure terminal and airline counter before eating or shopping.", "You are willing to skip the optional experience if airline procedures need attention."],
      avoid: ["Your terminal or check-in status is still unresolved.", "You need a particular restaurant, shop, or observation deck to be open.", "Your airline deadline is already close."],
      sources: [["Haneda international departure procedures", "https://tokyo-haneda.com/en/flight/int/dep_step.html"], ["Haneda terminal floor guide", "https://tokyo-haneda.com/en/floor/floor-guide.html"]],
    },
    31: {
      choose: ["You are at or near Narita and want a quiet, low-complexity final stop.", "A meal, cafe break, or rest near your confirmed terminal is enough.", "You will resolve terminal and counter questions before using optional time."],
      avoid: ["You intend to return to Narita city after reaching the airport.", "Your terminal or airline counter is still uncertain.", "Your airline deadline is already close."],
      sources: [["Narita international departure procedure", "https://www.narita-airport.jp/en/airportguide/inter-dep/"], ["Narita airport facility layout", "https://www.narita-airport.jp/en/service/ud/guide/"]],
    },
    32: {
      choose: ["You want one final Japanese meal or focused souvenir browse inside Narita Airport.", "You will confirm your terminal and check-in counter first.", "You can choose from what is open near your actual departure route."],
      avoid: ["You need a specific shop or restaurant to be guaranteed.", "Your terminal or check-in status is unresolved.", "Shopping would delay airline procedures."],
      sources: [["Narita international departure procedure", "https://www.narita-airport.jp/en/airportguide/inter-dep/"], ["Narita shops and restaurants", "https://www.narita-airport.jp/en/shop/"]],
    },
    33: {
      choose: ["You are already in Namba and want one unmistakably Osaka food-and-street scene.", "You can keep the visit to Ebisubashi, the riverwalk, and one meal.", "You will return to Nankai Namba before the displayed leave-by time."],
      avoid: ["Crowds or restaurant queues are already slowing the route.", "Your luggage is outside Namba or a nearby station area.", "Live KIX transport is disrupted."],
      sources: [["Dotonbori — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/dotonbori/"], ["KIX train access", "https://www.kansai-airport.or.jp/en/access/from-airport/train"]],
    },
    34: {
      choose: ["You want a compact Namba loop rather than another cross-city transfer.", "A quick meal, Hozenji atmosphere, or final souvenir is enough.", "You can stay close to Nankai Namba."],
      avoid: ["You plan to queue for a famous restaurant.", "Your luggage is outside Namba or Umeda.", "Live KIX transport is disrupted."],
      sources: [["Dotonbori and Minami — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/dotonbori/"], ["KIX train access", "https://www.kansai-airport.or.jp/en/access/from-airport/train"]],
    },
    35: {
      choose: ["You are already in Umeda and want a city view, green space, food, or shopping in one station complex.", "You prefer an indoor-friendly plan with many exit points.", "You will use the displayed airport departure time as a hard stop."],
      avoid: ["You want to add Umeda Sky Building queues or another district.", "Your luggage is outside Umeda or Namba.", "Live KIX transport is disrupted."],
      sources: [["Osaka Station City — Osaka Official Tourism Guide", "https://osaka-info.jp/en/spot/osaka-station-city/"], ["Grand Green Osaka — Osaka Official Tourism Guide", "https://discover.osaka-info.jp/en/spots/grand-green-osaka"], ["KIX access", "https://www.kansai-airport.or.jp/en/access/to-airport"]],
    },
    36: {
      choose: ["You want an Osaka Bay view or a focused outlet stop close to KIX.", "You can choose one zone instead of trying to cover the whole outlet.", "The shops are open and the return train margin is comfortable."],
      avoid: ["You have less than the displayed complete-plan time.", "You expect a full outlet shopping trip.", "Bad weather or service disruption makes the extra airport-island crossing uncertain."],
      sources: [["Rinku Premium Outlets", "https://www.premiumoutlets.co.jp/en/rinku/"], ["KIX access", "https://www.kansai-airport.or.jp/en/access/"]],
    },
    37: {
      choose: ["You want the lowest-complexity option and are happy with one airport experience.", "You will confirm your terminal and airline instructions before eating or shopping.", "You will treat Sky View as optional and check its shuttle timetable first."],
      avoid: ["Your airline deadline is already close.", "A terminal change or unresolved check-in issue needs attention.", "You need a particular shop, restaurant, or Sky View visit to be guaranteed."],
      sources: [["KIX shops and restaurants", "https://www.kansai-airport.or.jp/en/shop-and-dine/"], ["KIX airport map", "https://www.kansai-airport.or.jp/en/map"], ["KIX Sky View access and hours", "https://www.kansai-airport.or.jp/en/shop-and-dine/skyview/access"]],
    },
  };

  function basePlanId(id) {
    if (id === 2801) return 28;
    if (id === 3601) return 36;
    if (id === 3701) return 37;
    return id;
  }

  function improvePlanPage() {
    const guidance = planGuidance[basePlanId(plan.id)];
    const heroTitle = document.querySelector(".byf-plan-hero h1");
    if (heroTitle) heroTitle.textContent = plan.name;
    const lead = document.querySelector(".byf-experience-lead");
    if (lead) lead.textContent = `${plan.hook}. The timeline keeps a visible ${plan.airport} cutoff and never treats optional sightseeing as more important than your flight.`;
    const memory = document.querySelector(".byf-memory");
    if (memory) memory.innerHTML = `<b>What you’ll remember:</b> ${escapeHtml(plan.hook)}`;
    const preview = document.querySelector(".byf-place-preview p:not(.byf-kicker)");
    if (preview && plan.airportPlan) preview.textContent = plan.hook;
    const fit = document.querySelector(".byf-plan-fit");
    if (fit) {
      const definitions = fit.querySelectorAll("dd");
      if (definitions[0]) definitions[0].textContent = plan.starts.join(", ");
      if (definitions[1]) definitions[1].textContent = `${plan.min} min minimum; ${plan.recommended} min recommended`;
      if (definitions[2]) definitions[2].textContent = plan.strictStarts ? "Calculated from opening hours, admission deadlines and the checked closure calendar." : `${plan.startMin}–${plan.startMax} JST · ${plan.days}`;
      if (definitions[3]) definitions[3].textContent = "Large luggage can be stored near the suggested stop. Locker space is not guaranteed; an entered return elsewhere receives a separate conservative allowance.";
      const lists = fit.querySelectorAll("ul");
      if (guidance && lists[0]) lists[0].innerHTML = guidance.choose.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      if (guidance && lists[1]) lists[1].innerHTML = guidance.avoid.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    const sources = document.querySelector(".byf-source");
    if (sources && guidance) {
      const list = sources.querySelector("ul");
      if (list) list.innerHTML = guidance.sources.map(([label, url]) => `<li><a target="_blank" rel="noopener" href="${escapeHtml(url)}">${escapeHtml(label)} ↗</a></li>`).join("");
    }
    const checked = sources && sources.querySelector("small");
    if (checked) checked.textContent = `Last checked: ${plan.checked}`;
  }

  function routeHint(airport, area) {
    if (airport === "KIX") return area === "Umeda" ? "Compare the JR airport route from Osaka Station with the official airport bus. Confirm the platform, terminal and service time before leaving." : "From Namba, check the Nankai airport route; from Rinku, check the airport-bound train. Confirm the destination, terminal and service time before boarding.";
    if (airport === "NRT") return /Narita/.test(area) ? "Check the airport-bound JR or Keisei service from Narita town. Confirm your terminal station before boarding." : /Ueno|Akihabara/.test(area) ? "Compare Keisei from Keisei-Ueno with the live airport route. Ueno and Keisei-Ueno are different stations; allow walking between them." : "Compare Narita Express, Keisei and the official airport bus from your exact location. Confirm the airport terminal and departure point.";
    return area === "Shinagawa" ? "Use the Keikyu airport route from Shinagawa. Confirm the train destination and your Haneda terminal station before boarding." : "Compare Keikyu via Shinagawa or the Tokyo Monorail via Hamamatsucho with a live route. Confirm your Haneda terminal and the train destination.";
  }

  function stepDescription(step) {
    if (step.isStorageDrop) return [`Use a station locker or staffed luggage-storage service in ${step.storageArea || plan.area}.`, "Choose a storage point you can identify and return to easily. Locker availability is not guaranteed."];
    if (step.isPickup) return [`Use the luggage allowance already included for ${step.storageArea || luggageFit?.storageArea || plan.area}.`, "Collect every bag, check the receipt or counter, and begin the airport transfer when this step ends."];
    if (core.isAirportTransferStep(step) && !step.action) return ["This allowance includes station access, waiting, and the airport transfer.", routeHint(plan.airport, luggageFit?.mode === "return_elsewhere" ? luggageFit.storageArea : plan.area)];
    if (/^Arrive at .*Airport/i.test(step.label)) return ["You have reached the airport at the end of this plan.", "Confirm the correct terminal and proceed to your airline counter or security as instructed. Keep any remaining time for airline procedures."];
    if (step.happens || step.action) return [step.happens || step.label, step.action || "Move on at the end of this stage; skip queues."];
    if (/margin/i.test(step.label)) return ["This time is deliberately left unplanned for platform changes or small delays.", "Do not spend this margin on another stop."];
    if (/confirm|check-in|security/i.test(step.label)) return ["Verify the correct terminal and the latest instructions from your airline.", "Resolve check-in, bag-drop, or terminal questions before using time for food or shopping."];
    const editorial = [
      [/Kappabashi/i, "Browse two nearby kitchenware shops for one chosen product.", "Check those shops’ opening hours before arriving. Finish by the planning cutoff; knives need airline-approved packing."],
      [/Meiji Shrine/i, "Follow the shrine approach to the main sanctuary and return toward Harajuku.", "Use the current month’s closing time. Skip the museum or garden unless you have checked their separate hours."],
      [/Sensoji|Nakamise/i, "Choose the temple grounds and one short shopping street pass.", "Shops have separate hours. Keep the route compact and use a nearby exit if crowds build."],
      [/Tsukiji/i, "Choose one food priority in the outer market.", "Check the market calendar and your target stall. Switch to a no-queue meal instead of waiting."],
      [/Akihabara/i, "Choose one electronics or anime shop rather than browsing every floor.", "Confirm its hours, set a purchase limit and leave enough time to repack."],
      [/Dotonbori|Ebisubashi|Hozenji/i, "Follow a compact Namba street loop with one photo stop.", "Crowds can slow walking. Return toward Nankai Namba instead of adding another district."],
      [/Marunouchi|red-brick|facade/i, "See the Marunouchi station facade and nearby plaza.", "Remember which side of Tokyo Station you need for the airport journey."],
      [/Rinku|seaside/i, "Choose the bay view or one shopping zone close to the station.", "Check the return train and weather first; stop if the airport-island crossing is disrupted."],
      [/meal|lunch|dinner|eat|coffee/i, "Choose one nearby meal or seated break.", "Use a place with immediate seating. Choose takeaway or an airport meal if there is a queue."],
      [/shop|souvenir/i, "Choose one shopping zone and one purchase priority.", "Check the selected store’s hours, allow packing time and stop at the stage end."],
      [/travel|walk|reach|return|take/i, "Follow the next connection shown in this stage.", "Check the precise station entrance and platform on a live map before walking. Lift routes may take longer."],
    ].find(([pattern]) => pattern.test(step.label));
    return editorial ? editorial.slice(1) : [step.label, "Keep this stop focused; skip queues and leave when the next timeline stage begins."];

  }

  function renderTimeline(steps, start) {
    const timeline = document.querySelector(".byf-rich-timeline");
    if (!timeline) return;
    let cursor = new Date(start);
    timeline.innerHTML = steps.map((step) => {
      const [happens, action] = stepDescription(step);
      const airportMove = core.isAirportTransferStep(step);
      const classes = ["byf-rich-step", airportMove ? "is-airport-move" : "", step.isPickup ? "is-luggage-pickup" : "", step.isStorageDrop ? "is-luggage-drop" : ""].filter(Boolean).join(" ");
      const time = timeOnly.format(cursor);
      cursor = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
      return `<article class="${classes}"><time>${escapeHtml(time)}</time><div><h3>${escapeHtml(step.label)}</h3><h4>What happens next</h4><p>${escapeHtml(happens)}</p><h4>What to do</h4><p>${escapeHtml(action)}</p><p class="byf-duration">Allow about: ${Number(step.minutes || 0)} minutes</p></div></article>`;
    }).join("");
  }

  improvePlanPage();

  const personalized = params.get("byf_context") === "1";
  let steps = plan.steps.map((step) => ({ ...step }));
  let flight;
  let recommended;
  let start;
  let airportCode = plan.airport;
  let luggageFit = null;

  function showInvalid() {
    const notice = document.createElement("aside");
    notice.className = "byf-alert";
    notice.innerHTML = 'This saved plan no longer fits the entered conditions or opening-hour limits. <a href="/#planner">Recalculate your options</a>. The timeline below is a general example.';
    document.querySelector(".byf-model")?.before(notice);
  }
  if (personalized) {
    const flightAt = params.get("flight_at");
    const freeAt = params.get("free_at");
    airportCode = params.get("airport");
    const airport = data.airports[airportCode];
    flight = flightAt ? new Date(`${flightAt}:00+09:00`) : null;
    const free = freeAt ? new Date(`${freeAt}:00+09:00`) : null;
    if (!airport || airportCode !== plan.airport || !flight || !free || flight <= free || !Number.isFinite(flight.getTime()) || !Number.isFinite(free.getTime())) { showInvalid(); return; }
    luggageFit = core.withLuggageStep(plan, params.get("luggage") || "", params.get("luggage_area") || "", params.get("start") || "");
    if (!luggageFit.compatible || !core.areaMatches(plan, params.get("start") || "")) { showInvalid(); return; }
    steps = core.withTravelNeeds(luggageFit.steps, params.get("needs") || "standard");
    recommended = new Date(flight.getTime() - airport.buffer * 60000);
    const total = core.totalMinutes(steps);
    const window = core.scheduleWindow(free, recommended, steps, plan);
    if (!window.valid || !core.supportsNeeds(plan, params.get("needs"))) {
      showInvalid();
      return;
    }
    const requestedStart = params.get("plan_start_at") ? new Date(params.get("plan_start_at")) : null;
    start = core.isStartWithinWindow(requestedStart, window) ? requestedStart : window.latest;

    const availableMinutes = Math.max(0, Math.floor((recommended - free) / 60000));
    const hours = Math.floor(availableMinutes / 60);
    const minutes = availableMinutes % 60;
    const duration = `${hours ? `${hours} hr${hours === 1 ? "" : "s"}` : ""}${hours && minutes ? " " : ""}${minutes ? `${minutes} min` : ""}`;
    const situation = document.createElement("aside");
    situation.className = "byf-situation";
    situation.setAttribute("aria-label", "Your planner conditions");
    situation.innerHTML = `<b>Your situation</b>You have about ${escapeHtml(duration || "0 min")} before the protected airport-ready time for ${escapeHtml(airportCode)}. This timeline includes your starting area and the luggage choice entered in the planner.`;
    const model = document.querySelector(".byf-model");
    if (model) model.before(situation);
  } else if (plan.id >= 4001 && plan.id <= 4010) {
    flight = new Date("2026-10-10T21:00:00+09:00");
    recommended = new Date(+flight - data.airports[plan.airport].buffer * 60000);
    const exampleWindow = core.scheduleWindow(new Date("2026-10-10T09:00:00+09:00"), recommended, steps, plan);
    if (!exampleWindow.valid) return;
    start = exampleWindow.latest;
  } else if (plan.airport === "KIX") {
    flight = new Date("2026-08-28T20:00:00+09:00");
    recommended = new Date(flight.getTime() - data.airports.KIX.buffer * 60000);
    start = new Date(recommended.getTime() - core.totalMinutes(steps) * 60000);
  } else {
    return;
  }

  renderTimeline(steps, start);
  if (personalized) {
    const controls = document.createElement("div");
    controls.className = "byf-plan-tools";
    const back = new URLSearchParams(params);
    ["byf_context", "plan_id", "plan_start_at"].forEach((key) => back.delete(key));
    controls.innerHTML = `<a href="/?${escapeHtml(back.toString())}#planner">Change my conditions</a><button type="button" data-copy-plan>Copy plan link</button><button type="button" data-print-plan>Print / save PDF</button><span role="status"></span>`;
    controls.querySelector("[data-copy-plan]").addEventListener("click", async () => {
      const status = controls.querySelector('[role="status"]');
      try { await navigator.clipboard.writeText(window.location.href); status.textContent = "Plan link copied. It includes your flight and luggage conditions."; }
      catch { status.textContent = "Copy the address from your browser to share these conditions."; }
    });
    controls.querySelector("[data-print-plan]").addEventListener("click", () => window.print());
    document.querySelector(".byf-model")?.prepend(controls);
  }
  const timing = core.timingFacts(steps, start, plan.airportPlan);
  const hasAirportTravel = Boolean(timing.leaveAt);
  const leaveAt = timing.leaveAt || start;
  const airportArrivalAt = timing.airportArrivalAt || recommended;
  const keyTimes = document.querySelector(".byf-key-times");
  if (keyTimes) keyTimes.innerHTML = [
    ["Your flight", flight],
    ["Ready for airline procedures by", recommended],
    ["At the airport by", airportArrivalAt],
    [plan.airportPlan && !hasAirportTravel ? "Begin airport experience by" : `Leave for ${airportCode} by`, leaveAt],
  ].map(([label, value], index) => `<span${index === 3 ? ' class="is-leave"' : ""}><small>${escapeHtml(label)}</small><b>${escapeHtml(formatter.format(value))}</b></span>`).join("");
  document.querySelectorAll(".byf-deadline b").forEach((node) => { node.textContent = formatter.format(leaveAt); });
  const modelHeading = document.querySelector(".byf-model h2");
  if (modelHeading) modelHeading.textContent = personalized ? `Your timeline for a ${formatter.format(flight)} ${airportCode} flight` : `Example timeline for a ${formatter.format(flight)} ${airportCode} flight`;
  const modelIntro = document.querySelector(".byf-model h2 + p");
  if (modelIntro) modelIntro.textContent = personalized ? "Calculated from your flight, starting area, and luggage return. ‘At the airport’ and ‘ready for airline procedures’ are shown separately." : "This example ends at the protected airline-procedure time; check live transport and your airline before leaving.";
  if (personalized) {
    const definitions = document.querySelectorAll(".byf-plan-fit dd");
    if (definitions[1]) definitions[1].textContent = `${core.totalMinutes(steps)} min for this personalized plan, including any luggage allowance`;
    if (definitions[3] && luggageFit) {
      definitions[3].textContent = luggageFit.mode === "return_elsewhere"
        ? plan.airportPlan && params.get("start") === luggageFit.storageArea
          ? `Your luggage pickup in ${luggageFit.storageArea} is included with a conservative allowance.`
          : `Your return to ${luggageFit.storageArea} is included with a conservative allowance. Check the exact hotel or storage route live; it can take longer.`
        : luggageFit.mode === "store_near_stop" && !plan.airportPlan
          ? `This plan includes ${luggageFit.dropMinutes} minutes to store luggage in ${luggageFit.storageArea}, the return journey to that storage area, and a separate collection allowance before the airport transfer.`
          : "No separate luggage detour is included.";
    }
  }
  }

  if (window.BYFPlannerCore) {
    initializePlanContext();
  } else {
    const script = document.createElement("script");
    script.src = "/assets/planner-core.js?v=20261004-1";
    script.dataset.byfPlannerCore = "1";
    script.addEventListener("load", initializePlanContext, { once: true });
    document.head.append(script);
  }
})();
