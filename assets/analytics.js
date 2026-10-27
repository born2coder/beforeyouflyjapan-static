(function () {
  "use strict";
  const allowed = new Set(["plan_id", "airport", "starting_area", "available_minutes", "luggage_state", "reason", "results", "place", "link_path"]);
  window.BYFTrack = function (event, details = {}) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(event)) return;
    const params = {};
    Object.entries(details).forEach(([key, value]) => {
      if (allowed.has(key) && ["string", "number", "boolean"].includes(typeof value)) params[key] = typeof value === "string" ? value.slice(0, 100) : value;
    });
    if (typeof window.gtag === "function") window.gtag("event", event, params);
    else {
      window.dataLayer = window.dataLayer || [];
      (function () { window.dataLayer.push(arguments); })("event", event, params);
    }
  };
  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[data-byf-event]");
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    window.BYFTrack(link.dataset.byfEvent, { place: link.dataset.place || "", link_path: url.pathname });
  });
})();
