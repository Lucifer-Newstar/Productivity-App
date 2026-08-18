/** Parses bounded loopback-only Intelligence Engine configuration. */
import { isIP } from "node:net";

export interface EngineConfig {
  host: "127.0.0.1" | "::1";
  port: number;
  allowedOrigins: Set<string>;
  provider: "llama" | "mock";
  llama: {
    baseUrl: string;
    modelId: string;
    runtimeVersion: string;
    maximumContextTokens: number;
    maximumOutputTokens: number;
    nativeToolCalling: boolean;
  };
  pairingTtlMs: number;
  sessionTtlMs: number;
  requestTimeoutMs: number;
  maximumBodyBytes: number;
  maximumActiveRequests: number;
}

function boundedInt(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function loopbackUrl(value: string): string {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (url.protocol !== "http:" || !(host === "localhost" || host === "127.0.0.1" || host === "::1" || isIP(host) === 6 && host === "::1")) {
    throw new Error("KAIZEN_LLAMA_BASE_URL must be loopback HTTP");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): EngineConfig {
  const rawHost = env.KAIZEN_AI_HOST ?? "127.0.0.1";
  if (rawHost !== "127.0.0.1" && rawHost !== "::1") throw new Error("Intelligence Engine must bind to loopback");
  const origins = (env.KAIZEN_AI_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000").split(",").map((x) => x.trim()).filter(Boolean);
  for (const origin of origins) {
    const url = new URL(origin);
    if (!/^https?:$/.test(url.protocol) || url.pathname !== "/" || url.search || url.hash) throw new Error(`invalid allowed origin: ${origin}`);
  }
  return {
    host: rawHost,
    port: boundedInt(env.KAIZEN_AI_PORT, 4317, 1024, 65535),
    allowedOrigins: new Set(origins),
    provider: env.KAIZEN_AI_PROVIDER === "mock" ? "mock" : "llama",
    llama: {
      baseUrl: loopbackUrl(env.KAIZEN_LLAMA_BASE_URL ?? "http://127.0.0.1:8080"),
      modelId: env.KAIZEN_LLAMA_MODEL_ID ?? "local-model",
      runtimeVersion: env.KAIZEN_LLAMA_RUNTIME_VERSION ?? "unreported",
      maximumContextTokens: boundedInt(env.KAIZEN_LLAMA_CONTEXT_TOKENS, 4096, 1024, 262144),
      maximumOutputTokens: boundedInt(env.KAIZEN_LLAMA_OUTPUT_TOKENS, 512, 64, 8192),
      nativeToolCalling: env.KAIZEN_LLAMA_NATIVE_TOOLS !== "0",
    },
    pairingTtlMs: boundedInt(env.KAIZEN_AI_PAIRING_TTL_MS, 5 * 60_000, 30_000, 30 * 60_000),
    sessionTtlMs: boundedInt(env.KAIZEN_AI_SESSION_TTL_MS, 30 * 60_000, 60_000, 24 * 60 * 60_000),
    requestTimeoutMs: boundedInt(env.KAIZEN_AI_REQUEST_TIMEOUT_MS, 120_000, 5_000, 10 * 60_000),
    maximumBodyBytes: boundedInt(env.KAIZEN_AI_MAX_BODY_BYTES, 1_000_000, 16_384, 5_000_000),
    maximumActiveRequests: boundedInt(env.KAIZEN_AI_MAX_ACTIVE_REQUESTS, 1, 1, 4),
  };
}
