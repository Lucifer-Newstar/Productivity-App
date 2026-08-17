import { createHash, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { EngineConfig } from "./config.js";
import type { BridgeToolResult } from "./contracts/tools.js";
import type { IntelligenceRequestInput, PublicError } from "./contracts/protocol.js";
import { ProviderRegistry } from "./providers/registry.js";
import { IntelligenceOrchestrator, IntelligenceError } from "./runtime/orchestrator.js";
import { RequestManager } from "./runtime/requestManager.js";
import { assertSafeJson } from "./security/json.js";
import { PairingManager } from "./security/pairing.js";
import { FixedWindowLimiter } from "./security/rateLimit.js";

function loopbackAddress(socket: Socket): boolean {
  const address = socket.remoteAddress ?? "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function validHost(value: string | undefined): boolean {
  if (!value) return false;
  try { const host = new URL(`http://${value}`).hostname.replace(/^\[|\]$/g, ""); return host === "localhost" || host === "127.0.0.1" || host === "::1"; }
  catch { return false; }
}

function tokenFrom(request: IncomingMessage): string | null {
  const value = request.headers.authorization;
  return value?.startsWith("Bearer ") ? value.slice(7) : null;
}

function sessionId(token: string): string { return createHash("sha256").update(token).digest("hex").slice(0, 24); }

async function readJson(request: IncomingMessage, maximumBytes: number): Promise<unknown> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += buffer.length;
    if (size > maximumBytes) throw new IntelligenceError("BODY_TOO_LARGE", "Request body is too large.");
    chunks.push(buffer);
  }
  let value: unknown;
  try { value = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); }
  catch { throw new IntelligenceError("INVALID_JSON", "Request body must be valid JSON."); }
  assertSafeJson(value); return value;
}

function securityHeaders(response: ServerResponse): void {
  response.setHeader("cache-control", "no-store"); response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY"); response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("cross-origin-resource-policy", "same-origin"); response.setHeader("content-security-policy", "default-src 'none'; frame-ancestors 'none'");
}

function json(response: ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value); response.statusCode = status; response.setHeader("content-type", "application/json; charset=utf-8"); response.setHeader("content-length", Buffer.byteLength(body)); response.end(body);
}

function publicError(code: string, message: string, retryable = false): PublicError { return { error: { code, message, retryable, correlationId: randomUUID() } }; }

export interface EngineGateway {
  server: ReturnType<typeof createServer>;
  pairingCode: string;
  requests: RequestManager;
  providers: ProviderRegistry;
}

