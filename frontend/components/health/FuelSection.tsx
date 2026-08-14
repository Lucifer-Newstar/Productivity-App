"use client";

/**
 * FuelSection — daily meals timeline + macro tracking.
 *
 * Wave 2 core:
 *  - Breakfast / Lunch / Dinner / Snacks slots
 *  - Add items by picking from food DB (search) or manual quick-add (name + kcal)
 *  - Daily totals: kcal, protein/carbs/fat
 *  - Repeat yesterday button
 *  - Macro pie/donut visualisation (SVG)
 *
 * Wave 8A additions:
 *  - Macro rough sliders (C/P/F % always sum 100) + presets (Balanced/Cut/Bulk/Keto)
 *  - Actual-vs-target gram bars driven by the kcal budget
 *  - Intermittent-fasting ring clock (FastingClock) + fast streak
 *  - Frequent-foods library (auto top-20 + pin, one-tap re-log)
 *  - Social / cheat meal flags with reason tag + guilt-reset
 *  - Meal time field (feeds fast streak) + meal photo attach (dataURL)
 */

import { useMemo, useRef, useState } from "react";
import { Repeat, Plus, Trash2, Search, Utensils, Coffee, Moon, Sun, Cookie, Users, Pizza, Camera, X, Pin, Star } from "lucide-react";
import { useStore } from "../../lib/store";
import { FOOD_DB, searchFoods, type FoodEntry } from "../../lib/healthFoodDb";
import {
  formatKcal, tdee, rebalanceMacros, macroGramTargets, frequentFoods,
} from "../../lib/healthAnalytics";
import { MACRO_PRESETS, type MacroPresetId } from "../../lib/healthTypes";
import type { MealEntry, MealItem } from "../../lib/healthTypes";
import FastingClock from "./FastingClock";

type Slot = "breakfast" | "lunch" | "dinner" | "snack";
const SLOTS: { id: Slot; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "breakfast", label: "Breakfast", icon: <Coffee size={14}/>, color: "#f59e0b" },
  { id: "lunch",     label: "Lunch",     icon: <Sun size={14}/>,     color: "#ef4444" },
  { id: "dinner",    label: "Dinner",    icon: <Moon size={14}/>,    color: "#818cf8" },
  { id: "snack",     label: "Snacks",    icon: <Cookie size={14}/>,  color: "#10b981" },
];

function todayIso() { return new Date().toISOString().slice(0, 10); }

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function emptyMeal(slot: Slot): MealEntry {
  return {
    id: uid(),
    date: todayIso(),
    slot,
    items: [],
  };
}

