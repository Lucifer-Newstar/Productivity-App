/** Application provider registry locked to the accepted deterministic v0.1.1 baseline. */
import type { EngineConfig } from "../config.js";
import type { GenerationProvider } from "../contracts/provider.js";
import { MockGenerationProvider } from "./mock.js";

export class ProviderRegistry {
  readonly generation: GenerationProvider;
  constructor(config: EngineConfig) {
    if (config.provider !== "mock") throw new Error("No model provider is approved for application runtime");
    this.generation = new MockGenerationProvider();
  }
}
