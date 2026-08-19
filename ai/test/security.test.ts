/** Regression coverage for the security.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { PairingManager } from "../src/security/pairing.js";
import { assertSafeJson } from "../src/security/json.js";
import { FixedWindowLimiter } from "../src/security/rateLimit.js";

test("pairing is one-time, expiring and scoped read-only", () => {
  const pairing = new PairingManager(100, 200, 1_000);
  assert.equal(pairing.pair("wrong", 1_010), null);
  const session = pairing.pair(pairing.pairingCode, 1_010); assert.ok(session);
  assert.equal(pairing.pair(pairing.pairingCode, 1_011), null);
  assert.deepEqual(session.permissions.tools, ["get_today"]);
  assert.equal(pairing.authorize(session.token, 1_100)?.permissions.healthConsent, false);
  assert.equal(pairing.authorize(session.token, 1_211), null);
});

test("unsafe JSON and rate excess fail closed", () => {
  const polluted = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => assertSafeJson(polluted), /unsafe object key/);
  const limiter = new FixedWindowLimiter(2, 1000);
  assert.equal(limiter.allow("client", 0), true);
  assert.equal(limiter.allow("client", 1), true);
  assert.equal(limiter.allow("client", 2), false);
  assert.equal(limiter.allow("client", 1001), true);
});
