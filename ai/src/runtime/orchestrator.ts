/** Executes trusted Core Today routing and projects only source-verified interpreter responses. */
import { randomUUID } from "node:crypto";
import type { CoreTodayEvidenceV1, TodayInterpreterRequestV1, TodayInterpreterResponseV1 } from "../contracts/interpreter.js";
import type { DomainId } from "../contracts/domain.js";
import type { IntelligenceRequestInput, EngineEvent } from "../contracts/protocol.js";
import type { IntelligenceResponse, SourceReference } from "../contracts/responses.js";
import type { BridgeToolRequest, BridgeToolResult } from "../contracts/tools.js";
import type { GenerationProvider, ProviderMessage } from "../contracts/provider.js";
import { TODAY_INTERPRETER_RESPONSE_SCHEMA } from "../contracts/interpreter.js";
import { GET_TODAY_TOOL } from "../contracts/tools.js";
import { CONSTITUTION_VERSION } from "../prompts/constitution.js";
import { promptForIntent } from "../prompts/registry.js";
import { parseAndValidateTodayInterpreter } from "../validation/schema.js";
import { assertSafeJson } from "../security/json.js";
import { routeCoreToday } from "./deterministicRouter.js";
import { IntelligenceError } from "./errors.js";

export { IntelligenceError } from "./errors.js";

type ToolExecutor = (request: BridgeToolRequest, signal: AbortSignal) => Promise<BridgeToolResult>;
type Emitter = (event: EngineEvent) => void;

const TOP_LEVEL_KEYS = new Set(["contract", "contractVersion", "domain", "snapshotId", "revision", "capturedAt", "timezone", "sensitivity", "trust", "data", "analytics", "redactions"]);
const DATA_KEYS = new Set(["localDate", "availableFocusMinutes", "tasks", "scheduled", "deterministicNextAction", "attention"]);
const TASK_KEYS = new Set(["id", "title", "space", "priority", "dueDate", "completed"]);
const SCHEDULED_KEYS = new Set(["id", "source", "title", "startsAt", "estimateMinutes"]);
const ATTENTION_KEYS = new Set(["notificationId", "section", "priority", "title"]);
const NEXT_KEYS = new Set(["sourceId", "title", "reason", "estimateMinutes", "algorithmVersion"]);
const ANALYTICS_KEYS = new Set(["id", "label", "value", "algorithm", "algorithmVersion", "computedAt"]);
const REDACTION_KEYS = new Set(["field", "reason"]);
const REVISION_KEYS = new Set(["installationEpoch", "domains"]);
const TODAY_REVISION_DOMAINS = new Set(["core", "forge", "notifications"]);

function onlyKeys(value: unknown, allowed: Set<string>): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).every((key) => allowed.has(key));
}

function boundedText(value: unknown, maximum = 500): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum;
}

