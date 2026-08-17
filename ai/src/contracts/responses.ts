import type { ContentTrust, DomainId, RevisionVector } from "./domain.js";
import type { ModelIdentity } from "./provider.js";

export interface SourceReference {
  sourceId: string;
  domain: DomainId;
  entityType: string;
  entityId: string;
  label: string;
  observedAt?: string;
  snapshotId: string;
  trust: Exclude<ContentTrust, "system">;
}

export interface RationaleItem {
  claim: string;
  sourceIds: string[];
  kind: "fact" | "deterministic-result" | "inference" | "assumption";
}

export interface DataFreshness {
  generatedAt: string;
  snapshots: Array<{ domain: DomainId; snapshotId: string; revision: RevisionVector; capturedAt: string }>;
  staleDomains: DomainId[];
  unavailableDomains: DomainId[];
}

export interface IntelligenceResponse {
  schemaVersion: "1.0";
  responseId: string;
  sessionId: string;
  type: "answer" | "brief" | "recommendation" | "plan" | "proposal";
  title: string;
  summary: string;
  rationale: RationaleItem[];
  confidence: number;
  uncertainty: string[];
  assumptions: string[];
  sources: SourceReference[];
  freshness: DataFreshness;
  generatedAt: string;
  model: ModelIdentity;
  promptVersion: string;
  constitutionVersion: string;
}

export const INTELLIGENCE_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["type", "title", "summary", "rationale", "confidence", "uncertainty", "assumptions", "sourceIds"],
  properties: {
    type: { enum: ["answer", "brief", "recommendation", "plan"] },
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
          sourceIds: { type: "array", maxItems: 12, items: { type: "string" } },
          kind: { enum: ["fact", "deterministic-result", "inference", "assumption"] },
        },
      },
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    uncertainty: { type: "array", maxItems: 12, items: { type: "string" } },
    assumptions: { type: "array", maxItems: 12, items: { type: "string" } },
    sourceIds: { type: "array", maxItems: 50, items: { type: "string" } },
  },
} as const;
