/** Runs the bounded read-only tool loop and projects only source-verified responses. */
import { randomUUID } from "node:crypto";
import type { DomainSnapshot, TodayContextV1, DomainId } from "../contracts/domain.js";
import type { IntelligenceRequestInput, EngineEvent } from "../contracts/protocol.js";
import type { IntelligenceResponse, SourceReference } from "../contracts/responses.js";
import type { BridgeToolRequest, BridgeToolResult } from "../contracts/tools.js";
import type { GenerationProvider, ProviderMessage } from "../contracts/provider.js";
import { INTELLIGENCE_RESPONSE_SCHEMA } from "../contracts/responses.js";
import { GET_TODAY_TOOL, providerTool } from "../contracts/tools.js";
import { CONSTITUTION_VERSION } from "../prompts/constitution.js";
import { promptForIntent } from "../prompts/registry.js";
import { parseAndValidateIntelligence, validateToolArguments } from "../validation/schema.js";
import { assertSafeJson } from "../security/json.js";

export class IntelligenceError extends Error {
  constructor(readonly code: string, message: string, readonly retryable = false) { super(message); }
}

interface ModelPayload {
  type: IntelligenceResponse["type"];
  title: string;
  summary: string;
  rationale: IntelligenceResponse["rationale"];
  confidence: number;
  uncertainty: string[];
  assumptions: string[];
  sourceIds: string[];
}

type ToolExecutor = (request: BridgeToolRequest, signal: AbortSignal) => Promise<BridgeToolResult>;
type Emitter = (event: EngineEvent) => void;

function asTodaySnapshot(value: unknown): DomainSnapshot<TodayContextV1> {
  const snapshot = value as DomainSnapshot<TodayContextV1>;
  if (!snapshot || snapshot.contract !== "core.today" || snapshot.contractVersion !== "1.0" || snapshot.domain !== "core" || !snapshot.snapshotId || !snapshot.revision?.installationEpoch || !Array.isArray(snapshot.data?.tasks) || !Array.isArray(snapshot.data?.scheduled) || !Array.isArray(snapshot.data?.attention)) {
    throw new IntelligenceError("INVALID_TOOL_RESULT", "The browser returned an invalid current-day snapshot.");
  }
  assertSafeJson(snapshot);
  return snapshot;
}

function domainForSpace(space: string): DomainId {
  return space === "projects" ? "forge" : (["career", "workout", "health", "entertainment", "notifications"].includes(space) ? space as DomainId : "core");
}

function availableSources(snapshot: DomainSnapshot<TodayContextV1>): Map<string, SourceReference> {
  const sources = new Map<string, SourceReference>(), base = { snapshotId: snapshot.snapshotId, trust: "kaizen-derived" as const };
  for (const task of snapshot.data.tasks) sources.set(task.id, { ...base, sourceId: task.id, domain: domainForSpace(task.space), entityType: "task", entityId: task.id, label: task.title });
  for (const item of snapshot.data.scheduled) sources.set(item.id, { ...base, sourceId: item.id, domain: domainForSpace(item.source), entityType: "scheduled-item", entityId: item.id, label: item.title });
  for (const item of snapshot.data.attention) sources.set(item.notificationId, { ...base, sourceId: item.notificationId, domain: domainForSpace(item.section), entityType: "notification", entityId: item.notificationId, label: item.title });
  const next = snapshot.data.deterministicNextAction;
  if (next && !sources.has(next.sourceId)) sources.set(next.sourceId, { ...base, sourceId: next.sourceId, domain: "core", entityType: "next-action", entityId: next.sourceId, label: next.title });
  return sources;
}

export class IntelligenceOrchestrator {
  constructor(private readonly provider: GenerationProvider, private readonly requestTimeoutMs: number) {}

