/** Stable public runtime error used across routing, orchestration, and gateway boundaries. */
export class IntelligenceError extends Error {
  constructor(readonly code: string, message: string, readonly retryable = false) { super(message); }
}
