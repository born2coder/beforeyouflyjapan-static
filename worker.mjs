const CONTACT_TYPES = Object.freeze({
  general: "General question",
  correction: "Report a correction",
  hotel: "Hotels and hostels",
  partnership: "Media or partnership",
});

const MAX_BODY_BYTES = 16_384;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 3_000;
const MIN_MESSAGE_LENGTH = 20;
const MAX_URLS = 2;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validEmail(value) {
  if (!value || value.length > MAX_EMAIL_LENGTH || /[\r\n]/.test(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function countUrls(value) {
  return (value.match(/(?:https?:\/\/|www\.)[^\s<]+/gi) || []).length;
}

function validatePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, message: "Invalid request." };
  }

  const type = normalizeText(input.type);
  const name = normalizeText(input.name);
  const email = normalizeText(input.email).toLowerCase();
  const message = normalizeText(input.message);
  const website = normalizeText(input.website);
  const turnstileToken = normalizeText(input.turnstileToken);

  if (website) return { ok: false, silent: true };
  if (!Object.hasOwn(CONTACT_TYPES, type)) return { ok: false, message: "Choose an enquiry type." };
  if (!name || name.length > MAX_NAME_LENGTH || /[\r\n]/.test(name)) {
    return { ok: false, message: "Enter a valid name." };
  }
  if (!validEmail(email)) return { ok: false, message: "Enter a valid reply email." };
  if (message.length < MIN_MESSAGE_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, message: `Your message must be ${MIN_MESSAGE_LENGTH}–${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (countUrls(message) > MAX_URLS) {
    return { ok: false, message: `Please include no more than ${MAX_URLS} links.` };
  }
  if (!turnstileToken || turnstileToken.length > 2_048) {
    return { ok: false, message: "Please complete the security check." };
  }

  return { ok: true, value: { type, name, email, message, turnstileToken } };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

async function hashKey(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimits(env, email, ip) {
  if (!env.CONTACT_EMAIL_RATE_LIMIT || !env.CONTACT_IP_RATE_LIMIT) {
    throw new Error("Contact rate-limit bindings are missing");
  }

  const [emailKey, ipKey] = await Promise.all([
    hashKey(`email:${email}`),
    hashKey(`ip:${ip || "unknown"}`),
  ]);
  const [emailResult, ipResult] = await Promise.all([
    env.CONTACT_EMAIL_RATE_LIMIT.limit({ key: emailKey }),
    env.CONTACT_IP_RATE_LIMIT.limit({ key: ipKey }),
  ]);
  return emailResult.success && ipResult.success;
}

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) throw new Error("TURNSTILE_SECRET_KEY is missing");

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true
    && result.action === "contact"
    && ["beforeyouflyjapan.com", "www.beforeyouflyjapan.com"].includes(result.hostname);
}

async function sendContactEmail(env, contact) {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    throw new Error("Contact email secrets are missing");
  }

  const typeLabel = CONTACT_TYPES[contact.type];
  const subject = `[Before You Fly Japan] ${typeLabel}`;
  const text = [
    `Enquiry type: ${typeLabel}`,
    `Name: ${contact.name}`,
    `Reply email: ${contact.email}`,
    "",
    contact.message,
  ].join("\n");
  const html = `
    <h2>${escapeHtml(typeLabel)}</h2>
    <p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>
    <p><strong>Reply email:</strong> ${escapeHtml(contact.email)}</p>
    <hr>
    <p>${escapeHtml(contact.message).replace(/\n/g, "<br>")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      from: "Before You Fly Japan <contact@notify.beforeyouflyjapan.com>",
      to: [env.CONTACT_TO_EMAIL],
      reply_to: contact.email,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

async function handleContact(request, env) {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const requestUrl = new URL(request.url);
  if (request.headers.get("Origin") !== requestUrl.origin) {
    return json({ error: "Request origin is not allowed." }, 403);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Content type must be JSON." }, 415);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);

  let raw;
  try {
    raw = await request.text();
  } catch {
    return json({ error: "Could not read the request." }, 400);
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: "Request is too large." }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const validation = validatePayload(payload);
  if (!validation.ok) {
    if (validation.silent) return json({ ok: true });
    return json({ error: validation.message }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  try {
    const turnstileValid = await verifyTurnstile(env, validation.value.turnstileToken, ip);
    if (!turnstileValid) return json({ error: "The security check expired. Please try again." }, 400);

    const withinLimit = await checkRateLimits(env, validation.value.email, ip);
    if (!withinLimit) {
      return json({ error: "Too many messages were sent. Please wait before trying again." }, 429);
    }

    await sendContactEmail(env, validation.value);
    return json({ ok: true });
  } catch (error) {
    console.error("Contact form delivery failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "We could not send your message right now. Please try again later." }, 503);
  }
}

function handleConfig(env) {
  const siteKey = typeof env.TURNSTILE_SITE_KEY === "string" ? env.TURNSTILE_SITE_KEY.trim() : "";
  return json({ configured: Boolean(siteKey), siteKey: siteKey || undefined });
}

export { CONTACT_TYPES, countUrls, handleContact, validatePayload };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact/config" && request.method === "GET") return handleConfig(env);
    if (pathname === "/api/contact") return handleContact(request, env);
    return env.ASSETS.fetch(request);
  },
};
