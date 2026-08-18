#!/usr/bin/env node
/** Exercises authentication, CORS, payload, identifier, export, and 404 defenses. */
import assert from "node:assert/strict";

const base = process.env.TEST_API_URL ?? "http://127.0.0.1:4000";
const key = process.env.KAIZEN_API_KEY ?? "security-test-key";
let passed = 0;

async function request(path, options = {}) {
  const headers = { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.auth === false ? {} : { "x-kaizen-key": key }), ...(options.headers ?? {}) };
  return fetch(base + path, { ...options, headers });
}
function ok(condition, label) { assert.ok(condition, label); passed++; console.log(`✓ ${label}`); }

let r = await request("/api/health-check", { auth: false });
ok(r.status === 200, "public liveness endpoint works");
ok(r.headers.get("x-content-type-options") === "nosniff", "nosniff header present");
ok(r.headers.get("x-powered-by") === null, "framework disclosure header removed");
ok(!!r.headers.get("ratelimit"), "rate-limit headers present");

r = await request("/api/core/tasks", { auth: false });
ok(r.status === 401, "protected API rejects missing key");

r = await request("/api/core/tasks", { headers: { origin: "https://evil.example" } });
ok(r.status === 403, "CORS rejects untrusted browser origin");

r = await request("/api/core/tasks", { method: "POST", body: "[]" });
ok(r.status === 400, "CRUD rejects non-object JSON");

r = await request("/api/core/tasks", { method: "POST", body: '{"title":"x","__proto__":{"polluted":true}}' });
ok(r.status === 400, "prototype-pollution key rejected");

r = await request("/api/core/tasks", { method: "POST", body: JSON.stringify({ id: "../../escape", title: "x" }) });
ok(r.status === 400, "unsafe record id rejected");

r = await request("/api/core/tasks", { method: "POST", body: JSON.stringify({ id: "security-duplicate", title: "x" }) });
ok(r.status === 201, "valid authenticated create succeeds");
r = await request("/api/core/tasks", { method: "POST", body: JSON.stringify({ id: "security-duplicate", title: "overwrite" }) });
ok(r.status === 409, "duplicate IDs cannot overwrite records");
await request("/api/core/tasks/security-duplicate", { method: "DELETE" });

r = await request("/api/sessions", { method: "POST", body: JSON.stringify({ name: "=HYPERLINK(\"https://evil.example\")" }) });
assert.equal(r.status, 201);
const session = await r.json();
await request(`/api/sessions/${session.id}/sets`, { method: "POST", body: JSON.stringify({ blockId: "unknown", setIndex: 1, value: 5, weight: 10 }) });
await request(`/api/sessions/${session.id}/finish`, { method: "PATCH", body: "{}" });
r = await request("/api/export/csv");
const csv = await r.text();
ok(csv.includes("'=HYPERLINK"), "CSV formula injection is neutralised");
await request(`/api/sessions/${session.id}`, { method: "DELETE" });

r = await request("/api/does-not-exist");
ok(r.status === 404 && (await r.json()).error === "not found", "unknown API routes return bounded JSON 404");

console.log(`\n${passed} security checks passed.`);
