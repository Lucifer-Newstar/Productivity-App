/** Provider adapter for mock inference behavior. */
import { randomUUID } from "node:crypto";
import type { GenerationCapabilities, GenerationChunk, GenerationProvider, GenerationRequest, GenerationResponse, ModelIdentity, ProviderHealth } from "../contracts/provider.js";

export class MockGenerationProvider implements GenerationProvider {
  identity(): ModelIdentity { return { providerId: "kaizen-mock", mode: "local", modelId: "deterministic-mock", runtime: "node", runtimeVersion: process.version }; }
  capabilities(): GenerationCapabilities { return { streaming: true, nativeToolCalling: true, structuredOutput: "native-schema", maximumContextTokens: 4096, maximumOutputTokens: 512, parallelToolCalls: false, vision: false }; }
  async health(): Promise<ProviderHealth> { return { status: "ready", checkedAt: new Date().toISOString() }; }

  async generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResponse> {
    let text = ""; const toolCalls = [];
    for await (const chunk of this.stream(request, signal)) {
      if (chunk.type === "text-delta") text += chunk.text;
      if (chunk.type === "tool-call") toolCalls.push(chunk.call);
    }
    return { text, toolCalls, finishReason: toolCalls.length ? "tool_calls" : "stop" };
  }

  async *stream(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationChunk> {
    if (signal.aborted) throw signal.reason;
    const toolMessage = [...request.messages].reverse().find((message) => message.role === "tool");
    if (!toolMessage && request.tools?.some((tool) => tool.function.name === "get_today")) {
      yield { type: "tool-call", call: { id: randomUUID(), name: "get_today", argumentsJson: "{}" } };
      yield { type: "complete", finishReason: "tool_calls" };
      return;
    }
    let snapshot: any = {};
    try { snapshot = toolMessage ? JSON.parse(toolMessage.content) : {}; } catch {}
    const data = snapshot?.snapshot?.data ?? snapshot?.data ?? {};
    const action = data.deterministicNextAction;
    const sourceId = action?.sourceId ?? data.tasks?.[0]?.id;
    const payload = {
      type: "recommendation",
      title: action?.title ?? "Review today's priorities",
      summary: action?.reason ?? "Use the current Kaizen context to select one concrete next action.",
      rationale: sourceId ? [{ claim: action?.reason ?? "This is the highest-ranked current action.", sourceIds: [sourceId], kind: action ? "deterministic-result" : "inference" }] : [],
      confidence: sourceId ? .9 : .25,
      uncertainty: sourceId ? [] : ["No actionable task was available."],
      assumptions: [],
      sourceIds: sourceId ? [sourceId] : [],
    };
    const text = JSON.stringify(payload);
    yield { type: "text-delta", text };
    yield { type: "usage", promptTokens: 1, outputTokens: 1 };
    yield { type: "complete", finishReason: "stop" };
  }
}
