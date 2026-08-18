/** Regression coverage for the provider.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { MockGenerationProvider } from "../src/providers/mock.js";
import { loadConfig } from "../src/config.js";

test("config rejects network exposure and arbitrary model hosts", () => {
  assert.throws(() => loadConfig({ KAIZEN_AI_HOST: "0.0.0.0" }), /loopback/);
  assert.throws(() => loadConfig({ KAIZEN_LLAMA_BASE_URL: "https://example.com" }), /loopback/);
  assert.equal(loadConfig({ KAIZEN_AI_PORT: "4318" }).port, 4318);
});

test("mock provider performs get_today tool round trip", async () => {
  const provider = new MockGenerationProvider(); const signal = new AbortController().signal;
  const first = await provider.generate({ requestId: "r1", messages: [{ role: "system", content: "test" }, { role: "user", content: "focus" }], tools: [{ type: "function", function: { name: "get_today", description: "today", parameters: { type: "object" } } }], temperature: 0, maxOutputTokens: 100, metadata: { constitutionVersion: "KAC-1", promptVersion: "1", toolSchemaVersion: "1" } }, signal);
  assert.equal(first.toolCalls[0]?.name, "get_today");
  const second = await provider.generate({ requestId: "r1", messages: [{ role: "system", content: "test" }, { role: "user", content: "focus" }, { role: "tool", toolCallId: first.toolCalls[0]?.id, content: JSON.stringify({ snapshot: { data: { deterministicNextAction: { sourceId: "t1", title: "Ship auth", reason: "Due today" } } } }) }], temperature: 0, maxOutputTokens: 100, metadata: { constitutionVersion: "KAC-1", promptVersion: "1", toolSchemaVersion: "1" } }, signal);
  assert.match(second.text, /Ship auth/);
  assert.deepEqual(second.toolCalls, []);
});
