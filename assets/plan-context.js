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
  const plan = data.plans.find((item) => requestedId && item.id === requestedId) || data.plans.find((item) => {
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

  const kixGuidance = {
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
    if (id === 3601) return 36;
    if (id === 3701) return 37;
    return id;
  }

  function improveKixPage() {
    if (plan.airport !== "KIX") return;
    const guidance = kixGuidance[basePlanId(plan.id)];
    const heroTitle = document.querySelector(".byf-plan-hero h1");
    if (heroTitle) heroTitle.textContent = plan.name;
    const lead = document.querySelector(".byf-experience-lead");
    if (lead) lead.textContent = `${plan.hook}. The route stays in one area and ends with a visible KIX cutoff.`;
    const memory = document.querySelector(".byf-memory");
    if (memory) memory.innerHTML = `<b>What you’ll remember:</b> ${escapeHtml(plan.hook)}`;
    const preview = document.querySelector(".byf-place-preview p:not(.byf-kicker)");
    if (preview) preview.textContent = plan.hook;
    const fit = document.querySelector(".byf-plan-fit");
    if (fit) {
      const definitions = fit.querySelectorAll("dd");
      if (definitions[0]) definitions[0].textContent = plan.starts.join(", ");
      if (definitions[1]) definitions[1].textContent = `${plan.min} min minimum; ${plan.recommended} min recommended`;
      if (definitions[2]) definitions[2].textContent = `${plan.startMin}–${plan.startMax} JST · ${plan.days}`;
      if (definitions[3]) definitions[3].textContent = plan.luggage === "yes" ? "Works with luggage; stored luggage pickup is added when it is nearby." : "Store large luggage nearby before starting.";
      const lists = fit.querySelectorAll("ul");
      if (guidance && lists[0]) lists[0].innerHTML = guidance.choose.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      if (guidance && lists[1]) lists[1].innerHTML = guidance.avoid.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    const sources = document.querySelector(".byf-source");
    if (sources && guidance) {
      const list = sources.querySelector("ul");
      if (list) list.innerHTML = guidance.sources.map(([label, url]) => `<li><a target="_blank" rel="noopener" href="${escapeHtml(url)}">${escapeHtml(label)} ↗</a></li>`).join("");
      const checked = sources.querySelector("small");
      if (checked) checked.textContent = "Last checked: 2026-08-28";
    }
  }

  function stepDescription(step) {
    if (step.isPickup) return ["Return to the nearby storage point shown in your planner result.", "Collect every bag, check the storage receipt or hotel desk, and leave immediately for the airport route."];
    if (/(?:travel|head) to (?:haneda|narita|kansai) airport/i.test(step.label)) return ["This allowance includes station access, waiting, and the airport transfer.", "Check the live route before moving and use the displayed time as a hard departure deadline."];
    if (/margin/i.test(step.label)) return ["This time is deliberately left unplanned for platform changes or small delays.", "Do not spend this margin on another stop."];
    if (/confirm|check-in|security/i.test(step.label)) return ["Verify the correct terminal and the latest instructions from your airline.", "Resolve check-in, bag-drop, or terminal questions before using time for food or shopping."];
    return [`Stay focused on this one stage for about ${step.minutes} minutes.`, "Skip queues and unplanned detours; move on when the next timeline time arrives."];
  }

  function renderTimeline(steps, start) {
    const timeline = document.querySelector(".byf-rich-timeline");
    if (!timeline) return;
    let cursor = new Date(start);
    timeline.innerHTML = steps.map((step) => {
      const [happens, action] = stepDescription(step);
      const airportMove = /(?:travel|head) to (?:haneda|narita|kansai) airport/i.test(step.label);
      const classes = ["byf-rich-step", airportMove ? "is-airport-move" : "", step.isPickup ? "is-luggage-pickup" : ""].filter(Boolean).join(" ");
      const time = timeOnly.format(cursor);
      cursor = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
      return `<article class="${classes}"><time>${escapeHtml(time)}</time><div><h3>${escapeHtml(step.label)}</h3><h4>What happens next</h4><p>${escapeHtml(happens)}</p><h4>What to do</h4><p>${escapeHtml(action)}</p><p class="byf-duration">Allow about: ${Number(step.minutes || 0)} minutes</p></div></article>`;
    }).join("");
  }

  improveKixPage();

  const personalized = params.get("byf_context") === "1";
  let steps = plan.steps.map((step) => ({ ...step }));
  let flight;
  let recommended;
  let start;
  let airportCode = plan.airport;

  if (personalized) {
    const flightAt = params.get("flight_at");
    const freeAt = params.get("free_at");
    airportCode = params.get("airport");
    const airport = data.airports[airportCode];
    flight = flightAt ? new Date(`${flightAt}:00+09:00`) : null;
    const free = freeAt ? new Date(`${freeAt}:00+09:00`) : null;
    if (!airport || !flight || !free || !Number.isFinite(flight.getTime()) || !Number.isFinite(free.getTime())) return;
    const luggageFit = core.withLuggageStep(plan, params.get("luggage") || "", params.get("luggage_area") || "", params.get("start") || "");
    if (!luggageFit.compatible) return;
    steps = luggageFit.steps;
    recommended = new Date(flight.getTime() - airport.buffer * 60000);
    start = new Date(recommended.getTime() - core.totalMinutes(steps) * 60000);
    if (start < free) return;
  } else if (plan.airport === "KIX") {
    flight = new Date("2026-08-28T20:00:00+09:00");
    recommended = new Date(flight.getTime() - data.airports.KIX.buffer * 60000);
    start = new Date(recommended.getTime() - core.totalMinutes(steps) * 60000);
  } else {
    return;
  }

  renderTimeline(steps, start);
  let cursor = new Date(start);
  let leaveAt = null;
  steps.forEach((step) => {
    if (/(?:travel|head) to (?:haneda|narita|kansai) airport/i.test(step.label) && !leaveAt) leaveAt = new Date(cursor);
    cursor = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
  });
  if (!leaveAt) leaveAt = start;

  const keyValues = document.querySelectorAll(".byf-key-times b");
  if (keyValues[0]) keyValues[0].textContent = formatter.format(flight);
  if (keyValues[1]) keyValues[1].textContent = formatter.format(recommended);
  if (keyValues[2]) keyValues[2].textContent = formatter.format(leaveAt);
  const leaveLabel = document.querySelector(".byf-key-times .is-leave small");
  if (leaveLabel) leaveLabel.textContent = plan.airportPlan && !steps.some((step) => /(?:travel|head) to (?:haneda|narita|kansai) airport/i.test(step.label)) ? "Begin airport experience by" : `Leave for ${airportCode} by`;
  document.querySelectorAll(".byf-deadline b").forEach((node) => { node.textContent = formatter.format(leaveAt); });
  const modelHeading = document.querySelector(".byf-model h2");
  if (modelHeading) modelHeading.textContent = personalized ? `Your timeline for a ${formatter.format(flight)} ${airportCode} flight` : `Example timeline for an 8:00 PM ${airportCode} flight`;
  const modelIntro = document.querySelector(".byf-model h2 + p");
  if (modelIntro) modelIntro.textContent = personalized ? "Calculated from your flight, starting area, and the luggage location you entered." : "This example ends at the recommended airport-arrival time; check live transport and your airline before leaving.";
  }

  if (window.BYFPlannerCore) {
    initializePlanContext();
  } else {
    const script = document.createElement("script");
    script.src = "/assets/planner-core.js";
    script.dataset.byfPlannerCore = "1";
    script.addEventListener("load", initializePlanContext, { once: true });
    document.head.append(script);
  }
})();
