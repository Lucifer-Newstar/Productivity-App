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
 */

import { useMemo, useState } from "react";
import { Repeat, Plus, Trash2, Search, Utensils, Coffee, Moon, Sun, Cookie } from "lucide-react";
import { useStore } from "../../lib/store";
import { FOOD_DB, searchFoods, type FoodEntry } from "../../lib/healthFoodDb";
import { formatKcal, tdee } from "../../lib/healthAnalytics";
import type { MealEntry, MealItem } from "../../lib/healthTypes";

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
      const todaysWithItems = Object.values(nextSlots).filter(m => m.items.length > 0);
      return { meals: [...otherDays, ...todaysWithItems] };
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
