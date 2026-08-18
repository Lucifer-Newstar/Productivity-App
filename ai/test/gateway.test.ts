/** Regression coverage for the gateway.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { loadConfig } from "../src/config.js";
import { createEngineGateway } from "../src/gateway.js";

const ORIGIN = "http://localhost:3000";

async function jsonBody(response: Response): Promise<any> { return response.json(); }

class SseReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>;
  private readonly decoder = new TextDecoder();
  private buffer = "";
  constructor(response: Response) { assert.ok(response.body); this.reader = response.body!.getReader(); }
  async until(type: string): Promise<any> {
    for (;;) {
      const blocks = this.buffer.split("\n\n"); this.buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const event = block.split("\n").find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = block.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
        if (event === type && data) return JSON.parse(data);
      }
      const { value, done } = await this.reader.read(); if (done) throw new Error(`SSE ended before ${type}`);
      this.buffer += this.decoder.decode(value, { stream: true });
    }
  }
  cancel(): Promise<void> { return this.reader.cancel(); }
}

test("secure gateway completes the read-only get_today flow", async () => {
  const config = loadConfig({ KAIZEN_AI_PROVIDER: "mock", KAIZEN_AI_ORIGINS: ORIGIN, KAIZEN_AI_REQUEST_TIMEOUT_MS: "5000" });
  const gateway = createEngineGateway(config); await new Promise<void>((resolve) => gateway.server.listen(0, "127.0.0.1", resolve));
  const port = (gateway.server.address() as AddressInfo).port, base = `http://127.0.0.1:${port}`;
  try {
    const evil = await fetch(`${base}/v1/pair`, { method: "POST", headers: { origin: "https://evil.example", "x-kaizen-pairing-code": gateway.pairingCode } });
    assert.equal(evil.status, 403);
    const pair = await fetch(`${base}/v1/pair`, { method: "POST", headers: { origin: ORIGIN, "x-kaizen-pairing-code": gateway.pairingCode } });
    assert.equal(pair.status, 200); const paired = await jsonBody(pair); const auth = { origin: ORIGIN, authorization: `Bearer ${paired.sessionToken}` };
    const denied = await fetch(`${base}/v1/status`, { headers: { origin: ORIGIN } }); assert.equal(denied.status, 401);
    const created = await fetch(`${base}/v1/requests`, { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ prompt: "What should I focus on?", intent: "focus-today", permissions: { healthConsent: true } }) });
    assert.equal(created.status, 202); const { requestId } = await jsonBody(created);
    const eventResponse = await fetch(`${base}/v1/requests/${requestId}/events`, { headers: auth }); assert.equal(eventResponse.status, 200); const events = new SseReader(eventResponse);
    const tool = await events.until("tool.requested"); assert.equal(tool.request.tool, "get_today");
    const snapshot = { contract: "core.today", contractVersion: "1.0", domain: "core", snapshotId: "epoch:core.1", revision: { installationEpoch: "epoch", domains: { core: 1 } }, capturedAt: new Date().toISOString(), timezone: "Asia/Kolkata", sensitivity: "personal", trust: "kaizen-derived", data: { localDate: "2026-08-17", tasks: [{ id: "t1", title: "Ship auth", space: "projects", priority: "high", completed: false }], scheduled: [], deterministicNextAction: { sourceId: "t1", title: "Ship auth", reason: "Due today", algorithmVersion: "1" }, attention: [] }, analytics: [], redactions: [] };
    const submitted = await fetch(`${base}/v1/requests/${requestId}/tool-results`, { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ requestId, callId: tool.request.callId, status: "ok", snapshot }) });
    assert.equal(submitted.status, 204);
    const complete = await events.until("response.completed"); assert.equal(complete.response.title, "Ship auth"); assert.equal(complete.response.sources[0].entityId, "t1"); assert.equal(complete.response.model.providerId, "kaizen-mock");
    await events.cancel();
    const metricsResponse=await fetch(`${base}/v1/metrics`,{headers:auth});const metrics=await metricsResponse.json();assert.equal(metrics.requestsCompleted,1);assert.equal(metrics.toolCalls,1);assert.equal(JSON.stringify(metrics).includes("Ship auth"),false);
    const revoke = await fetch(`${base}/v1/session`, { method: "DELETE", headers: auth }); assert.equal(revoke.status, 204);
    const expired = await fetch(`${base}/v1/status`, { headers: auth }); assert.equal(expired.status, 401);
  } finally { await new Promise<void>((resolve) => gateway.server.close(() => resolve())); }
});
