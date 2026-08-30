export const CONTACT_TYPES = Object.freeze({
  correction: "Information correction",
  feedback: "Service feedback",
  business: "Business or advertising inquiry",
  other: "Other inquiry",
});

const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s]+/gi;
const HTML_PATTERN = /<\/?[a-z][^>]*>/i;
const SCRIPT_PATTERN = /(?:javascript\s*:|data\s*:\s*text\/html|<\s*script|on\w+\s*=)/i;
const LONG_TOKEN_PATTERN = /\S{301,}/;

export function normalizeLine(value) {
  return String(value ?? "").replace(/[\r\n\0]+/g, " ").trim();
}

export function normalizeMessage(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\0/g, "")
    .trim();
}

export function validateContactPayload(input) {
  const data = {
    inquiryType: normalizeLine(input?.inquiryType),
    name: normalizeLine(input?.name),
    email: normalizeLine(input?.email).toLowerCase(),
    message: normalizeMessage(input?.message),
    website: normalizeLine(input?.website),
    turnstileToken: normalizeLine(input?.turnstileToken),
    startedAt: Number(input?.startedAt),
  };

  if (data.website) return { ok: false, bot: true, data };
  if (!CONTACT_TYPES[data.inquiryType]) return failure("inquiryType", data);
  if (data.name.length < 1 || data.name.length > 80) return failure("name", data);
  if (data.email.length > 254 || !EMAIL_PATTERN.test(data.email)) return failure("email", data);
  if (data.message.length < 30 || data.message.length > 2000) return failure("message", data);
  if ((data.message.match(URL_PATTERN) || []).length > 3) return failure("message", data);
  if (HTML_PATTERN.test(data.message) || SCRIPT_PATTERN.test(data.message)) return failure("message", data);
  if (LONG_TOKEN_PATTERN.test(data.message)) return failure("message", data);
  if (!data.turnstileToken || data.turnstileToken.length > 2048) return failure("turnstile", data);

  const now = Date.now();
  if (!Number.isFinite(data.startedAt) || now - data.startedAt < 3000 || now - data.startedAt > 7_200_000) {
    return failure("form", data);
  }

  return { ok: true, data };
}

function failure(field, data) {
  return { ok: false, field, data };
}

export function countRecentAttempts(attempts, now = Date.now(), windowMs = 900_000) {
  return (Array.isArray(attempts) ? attempts : []).filter(
    (timestamp) => Number.isFinite(timestamp) && timestamp > now - windowMs && timestamp <= now,
  );
}

export function buildPlainTextEmail(data, metadata) {
  return [
    "A new inquiry was submitted through Before You Fly Japan.",
    "",
    `Type: ${CONTACT_TYPES[data.inquiryType]}`,
    `Name: ${data.name}`,
    `Reply-to: ${data.email}`,
    `Submitted: ${metadata.submittedAt}`,
    `Country: ${metadata.country || "Unknown"}`,
    `Reference: ${metadata.reference}`,
    "",
    "Message:",
    data.message,
  ].join("\r\n");
}
