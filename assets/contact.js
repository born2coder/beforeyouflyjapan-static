(function () {
  "use strict";

  const form = document.querySelector("#byf-contact-form");
  const submit = document.querySelector("#byf-contact-submit");
  const status = document.querySelector("#byf-contact-status");
  const widget = document.querySelector("#byf-turnstile");
  if (!form || !submit || !status || !widget) return;

  let turnstileToken = "";
  let widgetId = null;

  function setStatus(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind || "";
  }

  function waitForTurnstile(siteKey, attempts) {
    if (window.turnstile && typeof window.turnstile.render === "function") {
      widgetId = window.turnstile.render(widget, {
        sitekey: siteKey,
        action: "contact",
        theme: "light",
        callback: function (token) {
          turnstileToken = token;
          submit.disabled = false;
          setStatus("", "");
        },
        "expired-callback": function () {
          turnstileToken = "";
          submit.disabled = true;
          setStatus("The security check expired. Please complete it again.", "error");
        },
        "error-callback": function () {
          turnstileToken = "";
          submit.disabled = true;
          setStatus("The security check could not load. Please refresh this page.", "error");
        },
      });
      return;
    }
    if (attempts <= 0) {
      setStatus("The security check could not load. Please refresh this page.", "error");
      return;
    }
    window.setTimeout(function () { waitForTurnstile(siteKey, attempts - 1); }, 250);
  }

  fetch("/api/contact/config", { headers: { Accept: "application/json" } })
    .then(function (response) { return response.ok ? response.json() : Promise.reject(new Error("config")); })
    .then(function (config) {
      if (!config.configured || !config.siteKey) throw new Error("not configured");
      waitForTurnstile(config.siteKey, 40);
    })
    .catch(function () {
      setStatus("The contact form is temporarily unavailable. Please try again later.", "error");
    });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!turnstileToken) {
      setStatus("Please complete the security check.", "error");
      return;
    }

    submit.disabled = true;
    setStatus("Sending your message…", "working");
    const data = new FormData(form);
    const payload = {
      type: data.get("type"),
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message"),
      website: data.get("website"),
      turnstileToken: turnstileToken,
    };

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          if (!response.ok) throw new Error(body.error || "We could not send your message.");
          return body;
        });
      })
      .then(function () {
        form.reset();
        turnstileToken = "";
        if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
        setStatus("Thank you. Your message has been sent.", "success");
      })
      .catch(function (error) {
        turnstileToken = "";
        if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
        setStatus(error.message || "We could not send your message. Please try again.", "error");
      });
  });
})();
