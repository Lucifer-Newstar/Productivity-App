/** Privacy-safe observability for telemetry metrics. */
export interface TelemetrySnapshot {
  startedAt: string;
  requestsStarted: number;
  requestsCompleted: number;
  requestsFailed: number;
  requestsCancelled: number;
  toolCalls: number;
  totalDurationMs: number;
  maximumDurationMs: number;
  errorCodes: Record<string, number>;
}

export class EngineTelemetry {
  private readonly state: TelemetrySnapshot = { startedAt: new Date().toISOString(), requestsStarted: 0, requestsCompleted: 0, requestsFailed: 0, requestsCancelled: 0, toolCalls: 0, totalDurationMs: 0, maximumDurationMs: 0, errorCodes: {} };
  requestStarted(): void { this.state.requestsStarted++; }
  toolCalled(): void { this.state.toolCalls++; }
  requestCompleted(durationMs: number): void { this.state.requestsCompleted++; this.duration(durationMs); }
  requestFailed(code: string, durationMs: number): void { this.state.requestsFailed++; this.state.errorCodes[code] = (this.state.errorCodes[code] ?? 0) + 1; this.duration(durationMs); }
  requestCancelled(durationMs: number): void { this.state.requestsCancelled++; this.duration(durationMs); }
  snapshot(): TelemetrySnapshot { return structuredClone(this.state); }
  private duration(value: number): void { const ms = Math.max(0, Math.round(value)); this.state.totalDurationMs += ms; this.state.maximumDurationMs = Math.max(this.state.maximumDurationMs, ms); }
}
