/** Versioned Intelligence Engine contracts for provider data. */
export type ProcessingMode = "local" | "remote";

export interface ModelIdentity {
  providerId: string;
  mode: ProcessingMode;
  modelId: string;
  modelFamily?: string;
  revision?: string;
  artifactSha256?: string;
  quantization?: string;
  license?: string;
  runtime: string;
  runtimeVersion: string;
}

export interface GenerationCapabilities {
  streaming: boolean;
  nativeToolCalling: boolean;
  structuredOutput: "native-schema" | "grammar" | "prompt-only" | "none";
  maximumContextTokens: number;
  maximumOutputTokens: number;
  parallelToolCalls: boolean;
  vision: boolean;
}

export interface ProviderMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ProviderToolCall[];
}

export interface ProviderToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GenerationRequest {
  requestId: string;
  messages: ProviderMessage[];
  tools?: ProviderToolDefinition[];
  responseSchema?: Record<string, unknown>;
  temperature: number;
  maxOutputTokens: number;
  metadata: {
    constitutionVersion: string;
    promptVersion: string;
    toolSchemaVersion: string;
  };
}

export interface ProviderToolCall {
  id: string;
  name: string;
  argumentsJson: string;
}

export type GenerationChunk =
  | { type: "text-delta"; text: string }
  | { type: "tool-call"; call: ProviderToolCall }
  | { type: "usage"; promptTokens?: number; outputTokens?: number }
  | { type: "complete"; finishReason?: string };

export interface GenerationResponse {
  text: string;
  toolCalls: ProviderToolCall[];
  promptTokens?: number;
  outputTokens?: number;
  finishReason?: string;
}

export interface ProviderHealth {
  status: "ready" | "starting" | "offline" | "failed";
  detail?: string;
  checkedAt: string;
}

export interface GenerationProvider {
  identity(): ModelIdentity;
  capabilities(): GenerationCapabilities;
  generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResponse>;
  stream(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationChunk>;
  health(signal?: AbortSignal): Promise<ProviderHealth>;
}

export interface EmbeddingCapabilities {
  maximumBatchSize: number;
  maximumInputTokens: number;
  dimensions: number;
  normalized: boolean;
}

export interface EmbeddingRequest {
  requestId: string;
  inputs: Array<{ id: string; text: string }>;
  purpose: "document" | "query" | "memory";
}

export interface EmbeddingResponse {
  model: ModelIdentity;
  dimensions: number;
  vectors: Array<{ id: string; values: number[] }>;
}

export interface EmbeddingProvider {
  identity(): ModelIdentity;
  capabilities(): EmbeddingCapabilities;
  embed(request: EmbeddingRequest, signal: AbortSignal): Promise<EmbeddingResponse>;
  health(signal?: AbortSignal): Promise<ProviderHealth>;
}
