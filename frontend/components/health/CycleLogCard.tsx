"use client";
/** Optional cycle log — educational, local, non-diagnostic. */
import { useStore } from "../../lib/store";
import { estimatedNextPeriodStart } from "../../lib/healthAnalytics";
import { DEFAULT_CYCLE_LOG } from "../../lib/healthTypes";

export default function CycleLogCard({ compact = false }: { compact?: boolean }) {
  const { health, updateHealth } = useStore();
  const log = health.cycleLog ?? DEFAULT_CYCLE_LOG;
  const next = estimatedNextPeriodStart(log);
  const patch = (partial: Partial<typeof log>) =>
    updateHealth((h) => ({ cycleLog: { ...(h.cycleLog ?? DEFAULT_CYCLE_LOG), ...partial } }));

  return (
    <div className={compact ? "hlth-card" : undefined} style={compact ? { padding: "12px 16px" } : undefined}>
      {compact && <div className="hlth-card-h">CYCLE LOG · optional</div>}
      <div className={compact ? undefined : "profile-row"} style={compact ? { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 } : undefined}>
        <label className={compact ? undefined : "profile-field"} style={compact ? { display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" } : undefined}>
          <span>Last start</span>
          <input
            className={compact ? undefined : "input-base"}
            type="date"
            value={log.lastStartDate}
            onChange={(e) => patch({ lastStartDate: e.target.value })}
            style={compact ? { background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px" } : undefined}
          />
        </label>
        <label className={compact ? undefined : "profile-field"} style={compact ? { display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" } : undefined}>
          <span>Cycle (days)</span>
          <input
            className={compact ? undefined : "input-base"}
            type="number"
            min={21}
            max={45}
            value={log.cycleLengthDays}
            onChange={(e) => patch({ cycleLengthDays: Math.max(21, Math.min(45, Number(e.target.value) || 28)) })}
            style={compact ? { background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px" } : undefined}
          />
        </label>
        <label className={compact ? undefined : "profile-field"} style={compact ? { display: "flex", flexDirection: "column", gap: 4, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" } : undefined}>
          <span>Period (days)</span>
          <input
            className={compact ? undefined : "input-base"}
            type="number"
            min={1}
            max={10}
            value={log.periodLengthDays}
            onChange={(e) => patch({ periodLengthDays: Math.max(1, Math.min(10, Number(e.target.value) || 5)) })}
            style={compact ? { background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "4px 6px" } : undefined}
          />
        </label>
      </div>
      {next && (
        <p className={compact ? undefined : "profile-hint"} style={compact ? { marginTop: 8, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)" } : undefined}>
          Next estimated start · {next}
        </p>
      )}
      <p className={compact ? undefined : "profile-hint"} style={compact ? { marginTop: 6, fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", letterSpacing: "0.04em" } : undefined}>
        Educational, not medical advice. Averages only — this is not a diagnosis.
      </p>
    </div>
  );
}
