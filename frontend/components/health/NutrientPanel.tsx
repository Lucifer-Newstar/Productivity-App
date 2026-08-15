"use client";

/**
 * NutrientPanel — Wave 8B FUEL nutrient depth.
 *
 *  - Sub-nutrient trackers vs daily targets: fiber / added sugar / sodium /
 *    cholesterol / sat-fat / trans-fat / omega-3 (rough numeric self-entry)
 *  - Micronutrient awareness radar — 6-axis SVG (Na/K/Mg/Fe/VitC/Ω-3), 1-10 sliders
 *  - Water-soluble + fat-soluble vitamin and mineral quick-log checklists (🇮🇳 RDA chips)
 *  - Antioxidant / probiotic / prebiotic serving counters (Chennai staples)
 *
 * One DailyNutrientEntry row per date in health.nutrients.
 */

import { useMemo } from "react";
import { Leaf, ShieldPlus, FlaskConical, Radar } from "lucide-react";
import { useStore } from "../../lib/store";
import {
  NUTRIENT_TARGETS, nutrientStatus, fiberFromMeals, type NutrientKey,
} from "../../lib/healthAnalytics";
import type { DailyNutrientEntry } from "../../lib/healthTypes";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

const RADAR_AXES: { key: keyof NonNullable<DailyNutrientEntry["radar"]>; label: string; color: string }[] = [
  { key: "sodium",    label: "Na",   color: "#f59e0b" },
  { key: "potassium", label: "K",    color: "#10b981" },
  { key: "magnesium", label: "Mg",   color: "#818cf8" },
  { key: "iron",      label: "Fe",   color: "#ef4444" },
  { key: "vitC",      label: "VitC", color: "#facc15" },
  { key: "omega3",    label: "Ω-3",  color: "#22d3ee" },
];

const WATER_VITS: { id: "C"|"B1"|"B2"|"B3"|"B5"|"B6"|"B7"|"B9"|"B12"; rda: string }[] = [
  { id: "C", rda: "80mg" }, { id: "B1", rda: "1.4mg" }, { id: "B2", rda: "2mg" },
  { id: "B3", rda: "14mg" }, { id: "B5", rda: "5mg" }, { id: "B6", rda: "1.9mg" },
  { id: "B7", rda: "30µg" }, { id: "B9", rda: "400µg" }, { id: "B12", rda: "2.4µg" },
];
const FAT_VITS: { id: "A"|"D"|"E"|"K"; rda: string }[] = [
  { id: "A", rda: "900µg" }, { id: "D", rda: "600IU" }, { id: "E", rda: "10mg" }, { id: "K", rda: "55µg" },
];
const MINERALS: { id: "Ca"|"Mg"|"K"|"Zn"|"Fe"|"Se"|"Cu"|"Mn"; rda: string }[] = [
  { id: "Ca", rda: "1000mg" }, { id: "Mg", rda: "400mg" }, { id: "K", rda: "4.7g" },
  { id: "Zn", rda: "12mg" }, { id: "Fe", rda: "19mg" }, { id: "Se", rda: "40µg" },
  { id: "Cu", rda: "2mg" }, { id: "Mn", rda: "4mg" },
];

const FUNCTIONAL: { key: "antioxidants" | "probiotics" | "prebiotics"; label: string; color: string; examples: string }[] = [
  { key: "antioxidants", label: "ANTIOXIDANTS", color: "#a78bfa", examples: "berries · dark choc · green tea · turmeric 🌏 · greens" },
  { key: "probiotics",   label: "PROBIOTICS",   color: "#34d399", examples: "curd/thayir 🌏 · lassi · kefir · kanji · pickle" },
  { key: "prebiotics",   label: "PREBIOTICS",   color: "#fbbf24", examples: "onion · garlic · raw banana · oats · leek" },
];

