"use client";

/**
 * SkillsSection — skill inventory MVP.
 * - Add skills with 1-10 proficiency, confidence, interest sliders.
 * - Visual "skill web" rendered as a horizontal bar chart sorted by proficiency.
 * - Decay warning (lastUsed > 90 days → yellow; > 180 → red).
 * - Category grouping.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Brain, AlertTriangle, Trash2, Sparkles, TrendingUp } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import SkillRadar from "../SkillRadar";
import type { CareerSkill, SkillUsageFreq } from "../../../lib/careerTypes";

const CATEGORIES = ["Technical", "Leadership", "Communication", "Design", "Domain", "Other"];
const USAGE: SkillUsageFreq[] = ["daily","weekly","monthly","rarely"];
const uid = () => Math.random().toString(36).slice(2,10);

export default function SkillsSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0]);

  const add = () => {
    if (!name.trim()) return;
    const skill: CareerSkill = {
      id: uid(), name: name.trim(), category: cat, proficiency: 3, confidence: 3, interest: 5,
      usage: "weekly", growth: [], portfolioLinks: [],
    };
    updateCareer((c) => ({ skills: [skill, ...c.skills] }));
    setName(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<CareerSkill>) => {
    updateCareer((c) => ({
      skills: c.skills.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...patch };
        // If proficiency changed, append a growth point (dedupe by date).
        if (patch.proficiency != null && patch.proficiency !== s.proficiency) {
          const today = new Date().toISOString().slice(0, 10);
          const existing = (s.growth || []).filter((g) => g.date !== today);
          merged.growth = [...existing, { date: today, level: patch.proficiency }];
        }
        return merged;
      }),
    }));
  };
  const del = (id: string) => { if (confirm("Delete skill?")) updateCareer((c) => ({ skills: c.skills.filter(s => s.id !== id) })); };
  const touch = (id: string) => upd(id, { lastUsedAt: Date.now() });

  const grouped = useMemo(() => {
    const map: Record<string, CareerSkill[]> = {};
    for (const s of career.skills) {
      const k = s.category ?? "Other";
      (map[k] = map[k] || []).push(s);
    }
    for (const k in map) map[k].sort((a,b) => b.proficiency - a.proficiency);
    return map;
  }, [career.skills]);

  const decayCount = career.skills.filter(s => s.lastUsedAt && Date.now() - s.lastUsedAt > 90*86400000).length;
  const avg = career.skills.length ? Math.round(career.skills.reduce((n,s)=>n+s.proficiency,0)/career.skills.length*10)/10 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Skills Inventory</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
            Every blade sharpened — track proficiency, confidence, decay.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
          style={{ background: "linear-gradient(135deg,#7f1d1d,#450a0a)", color: "#fecaca", border: "1.5px solid rgba(248,113,113,0.6)", boxShadow: "0 8px 20px -8px rgba(185,28,28,0.8)" }}>
          <Plus size={14} /> ADD SKILL
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tracked" value={career.skills.length} color="#b91c1c" />
        <Stat label="Avg level" value={avg} color="#d4af37" />
        <Stat label="Decaying" value={decayCount} color="#ec4899" />
        <Stat label="Daily use" value={career.skills.filter(s=>s.usage==="daily").length} color="#06b6d4" />
      </div>

      {/* Radar + top growth */}
      {career.skills.length >= 3 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-4"
            style={{ background: isDark ? "linear-gradient(145deg,rgba(12,26,34,0.9),rgba(10,20,24,0.8))" : "rgba(255,248,228,0.95)",
              border: "1px solid rgba(185,28,28,0.4)" }}>
            <h3 className="emperor-title text-xs tracking-[0.3em] mb-2 text-center" style={{color:"#fecaca"}}>
              SKILL · RADAR
            </h3>
            <SkillRadar skills={career.skills} />
          </div>
          <div className="rounded-2xl p-4"
            style={{ background: isDark ? "linear-gradient(145deg,rgba(12,26,34,0.9),rgba(10,20,24,0.8))" : "rgba(255,248,228,0.95)",
              border: "1px solid rgba(6,182,212,0.4)" }}>
            <h3 className="emperor-title text-xs tracking-[0.3em] mb-3 flex items-center gap-2" style={{color:"#67e8f9"}}>
              <TrendingUp size={14}/> GROWTH
            </h3>
            <GrowthChart skills={career.skills} isDark={isDark}/>
            <TopSkills skills={career.skills} />
          </div>
        </div>
      )}

      {adding && (
        <div className="rounded-xl p-4 flex flex-wrap gap-2 items-center"
          style={{ background: isDark ? "rgba(12,26,34,0.8)" : "rgba(255,248,228,0.9)", border: "1px solid rgba(185,28,28,0.4)" }}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Skill name (e.g. Terraform)"
            className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
            style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)"}` }} />
          <select value={cat} onChange={e=>setCat(e.target.value)}
            className="bg-transparent text-sm px-3 py-2 rounded-lg outline-none"
            style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)"}` }}>
            {CATEGORIES.map(c => <option key={c} value={c} style={{background:"#0a0709"}}>{c}</option>)}
          </select>
          <button onClick={add} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg"
            style={{ background: "#b91c1c", color: "white" }}>Add</button>
          <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2 text-gray-400">Cancel</button>
        </div>
      )}

      {career.skills.length === 0 && !adding && (
        <Empty title="No skills tracked yet." subtitle="Log the blades in your arsenal — even soft skills matter." />
      )}

      {Object.entries(grouped).map(([c, skills]) => (
        <div key={c}>
          <h3 className="emperor-title text-sm tracking-[0.25em] mb-2" style={{ color: "#b91c1c" }}>{c.toUpperCase()}</h3>
          <div className="space-y-2">
            {skills.map(s => {
              const days = s.lastUsedAt ? Math.floor((Date.now()-s.lastUsedAt)/86400000) : null;
              const stale = days && days > 90;
              const rotting = days && days > 180;
              return (
                <motion.div key={s.id} layout
                  className="rounded-xl p-3 md:p-4 relative"
                  style={{
                    background: isDark ? "linear-gradient(145deg,rgba(12,26,34,0.7),rgba(10,20,24,0.5))" : "rgba(255,248,228,0.9)",
                    border: `1px solid ${rotting ? "rgba(239,68,68,0.5)" : stale ? "rgba(245,158,11,0.4)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input value={s.name} onChange={e=>upd(s.id,{name:e.target.value})}
                          className="bg-transparent font-bold text-sm md:text-base outline-none"
                          style={{ color: isDark ? "#f3e9d2" : "#1a0f0a", minWidth: 120 }} />
                        {rotting && <span title="Not used in 180+ days" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{background:"rgba(239,68,68,0.15)",color:"#f87171"}}><AlertTriangle size={10}/>ROTTING</span>}
                        {stale && !rotting && <span title="Not used in 90+ days" className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}><AlertTriangle size={10}/>STALE</span>}
                      </div>
                      <div className="h-1.5 mt-2 rounded-full overflow-hidden" style={{background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}}>
                        <div className="h-full rounded-full" style={{ width: `${s.proficiency*10}%`, background: "linear-gradient(90deg,#b91c1c,#ec4899)", boxShadow:"0 0 8px #b91c1c" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>touch(s.id)} className="text-[10px] emperor-title px-2 py-1 rounded" style={{background:"rgba(6,182,212,0.12)",color:"#67e8f9"}}>Used today</button>
                      <button onClick={()=>del(s.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <Slider label="Proficiency" value={s.proficiency} color="#b91c1c" onChange={v=>upd(s.id,{proficiency:v})} />
                    <Slider label="Confidence" value={s.confidence} color="#d4af37" onChange={v=>upd(s.id,{confidence:v})} />
                    <Slider label="Interest" value={s.interest} color="#ec4899" onChange={v=>upd(s.id,{interest:v})} />
                    <div>
                      <div className="text-[10px] emperor-title tracking-widest mb-1" style={{color:"#8b9eb0"}}>USAGE</div>
                      <select value={s.usage} onChange={e=>upd(s.id,{usage:e.target.value as SkillUsageFreq})}
                        className="w-full bg-transparent text-xs px-2 py-1 rounded outline-none"
                        style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}>
                        {USAGE.map(u => <option key={u} value={u} style={{background:"#0a0709"}}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  {days != null && <div className="text-[10px] mt-2" style={{color:"#6b7280"}}>Last used {days === 0 ? "today" : `${days} days ago`}</div>}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  const isDark = true;
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(12,26,34,0.6)", border: `1px solid ${color}33` }}>
      <div className="text-[10px] emperor-title tracking-widest" style={{ color }}>{label.toUpperCase()}</div>
      <div className="text-xl font-black mt-1" style={{ color: "#f3e9d2" }}>{value}</div>
    </div>
  );
}

function Slider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] emperor-title tracking-widest mb-1">
        <span style={{ color: "#8b9eb0" }}>{label.toUpperCase()}</span>
        <span style={{ color }}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-full accent-current" style={{ accentColor: color }} />
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(12,26,34,0.4)", border: "1px dashed rgba(103,232,249,0.25)" }}>
      <Sparkles size={28} className="mx-auto mb-2" style={{ color: "#67e8f9" }} />
      <p className="imperial-title tracking-widest text-sm" style={{ color: "#cffafe" }}>{title}</p>
      <p className="serif-body italic text-xs mt-1" style={{ color: "#8b9eb0" }}>{subtitle}</p>
    </div>
  );
}

/**
 * GrowthChart — aggregate min/avg/max proficiency across all tracked skills
 * over the last 30 days of growth points. Renders a small sparkline SVG.
 */
function GrowthChart({ skills, isDark }: { skills: CareerSkill[]; isDark: boolean }) {
  const W = 280, H = 90, PAD = 8;
  const series = useMemo(() => {
    // Build a day-keyed map of skill-level snapshots (latest-known per day per skill).
    const byDay = new Map<string, Map<string, number>>();
    for (const s of skills) {
      const points = [...(s.growth || [])].sort((a, b) => a.date.localeCompare(b.date));
      let current: number | null = null;
      if (points.length === 0) {
        // Seed with current proficiency "today" so something shows.
        const t = new Date().toISOString().slice(0, 10);
        const m = byDay.get(t) || new Map<string, number>();
        m.set(s.id, s.proficiency);
        byDay.set(t, m);
        continue;
      }
      // Walk each day from first point → today, carrying the last known level forward.
      const start = new Date(points[0].date);
      const end = new Date();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        const hit = points.find(p => p.date === key);
        if (hit) current = hit.level;
        if (current != null) {
          const m = byDay.get(key) || new Map<string, number>();
          m.set(s.id, current);
          byDay.set(key, m);
        }
      }
    }
    // Keep last 21 unique days.
    const days = Array.from(byDay.keys()).sort().slice(-21);
    const avg: number[] = [];
    const peak: number[] = [];
    const low: number[] = [];
    for (const d of days) {
      const vs = Array.from(byDay.get(d)!.values());
      avg.push(vs.reduce((a, b) => a + b, 0) / vs.length);
      peak.push(Math.max(...vs));
      low.push(Math.min(...vs));
    }
    return { days, avg, peak, low };
  }, [skills]);

  if (series.days.length < 2) {
    return <div className="text-xs serif-body italic py-6 text-center" style={{ color: "#8b9eb0" }}>Log level changes to seed growth curves.</div>;
  }

  const xs = (i: number) => PAD + (i / (series.days.length - 1)) * (W - PAD * 2);
  const ys = (v: number) => H - PAD - (v / 10) * (H - PAD * 2);
  const pathFor = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(v)}`).join(" ");

  const avgColor = "#06b6d4";
  const peakColor = "#d4af37";
  const lowColor = "rgba(236,72,153,0.55)";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* grid */}
        {[2,4,6,8].map(v => (
          <line key={v} x1={PAD} x2={W-PAD} y1={ys(v)} y2={ys(v)} stroke={gridColor} strokeDasharray="2 3" strokeWidth={1}/>
        ))}
        {/* band peak→low */}
        <path d={`${pathFor(series.peak)} L${xs(series.days.length-1)},${ys(series.low[series.low.length-1])} ${series.low.slice(0,-1).map((v,i)=>`L${xs(series.low.length-1-i)},${ys(series.low[series.low.length-2-i])}`).reverse().join(" ")} Z`}
              fill="url(#gband)" opacity={0.25}/>
        <defs>
          <linearGradient id="gband" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={peakColor}/>
            <stop offset="100%" stopColor={avgColor}/>
          </linearGradient>
        </defs>
        <path d={pathFor(series.peak)} stroke={peakColor} strokeWidth={1.25} fill="none" opacity={0.6}/>
        <path d={pathFor(series.low)} stroke={lowColor} strokeWidth={1.25} fill="none" opacity={0.6}/>
        <path d={pathFor(series.avg)} stroke={avgColor} strokeWidth={2} fill="none"
              style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.6))" }}/>
        {series.avg.map((v,i) => (
          <circle key={i} cx={xs(i)} cy={ys(v)} r={i === series.avg.length-1 ? 3 : 1.5} fill={avgColor}/>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[9px] emperor-title tracking-widest mt-1" style={{color:"#8b9eb0"}}>
        <span><span style={{color:peakColor}}>■</span> PEAK</span>
        <span><span style={{color:avgColor}}>■</span> AVG LVL</span>
        <span><span style={{color:"#ec4899"}}>■</span> LOW</span>
      </div>
      <div className="flex justify-between text-[9px] mt-0.5" style={{color:"#6b7280"}}>
        <span>{series.days[0]}</span>
        <span>{series.days[series.days.length-1]}</span>
      </div>
    </div>
  );
}

/**
 * TopSkills — compact ranked list of highest-proficiency skills with delta.
 */
function TopSkills({ skills }: { skills: CareerSkill[] }) {
  const ranked = useMemo(() => {
    return [...skills]
      .map(s => {
        const growth = s.growth || [];
        const first = growth[0]?.level ?? s.proficiency;
        const delta = s.proficiency - first;
        return { s, delta };
      })
      .sort((a, b) => b.s.proficiency - a.s.proficiency)
      .slice(0, 5);
  }, [skills]);

  if (ranked.length === 0) return null;

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(255,255,255,0.08)" }}>
      <div className="text-[9px] emperor-title tracking-[0.25em] mb-2" style={{color:"#8b9eb0"}}>TOP · BLADES</div>
      <div className="space-y-1.5">
        {ranked.map(({ s, delta }, i) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-center font-black" style={{color: i===0 ? "#d4af37" : "#6b7280"}}>{i+1}</span>
            <span className="flex-1 truncate" style={{color:"#f3e9d2"}}>{s.name}</span>
            <span className="font-black" style={{color:"#06b6d4"}}>{s.proficiency}</span>
            {delta !== 0 && (
              <span className="text-[10px]" style={{ color: delta > 0 ? "#34d399" : "#f87171" }}>
                {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
