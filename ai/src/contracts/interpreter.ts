/** Frozen v0.1.1 wire contracts for trusted Core Today routing and model interpretation. */
import type { DomainSnapshot, TodayContextV1 } from "./domain.js";

export const TODAY_INTERPRETER_CONTRACT_VERSION = "1.0" as const;
export const TODAY_INTERPRETER_CAPABILITY = "core.today.interpret" as const;

export interface DeterministicTodayRouteV1 {
  schemaVersion: "1.0";
  routeId: string;
  capability: "core.today.interpret";
  intent: "focus-today";
  selectedBy: "kaizen-deterministic-router";
  tool: {
    name: "get_today";
    version: "1.0";
    arguments: {
      localDate: string;
      includeCompleted: false;
      maximumItems: number;
    };
  };
  evidenceContract: "core.today@1.0";
  allowedDomains: ["core"];
  modelToolAccess: "none";
}

export type CoreTodayEvidenceV1 = DomainSnapshot<TodayContextV1> & {
  contract: "core.today";
  contractVersion: "1.0";
  domain: "core";
};

export interface TodayInterpreterRequestV1 {
  schemaVersion: "1.0";
  route: DeterministicTodayRouteV1;
  evidence: CoreTodayEvidenceV1;
  providerPolicy: {
    tools: "forbidden";
    additionalRetrieval: "forbidden";
    memory: "forbidden";
    writes: "forbidden";
  };
}

export interface TodayInterpreterResponseV1 {
  type: "recommendation";
  title: string;
  summary: string;
  rationale: Array<{
    claim: string;
    sourceIds: string[];
    kind: "fact" | "deterministic-result" | "inference" | "assumption";
  }>;
  confidence: number;
  uncertainty: string[];
  assumptions: string[];
  sourceIds: string[];
}

export const DETERMINISTIC_TODAY_ROUTE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "routeId", "capability", "intent", "selectedBy", "tool", "evidenceContract", "allowedDomains", "modelToolAccess"],
  properties: {
    schemaVersion: { const: "1.0" },
    routeId: { type: "string", minLength: 1, maxLength: 128 },
    capability: { const: "core.today.interpret" },
    intent: { const: "focus-today" },
    selectedBy: { const: "kaizen-deterministic-router" },
    tool: {
      type: "object",
      additionalProperties: false,
      required: ["name", "version", "arguments"],
      properties: {
        name: { const: "get_today" },
        version: { const: "1.0" },
        arguments: {
          type: "object",
          additionalProperties: false,
          required: ["localDate", "includeCompleted", "maximumItems"],
          properties: {
            localDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            includeCompleted: { const: false },
            maximumItems: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
      },
    },
    evidenceContract: { const: "core.today@1.0" },
    allowedDomains: {
      type: "array",
      minItems: 1,
      maxItems: 1,
      prefixItems: [{ const: "core" }],
      items: false,
    },
    modelToolAccess: { const: "none" },
  },
} as const;

export const TODAY_INTERPRETER_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "title", "summary", "rationale", "confidence", "uncertainty", "assumptions", "sourceIds"],
  properties: {
    type: { const: "recommendation" },
    title: { type: "string", minLength: 1, maxLength: 160 },
    summary: { type: "string", minLength: 1, maxLength: 2_000 },
    rationale: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "sourceIds", "kind"],
        properties: {
          claim: { type: "string", minLength: 1, maxLength: 500 },
          sourceIds: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 128 } },
          kind: { enum: ["fact", "deterministic-result", "inference", "assumption"] },
        },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertainty: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 500 } },
    assumptions: { type: "array", maxItems: 12, items: { type: "string", minLength: 1, maxLength: 500 } },
    sourceIds: { type: "array", maxItems: 50, uniqueItems: true, items: { type: "string", minLength: 1, maxLength: 128 } },
  },
} as const;
