import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlainTextEmail,
  countRecentAttempts,
  validateContactPayload,
} from "../src/contact-core.mjs";

function validPayload(overrides = {}) {
  return {
    inquiryType: "feedback",
    name: "Taylor Visitor",
    email: "Taylor@example.com",
    message: "This is a useful service and I wanted to share detailed feedback.",
    website: "",
    turnstileToken: "valid-token",
    startedAt: Date.now() - 5000,
    ...overrides,
  };
}

test("accepts a valid inquiry and normalizes the email", () => {
  const result = validateContactPayload(validPayload());
  assert.equal(result.ok, true);
  assert.equal(result.data.email, "taylor@example.com");
});

test("rejects unknown inquiry types", () => {
  assert.equal(validateContactPayload(validPayload({ inquiryType: "sales" })).field, "inquiryType");
});

test("treats a filled honeypot as a bot", () => {
  const result = validateContactPayload(validPayload({ website: "https://spam.invalid" }));
  assert.equal(result.bot, true);
});

test("rejects malformed email addresses and header newlines", () => {
  assert.equal(validateContactPayload(validPayload({ email: "a@example.com\nBcc: x@example.com" })).field, "email");
});

test("enforces message length", () => {
  assert.equal(validateContactPayload(validPayload({ message: "Too short" })).field, "message");
  assert.equal(validateContactPayload(validPayload({ message: "x".repeat(2001) })).field, "message");
});

test("rejects HTML, scripts, too many links, and abnormal tokens", () => {
  assert.equal(validateContactPayload(validPayload({ message: "Please review <strong>this correction in the guide</strong>." })).field, "message");
  assert.equal(validateContactPayload(validPayload({ message: "Please check javascript:alert(1) because this content looks unsafe." })).field, "message");
  assert.equal(validateContactPayload(validPayload({ message: "https://a.test https://b.test https://c.test https://d.test" })).field, "message");
  assert.equal(validateContactPayload(validPayload({ message: `Feedback ${"x".repeat(301)}` })).field, "message");
});

test("rejects implausibly fast or stale submissions", () => {
  assert.equal(validateContactPayload(validPayload({ startedAt: Date.now() })).field, "form");
  assert.equal(validateContactPayload(validPayload({ startedAt: Date.now() - 7_200_001 })).field, "form");
});

test("keeps only attempts inside the rolling 15-minute window", () => {
  const now = 2_000_000;
  assert.deepEqual(countRecentAttempts([now - 900_001, now - 899_999, now, now + 1], now), [now - 899_999, now]);
});

test("builds a plain-text notification without an automatic reply", () => {
  const data = validateContactPayload(validPayload()).data;
  const body = buildPlainTextEmail(data, {
    submittedAt: "2026-08-30T00:00:00.000Z",
    country: "JP",
    reference: "abc-123",
  });
  assert.match(body, /Service feedback/);
  assert.match(body, /Reference: abc-123/);
  assert.match(body, /Reply-to: taylor@example.com/);
});
