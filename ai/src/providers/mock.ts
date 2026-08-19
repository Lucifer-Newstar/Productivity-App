/** Deterministic Core Today provider used by the accepted application baseline. */
import type { GenerationCapabilities, GenerationChunk, GenerationProvider, GenerationRequest, GenerationResponse, ModelIdentity, ProviderHealth } from "../contracts/provider.js";

export class MockGenerationProvider implements GenerationProvider {
  identity(): ModelIdentity { return { providerId: "kaizen-mock", mode: "local", modelId: "deterministic-mock", runtime: "node", runtimeVersion: process.version }; }
  capabilities(): GenerationCapabilities { return { streaming: true, nativeToolCalling: false, structuredOutput: "native-schema", maximumContextTokens: 4096, maximumOutputTokens: 512, parallelToolCalls: false, vision: false }; }
  async health(): Promise<ProviderHealth> { return { status: "ready", detail: "deterministic Core Today baseline", checkedAt: new Date().toISOString() }; }

  async generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResponse> {
    let text = "";
    for await (const chunk of this.stream(request, signal)) if (chunk.type === "text-delta") text += chunk.text;
    return { text, toolCalls: [], finishReason: "stop" };
  }

  async *stream(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationChunk> {
    if (signal.aborted) throw signal.reason;
    if (request.tools?.length || request.messages.some((message) => message.role === "tool" || message.toolCalls?.length)) {
      throw new Error("The deterministic application provider does not accept model tool authority");
    }
    let snapshot: any = {};
    try {
      const payload = JSON.parse([...request.messages].reverse().find((message) => message.role === "user")?.content ?? "{}");
      snapshot = payload?.evidence ?? payload;
    } catch {}
    const data = snapshot?.data ?? {};
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
    yield { type: "usage", promptTokens: 0, outputTokens: 0 };
    yield { type: "complete", finishReason: "stop" };
  }
}
