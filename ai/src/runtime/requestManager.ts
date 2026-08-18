/** Bounded runtime implementation for request manager orchestration. */
import { randomUUID } from "node:crypto";
import type { BridgeToolRequest, BridgeToolResult } from "../contracts/tools.js";
import type { EngineEvent, IntelligenceRequestInput } from "../contracts/protocol.js";
import { IntelligenceError, IntelligenceOrchestrator } from "./orchestrator.js";
import { EngineTelemetry } from "../observability/telemetry.js";

interface PendingTool { request: BridgeToolRequest; resolve: (result: BridgeToolResult) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }
interface RequestState {
  id: string; sessionId: string; status: "running" | "complete" | "failed" | "cancelled"; events: EngineEvent[];
  listeners: Set<(event: EngineEvent) => void>; pendingTools: Map<string, PendingTool>; controller: AbortController; createdAt: number;
}

export class RequestManager {
  private readonly requests = new Map<string, RequestState>();
  constructor(private readonly orchestrator: IntelligenceOrchestrator, private readonly maximumActive: number, private readonly telemetry = new EngineTelemetry(), private readonly toolTimeoutMs = 30_000) {}

  create(input: IntelligenceRequestInput, sessionId: string): string {
    const active = [...this.requests.values()].filter((request) => request.status === "running").length;
    if (active >= this.maximumActive) throw new IntelligenceError("ENGINE_BUSY", "Kaizen Intelligence is already processing a request.", true);
    const id = randomUUID(), state: RequestState = { id, sessionId, status: "running", events: [], listeners: new Set(), pendingTools: new Map(), controller: new AbortController(), createdAt: Date.now() };
    this.requests.set(id, state); this.telemetry.requestStarted(); this.emit(state, { type: "request.started", requestId: id, at: new Date().toISOString() });
    void this.orchestrator.run(input, sessionId, id, (request, signal) => this.waitForTool(state, request, signal), (event) => this.emit(state, event), state.controller.signal)
      .then((response) => { state.status = "complete"; this.telemetry.requestCompleted(Date.now()-state.createdAt); this.emit(state, { type: "response.completed", response, at: new Date().toISOString() }); })
      .catch((error: unknown) => {
        if (state.controller.signal.aborted) { state.status = "cancelled"; this.telemetry.requestCancelled(Date.now()-state.createdAt); this.emit(state, { type: "request.cancelled", at: new Date().toISOString() }); return; }
        state.status = "failed"; const known = error instanceof IntelligenceError ? error : new IntelligenceError("ENGINE_FAILED", "Kaizen Intelligence encountered a local error.", true); this.telemetry.requestFailed(known.code,Date.now()-state.createdAt);
        this.emit(state, { type: "request.failed", code: known.code, message: known.message, retryable: known.retryable, at: new Date().toISOString() });
      });
    return id;
  }

  private waitForTool(state: RequestState, request: BridgeToolRequest, signal: AbortSignal): Promise<BridgeToolResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { state.pendingTools.delete(request.callId); reject(new IntelligenceError("TOOL_TIMEOUT", "The browser did not return tool data in time.", true)); }, this.toolTimeoutMs);
      const pending = { request, resolve: (result: BridgeToolResult) => { clearTimeout(timer); resolve(result); }, reject, timer };
      state.pendingTools.set(request.callId, pending);
      signal.addEventListener("abort", () => { clearTimeout(timer); state.pendingTools.delete(request.callId); reject(signal.reason); }, { once: true });
    });
  }

  submitToolResult(requestId: string, sessionId: string, result: BridgeToolResult): boolean {
    const state = this.requests.get(requestId); if (!state || state.sessionId !== sessionId || state.status !== "running") return false;
    const pending = state.pendingTools.get(result.callId); if (!pending || result.requestId !== requestId) return false;
    state.pendingTools.delete(result.callId); pending.resolve(result); return true;
  }

  subscribe(requestId: string, sessionId: string, listener: (event: EngineEvent) => void): (() => void) | null {
    const state = this.requests.get(requestId); if (!state || state.sessionId !== sessionId) return null;
    for (const event of state.events) listener(event); state.listeners.add(listener); return () => state.listeners.delete(listener);
  }

  cancel(requestId: string, sessionId: string): boolean {
    const state = this.requests.get(requestId); if (!state || state.sessionId !== sessionId || state.status !== "running") return false;
    state.controller.abort(new Error("cancelled")); for (const pending of state.pendingTools.values()) { clearTimeout(pending.timer); pending.reject(new Error("cancelled")); } state.pendingTools.clear(); return true;
  }

  metrics(){return this.telemetry.snapshot();}
  status(requestId: string, sessionId: string): RequestState["status"] | null { const state = this.requests.get(requestId); return state?.sessionId === sessionId ? state.status : null; }
  cleanup(maxAgeMs = 60 * 60_000, now = Date.now()): void { for (const [id, state] of this.requests) if (state.status !== "running" && now - state.createdAt > maxAgeMs) this.requests.delete(id); }
  private emit(state: RequestState, event: EngineEvent): void { if(event.type==="tool.requested")this.telemetry.toolCalled(); state.events.push(event); if (state.events.length > 500) state.events.shift(); for (const listener of state.listeners) listener(event); }
}
