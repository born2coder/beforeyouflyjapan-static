(function () {
  const data = window.BYF_STATIC_DATA;
  if (!data || !Array.isArray(data.plans)) return;

  const path = window.location.pathname.replace(/\/+$/, "/");
  const plan = data.plans.find((item) => {
    try {
      return new URL(item.url).pathname.replace(/\/+$/, "/") === path;
    } catch {
      return false;
    }
  });
  if (!plan) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("byf_context") !== "1") return;

  const flightAt = params.get("flight_at");
  const freeAt = params.get("free_at");
  const airportCode = params.get("airport");
  const luggage = params.get("luggage") || "";
  const airport = data.airports[airportCode];
  const flight = flightAt ? new Date(`${flightAt}:00+09:00`) : null;
  const free = freeAt ? new Date(`${freeAt}:00+09:00`) : null;
  if (!airport || !flight || !free || !Number.isFinite(flight.getTime()) || !Number.isFinite(free.getTime())) return;

  const pickupExtra = luggage === "stored_hotel" || luggage === "stored_locker" ? 65 : 0;
  const stepTotal = plan.steps.reduce((sum, step) => sum + Number(step.minutes || 0), 0);
  const recommended = new Date(flight.getTime() - airport.buffer * 60000);
  const start = new Date(recommended.getTime() - (stepTotal + pickupExtra) * 60000);
  if (start < free) return;

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Tokyo",
  });
  const timeOnly = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Tokyo",
  });

  const keyValues = document.querySelectorAll(".byf-key-times b");
  if (keyValues[0]) keyValues[0].textContent = formatter.format(flight);
  if (keyValues[1]) keyValues[1].textContent = formatter.format(recommended);

  let cursor = new Date(start);
  let leaveAt = null;
  const timelineSteps = document.querySelectorAll(".byf-rich-step");
  plan.steps.forEach((step, index) => {
    if (/head to (haneda|narita|kansai) airport|travel to (haneda|narita|kansai) airport|proceed to airline check-in/i.test(step.label) && !leaveAt) {
      leaveAt = new Date(cursor);
    }
    const time = timelineSteps[index]?.querySelector("time");
    if (time) time.textContent = timeOnly.format(cursor);
    cursor = new Date(cursor.getTime() + Number(step.minutes || 0) * 60000);
  });
  if (!leaveAt) leaveAt = start;
  if (keyValues[2]) keyValues[2].textContent = formatter.format(leaveAt);

  document.querySelectorAll(".byf-deadline b").forEach((node) => {
    node.textContent = formatter.format(leaveAt);
  });
  const modelHeading = document.querySelector(".byf-model h2");
  if (modelHeading) modelHeading.textContent = `Your timeline for a ${formatter.format(flight)} ${airportCode} flight`;
  const modelIntro = document.querySelector(".byf-model h2 + p");
  if (modelIntro) modelIntro.textContent = "Calculated from the flight time and conditions you entered in the planner.";
})();
