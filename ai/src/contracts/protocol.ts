/** Versioned Intelligence Engine contracts for protocol data. */
import type { BridgeToolRequest, BridgeToolResult } from "./tools.js";
import type { IntelligenceResponse } from "./responses.js";

export type EngineStatus =
  | { state: "offline" }
  | { state: "starting"; startedAt: string }
  | { state: "loading-model"; modelLabel: string; progress?: number }
  | { state: "ready"; modelLabel: string }
  | { state: "busy"; requestId: string; cancellable: boolean }
  | { state: "failed"; code: string; message: string };

export interface SessionPermissions {
  mode: "local";
  domains: string[];
  healthConsent: boolean;
  tools: string[];
}

export interface IntelligenceRequestInput {
  intent: "focus-today";
  localDate: string;
  permissions: SessionPermissions;
}

export type EngineEvent =
  | { type: "request.started"; requestId: string; at: string }
  | { type: "tool.requested"; request: BridgeToolRequest; at: string }
  | { type: "tool.completed"; result: BridgeToolResult; at: string }
  | { type: "generation.delta"; text: string; at: string }
  | { type: "response.completed"; response: IntelligenceResponse; at: string }
  | { type: "request.failed"; code: string; message: string; retryable: boolean; at: string }
  | { type: "request.cancelled"; at: string };

export interface PublicError {
  error: { code: string; message: string; retryable: boolean; correlationId: string };
}
