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
import { Plus, Brain, AlertTriangle, Trash2, Sparkles } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
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

  const upd = (id: string, patch: Partial<CareerSkill>) =>
    updateCareer((c) => ({ skills: c.skills.map(s => s.id === id ? { ...s, ...patch } : s) }));
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
