/** Regression coverage for the deterministic application provider and closed model boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.js";
import { MockGenerationProvider } from "../src/providers/mock.js";
import { ProviderRegistry } from "../src/providers/registry.js";

const metadata = { constitutionVersion: "KAC-1", promptVersion: "1.1", toolSchemaVersion: "core.today.interpreter@1.0" };

test("application configuration defaults to deterministic and rejects model settings", () => {
  assert.throws(() => loadConfig({ KAIZEN_AI_HOST: "0.0.0.0" }), /loopback/);
  assert.throws(() => loadConfig({ KAIZEN_AI_PROVIDER: "llama" }), /No model provider is approved/);
  assert.throws(() => loadConfig({ KAIZEN_LLAMA_BASE_URL: "http://127.0.0.1:8080" }), /no model provider is approved/);
  const config = loadConfig({ KAIZEN_AI_PORT: "4318" });
  assert.equal(config.port, 4318);
  assert.equal(config.provider, "mock");
  assert.equal(new ProviderRegistry(config).generation.identity().providerId, "kaizen-mock");
});

test("deterministic provider interprets evidence with no model tool authority", async () => {
  const provider = new MockGenerationProvider(), signal = new AbortController().signal;
  assert.equal(provider.capabilities().nativeToolCalling, false);
  const envelope = { evidence: { data: { tasks: [{ id: "t1", title: "Ship auth" }], deterministicNextAction: { sourceId: "t1", title: "Ship auth", reason: "Due today" } } } };
  const response = await provider.generate({ requestId: "r1", messages: [{ role: "system", content: "deterministic" }, { role: "user", content: JSON.stringify(envelope) }], temperature: 0, maxOutputTokens: 100, metadata }, signal);
  assert.match(response.text, /Ship auth/);
  assert.deepEqual(response.toolCalls, []);
  await assert.rejects(() => provider.generate({ requestId: "r2", messages: [{ role: "user", content: "{}" }], tools: [{ type: "function", function: { name: "get_today", description: "forbidden", parameters: {} } }], temperature: 0, maxOutputTokens: 100, metadata }, signal), /does not accept model tool authority/);
});
