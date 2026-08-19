/** Parses the bounded loopback-only deterministic Intelligence Engine configuration. */

export interface EngineConfig {
  host: "127.0.0.1" | "::1";
  port: number;
  allowedOrigins: Set<string>;
  provider: "mock";
  pairingTtlMs: number;
  sessionTtlMs: number;
  requestTimeoutMs: number;
  maximumBodyBytes: number;
  maximumActiveRequests: number;
}

const MODEL_ENVIRONMENT = [
  "KAIZEN_LLAMA_BASE_URL",
  "KAIZEN_LLAMA_MODEL_ID",
  "KAIZEN_LLAMA_RUNTIME_VERSION",
  "KAIZEN_LLAMA_CONTEXT_TOKENS",
  "KAIZEN_LLAMA_OUTPUT_TOKENS",
  "KAIZEN_LLAMA_NATIVE_TOOLS",
] as const;

function boundedInt(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const rawHost = env.KAIZEN_AI_HOST ?? "127.0.0.1";
  if (rawHost !== "127.0.0.1" && rawHost !== "::1") throw new Error("Intelligence Engine must bind to loopback");
  const provider = env.KAIZEN_AI_PROVIDER ?? "mock";
  if (provider !== "mock") throw new Error("No model provider is approved; KAIZEN_AI_PROVIDER must be mock");
  const configuredModelVariable = MODEL_ENVIRONMENT.find((name) => env[name] !== undefined);
  if (configuredModelVariable) throw new Error(`${configuredModelVariable} is unavailable because no model provider is approved`);
  const origins = (env.KAIZEN_AI_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((x) => x.trim()).filter(Boolean);
  for (const origin of origins) {
    const url = new URL(origin);
    if (!/^https?:$/.test(url.protocol) || url.pathname !== "/" || url.search || url.hash) throw new Error(`invalid allowed origin: ${origin}`);
  }
  return {
    host: rawHost,
    port: boundedInt(env.KAIZEN_AI_PORT, 4317, 1024, 65535),
    allowedOrigins: new Set(origins),
    provider: "mock",
    pairingTtlMs: boundedInt(env.KAIZEN_AI_PAIRING_TTL_MS, 5 * 60_000, 30_000, 30 * 60_000),
    sessionTtlMs: boundedInt(env.KAIZEN_AI_SESSION_TTL_MS, 30 * 60_000, 60_000, 24 * 60 * 60_000),
    requestTimeoutMs: boundedInt(env.KAIZEN_AI_REQUEST_TIMEOUT_MS, 120_000, 5_000, 10 * 60_000),
    maximumBodyBytes: boundedInt(env.KAIZEN_AI_MAX_BODY_BYTES, 1_000_000, 16_384, 5_000_000),
    maximumActiveRequests: boundedInt(env.KAIZEN_AI_MAX_ACTIVE_REQUESTS, 1, 1, 4),
  };
}