function MacroDonut({ carbs, protein, fat, kcal }: { carbs: number; protein: number; fat: number; kcal: number }) {
  const total = carbs + protein + fat;
  const R = 54;
  const C = 54;
  const cx = 64, cy = 64;
  const segs = [
    { label: "Carbs",    value: carbs,    color: "#f59e0b" },
    { label: "Protein",  value: protein,  color: "#10b981" },
    { label: "Fat",      value: fat,      color: "#ef4444" },
  ];
  let offset = 0;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={14}/>
        {total > 0 && segs.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={s.color} strokeWidth={14} strokeLinecap="butt"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{filter:`drop-shadow(0 0 4px ${s.color}88)`}}/>
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy-2} textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--hlth-fg)" fontFamily="var(--hlth-font-display)">
          {Math.round(kcal)}
        </text>
        <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill="var(--hlth-muted)" fontFamily="var(--hlth-font-mono)" letterSpacing="0.15em">KCAL</text>
      </svg>
      <div style={{display:"flex", flexDirection:"column", gap:6, fontFamily:"var(--hlth-font-mono)", fontSize:12}}>
        {segs.map(s => (
          <div key={s.label} style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{width:10,height:10,background:s.color,borderRadius:2}}/>
            <span style={{minWidth:62, color:"var(--hlth-fg)"}}>{s.label}</span>
            <span style={{color:"var(--hlth-muted)"}}>{Math.round(s.value)}g</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wave 8A — macro rough sliders (always sum 100%) + preset chips + target bars. */
function MacroSliders({ totals, targetKcal }: { totals: { kcal: number; carbsG: number; proteinG: number; fatG: number }; targetKcal: number }) {
  const { health, updateHealth } = useStore();
  const p = health.profile;
  const pct = { c: p.macroCarbsPct ?? 40, p: p.macroProteinPct ?? 30, f: p.macroFatPct ?? 30 };
  const grams = macroGramTargets(targetKcal, pct.c, pct.p, pct.f);
  const preset = p.macroPreset ?? "balanced";

  const write = (next: { c: number; p: number; f: number }, presetId: MacroPresetId) => {
    updateHealth(() => ({
      profile: { ...p, macroPreset: presetId, macroCarbsPct: next.c, macroProteinPct: next.p, macroFatPct: next.f },
    }));
  };
  const onSlide = (axis: "c" | "p" | "f", v: number) => write(rebalanceMacros(pct, axis, v), "custom");
  const onPreset = (id: Exclude<MacroPresetId, "custom">) => {
    const m = MACRO_PRESETS[id];
    write({ c: m.c, p: m.p, f: m.f }, id);
  };

  const rows: { axis: "c" | "p" | "f"; label: string; color: string; actual: number; target: number }[] = [
    { axis: "c", label: "Carbs",   color: "#f59e0b", actual: totals.carbsG,   target: grams.carbsG },
    { axis: "p", label: "Protein", color: "#10b981", actual: totals.proteinG, target: grams.proteinG },
    { axis: "f", label: "Fat",     color: "#ef4444", actual: totals.fatG,     target: grams.fatG },
  ];

  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div className="hlth-card-h">MACRO TARGETS · rough sliders — always 100%</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 12px" }}>
        {(Object.keys(MACRO_PRESETS) as Exclude<MacroPresetId, "custom">[]).map(id => (
          <button key={id} className="hlth-btn hlth-btn-ghost" onClick={() => onPreset(id)}
            style={{
              padding: "5px 10px", fontSize: 10,
              ...(preset === id ? { borderColor: "var(--hlth-accent)", color: "var(--hlth-accent-glow)", background: "rgba(163,230,53,0.08)" } : {}),
            }}>
            {MACRO_PRESETS[id].label} {MACRO_PRESETS[id].c}/{MACRO_PRESETS[id].p}/{MACRO_PRESETS[id].f}
          </button>
        ))}
        {preset === "custom" && (
          <span style={{ alignSelf: "center", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: "var(--hlth-accent-glow)", letterSpacing: "0.1em" }}>
            CUSTOM {pct.c}/{pct.p}/{pct.f}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(r => {
          const fillPct = r.target > 0 ? Math.min(100, Math.round(r.actual / r.target * 100)) : 0;
          const over = r.target > 0 && r.actual > r.target * 1.1;
          return (
            <div key={r.axis}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ minWidth: 58, fontFamily: "var(--hlth-font-mono)", fontSize: 11, color: r.color, fontWeight: 700 }}>{r.label}</span>
                <input type="range" min={0} max={100} value={pct[r.axis]}
                  onChange={e => onSlide(r.axis, +e.target.value)}
                  style={{ flex: 1, accentColor: r.color }} />
                <span style={{ minWidth: 38, textAlign: "right", fontFamily: "var(--hlth-font-mono)", fontSize: 12, color: "var(--hlth-fg)", fontWeight: 700 }}>{pct[r.axis]}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3 }}>
                <span style={{ minWidth: 58 }} />
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(148,163,184,0.15)", overflow: "hidden" }}>
                  <div style={{ width: `${fillPct}%`, height: "100%", background: r.color, opacity: 0.8, transition: "width 0.3s" }} />
                </div>
                <span style={{ minWidth: 110, textAlign: "right", fontFamily: "var(--hlth-font-mono)", fontSize: 10, color: over ? "#ef4444" : "var(--hlth-muted)" }}>
                  {Math.round(r.actual)}g / {r.target}g{over ? " ▲" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hlth-subtle" style={{ fontSize: 9, letterSpacing: "0.1em", marginTop: 10, opacity: 0.7 }}>
        gram targets derive from {formatKcal(targetKcal)} kcal budget · 4/4/9 kcal per g
      </div>
    </div>
  );
}

/** Wave 8A — frequent foods library: auto top-20 + pinnable, one-tap re-log. */
function FrequentFoodsStrip({ onLog }: { onLog: (name: string, kcal: number, c: number, p: number, f: number) => void }) {
  const { health, updateHealth } = useStore();
  const foods = useMemo(
    () => frequentFoods(health.meals, health.pinnedFoods ?? [], 20),
    [health.meals, health.pinnedFoods],
  );
  if (foods.length === 0) return null;
  const togglePin = (name: string) => {
    updateHealth(h => {
      const cur = h.pinnedFoods ?? [];
      const has = cur.some(x => x.toLowerCase() === name.toLowerCase());
      return { pinnedFoods: has ? cur.filter(x => x.toLowerCase() !== name.toLowerCase()) : [...cur, name] };
    });
  };
  return (
    <div className="hlth-card" style={{ padding: "14px 16px" }}>
      <div className="hlth-card-h" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Star size={12} /> YOUR TOP FOODS · tap to log to snacks · pin favourites
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {foods.map(f => (
          <span key={f.name} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--hlth-card2)", border: `1px solid ${f.pinned ? "var(--hlth-accent)" : "var(--hlth-border-soft)"}`,
            borderRadius: 999, padding: "4px 6px 4px 10px", fontSize: 11,
          }}>
            <button onClick={() => onLog(f.name, f.kcal, f.carbsG, f.proteinG, f.fatG)}
              style={{ background: "transparent", border: "none", color: "var(--hlth-fg)", cursor: "pointer", fontWeight: 600, fontSize: 11, padding: 0, fontFamily: "inherit" }}>
              {f.name} <span style={{ fontFamily: "var(--hlth-font-mono)", fontSize: 9, color: "var(--hlth-accent-glow)" }}>{f.kcal}kc·×{f.count}</span>
            </button>
            <button onClick={() => togglePin(f.name)} title={f.pinned ? "Unpin" : "Pin"}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: f.pinned ? "var(--hlth-accent-glow)" : "var(--hlth-muted)", display: "inline-flex" }}>
              <Pin size={10} style={f.pinned ? { fill: "currentColor" } : undefined} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function FoodPicker({ onPick, onClose }: { onPick: (f: FoodEntry, servings: number) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [servings, setServings] = useState(1);
  const results = useMemo(() => searchFoods(q, 30), [q]);
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:60, display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", padding:16,
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"min(720px, 100%)", maxHeight:"80vh", overflow:"auto",
        background:"var(--hlth-card)", border:"1px solid var(--hlth-border)", borderRadius:12, padding:16,
      }}>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
          <Search size={16} style={{color:"var(--hlth-accent)"}}/>
          <input autoFocus placeholder="Search food… (idli, chicken, biryani, whey…)"
            value={q} onChange={e=>setQ(e.target.value)}
            style={{flex:1, background:"var(--hlth-card2)", color:"var(--hlth-fg)",
              border:"1px solid var(--hlth-border-soft)", borderRadius:6, padding:"8px 10px",
              fontFamily:"var(--hlth-font-mono)", fontSize:12}}/>
          <label style={{fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", display:"flex",alignItems:"center",gap:6}}>
            ×
            <input type="number" min={0.25} step={0.25} value={servings}
              onChange={e=>setServings(Math.max(0.25, +e.target.value||1))}
              style={{width:48, background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"4px 6px", fontFamily:"var(--hlth-font-mono)"}}/>
          </label>
          <button className="hlth-btn-ghost hlth-btn" onClick={onClose} style={{padding:"6px 10px"}}>esc</button>
        </div>
        {results.length === 0 && <div style={{padding:"20px", textAlign:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
          no matches · try typing part of the name
        </div>}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:8}}>
          {results.map(f => (
            <button key={f.id} onClick={()=>onPick(f, servings)}
              style={{
                textAlign:"left", background:"var(--hlth-card2)",
                border:"1px solid var(--hlth-border-soft)", borderRadius:8, padding:10,
                color:"var(--hlth-fg)", cursor:"pointer", transition:"all 0.15s",
                fontFamily:"inherit",
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--hlth-accent)"; (e.currentTarget as HTMLButtonElement).style.background="rgba(16,185,129,0.08)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="var(--hlth-border-soft)"; (e.currentTarget as HTMLButtonElement).style.background="var(--hlth-card2)";}}>
              <div style={{fontWeight:700, fontSize:13, marginBottom:3}}>{f.name}</div>
              <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, letterSpacing:"0.05em", color:"var(--hlth-muted)", display:"flex", gap:8, flexWrap:"wrap"}}>
                <span style={{color:"var(--hlth-accent-glow)"}}>{Math.round(f.kcal)} kcal</span>
                <span>C{f.carbsG} · P{f.proteinG} · F{f.fatG}</span>
              </div>
              <div style={{fontSize:9, color:"var(--hlth-muted)", marginTop:2, letterSpacing:"0.1em", textTransform:"uppercase"}}>{f.serving}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManualAdd({ onAdd, onCancel }: { onAdd: (name: string, kcal: number, c: number, p: number, f: number) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState<number>(0);
  const [c, setC] = useState<number>(0);
  const [p, setP] = useState<number>(0);
  const [f, setF] = useState<number>(0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || kcal <= 0) return;
    onAdd(name.trim(), kcal, c, p, f);
  };
  return (
    <form onSubmit={submit} style={{
      display:"grid", gridTemplateColumns:"2fr repeat(4, 1fr) auto", gap:8, alignItems:"end",
      padding:10, background:"var(--hlth-card2)", borderRadius:8, border:"1px dashed var(--hlth-border)",
    }}>
      <label style={{display:"flex", flexDirection:"column", gap:3, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
        NAME
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. chicken rice"
          style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontSize:12}}/>
      </label>
      <label style={{display:"flex", flexDirection:"column", gap:3, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
        KCAL
        <input type="number" min={0} value={kcal} onChange={e=>setKcal(+e.target.value)}
          style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontSize:12}}/>
      </label>
      <label style={{display:"flex", flexDirection:"column", gap:3, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
        CARBS g
        <input type="number" min={0} value={c} onChange={e=>setC(+e.target.value)}
          style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontSize:12}}/>
      </label>
      <label style={{display:"flex", flexDirection:"column", gap:3, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
        PROTEIN g
        <input type="number" min={0} value={p} onChange={e=>setP(+e.target.value)}
          style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontSize:12}}/>
      </label>
      <label style={{display:"flex", flexDirection:"column", gap:3, fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
        FAT g
        <input type="number" min={0} value={f} onChange={e=>setF(+e.target.value)}
          style={{background:"var(--hlth-card)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"6px 8px", fontSize:12}}/>
      </label>
      <div style={{display:"flex", gap:6}}>
        <button type="submit" className="hlth-btn" style={{padding:"6px 10px", fontSize:10}}>LOG</button>
        <button type="button" className="hlth-btn hlth-btn-ghost" style={{padding:"6px 10px", fontSize:10}} onClick={onCancel}>✕</button>
      </div>
    </form>
  );
}

export default function FuelSection() {
  const { health, updateHealth, workout } = useStore();
  const today = todayIso();

  // Get today's meals; create empty slots if missing
  const todaysMeals = useMemo(() => {
    const byDate = health.meals.filter(m => m.date === today);
    const slots: Record<Slot, MealEntry> = {
      breakfast: byDate.find(m => m.slot === "breakfast") ?? emptyMeal("breakfast"),
      lunch:     byDate.find(m => m.slot === "lunch") ?? emptyMeal("lunch"),
      dinner:    byDate.find(m => m.slot === "dinner") ?? emptyMeal("dinner"),
      snack:     byDate.find(m => m.slot === "snack") ?? emptyMeal("snack"),
    };
    return slots;
  }, [health.meals, today]);

  const [pickerFor, setPickerFor] = useState<Slot | null>(null);
  const [manualFor, setManualFor] = useState<Slot | null>(null);

  const totals = useMemo(() => {
    let kcal=0, c=0, p=0, f=0;
    for (const slot of Object.values(todaysMeals)) {
      for (const it of slot.items) {
        kcal += it.kcal;
        c += it.carbsG ?? 0;
        p += it.proteinG ?? 0;
        f += it.fatG ?? 0;
      }
    }
    return { kcal, carbsG: c, proteinG: p, fatG: f };
  }, [todaysMeals]);

  const latestBw = useMemo(() => {
    const sorted = [...workout.bodyweight].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0]?.weightKg ?? 70;
  }, [workout.bodyweight]);

  const targetKcal = Math.round(tdee(latestBw, health.profile));

  const persist = (nextSlots: Record<Slot, MealEntry>) => {
    updateHealth(h => {
      const otherDays = h.meals.filter(m => m.date !== today);
      // Keep slots that have items OR wave-8A metadata (time/flags/photo).
      const todaysWithData = Object.values(nextSlots).filter(
        m => m.items.length > 0 || m.time || m.social || m.cheat || m.photoDataUrl,
      );
      return { meals: [...otherDays, ...todaysWithData] };
    });
  };

  const addFoodToSlot = (slot: Slot, f: FoodEntry, servings: number) => {
    const next = { ...todaysMeals };
    const item: MealItem = {
      id: uid(),
      name: `${f.name}${servings !== 1 ? ` ×${servings}` : ""}`,
      kcal: Math.round(f.kcal * servings),
      carbsG: Math.round((f.carbsG ?? 0) * servings),
      proteinG: Math.round((f.proteinG ?? 0) * servings),
      fatG: Math.round((f.fatG ?? 0) * servings),
      fibreG: f.fibreG ? Math.round(f.fibreG * servings) : undefined,
    };
    next[slot] = { ...next[slot], items: [...next[slot].items, item] };
    persist(next);
    setPickerFor(null);
  };

  const addManualToSlot = (slot: Slot, name: string, kcal: number, c: number, p: number, f: number) => {
    const next = { ...todaysMeals };
    next[slot] = { ...next[slot], items: [...next[slot].items, { id: uid(), name, kcal, carbsG:c, proteinG:p, fatG:f }]};
    persist(next);
    setManualFor(null);
  };

  const removeItem = (slot: Slot, itemId: string) => {
    const next = { ...todaysMeals };
    next[slot] = { ...next[slot], items: next[slot].items.filter(i => i.id !== itemId) };
    persist(next);
  };

  // Wave 8A — meal-level metadata (time, social, cheat + reason, photo).
  const patchMeal = (slot: Slot, patch: Partial<MealEntry>) => {
    const next = { ...todaysMeals };
    next[slot] = { ...next[slot], ...patch };
    persist(next);
  };

  const attachPhoto = (slot: Slot, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") patchMeal(slot, { photoDataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const logFrequent = (name: string, kcal: number, c: number, p: number, f: number) => {
    addManualToSlot("snack", name, kcal, c, p, f);
  };

  const repeatYesterday = () => {
    const y = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const yMeals = health.meals.filter(m => m.date === y);
    if (yMeals.length === 0) {
      // Use alert-free inline feedback in future; simple window.alert is fine for v0
      window.alert("No meals logged yesterday.");
      return;
    }
    updateHealth(h => {
      const keep = h.meals.filter(m => m.date !== today);
      const copied = yMeals.map(m => ({
        ...m,
        id: uid(),
        date: today,
        items: m.items.map(i => ({ ...i, id: uid() })),
      }));
      return { meals: [...keep, ...copied] };
    });
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:18}}>
      {/* Summary row */}
      <div className="hlth-card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16}}>
          <div>
            <div className="hlth-card-h">§01 // FUEL · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"})}</div>
            <h2 style={{
              fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:24,
              letterSpacing:"0.05em", margin:"4px 0 4px", color:"var(--hlth-accent-glow)",
            }}>Daily meals</h2>
            <div className="hlth-subtle" style={{fontSize:11, letterSpacing:"0.1em"}}>
              pick from 80+ seeded Indian foods or quick-log manually
            </div>
          </div>
          <div style={{display:"flex", gap:10, alignItems:"center"}}>
            <MacroDonut carbs={totals.carbsG} protein={totals.proteinG} fat={totals.fatG} kcal={totals.kcal}/>
          </div>
        </div>
        <div style={{display:"flex", gap:8, marginTop:14, flexWrap:"wrap"}}>
          <button className="hlth-btn hlth-btn-ghost" onClick={repeatYesterday}
            style={{display:"inline-flex", alignItems:"center", gap:6, fontSize:10}}>
            <Repeat size={12}/> REPEAT YESTERDAY
          </button>
          <span className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em", alignSelf:"center"}}>
            {formatKcal(totals.kcal)} / {formatKcal(targetKcal)} target · carbs {Math.round(totals.carbsG)}g · protein {Math.round(totals.proteinG)}g · fat {Math.round(totals.fatG)}g
          </span>
        </div>
      </div>

      {/* Wave 8A — fasting ring clock + macro sliders */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))", gap:14}}>
        <FastingClock/>
        <MacroSliders totals={totals} targetKcal={targetKcal}/>
      </div>

      {/* Wave 8A — frequent foods library */}
      <FrequentFoodsStrip onLog={logFrequent}/>

      {/* Meal slots */}
      <div style={{display:"flex", flexDirection:"column", gap:14}}>
        {SLOTS.map(s => {
          const meal = todaysMeals[s.id];
          const slotKcal = meal.items.reduce((sum, i) => sum + i.kcal, 0);
          return (
            <div key={s.id} className="hlth-card" style={{padding:"14px 16px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <span style={{
                    width:28, height:28, borderRadius:8, display:"inline-flex",
                    alignItems:"center", justifyContent:"center",
                    color:s.color, background:`${s.color}22`, border:`1px solid ${s.color}55`,
                  }}>{s.icon}</span>
                  <div>
                    <div style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:16, letterSpacing:"0.08em"}}>{s.label.toUpperCase()}</div>
                    <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
                      {meal.items.length} item{meal.items.length===1?"":"s"} · {Math.round(slotKcal)} kcal
                    </div>
                  </div>
                </div>
                <div style={{display:"flex", gap:6}}>
                  <button className="hlth-btn" onClick={()=>setPickerFor(s.id)}
                    style={{padding:"6px 10px", fontSize:10, display:"inline-flex", alignItems:"center", gap:4}}>
                    <Search size={10}/> PICK FOOD
                  </button>
                  <button className="hlth-btn hlth-btn-ghost" onClick={()=>setManualFor(s.id)}
                    style={{padding:"6px 10px", fontSize:10, display:"inline-flex", alignItems:"center", gap:4}}>
                    <Plus size={10}/> MANUAL
                  </button>
                </div>
              </div>

              {manualFor === s.id && (
                <div style={{marginBottom:8}}>
                  <ManualAdd
                    onAdd={(name, kcal, c, p, f) => addManualToSlot(s.id, name, kcal, c, p, f)}
                    onCancel={()=>setManualFor(null)}/>
                </div>
              )}

              {/* Wave 8A — meal meta row: time · social · cheat(+reason) · photo */}
              <div style={{
                display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8,
                fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.06em",
              }}>
                <label style={{display:"inline-flex", alignItems:"center", gap:5}}>
                  TIME
                  <input type="time" value={meal.time ?? ""}
                    onChange={e=>patchMeal(s.id, { time: e.target.value || undefined })}
                    style={{background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"3px 6px", fontFamily:"var(--hlth-font-mono)", fontSize:10}}/>
                </label>
                <label style={{display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer", color: meal.social ? "#60a5fa" : "var(--hlth-muted)"}}>
                  <input type="checkbox" checked={!!meal.social}
                    onChange={e=>patchMeal(s.id, { social: e.target.checked || undefined })}
                    style={{accentColor:"#60a5fa"}}/>
                  <Users size={10}/> SOCIAL
                </label>
                <label style={{display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer", color: meal.cheat ? "#f59e0b" : "var(--hlth-muted)"}}>
                  <input type="checkbox" checked={!!meal.cheat}
                    onChange={e=>patchMeal(s.id, { cheat: e.target.checked || undefined, cheatReason: e.target.checked ? meal.cheatReason : undefined })}
                    style={{accentColor:"#f59e0b"}}/>
                  <Pizza size={10}/> CHEAT
                </label>
                {meal.cheat && (
                  <>
                    <select value={meal.cheatReason ?? ""}
                      onChange={e=>patchMeal(s.id, { cheatReason: (e.target.value || undefined) as MealEntry["cheatReason"] })}
                      style={{background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"3px 6px", fontFamily:"var(--hlth-font-mono)", fontSize:10}}>
                      <option value="">why?</option>
                      <option value="celebratory">celebratory</option>
                      <option value="stress">stress</option>
                      <option value="craving">craving</option>
                      <option value="social">social</option>
                    </select>
                    <button className="hlth-btn hlth-btn-ghost" style={{padding:"3px 8px", fontSize:9}}
                      onClick={()=>patchMeal(s.id, { cheat: undefined, cheatReason: undefined })}
                      title="No guilt. Log it. Move on.">
                      NO GUILT · RESET
                    </button>
                  </>
                )}
                <label style={{display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer"}}>
                  <Camera size={10}/> {meal.photoDataUrl ? "RETAKE" : "PHOTO"}
                  <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                    onChange={e=>{ const f = e.target.files?.[0]; if (f) attachPhoto(s.id, f); e.currentTarget.value=""; }}/>
                </label>
                {meal.photoDataUrl && (
                  <span style={{position:"relative", display:"inline-flex"}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={meal.photoDataUrl} alt={`${s.label} photo`}
                      style={{width:34, height:34, objectFit:"cover", borderRadius:6, border:"1px solid var(--hlth-border-soft)"}}/>
                    <button onClick={()=>patchMeal(s.id, { photoDataUrl: undefined })}
                      style={{position:"absolute", top:-6, right:-6, background:"var(--hlth-card)", border:"1px solid var(--hlth-border-soft)", borderRadius:"50%", width:14, height:14, display:"inline-flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--hlth-muted)", padding:0}}>
                      <X size={8}/>
                    </button>
                  </span>
                )}
              </div>

              {meal.items.length === 0 ? (
                <div style={{padding:"16px 10px", textAlign:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em", border:"1px dashed var(--hlth-border-soft)", borderRadius:8}}>
                  <Utensils size={16} style={{opacity:0.3, display:"block", margin:"0 auto 6px"}}/>
                  no items logged yet
                </div>
              ) : (
                <div style={{display:"flex", flexDirection:"column", gap:4}}>
                  {meal.items.map(it => (
                    <div key={it.id} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
                      padding:"8px 10px", borderRadius:6, background:"var(--hlth-card2)",
                      border:"1px solid var(--hlth-border-soft)",
                      fontSize:12,
                    }}>
                      <div style={{display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0}}>
                        <span style={{color:"var(--hlth-fg)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{it.name}</span>
                        {(it.carbsG||it.proteinG||it.fatG) ? (
                          <span style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.05em", flexShrink:0}}>
                            C{it.carbsG||0} · P{it.proteinG||0} · F{it.fatG||0}
                          </span>
                        ) : null}
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
                        <span style={{fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-accent-glow)", fontWeight:700}}>{Math.round(it.kcal)} kcal</span>
                        <button onClick={()=>removeItem(s.id, it.id)}
                          style={{background:"transparent", border:"none", color:"var(--hlth-muted)", cursor:"pointer", padding:4}}
                          title="Remove">
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pickerFor && (
        <FoodPicker
          onPick={(f, servings) => addFoodToSlot(pickerFor, f, servings)}
          onClose={()=>setPickerFor(null)}/>
      )}

      <div className="hlth-subtle" style={{fontSize:10, letterSpacing:"0.1em", textAlign:"center", opacity:0.7}}>
        macros are rough-awareness sliders — no food scale required
      </div>
    </div>
  );
}
