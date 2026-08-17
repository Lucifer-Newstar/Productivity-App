# Provider contracts and capability registry

## Provider separation

**LOCKED DECISION:** generation and embeddings are independent providers selected through a registry.

```ts
interface GenerationProvider {
  identity(): ModelIdentity;
  capabilities(): GenerationCapabilities;
  generate(request: GenerationRequest, signal: AbortSignal): Promise<GenerationResponse>;
  stream(request: GenerationRequest, signal: AbortSignal): AsyncIterable<GenerationChunk>;
  health(): Promise<ProviderHealth>;
}

interface EmbeddingProvider {
  identity(): ModelIdentity;
  capabilities(): EmbeddingCapabilities;
  embed(request: EmbeddingRequest, signal: AbortSignal): Promise<EmbeddingResponse>;
  health(): Promise<ProviderHealth>;
}
```

Neither contract exposes runtime-specific objects outside its adapter.

## Shared identity

```ts
interface ModelIdentity {
  providerId: string;
  mode: "local" | "remote";
  modelId: string;
  modelFamily?: string;
  revision?: string;
  artifactSha256?: string;
  quantization?: string;
  license?: string;
  runtime: string;
  runtimeVersion: string;
}
```

Local model artifacts require source, license and SHA-256 provenance.

## Generation request

```ts
interface GenerationRequest {
  requestId: string;
  messages: ProviderMessage[];
  tools?: ToolDefinition[];
  responseSchema?: object;
  temperature: number;
  maxOutputTokens: number;
  stop?: string[];
  metadata: {
    constitutionVersion: string;
    promptVersion: string;
    toolSchemaVersion: string;
  };
}
```

Requests must already be consent-filtered and budgeted. Providers do not decide what Kaizen data they may see.

## Embedding provider

```ts
interface EmbeddingRequest {
  requestId: string;
  inputs: Array<{ id: string; text: string }>;
  purpose: "document" | "query" | "memory";
}

interface EmbeddingResponse {
  model: ModelIdentity;
  dimensions: number;
  vectors: Array<{ id: string; values: number[] }>;
}
```

Changing embedding model identity or dimensions requires reindexing or a side-by-side index migration.

## Capability registry

**LOCKED DECISION**

```ts
interface GenerationCapabilities {
  streaming: boolean;
  nativeToolCalling: boolean;
  structuredOutput: "native-schema" | "grammar" | "prompt-only" | "none";
  maximumContextTokens: number;
  maximumOutputTokens: number;
  parallelToolCalls: boolean;
  vision: boolean;
}

interface EmbeddingCapabilities {
  maximumBatchSize: number;
  maximumInputTokens: number;
  dimensions: number;
  normalized: boolean;
}
```

The orchestrator chooses only strategies supported by capabilities and allowed by evaluation thresholds. Declared capability does not equal proven reliability; benchmark results can disable a nominal feature.

## Provider registry

```ts
interface ProviderRegistry {
  generation(profile: string): GenerationProvider;
  embeddings(profile: string): EmbeddingProvider | undefined;
  list(): ProviderDescriptor[];
}
```

Profiles refer to configuration, not hard-coded model names.

## Runtime selection

- **LOCAL:** initial and locked target mode.
- **HYBRID:** architecture supported, implementation deferred.
- **REMOTE:** architecture supported, implementation deferred.
- No silent local-to-remote fallback.
- Remote mode requires explicit provider, request and domain consent.

## Technical spikes

**REQUIRES TECHNICAL SPIKE:** llama.cpp server versus managed child process; candidate instruct models/quantizations; embedding runtime; process health/restart; GPU-layer settings; concurrency; structured JSON reliability.

No permanent model is selected in this document.