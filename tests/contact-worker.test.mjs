import assert from "node:assert/strict";
import test from "node:test";
import { handleContact, validatePayload } from "../worker.mjs";

const validPayload = {
  type: "general",
  name: "Alex Example",
  email: "alex@example.com",
  message: "I have a question about one of the departure-day plans.",
  website: "",
  turnstileToken: "test-token",
};

function request(payload, headers = {}) {
  return new Request("https://beforeyouflyjapan.com/api/contact", {
    method: "POST",
    headers: { Origin: "https://beforeyouflyjapan.com", "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

function env(overrides = {}) {
  return {
    RESEND_API_KEY: "test-key",
    CONTACT_TO_EMAIL: "owner@example.com",
    TURNSTILE_SECRET_KEY: "test-secret",
    CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: true }) },
    CONTACT_IP_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

test("validates expected fields", () => {
  assert.equal(validatePayload(validPayload).ok, true);
  assert.equal(validatePayload({ ...validPayload, type: "unknown" }).ok, false);
  assert.equal(validatePayload({ ...validPayload, email: "not-an-email" }).ok, false);
  assert.equal(validatePayload({ ...validPayload, message: "too short" }).ok, false);
  assert.equal(validatePayload({ ...validPayload, message: "https://a.test https://b.test https://c.test enough text" }).ok, false);
});

test("honeypot returns a silent success without external requests", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response(); };
  try {
    const response = await handleContact(request({ ...validPayload, website: "spam.example" }), env());
    assert.equal(response.status, 200);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects cross-origin and non-JSON submissions", async () => {
  const crossOrigin = await handleContact(request(validPayload, { Origin: "https://attacker.example" }), env());
  assert.equal(crossOrigin.status, 403);

  const wrongType = new Request("https://beforeyouflyjapan.com/api/contact", {
    method: "POST",
    headers: { Origin: "https://beforeyouflyjapan.com", "Content-Type": "text/plain" },
    body: "test",
  });
  assert.equal((await handleContact(wrongType, env())).status, 415);
});

test("verifies Turnstile then sends with a domain-restricted sender", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "beforeyouflyjapan.com" });
    }
    if (String(url).includes("api.resend.com")) return Response.json({ id: "email-id" });
    throw new Error("Unexpected URL");
  };
  try {
    const response = await handleContact(request(validPayload, { "CF-Connecting-IP": "203.0.113.10" }), env());
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    const email = JSON.parse(calls[1].options.body);
    assert.equal(email.from, "Before You Fly Japan <contact@notify.beforeyouflyjapan.com>");
    assert.deepEqual(email.to, ["owner@example.com"]);
    assert.equal(email.reply_to, "alex@example.com");
    assert.doesNotMatch(email.html, /<script/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns 429 when a rate-limit binding rejects the request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).includes("siteverify")
    ? Response.json({ success: true, action: "contact", hostname: "beforeyouflyjapan.com" })
    : Response.json({ id: "unexpected" });
  try {
    const response = await handleContact(request(validPayload), env({
      CONTACT_EMAIL_RATE_LIMIT: { limit: async () => ({ success: false }) },
    }));
    assert.equal(response.status, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("escapes visitor content before building the HTML email", async () => {
  const originalFetch = globalThis.fetch;
  let email;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes("siteverify")) {
      return Response.json({ success: true, action: "contact", hostname: "beforeyouflyjapan.com" });
    }
    email = JSON.parse(options.body);
    return Response.json({ id: "email-id" });
  };
  try {
    const response = await handleContact(request({
      ...validPayload,
      name: "<b>Alex</b>",
      message: "Please check this <script>alert('x')</script> itinerary item.",
    }), env());
    assert.equal(response.status, 200);
    assert.match(email.html, /&lt;b&gt;Alex&lt;\/b&gt;/);
    assert.match(email.html, /&lt;script&gt;alert\(&#039;x&#039;\)&lt;\/script&gt;/);
    assert.doesNotMatch(email.html, /<script/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
