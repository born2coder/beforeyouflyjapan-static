(function () {
  "use strict";

  const source = window.BYF_DATA;
  if (!source) return;

  const track = (event, details = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...details });
  };
  if (source.isPlan) track("plan_viewed", { plan_id: source.planId });
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-event]");
    if (target) track(target.dataset.event, { link_url: target.href || "" });
  });

  const form = document.getElementById("byf-form");
  if (!form) return;
  const core = window.BYFPlannerCore;
  if (!core) return;
  const data = core.enhanceData(source);
  window.BYF_DATA = data;
  const out = document.getElementById("byf-results");
  const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Tokyo" });
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Tokyo" });
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  const formatDuration = (minutes) => `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;

  const ensureAreaOption = (name) => {
    [form.elements.start, form.elements.luggage_area].forEach((select) => {
      if (!select || Array.from(select.options).some((option) => option.value === name)) return;
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.append(option);
    });
  };
  ensureAreaOption("Haneda Airport");
  ensureAreaOption("Rinku Town");

  const luggageLocation = form.querySelector(".byf-luggage-location");
  const luggageSelect = form.elements.luggage_area;
  const luggageQuestion = form.querySelector(".byf-luggage-question");
  const luggageHelp = luggageLocation.querySelector("small");
  const updateLuggage = () => {
    const chosen = form.querySelector('[name="luggage"]:checked')?.value || "";
    const returnElsewhere = chosen === "return_elsewhere" || chosen === "stored_hotel" || chosen === "stored_locker";
    luggageLocation.hidden = !returnElsewhere;
    luggageSelect.required = returnElsewhere;
    if (!returnElsewhere) luggageSelect.value = "";
    luggageQuestion.textContent = "Where will you return to collect your luggage?";
    luggageHelp.textContent = "Choose the area you must return to. We include a conservative return-and-pickup allowance.";
  };
  form.querySelectorAll('[name="luggage"]').forEach((element) => element.addEventListener("change", updateLuggage));

  let started = false;
  form.addEventListener("change", () => {
    if (!started) {
      started = true;
      track("planner_start");
    }
  });

  const airportHome = {
    HND: "https://tokyo-haneda.com/en/",
    NRT: "https://www.narita-airport.jp/en/",
    KIX: "https://www.kansai-airport.or.jp/en/",
  };
  const airportFallback = {
    HND: { title: "Use Haneda itself as the final experience", text: "Confirm your terminal first, then choose one meal, souvenir browse, or observation deck only if the remaining time still protects your airline deadline." },
    NRT: { title: "Keep the final stop inside Narita Airport", text: "Check your terminal first, then use only the time left for a meal, shopping, or a quiet rest near your departure area." },
    KIX: { title: "Use KIX or Aeroplaza as the final experience", text: "Confirm your terminal first, then choose one meal, souvenir browse, or rest. Use Sky View only when its shuttle timetable leaves a comfortable margin." },
  };

  function renderNoPlan({ airport, airportData, recommended, flight, available, start, luggage, reason }) {
    const fallback = airportFallback[airport];
    const reasonCopy = reason === "luggage_far"
      ? "The luggage return area appears to be in a different region from this plan, so we have not guessed a risky cross-region detour. Check the starting area and luggage area."
      : reason === "airport_backtrack"
        ? "Your luggage is outside the airport. Go directly to the entered luggage area, collect it, and return to the airport without adding sightseeing. Check both legs with a live route now."
      : data.messages.noPlan;
    const fallbackTitle = reason === "airport_backtrack" ? "Skip sightseeing and retrieve your luggage now" : fallback.title;
    const fallbackText = reason === "airport_backtrack" ? "This planner will not add an optional stop when you must leave the airport and come back for luggage." : fallback.text;
    const live = airportData.transport ? `<a class="byf-submit byf-no-primary" target="_blank" rel="noopener" href="${escapeHtml(airportData.transport)}">Check a live route to the airport →</a>` : "";
    const near = airportHome[airport] ? `<a class="byf-no-secondary" target="_blank" rel="noopener" href="${escapeHtml(airportHome[airport])}">Open official airport information →</a>` : "";
    out.innerHTML = `<section class="byf-no"><p class="byf-kicker">SAFE FALLBACK</p><h2>${escapeHtml(fallbackTitle)}</h2><p>${escapeHtml(reasonCopy)}</p><p>${escapeHtml(fallbackText)}</p><div class="byf-timebar"><b>${dateFormatter.format(recommended)}</b><span>Protected airport-ready time</span><b>${dateFormatter.format(flight)}</b><span>Your flight</span></div><div class="byf-actions">${live}${near}<a href="#planner">Change my conditions</a></div></section>`;
    track("no_plan_found", { airport, starting_area: start, available_minutes: available, luggage_state: luggage, reason });
    out.scrollIntoView({ behavior: "smooth" });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const airport = values.get("airport");
    const airportData = data.airports[airport];
    if (!airportData) {
      out.innerHTML = '<section class="byf-no"><h2>Choose an available airport.</h2></section>';
      return;
    }

    const flight = new Date(`${values.get("flight_at")}:00+09:00`);
    const free = new Date(`${values.get("free_at")}:00+09:00`);
    if (!Number.isFinite(flight.getTime()) || !Number.isFinite(free.getTime()) || flight <= free) {
      out.innerHTML = '<section class="byf-no"><h2>Check your flight and free-time dates.</h2></section>';
      return;
    }

    const recommended = new Date(flight.getTime() - airportData.buffer * 60000);
    const available = Math.floor((recommended - free) / 60000);
    const start = values.get("start");
    const luggage = values.get("luggage");
    const luggageArea = values.get("luggage_area") || "";
    const interest = values.get("interest") || "";
    const luggageMode = core.normalizeLuggageMode(luggage);
    const returnElsewhere = luggageMode === "return_elsewhere";
    if (returnElsewhere && !luggageArea) {
      out.innerHTML = '<section class="byf-no"><h2>Choose where you will pick up your luggage.</h2></section>';
      return;
    }
    const luggageRouteIsValid = !returnElsewhere || core.pickupMinutes(start, luggageArea) !== null;
    const airportBacktrack = returnElsewhere && /Airport$/.test(start) && luggageArea !== start;
    if (airportBacktrack) {
      renderNoPlan({ airport, airportData, recommended, flight, available, start, luggage, reason: "airport_backtrack" });
      return;
    }

    const plans = data.plans
      .map((plan) => {
        if (plan.airport !== airport || !core.areaMatches(plan, start)) return null;
        const luggageFit = core.withLuggageStep(plan, luggage, luggageArea, start);
        if (!luggageFit.compatible) return null;
        const steps = luggageFit.steps;
        const total = core.totalMinutes(steps);
        const window = core.planWindow(free, recommended, total, plan);
        const dayOk = !plan.days || /daily/i.test(plan.days) || plan.days.split(",").map((day) => day.trim().slice(0, 3)).includes(weekdayFormatter.format(free));
        if (total > available || !dayOk || !window.valid) return null;
        return { ...plan, _candidate: {
          start: window.latest,
          steps,
          total,
          pickupMinutes: luggageFit.pickupMinutes,
          score: core.scorePlan(plan, { startArea: start, interest, luggageMode, luggageArea, total, available }),
        } };
      })
      .filter(Boolean)
      .sort((left, right) => right._candidate.score - left._candidate.score || Math.abs(available - left._candidate.total) - Math.abs(available - right._candidate.total));

    if (available <= 0 || !plans.length) {
      renderNoPlan({ airport, airportData, recommended, flight, available, start, luggage, reason: luggageRouteIsValid ? "time" : "luggage_far" });
      return;
    }

    const cards = plans.slice(0, 3).map((plan, index) => {
      const candidate = plan._candidate;
      const timing = core.timingFacts(candidate.steps, candidate.start, plan.airportPlan);
      const hasAirportTravel = Boolean(timing.leaveAt);
      const leaveAt = timing.leaveAt || candidate.start;
      const airportArrivalAt = timing.airportArrivalAt || recommended;
      const luggageLabel = returnElsewhere
        ? plan.airportPlan && start === luggageArea
          ? `${candidate.pickupMinutes}-min pickup included`
          : `${candidate.pickupMinutes}-min return included`
        : luggageMode === "store_near_stop"
          ? plan.airportPlan ? "Keep luggage with you" : "Storage handling included"
          : "No luggage detour";
      const reasons = [];
      if (plan.area === start) reasons.push(plan.airportPlan ? `Already at ${start}` : `Starts in ${start}`);
      else if (plan.starts.includes(start)) reasons.push(`Starts in ${start}`);
      else reasons.push(`Near ${start}`);
      if (interest && plan.interest.includes(interest)) reasons.push(`Matches ${interest}`);
      if (returnElsewhere) reasons.push(plan.airportPlan && start === luggageArea ? `Pickup in ${luggageArea} is in the timeline` : `Return to ${luggageArea} is in the timeline`);
      else if (luggageMode === "store_near_stop" && !plan.airportPlan) reasons.push("Store luggage near the suggested stop");
      reasons.push("Airport buffer protected");
      const params = new URLSearchParams({
        byf_context: "1",
        plan_id: String(plan.id),
        airport,
        flight_at: values.get("flight_at"),
        free_at: values.get("free_at"),
        start,
        luggage,
        luggage_area: luggageArea,
        interest,
        plan_start_at: candidate.start.toISOString(),
      });
      const startLabel = plan.airportPlan && !hasAirportTravel ? "Begin airport experience by" : "Start this plan by";
      const departureLabel = hasAirportTravel ? "Leave for the airport by" : "Already at the airport";
      return `<article class="byf-card"><div class="byf-card-top"><span>${escapeHtml(index === 0 ? "Best fit" : plan.type)}</span><small>Checked ${escapeHtml(plan.checked)}</small></div><h3>${escapeHtml(plan.name)}</h3><p class="byf-card-hook"><b>Why go:</b> ${escapeHtml(plan.hook)}</p><p class="byf-fit-reason"><b>Why this fits:</b> ${escapeHtml(reasons.slice(0, 3).join(" • "))}</p><div class="byf-card-facts"><span><b>${formatDuration(candidate.total)}</b>complete plan</span><span><b>${escapeHtml(luggageLabel)}</b>luggage</span><span><b>${escapeHtml(plan.interest.slice(0, 2).join(" · "))}</b>experience</span></div><div class="byf-card-times"><span><small>${escapeHtml(startLabel)}</small><b>${dateFormatter.format(candidate.start)}</b></span><span><small>${escapeHtml(departureLabel)}</small><b>${dateFormatter.format(leaveAt)}</b></span><span><small>At the airport by</small><b>${dateFormatter.format(airportArrivalAt)}</b></span><span><small>Ready for airline procedures by</small><b>${dateFormatter.format(recommended)}</b></span></div><p class="byf-card-arrival"><b>${dateFormatter.format(flight)}</b> flight</p><div class="byf-actions"><a data-plan-id="${plan.id}" href="${escapeHtml(plan.url)}?${escapeHtml(params.toString())}">View plan details</a><a class="byf-live-link" target="_blank" rel="noopener" href="${escapeHtml(plan.live)}">Check live transport ↗</a></div></article>`;
    }).join("");

    out.innerHTML = `<div class="byf-result-head"><p class="byf-kicker">YOUR OPTIONS</p><h2>Your comfortable sightseeing window</h2><div class="byf-window"><strong>${formatDuration(available)}</strong><span>${dateFormatter.format(free)} → protected airport-ready time ${dateFormatter.format(recommended)}</span></div></div>${cards}`;
    out.scrollIntoView({ behavior: "smooth" });
    track("planner_complete", { airport, available_minutes: available, results: plans.length });
  });

  out.addEventListener("click", (event) => {
    const plan = event.target.closest("[data-plan-id]");
    if (plan) track("plan_selected", { plan_id: Number(plan.dataset.planId) });
    if (event.target.closest(".byf-live-link")) track("live_transport_click");
  });
})();
