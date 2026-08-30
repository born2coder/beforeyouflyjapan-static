(() => {
  const form = document.querySelector("#contact-form");
  const button = document.querySelector("#submit-button");
  const status = document.querySelector("#form-status");
  const turnstileContainer = document.querySelector("#turnstile");
  if (!form || !button || !status || !turnstileContainer) return;

  let startedAt = Date.now();
  let widgetId = null;
  let ready = false;

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.dataset.kind = kind;
  };

  const loadScript = () => new Promise((resolve, reject) => {
    if (window.turnstile) return resolve();
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  const initialize = async () => {
    try {
      const response = await fetch("/api/contact/config", { headers: { Accept: "application/json" }, cache: "no-store" });
      const config = await response.json();
      if (!response.ok || !config.enabled || !config.siteKey) throw new Error("unavailable");
      await loadScript();
      widgetId = window.turnstile.render(turnstileContainer, {
        sitekey: config.siteKey,
        theme: "auto",
        appearance: "interaction-only",
        "error-callback": () => setStatus("Bot verification could not load. Please refresh this page.", "error"),
        "expired-callback": () => setStatus("Verification expired. Please complete it again.", "error"),
      });
      ready = true;
      button.disabled = false;
      setStatus("The secure form is ready.");
    } catch {
      setStatus("The contact form is temporarily unavailable. Please try again later.", "error");
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ready || widgetId === null) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const message = form.elements.message.value.trim();
    if (message.length < 30) {
      setStatus("Please enter at least 30 characters in your message.", "error");
      form.elements.message.focus();
      return;
    }

    const turnstileToken = window.turnstile.getResponse(widgetId);
    if (!turnstileToken) {
      setStatus("Please complete the bot verification before sending.", "error");
      return;
    }

    button.disabled = true;
    setStatus("Sending your inquiry…");

    const payload = {
      inquiryType: form.elements.inquiryType.value,
      name: form.elements.name.value,
      email: form.elements.email.value,
      message,
      website: form.elements.website.value,
      startedAt,
      turnstileToken,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        if (result.code === "rate_limited") throw new Error("Too many submissions. Please wait 15 minutes and try again.");
        if (result.code === "verification_failed") throw new Error("Bot verification failed. Please try again.");
        if (result.code === "invalid") throw new Error("Please review the form. HTML, very long text strings, and more than three links are not accepted.");
        throw new Error("Your inquiry could not be sent. Please try again later.");
      }

      form.reset();
      startedAt = Date.now();
      window.turnstile.reset(widgetId);
      setStatus(`Thank you. Your inquiry was sent. Reference: ${result.reference || "received"}`, "success");
    } catch (error) {
      window.turnstile.reset(widgetId);
      setStatus(error.message || "Your inquiry could not be sent. Please try again later.", "error");
    } finally {
      button.disabled = false;
    }
  });

  initialize();
})();