export function createEngineGateway(config: EngineConfig): EngineGateway {
  const providers = new ProviderRegistry(config), pairing = new PairingManager(config.pairingTtlMs, config.sessionTtlMs);
  const orchestrator = new IntelligenceOrchestrator(providers.generation, config.requestTimeoutMs), requests = new RequestManager(orchestrator, config.maximumActiveRequests);
  const limiter = new FixedWindowLimiter(120, 60_000), pairLimiter = new FixedWindowLimiter(8, 60_000);
  const cleanup = setInterval(() => { pairing.cleanup(); requests.cleanup(); limiter.prune(); pairLimiter.prune(); }, 10 * 60_000); cleanup.unref();
  const server = createServer(async (request, response) => {
    securityHeaders(response);
    const origin = request.headers.origin, allowedOrigin = origin && config.allowedOrigins.has(origin) ? origin : null;
    if (allowedOrigin) { response.setHeader("access-control-allow-origin", allowedOrigin); response.setHeader("vary", "origin"); }
    if (!loopbackAddress(request.socket) || !validHost(request.headers.host)) { json(response, 403, publicError("LOCAL_ONLY", "The Intelligence Engine accepts loopback clients only.")); return; }
    if (request.method === "OPTIONS") {
      if (!allowedOrigin) { json(response, 403, publicError("ORIGIN_DENIED", "Browser origin is not allowed.")); return; }
      response.statusCode = 204; response.setHeader("access-control-allow-methods", "GET,POST,DELETE,OPTIONS"); response.setHeader("access-control-allow-headers", "authorization,content-type,x-kaizen-pairing-code"); response.setHeader("access-control-max-age", "600"); response.end(); return;
    }
    const url = new URL(request.url ?? "/", "http://localhost"), key = request.socket.remoteAddress ?? "local";
    if (!limiter.allow(key)) { json(response, 429, publicError("RATE_LIMITED", "Too many Intelligence Engine requests.", true)); return; }
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        const provider = await providers.generation.health(AbortSignal.timeout(2_000)); json(response, 200, { ok: true, engine: "ready", provider: provider.status, time: new Date().toISOString() }); return;
      }
      if (!allowedOrigin) { json(response, 403, publicError("ORIGIN_DENIED", "Browser origin is not allowed.")); return; }
      if (request.method === "POST" && url.pathname === "/v1/pair") {
        if (!pairLimiter.allow(key)) { json(response, 429, publicError("PAIRING_RATE_LIMITED", "Too many pairing attempts.")); return; }
        const code = request.headers["x-kaizen-pairing-code"];
        const paired = pairing.pair(typeof code === "string" ? code : "");
        if (!paired) { json(response, 401, publicError("PAIRING_DENIED", "Pairing code is invalid, expired, or already used.")); return; }
        json(response, 200, { sessionToken: paired.token, expiresAt: new Date(paired.expiresAt).toISOString(), permissions: paired.permissions }); return;
      }
      const token = tokenFrom(request), session = token ? pairing.authorize(token) : null;
      if (!token || !session) { json(response, 401, publicError("AUTH_REQUIRED", "A valid local Intelligence session is required.")); return; }
      const sid = sessionId(token);
      if (request.method === "GET" && url.pathname === "/v1/status") {
        const provider = await providers.generation.health(AbortSignal.timeout(2_000)); json(response, 200, { engine: provider.status === "ready" ? "ready" : "failed", provider, model: providers.generation.identity(), capabilities: providers.generation.capabilities() }); return;
      }
      if (request.method === "GET" && url.pathname === "/v1/metrics") { json(response, 200, requests.metrics()); return; }
      if (request.method === "DELETE" && url.pathname === "/v1/session") { pairing.revoke(token); response.statusCode = 204; response.end(); return; }
      if (request.method === "POST" && url.pathname === "/v1/requests") {
        const body = await readJson(request, config.maximumBodyBytes) as { prompt?: unknown; intent?: unknown };
        const input: IntelligenceRequestInput = { prompt: typeof body.prompt === "string" ? body.prompt : "", intent: body.intent === "focus-today" ? "focus-today" : "ask", permissions: session.permissions };
        const id = requests.create(input, sid); json(response, 202, { requestId: id }); return;
      }
      const events = url.pathname.match(/^\/v1\/requests\/([0-9a-f-]+)\/events$/i);
      if (request.method === "GET" && events) {
        response.statusCode = 200; response.setHeader("content-type", "text/event-stream; charset=utf-8"); response.setHeader("connection", "keep-alive"); response.flushHeaders();
        const unsubscribe = requests.subscribe(events[1]!, sid, (event) => response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
        if (!unsubscribe) { response.end(`event: request.failed\ndata: ${JSON.stringify({ type: "request.failed", code: "NOT_FOUND", message: "Request was not found.", retryable: false, at: new Date().toISOString() })}\n\n`); return; }
        const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 15_000); request.on("close", () => { clearInterval(heartbeat); unsubscribe(); }); return;
      }
      const toolResult = url.pathname.match(/^\/v1\/requests\/([0-9a-f-]+)\/tool-results$/i);
      if (request.method === "POST" && toolResult) {
        const result = await readJson(request, config.maximumBodyBytes) as BridgeToolResult;
        if (!result || typeof result.callId !== "string" || typeof result.requestId !== "string" || typeof result.status !== "string") { json(response, 400, publicError("INVALID_TOOL_RESULT", "Tool result envelope is invalid.")); return; }
        if (!requests.submitToolResult(toolResult[1]!, sid, result)) { json(response, 409, publicError("TOOL_RESULT_REJECTED", "Tool result is stale, mismatched, or unauthorized.")); return; }
        response.statusCode = 204; response.end(); return;
      }
      const cancel = url.pathname.match(/^\/v1\/requests\/([0-9a-f-]+)$/i);
      if (request.method === "DELETE" && cancel) { if (!requests.cancel(cancel[1]!, sid)) { json(response, 404, publicError("NOT_FOUND", "Request was not found.")); return; } response.statusCode = 204; response.end(); return; }
      json(response, 404, publicError("NOT_FOUND", "Route was not found."));
    } catch (error) {
      const known = error instanceof IntelligenceError ? error : new IntelligenceError("INVALID_REQUEST", error instanceof Error ? error.message : "Request failed.");
      json(response, known.code === "BODY_TOO_LARGE" ? 413 : 400, publicError(known.code, known.message, known.retryable));
    }
  });
  server.once("close", () => clearInterval(cleanup));
  return { server, pairingCode: pairing.pairingCode, requests, providers };
}