function RadarChart({ radar }: { radar: NonNullable<DailyNutrientEntry["radar"]> }) {
  const cx = 80, cy = 78, R = 58;
  const N = RADAR_AXES.length;
  const pt = (i: number, r: number) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const poly = RADAR_AXES.map((ax, i) => {
    const v = Math.max(0, Math.min(10, radar[ax.key] ?? 0));
    const p = pt(i, (v / 10) * R);
    return `${p.x},${p.y}`;
  }).join(" ");
  return (
    <svg width="160" height="156" viewBox="0 0 160 156">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f}
          points={RADAR_AXES.map((_, i) => { const p = pt(i, R * f); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={1} />
      ))}
      {RADAR_AXES.map((ax, i) => {
        const p = pt(i, R);
        const lp = pt(i, R + 12);
        return (
          <g key={ax.key}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(148,163,184,0.15)" strokeWidth={1} />
            <text x={lp.x} y={lp.y + 3} textAnchor="middle" fontSize="8.5" fill={ax.color}
              fontFamily="var(--hlth-font-mono)" fontWeight="700">{ax.label}</text>
          </g>
        );
      })}
      <polygon points={poly} fill="rgba(163,230,53,0.18)" stroke="var(--hlth-accent)" strokeWidth={1.5}
        style={{ filter: "drop-shadow(0 0 4px rgba(163,230,53,0.4))" }} />
      {RADAR_AXES.map((ax, i) => {
        const v = Math.max(0, Math.min(10, radar[ax.key] ?? 0));
        const p = pt(i, (v / 10) * R);
        return <circle key={ax.key} cx={p.x} cy={p.y} r={2.5} fill={ax.color} />;
      })}
    </svg>
  );
}

