const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function assertSafeJson(value: unknown, depth = 0, budget = { nodes: 0 }): void {
  if (++budget.nodes > 20_000) throw new Error("payload is too complex");
  if (depth > 20) throw new Error("payload is nested too deeply");
  if (typeof value === "string" && value.length > 100_000) throw new Error("string is too large");
  if (Array.isArray(value)) {
    if (value.length > 2_000) throw new Error("array has too many entries");
    for (const item of value) assertSafeJson(item, depth + 1, budget);
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (BLOCKED_KEYS.has(key)) throw new Error("unsafe object key");
      assertSafeJson(item, depth + 1, budget);
    }
  }
}