function asTodaySnapshot(value: unknown, localDate: string, maximumItems: number, now = Date.now()): CoreTodayEvidenceV1 {
  assertSafeJson(value);
  const snapshot = value as CoreTodayEvidenceV1;
  const data = snapshot?.data as unknown as Record<string, unknown> | undefined;
  const capturedAt = Date.parse(snapshot?.capturedAt ?? "");
  if (!snapshot || typeof snapshot !== "object" || !onlyKeys(snapshot as unknown as Record<string, unknown>, TOP_LEVEL_KEYS)
    || snapshot.contract !== "core.today" || snapshot.contractVersion !== "1.0" || snapshot.domain !== "core"
    || snapshot.sensitivity !== "personal" || snapshot.trust !== "kaizen-derived" || !boundedText(snapshot.snapshotId, 256)
    || !boundedText(snapshot.revision?.installationEpoch, 128) || !onlyKeys(snapshot.revision as unknown as Record<string, unknown>, REVISION_KEYS)
    || !snapshot.revision.domains || Object.entries(snapshot.revision.domains).some(([domain, revision]) => !TODAY_REVISION_DOMAINS.has(domain) || !Number.isInteger(revision) || revision! < 0)
    || !Number.isFinite(capturedAt) || capturedAt > now + 60_000 || now - capturedAt > 5 * 60_000
    || !data || !onlyKeys(data, DATA_KEYS) || snapshot.data.localDate !== localDate
    || !Array.isArray(snapshot.data.tasks) || !Array.isArray(snapshot.data.scheduled) || !Array.isArray(snapshot.data.attention)
    || !Array.isArray(snapshot.analytics) || !Array.isArray(snapshot.redactions)) {
    throw new IntelligenceError("INVALID_TOOL_RESULT", "The browser returned an invalid or stale Core Today snapshot.");
  }
  const recordCount = snapshot.data.tasks.length + snapshot.data.scheduled.length + snapshot.data.attention.length;
  const entityIds = [...snapshot.data.tasks.map((item) => item.id), ...snapshot.data.scheduled.map((item) => item.id), ...snapshot.data.attention.map((item) => item.notificationId)];
  const primitive = (item: unknown) => item === null || ["string", "number", "boolean"].includes(typeof item);
  if (recordCount > maximumItems || new Set(entityIds).size !== entityIds.length
    || !boundedText(snapshot.timezone, 128)
    || snapshot.data.tasks.some((item) => !onlyKeys(item as unknown as Record<string, unknown>, TASK_KEYS) || !boundedText(item.id, 128) || !boundedText(item.title) || !boundedText(item.space, 128) || typeof item.completed !== "boolean" || !["low", "medium", "high"].includes(item.priority) || (item.dueDate !== undefined && !boundedText(item.dueDate, 64)))
    || snapshot.data.scheduled.some((item) => !onlyKeys(item as unknown as Record<string, unknown>, SCHEDULED_KEYS) || !boundedText(item.id, 128) || !boundedText(item.title) || !boundedText(item.source, 128) || (item.startsAt !== undefined && !boundedText(item.startsAt, 128)) || (item.estimateMinutes !== undefined && (!Number.isFinite(item.estimateMinutes) || item.estimateMinutes < 0)))
    || snapshot.data.attention.some((item) => !onlyKeys(item as unknown as Record<string, unknown>, ATTENTION_KEYS) || !boundedText(item.notificationId, 128) || !boundedText(item.section, 128) || !boundedText(item.title) || !["high", "critical"].includes(item.priority))
    || snapshot.analytics.length > 10 || snapshot.analytics.some((item) => !onlyKeys(item as unknown as Record<string, unknown>, ANALYTICS_KEYS) || !boundedText(item.id, 128) || !boundedText(item.label) || !boundedText(item.algorithm, 128) || !boundedText(item.algorithmVersion, 128) || !boundedText(item.computedAt, 64) || !primitive(item.value))
    || snapshot.redactions.length > 20 || snapshot.redactions.some((item) => !onlyKeys(item as unknown as Record<string, unknown>, REDACTION_KEYS) || !boundedText(item.field, 128) || !["not-required", "consent", "sensitive", "unsafe"].includes(item.reason))) {
    throw new IntelligenceError("INVALID_TOOL_RESULT", "The Core Today snapshot exceeded its frozen field or record bounds.");
  }
  const next = snapshot.data.deterministicNextAction;
  if (next && (!onlyKeys(next as unknown as Record<string, unknown>, NEXT_KEYS) || !boundedText(next.sourceId, 128) || !boundedText(next.title) || !boundedText(next.reason, 1_000) || !boundedText(next.algorithmVersion, 128) || (next.estimateMinutes !== undefined && (!Number.isFinite(next.estimateMinutes) || next.estimateMinutes < 0)))) {
    throw new IntelligenceError("INVALID_TOOL_RESULT", "The deterministic Next Action was invalid.");
  }
  return snapshot;
}

function domainForSpace(space: string): DomainId {
  return space === "projects" ? "forge" : (["career", "workout", "health", "entertainment", "notifications"].includes(space) ? space as DomainId : "core");
}

function availableSources(snapshot: CoreTodayEvidenceV1): Map<string, SourceReference> {
  const sources = new Map<string, SourceReference>(), base = { snapshotId: snapshot.snapshotId, trust: "kaizen-derived" as const };
  for (const task of snapshot.data.tasks) sources.set(task.id, { ...base, sourceId: task.id, domain: domainForSpace(task.space), entityType: "task", entityId: task.id, label: task.title });
  for (const item of snapshot.data.scheduled) sources.set(item.id, { ...base, sourceId: item.id, domain: domainForSpace(item.source), entityType: "scheduled-item", entityId: item.id, label: item.title });
  for (const item of snapshot.data.attention) sources.set(item.notificationId, { ...base, sourceId: item.notificationId, domain: domainForSpace(item.section), entityType: "notification", entityId: item.notificationId, label: item.title });
  const next = snapshot.data.deterministicNextAction;
  if (next && !sources.has(next.sourceId)) sources.set(next.sourceId, { ...base, sourceId: next.sourceId, domain: "core", entityType: "next-action", entityId: next.sourceId, label: next.title });
  return sources;
}

