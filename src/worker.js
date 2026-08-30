import {
  CONTACT_TYPES,
  buildPlainTextEmail,
  countRecentAttempts,
  validateContactPayload,
} from "./contact-core.mjs";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export class ContactRateLimiter {
  constructor(state) {
    this.state = state;
  }

  async fetch() {
    const now = Date.now();
    const recent = countRecentAttempts(await this.state.storage.get("attempts"), now);
    if (recent.length >= 3) {
      return Response.json({ allowed: false }, { status: 429, headers: JSON_HEADERS });
    }
    recent.push(now);
    await this.state.storage.put("attempts", recent);
    return Response.json({ allowed: true }, { headers: JSON_HEADERS });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact/config" && request.method === "GET") {
      return json({
        enabled: Boolean(
          env.TURNSTILE_SITE_KEY &&
            env.TURNSTILE_SECRET_KEY &&
            env.CONTACT_TO &&
            env.CONTACT_FROM &&
            env.CONTACT_EMAIL &&
            env.CONTACT_RATE_LIMITER,
        ),
        siteKey: env.TURNSTILE_SITE_KEY || "",
      });
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") return json({ ok: false }, 405, { Allow: "POST" });
      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleContact(request, env) {
  if (!isConfigured(env)) return json({ ok: false, code: "unavailable" }, 503);

  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (origin !== expectedOrigin) return json({ ok: false }, 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return json({ ok: false }, 415);

  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 16_384) return json({ ok: false }, 413);

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > 16_384) return json({ ok: false }, 413);
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false }, 400);
  }

  const validated = validateContactPayload(payload);
  if (validated.bot) return json({ ok: true });
  if (!validated.ok) return json({ ok: false, code: "invalid", field: validated.field }, 400);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const turnstile = await verifyTurnstile(validated.data.turnstileToken, ip, env.TURNSTILE_SECRET_KEY);
  if (!turnstile.success) return json({ ok: false, code: "verification_failed" }, 400);
  if (turnstile.hostname && !["beforeyouflyjapan.com", "www.beforeyouflyjapan.com"].includes(turnstile.hostname)) {
    return json({ ok: false, code: "verification_failed" }, 400);
  }

  const ipKey = await sha256(ip);
  const limiter = env.CONTACT_RATE_LIMITER.get(env.CONTACT_RATE_LIMITER.idFromName(ipKey));
  const limitResponse = await limiter.fetch("https://contact-rate-limit.internal/check", { method: "POST" });
  if (!limitResponse.ok) return json({ ok: false, code: "rate_limited" }, 429);

  const reference = crypto.randomUUID();
  const text = buildPlainTextEmail(validated.data, {
    submittedAt: new Date().toISOString(),
    country: request.cf?.country,
    reference,
  });
  const subject = `[Before You Fly] ${CONTACT_TYPES[validated.data.inquiryType]}`;
  try {
    await env.CONTACT_EMAIL.send({
      from: { email: env.CONTACT_FROM, name: "Before You Fly Japan" },
      to: env.CONTACT_TO,
      replyTo: validated.data.email,
      subject,
      text,
    });
  } catch {
    return json({ ok: false, code: "unavailable" }, 503);
  }

  return json({ ok: true, reference });
}

async function verifyTurnstile(token, remoteIp, secret) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  body.append("remoteip", remoteIp);
  body.append("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!response.ok) return { success: false };
    return await response.json();
  } catch {
    return { success: false };
  }
}

function isConfigured(env) {
  return Boolean(
    env.TURNSTILE_SECRET_KEY &&
      env.CONTACT_TO &&
      env.CONTACT_FROM &&
      env.CONTACT_EMAIL &&
      env.CONTACT_RATE_LIMITER,
  );
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}
