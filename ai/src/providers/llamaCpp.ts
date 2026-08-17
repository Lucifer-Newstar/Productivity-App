import type {
  GenerationCapabilities, GenerationChunk, GenerationProvider, GenerationRequest,
  GenerationResponse, ModelIdentity, ProviderHealth, ProviderToolCall,
} from "../contracts/provider.js";

interface LlamaCppOptions {
  baseUrl: string;
  modelId: string;
  runtimeVersion: string;
  maximumContextTokens: number;
  maximumOutputTokens: number;
  nativeToolCalling: boolean;
}

interface ToolAccumulator { id: string; name: string; argumentsJson: string }

export class LlamaCppProvider implements GenerationProvider {
  constructor(private readonly options: LlamaCppOptions) {}

  identity(): ModelIdentity {
    return { providerId: "llama.cpp", mode: "local", modelId: this.options.modelId, runtime: "llama.cpp", runtimeVersion: this.options.runtimeVersion };
  }

  capabilities(): GenerationCapabilities {
    return { streaming: true, nativeToolCalling: this.options.nativeToolCalling, structuredOutput: "native-schema", maximumContextTokens: this.options.maximumContextTokens, maximumOutputTokens: this.options.maximumOutputTokens, parallelToolCalls: false, vision: false };
  }

  async health(signal?: AbortSignal): Promise<ProviderHealth> {
    try {
      const response = await fetch(`${this.options.baseUrl}/health`, { signal });
      return { status: response.ok ? "ready" : "failed", detail: response.ok ? undefined : `HTTP ${response.status}`, checkedAt: new Date().toISOString() };
    } catch (error) {
      return { status: "offline", detail: error instanceof Error ? error.message : "unavailable", checkedAt: new Date().toISOString() };
    }
  }

  async generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResponse> {
    let text = "", promptTokens: number | undefined, outputTokens: number | undefined, finishReason: string | undefined;
    const calls: ProviderToolCall[] = [];
    for await (const chunk of this.stream(request, signal)) {
      if (chunk.type === "text-delta") text += chunk.text;
      else if (chunk.type === "tool-call") calls.push(chunk.call);
      else if (chunk.type === "usage") { promptTokens = chunk.promptTokens; outputTokens = chunk.outputTokens; }
      else if (chunk.type === "complete") finishReason = chunk.finishReason;
    }
    return { text, toolCalls: calls, promptTokens, outputTokens, finishReason };
  }

  async *stream(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationChunk> {
    const body: Record<string, unknown> = {
      model: this.options.modelId,
      messages: request.messages.map((message) => ({ role: message.role, content: message.content, ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}) })),
      temperature: request.temperature,
      max_tokens: Math.min(request.maxOutputTokens, this.options.maximumOutputTokens),
      stream: true,
      stream_options: { include_usage: true },
    };
    if (request.tools?.length) { body.tools = request.tools; body.tool_choice = "auto"; }
    if (request.responseSchema) body.response_format = { type: "json_schema", schema: request.responseSchema };
    const response = await fetch(`${this.options.baseUrl}/v1/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
    if (!response.ok || !response.body) throw new Error(`llama.cpp request failed with HTTP ${response.status}`);
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let buffer = "", finishReason: string | undefined;
    const tools = new Map<number, ToolAccumulator>();
    for (;;) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        const event = JSON.parse(payload) as Record<string, unknown>;
        const usage = event.usage as { prompt_tokens?: number; completion_tokens?: number } | undefined;
        if (usage) yield { type: "usage", promptTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens };
        const choices = event.choices as Array<{ delta?: { content?: string; tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> }; finish_reason?: string }> | undefined;
        for (const choice of choices ?? []) {
          if (choice.delta?.content) yield { type: "text-delta", text: choice.delta.content };
          for (const piece of choice.delta?.tool_calls ?? []) {
            const current = tools.get(piece.index) ?? { id: piece.id ?? `call-${piece.index}`, name: "", argumentsJson: "" };
            if (piece.id) current.id = piece.id;
            current.name += piece.function?.name ?? "";
            current.argumentsJson += piece.function?.arguments ?? "";
            tools.set(piece.index, current);
          }
          if (choice.finish_reason) finishReason = choice.finish_reason;
        }
      }
      if (done) break;
    }
    for (const call of [...tools.entries()].sort(([a], [b]) => a - b).map(([, value]) => value)) yield { type: "tool-call", call };
    yield { type: "complete", finishReason };
  }
}