export default function NutrientPanel() {
  const { health, updateHealth } = useStore();
  const today = todayIso();
  const row = useMemo<DailyNutrientEntry>(() => {
    return health.nutrients.find(n => n.date === today) ?? { id: uid(), date: today };
  }, [health.nutrients, today]);

  const mealFiber = useMemo(() => fiberFromMeals(health.meals, today), [health.meals, today]);

  const patch = (p: Partial<DailyNutrientEntry>) => {
    updateHealth(h => {
      const others = h.nutrients.filter(n => n.date !== today);
      return { nutrients: [...others, { ...row, ...p }] };
    });
  };

  const radar = row.radar ?? {};
  const numKeys = Object.keys(NUTRIENT_TARGETS) as NutrientKey[];
  const statusColor: Record<string, string> = { ok: "#10b981", low: "#64748b", near: "#f59e0b", over: "#ef4444" };

  const toggleIn = (
    group: "waterSolubleVits" | "fatSolubleVits" | "minerals",
    id: string,
  ) => {
    const cur = (row[group] ?? {}) as Record<string, boolean>;
    patch({ [group]: { ...cur, [id]: !cur[id] } } as Partial<DailyNutrientEntry>);
  };

  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <FlaskConical size={12} /> NUTRIENT DEPTH · rough awareness, not a lab report
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 10 }}>
        {/* Sub-nutrient trackers */}
        <div>
          <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.12em", marginBottom: 8 }}>
            SUB-NUTRIENTS VS TARGET
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {numKeys.map(k => {
              const t = NUTRIENT_TARGETS[k];
              const raw = row[k] as number | undefined;
              // Fiber pre-seeds from food-DB fibre of logged meals.
              const value = k === "fiberG" && raw == null ? mealFiber : raw;
              const st = nutrientStatus(k, value);
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ minWidth: 86, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-fg)", letterSpacing: "0.04em" }}>{t.label}</span>
                  <input type="number" min={0} value={value ?? ""} placeholder="0"
                    onChange={e => patch({ [k]: e.target.value === "" ? undefined : Math.max(0, +e.target.value) } as Partial<DailyNutrientEntry>)}
                    style={{ width: 62, background: "var(--hlth-card2)", color: "var(--hlth-fg)", border: "1px solid var(--hlth-border-soft)", borderRadius: 4, padding: "3px 6px", fontFamily: "var(--hlth-font-mono)", fontSize: 11 }} />
                  <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-muted)", minWidth: 56 }}>
                    {t.kind === "zero" ? "target 0" : `${t.kind === "cap" ? "≤" : "≥"}${t.goal}${t.unit}`}
                  </span>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(148,163,184,0.15)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, st.pct)}%`, height: "100%", background: statusColor[st.status], transition: "width 0.3s" }} />
                  </div>
                  <span style={{ minWidth: 34, textAlign: "right", fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: statusColor[st.status], fontWeight: 700 }}>
                    {st.status === "over" ? "OVER" : `${st.pct}%`}
                  </span>
                </div>
              );
            })}
          </div>
          {(row.transFatG ?? 0) > 0 && (
            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
              Trans fat logged — usually from packaged/vanaspati foods. Zero is the only safe target.
            </div>
          )}
          {(row.sodiumMg ?? 0) > 1500 && (row.sodiumMg ?? 0) <= 2300 && (
            <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontFamily: "var(--hlth-font-mono)", fontSize: 10 }}>
              1.5g+ sodium — fine on Chennai training days (sweat losses), watch it on rest days. 🌏
            </div>
          )}
        </div>

        {/* Radar + sliders */}
        <div>
          <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.12em", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <Radar size={10} /> MICRONUTRIENT AWARENESS · 1-10 by feel
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <RadarChart radar={radar} />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 150 }}>
              {RADAR_AXES.map(ax => (
                <div key={ax.key} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ minWidth: 34, fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: ax.color, fontWeight: 700 }}>{ax.label}</span>
                  <input type="range" min={0} max={10} value={radar[ax.key] ?? 0}
                    onChange={e => patch({ radar: { ...radar, [ax.key]: +e.target.value } })}
                    style={{ flex: 1, accentColor: ax.color }} />
                  <span style={{ minWidth: 18, textAlign: "right", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-fg)" }}>{radar[ax.key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vitamin & mineral checklists */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 14 }}>
        {([
          { title: "WATER-SOLUBLE VITS", group: "waterSolubleVits" as const, items: WATER_VITS, color: "#22d3ee" },
          { title: "FAT-SOLUBLE VITS", group: "fatSolubleVits" as const, items: FAT_VITS, color: "#f59e0b" },
          { title: "MINERALS · 🇮🇳 RDA", group: "minerals" as const, items: MINERALS, color: "#a78bfa" },
        ]).map(sec => (
          <div key={sec.group}>
            <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-muted)", letterSpacing: "0.12em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <ShieldPlus size={10} /> {sec.title}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {sec.items.map(v => {
                const on = !!(row[sec.group] as Record<string, boolean> | undefined)?.[v.id];
                return (
                  <button key={v.id} onClick={() => toggleIn(sec.group, v.id)}
                    title={`RDA ${v.rda}`}
                    style={{
                      padding: "4px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                      fontFamily: "var(--hlth-font-mono)", fontWeight: 700, letterSpacing: "0.04em",
                      background: on ? `${sec.color}22` : "var(--hlth-card2)",
                      border: `1px solid ${on ? sec.color : "var(--hlth-border-soft)"}`,
                      color: on ? sec.color : "var(--hlth-muted)",
                    }}>
                    {v.id}<span style={{ fontSize: 8, opacity: 0.7, marginLeft: 3 }}>{v.rda}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Functional foods */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        {FUNCTIONAL.map(f => (
          <div key={f.key} style={{
            flex: "1 1 220px", display: "flex", alignItems: "center", gap: 10,
            background: "var(--hlth-card2)", border: "1px solid var(--hlth-border-soft)",
            borderRadius: 8, padding: "8px 12px",
          }}>
            <Leaf size={13} style={{ color: f.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: f.color, fontWeight: 700, letterSpacing: "0.08em" }}>{f.label}</div>
              <div style={{ fontSize: 9, color: "var(--hlth-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.examples}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className="hlth-btn hlth-btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }}
                onClick={() => patch({ [f.key]: Math.max(0, (row[f.key] ?? 0) - 1) } as Partial<DailyNutrientEntry>)}>−</button>
              <span style={{ fontFamily: "var(--hlth-font-display)", fontWeight: 900, fontSize: 16, minWidth: 18, textAlign: "center", color: (row[f.key] ?? 0) > 0 ? f.color : "var(--hlth-muted)" }}>
                {row[f.key] ?? 0}
              </span>
              <button className="hlth-btn hlth-btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }}
                onClick={() => patch({ [f.key]: (row[f.key] ?? 0) + 1 } as Partial<DailyNutrientEntry>)}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
