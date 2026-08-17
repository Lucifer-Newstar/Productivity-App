import type { EngineConfig } from "../config.js";
import type { GenerationProvider } from "../contracts/provider.js";
import { LlamaCppProvider } from "./llamaCpp.js";
import { MockGenerationProvider } from "./mock.js";

export class ProviderRegistry {
  readonly generation: GenerationProvider;
  constructor(config: EngineConfig) {
    this.generation = config.provider === "mock" ? new MockGenerationProvider() : new LlamaCppProvider(config.llama);
  }
}
