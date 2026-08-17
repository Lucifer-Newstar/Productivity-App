import type { DomainId, Sensitivity } from "./domain.js";
import type { ProviderToolDefinition } from "./provider.js";

export type ToolPermission = "read" | "analyze" | "suggest" | "act";

export interface ToolContract {
  name: string;
  version: string;
  description: string;
  permission: ToolPermission;
  domains: DomainId[];
  sensitivity: Sensitivity;
  inputSchema: Record<string, unknown>;
  outputContract: string;
  outputContractVersion: string;
  limits: { maxRecords: number; timeoutMs: number };
}

export interface BridgeToolRequest {
  requestId: string;
  sessionId: string;
  callId: string;
  tool: string;
  toolVersion: string;
  arguments: unknown;
  expectedContract: string;
  expectedContractVersion: string;
}

export interface BridgeToolResult {
  requestId: string;
  callId: string;
  status: "ok" | "denied" | "invalid" | "stale" | "error";
  snapshot?: unknown;
  error?: { code: string; message: string; retryable: boolean };
}

export const GET_TODAY_TOOL: ToolContract = {
  name: "get_today",
  version: "1.0",
  description: "Read the bounded current-day Kaizen context and deterministic next action.",
  permission: "read",
  domains: ["core", "notifications"],
  sensitivity: "personal",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      localDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      includeCompleted: { type: "boolean" },
      maximumItems: { type: "integer", minimum: 1, maximum: 100 },
    },
  },
  outputContract: "core.today",
  outputContractVersion: "1.0",
  limits: { maxRecords: 100, timeoutMs: 5_000 },
};

export function providerTool(contract: ToolContract): ProviderToolDefinition {
  return {
    type: "function",
    function: {
      name: contract.name,
      description: contract.description,
      parameters: contract.inputSchema,
    },
  };
}
