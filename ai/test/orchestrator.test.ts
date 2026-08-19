/** Regression coverage for the orchestrator.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { MockGenerationProvider } from "../src/providers/mock.js";
import { IntelligenceOrchestrator } from "../src/runtime/orchestrator.js";
import type { BridgeToolResult } from "../src/contracts/tools.js";

const snapshot = {
  contract: "core.today", contractVersion: "1.0", domain: "core", snapshotId: "epoch:core.1",
  revision: { installationEpoch: "epoch", domains: { core: 1 } }, capturedAt: new Date().toISOString(), timezone: "Asia/Kolkata", sensitivity: "personal", trust: "kaizen-derived",
  data: { localDate: "2026-08-17", tasks: [{ id: "t1", title: "Ship auth", space: "projects", priority: "high", completed: false }], scheduled: [], deterministicNextAction: { sourceId: "t1", title: "Ship auth", reason: "Due today", algorithmVersion: "1" }, attention: [] }, analytics: [], redactions: [],
};

test("orchestrator grounds a response through get_today", async () => {
  const orchestrator = new IntelligenceOrchestrator(new MockGenerationProvider(), 5_000), events: string[] = [];
  const response = await orchestrator.run({ intent: "focus-today", localDate: "2026-08-17", permissions: { mode: "local", domains: ["core", "notifications"], healthConsent: false, tools: ["get_today"] } }, "session", "request", async (toolRequest) => ({ requestId: "request", callId: toolRequest.callId, status: "ok", snapshot } as BridgeToolResult), (event) => events.push(event.type), new AbortController().signal);
  assert.equal(response.title, "Ship auth");
  assert.equal(response.sources[0]?.entityId, "t1");
  assert.deepEqual(events, ["tool.requested", "tool.completed", "generation.delta"]);
});

test("orchestrator rejects unavailable tool permission", async () => {
  const orchestrator = new IntelligenceOrchestrator(new MockGenerationProvider(), 5_000);
  await assert.rejects(() => orchestrator.run({ intent: "focus-today", localDate: "2026-08-17", permissions: { mode: "local", domains: [], healthConsent: false, tools: [] } }, "s", "r", async () => { throw new Error(); }, () => {}, new AbortController().signal), /permission/);
});
