/** Trusted fixed-intent router for the v0.1.1 Core Today interpreter capability. */
import { randomUUID } from "node:crypto";
import type { DeterministicTodayRouteV1 } from "../contracts/interpreter.js";
import type { IntelligenceRequestInput } from "../contracts/protocol.js";
import { validateDeterministicTodayRoute } from "../validation/schema.js";
import { IntelligenceError } from "./errors.js";

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(LOCAL_DATE);
  if (!match) return false;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(Date.UTC(year,month-1,day));
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day;
}

export function routeCoreToday(input: IntelligenceRequestInput): DeterministicTodayRouteV1 {
  if (input.intent !== "focus-today") throw new IntelligenceError("UNSUPPORTED_INTENT", "Only the Core Today focus request is available in v0.1.1.");
  if (!isValidLocalDate(input.localDate)) throw new IntelligenceError("INVALID_REQUEST", "A trusted local date in YYYY-MM-DD format is required.");
  if (!input.permissions.tools.includes("get_today") || !input.permissions.domains.includes("core")) {
    throw new IntelligenceError("TOOL_DENIED", "Current-day context permission is required.");
  }
  const route: DeterministicTodayRouteV1 = {
    schemaVersion: "1.0",
    routeId: randomUUID(),
    capability: "core.today.interpret",
    intent: "focus-today",
    selectedBy: "kaizen-deterministic-router",
    tool: { name: "get_today", version: "1.0", arguments: { localDate: input.localDate, includeCompleted: false, maximumItems: 100 } },
    evidenceContract: "core.today@1.0",
    allowedDomains: ["core"],
    modelToolAccess: "none",
  };
  const validation = validateDeterministicTodayRoute(route);
  if (!validation.ok) throw new IntelligenceError("ROUTE_CONTRACT_FAILED", "The trusted Core Today route failed its frozen contract.");
  return route;
}