function verifyInterpreterPayload(payload: TodayInterpreterResponseV1, snapshot: CoreTodayEvidenceV1): string[] {
  const sourceMap = availableSources(snapshot), requestedSources = [...new Set(payload.sourceIds)];
  if (requestedSources.some((id) => !sourceMap.has(id))) throw new IntelligenceError("FABRICATED_SOURCE", "The interpreter cited a record that was not provided.");
  for (const rationale of payload.rationale) {
    if (rationale.sourceIds.some((id) => !sourceMap.has(id) || !requestedSources.includes(id))) throw new IntelligenceError("FABRICATED_SOURCE", "The interpreter rationale cited an unavailable source.");
    if ((rationale.kind === "fact" || rationale.kind === "deterministic-result") && rationale.sourceIds.length === 0) throw new IntelligenceError("UNSUPPORTED_CLAIM", "A factual interpreter claim did not cite supplied evidence.");
  }
  const next = snapshot.data.deterministicNextAction;
  if (next) {
    const preservesPrecedence = requestedSources.includes(next.sourceId) && payload.rationale.some((item) => item.kind === "deterministic-result" && item.sourceIds.includes(next.sourceId));
    if (!preservesPrecedence) throw new IntelligenceError("DETERMINISTIC_PRECEDENCE", "The interpreter did not preserve Kaizen's deterministic Next Action.");
  }
  if (sourceMap.size === 0 && payload.uncertainty.length === 0) throw new IntelligenceError("UNCERTAINTY_REQUIRED", "The interpreter did not disclose that Core Today evidence was empty.");
  return requestedSources;
}

export class IntelligenceOrchestrator {
  constructor(private readonly provider: GenerationProvider, private readonly requestTimeoutMs: number) {}

  async run(input: IntelligenceRequestInput, sessionId: string, requestId: string, executeTool: ToolExecutor, emit: Emitter, signal: AbortSignal): Promise<IntelligenceResponse> {
    const route = routeCoreToday(input);
    const prompt = promptForIntent("focus-today"), metadata = { constitutionVersion: CONSTITUTION_VERSION, promptVersion: prompt.version, toolSchemaVersion: "core.today.interpreter@1.0" };
    const timer = AbortSignal.timeout(this.requestTimeoutMs), combined = AbortSignal.any([signal, timer]);
    const callId = randomUUID();
    const toolRequest: BridgeToolRequest = {
      requestId, sessionId, callId, tool: route.tool.name, toolVersion: route.tool.version, arguments: route.tool.arguments,
      expectedContract: GET_TODAY_TOOL.outputContract, expectedContractVersion: GET_TODAY_TOOL.outputContractVersion,
    };
    emit({ type: "tool.requested", request: toolRequest, at: new Date().toISOString() });
    const result = await executeTool(toolRequest, combined);
    if (result.requestId !== requestId || result.callId !== callId) throw new IntelligenceError("INVALID_TOOL_RESULT", "The browser returned a mismatched tool result.");
    emit({ type: "tool.completed", result: { requestId: result.requestId, callId: result.callId, status: result.status, error: result.error }, at: new Date().toISOString() });
    if (result.status !== "ok" || !result.snapshot) throw new IntelligenceError(result.error?.code ?? "TOOL_FAILED", result.error?.message ?? "Current-day context was unavailable.", result.error?.retryable ?? false);
    const snapshot = asTodaySnapshot(result.snapshot, route.tool.arguments.localDate, route.tool.arguments.maximumItems);
    const interpreterRequest: TodayInterpreterRequestV1 = {
      schemaVersion: "1.0", route, evidence: snapshot,
      providerPolicy: { tools: "forbidden", additionalRetrieval: "forbidden", memory: "forbidden", writes: "forbidden" },
    };
    const messages: ProviderMessage[] = [{ role: "system", content: prompt.system }, { role: "user", content: JSON.stringify(interpreterRequest) }];
    let generated = "";
    for await (const chunk of this.provider.stream({ requestId, messages, responseSchema: TODAY_INTERPRETER_RESPONSE_SCHEMA as unknown as Record<string, unknown>, temperature: 0, maxOutputTokens: 512, metadata }, combined)) {
      if (chunk.type === "text-delta") { generated += chunk.text; emit({ type: "generation.delta", text: chunk.text, at: new Date().toISOString() }); }
      if (chunk.type === "tool-call") throw new IntelligenceError("MODEL_TOOL_CALL", "The interpreter emitted a forbidden tool call.");
    }
    const validation = parseAndValidateTodayInterpreter(generated);
    if (!validation.ok || !validation.value) throw new IntelligenceError("INVALID_RESPONSE", `The interpreter returned an invalid response: ${validation.errors.join("; ")}`, true);
    const payload = validation.value as unknown as TodayInterpreterResponseV1;
    const requestedSources = verifyInterpreterPayload(payload, snapshot), sourceMap = availableSources(snapshot);
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