  async run(input: IntelligenceRequestInput, sessionId: string, requestId: string, executeTool: ToolExecutor, emit: Emitter, signal: AbortSignal): Promise<IntelligenceResponse> {
    if (!input.permissions.tools.includes("get_today") || !input.permissions.domains.includes("core")) throw new IntelligenceError("TOOL_DENIED", "Current-day context permission is required.");
    if (!input.prompt.trim() || input.prompt.length > 2_000) throw new IntelligenceError("INVALID_REQUEST", "Prompt must contain 1–2,000 characters.");
    const prompt = promptForIntent(input.intent ?? "ask"), metadata = { constitutionVersion: CONSTITUTION_VERSION, promptVersion: prompt.version, toolSchemaVersion: GET_TODAY_TOOL.version };
    const messages: ProviderMessage[] = [{ role: "system", content: prompt.system }, { role: "user", content: input.prompt.trim() }];
    const timer = AbortSignal.timeout(this.requestTimeoutMs), combined = AbortSignal.any([signal, timer]);
    const first = await this.provider.generate({ requestId, messages, tools: [providerTool(GET_TODAY_TOOL)], temperature: 0, maxOutputTokens: 256, metadata }, combined);
    if (first.toolCalls.length !== 1 || first.toolCalls[0]?.name !== GET_TODAY_TOOL.name) throw new IntelligenceError("TOOL_SELECTION_FAILED", "The local model did not select the required read tool.", true);
    const call = first.toolCalls[0];
    let args: unknown;
    try { args = JSON.parse(call.argumentsJson || "{}"); } catch { throw new IntelligenceError("INVALID_TOOL_ARGUMENTS", "The model produced invalid tool arguments.", true); }
    const checked = validateToolArguments(GET_TODAY_TOOL.name, GET_TODAY_TOOL.version, args);
    if (!checked.ok) throw new IntelligenceError("INVALID_TOOL_ARGUMENTS", checked.errors.join("; "), true);
    const toolRequest: BridgeToolRequest = { requestId, sessionId, callId: call.id, tool: GET_TODAY_TOOL.name, toolVersion: GET_TODAY_TOOL.version, arguments: args, expectedContract: GET_TODAY_TOOL.outputContract, expectedContractVersion: GET_TODAY_TOOL.outputContractVersion };
    emit({ type: "tool.requested", request: toolRequest, at: new Date().toISOString() });
    const result = await executeTool(toolRequest, combined);
    if (result.requestId !== requestId || result.callId !== call.id) throw new IntelligenceError("INVALID_TOOL_RESULT", "The browser returned a mismatched tool result.");
    emit({ type: "tool.completed", result: { requestId: result.requestId, callId: result.callId, status: result.status, error: result.error }, at: new Date().toISOString() });
    if (result.status !== "ok" || !result.snapshot) throw new IntelligenceError(result.error?.code ?? "TOOL_FAILED", result.error?.message ?? "Current-day context was unavailable.", result.error?.retryable ?? false);
    const snapshot = asTodaySnapshot(result.snapshot), toolMessage = JSON.stringify({ snapshot });
    const secondMessages: ProviderMessage[] = [...messages, { role: "assistant", content: "", toolCalls: [call] }, { role: "tool", toolCallId: call.id, content: toolMessage }];
    let generated = "";
    for await (const chunk of this.provider.stream({ requestId, messages: secondMessages, responseSchema: INTELLIGENCE_RESPONSE_SCHEMA as unknown as Record<string, unknown>, temperature: 0, maxOutputTokens: 512, metadata }, combined)) {
      if (chunk.type === "text-delta") { generated += chunk.text; emit({ type: "generation.delta", text: chunk.text, at: new Date().toISOString() }); }
      if (chunk.type === "tool-call") throw new IntelligenceError("TOOL_LIMIT", "The model attempted an additional tool call.");
    }
    const validation = parseAndValidateIntelligence(generated);
    if (!validation.ok || !validation.value) throw new IntelligenceError("INVALID_RESPONSE", `The local model returned an invalid response: ${validation.errors.join("; ")}`, true);
    const payload = validation.value as unknown as ModelPayload, sourceMap = availableSources(snapshot);
    const requestedSources = [...new Set(payload.sourceIds)];
    if (requestedSources.some((id) => !sourceMap.has(id))) throw new IntelligenceError("FABRICATED_SOURCE", "The local model cited a record that was not provided.");
    for (const rationale of payload.rationale) if (rationale.sourceIds.some((id) => !sourceMap.has(id))) throw new IntelligenceError("FABRICATED_SOURCE", "The local model rationale cited an unknown record.");
    const generatedAt = new Date().toISOString();
    return {
      schemaVersion: "1.0", responseId: randomUUID(), sessionId, type: payload.type, title: payload.title, summary: payload.summary,
      rationale: payload.rationale, confidence: payload.confidence, uncertainty: payload.uncertainty, assumptions: payload.assumptions,
      sources: requestedSources.map((id) => sourceMap.get(id)!),
      freshness: { generatedAt, snapshots: [{ domain: snapshot.domain, snapshotId: snapshot.snapshotId, revision: snapshot.revision, capturedAt: snapshot.capturedAt }], staleDomains: [], unavailableDomains: [] },
      generatedAt, model: this.provider.identity(), promptVersion: prompt.version, constitutionVersion: CONSTITUTION_VERSION,
    };
  }
}
