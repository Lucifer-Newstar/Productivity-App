"use client";

/**
 * HydrationSection — 8-glass grid, dynamic water goal, caffeine tally.
 *
 * Wave 2 core:
 *  - 8-glass visual grid (customizable glass size)
 *  - Dynamic water goal (35ml/kg × climate mult + workout adj)
 *  - Quick-add buttons for water/coconut/coffee/tea/lassi
 *  - Caffeine mg tally with half-life note
 *  - Electrolyte toggle per drink
 */

import { useMemo, useState, useEffect } from "react";
import { Droplets, Coffee, Plus, Undo2, AlertTriangle, CheckCircle2, GlassWater } from "lucide-react";
import { useStore } from "../../lib/store";
import { waterGoalMl, formatMl } from "../../lib/healthAnalytics";
import type { WaterEntry } from "../../lib/healthTypes";

type Bev = "water" | "coconut" | "coffee" | "tea" | "juice" | "soda" | "sports" | "milk" | "lassi" | "ors" | "alcohol" | "other";

const BEVERAGES: { id: Bev; label: string; color: string; icon: React.ReactNode; net: number; caffeineMg: number; }[] = [
  { id:"water",    label:"Water",         color:"#3b82f6", icon:<Droplets size={14}/>,    net:1.00, caffeineMg:0 },
  { id:"coconut",  label:"Coconut water", color:"#06b6d4", icon:<GlassWater size={14}/>, net:0.98, caffeineMg:0 },
  { id:"coffee",   label:"Coffee",        color:"#92400e", icon:<Coffee size={14}/>,      net:0.85, caffeineMg:90 },
  { id:"tea",      label:"Chai/Tea",      color:"#b45309", icon:<Coffee size={14}/>,      net:0.85, caffeineMg:40 },
  { id:"milk",     label:"Milk",          color:"#f8fafc", icon:<Droplets size={14}/>,    net:0.95, caffeineMg:0 },
  { id:"lassi",    label:"Lassi",         color:"#fef3c7", icon:<Droplets size={14}/>,    net:0.95, caffeineMg:0 },
  { id:"juice",    label:"Juice",         color:"#f97316", icon:<Droplets size={14}/>,    net:0.90, caffeineMg:0 },
  { id:"sports",   label:"Sports drink",  color:"#a3e635", icon:<Droplets size={14}/>,    net:0.95, caffeineMg:0 },
  { id:"ors",      label:"ORS",           color:"#ec4899", icon:<AlertTriangle size={14}/>, net:1.00, caffeineMg:0 },
  { id:"soda",     label:"Soda",          color:"#78350f", icon:<Droplets size={14}/>,    net:0.85, caffeineMg:34 },
  { id:"alcohol",  label:"Alcohol",       color:"#a78bfa", icon:<Droplets size={14}/>,    net:0.0, caffeineMg:0 },
  { id:"other",    label:"Other",         color:"#64748b", icon:<Plus size={14}/>,        net:0.85, caffeineMg:0 },
];

function todayIso() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

function GlassGrid({ filled, onToggle, size }: { filled: number; onToggle: (i: number) => void; size: number; }) {
  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10}}>
      {Array.from({length:8}).map((_, i) => {
        const isFull = i < filled;
        return (
          <button key={i} onClick={()=>onToggle(i)}
            title={`Glass ${i+1} (${size}ml)`}
            style={{
              background:"var(--hlth-card2)",
              border:`1px solid ${isFull ? "#3b82f6" : "var(--hlth-border-soft)"}`,
              borderRadius:10, padding:14, display:"flex", flexDirection:"column",
              alignItems:"center", gap:6, cursor:"pointer", transition:"all 0.15s",
              color: isFull ? "#60a5fa" : "var(--hlth-muted)",
              boxShadow: isFull ? "inset 0 0 24px rgba(59,130,246,0.18)" : "none",
            }}>
            <svg width="36" height="46" viewBox="0 0 36 46" aria-hidden>
              <defs>
                <clipPath id={`clip-${i}`}>
                  <rect x="4" y="10" width="28" height={`${isFull ? 32 : 0}`} ry="2" style={{transition:"height 0.3s"}}/>
                </clipPath>
              </defs>
              {/* glass outline */}
              <path d="M5 10 L6 43 Q6 45 8 45 L28 45 Q30 45 30 43 L31 10 Z" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <line x1="3" y1="10" x2="33" y2="10" stroke="currentColor" strokeWidth="2"/>
              {/* water */}
              <g clipPath={`url(#clip-${i})`}>
                <rect x="0" y="0" width="36" height="46" fill="#3b82f6" opacity="0.6"/>
                <path d="M2 18 Q9 14 18 18 T34 18 L34 44 L2 44 Z" fill="#60a5fa" opacity="0.6"/>
              </g>
            </svg>
            <span style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, letterSpacing:"0.1em"}}>
              {isFull ? "●" : "○"} {size}ml
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function HydrationSection() {
  const { health, updateHealth, workout } = useStore();
  const today = todayIso();
  const [glassMl, setGlassMl] = useState(250);
  const [bev, setBev] = useState<Bev>("water");
  const [electrolytes, setElectrolytes] = useState(false);
  const [customMl, setCustomMl] = useState(300);

  const todayEntries = useMemo(() =>
    health.water.filter(e => e.date === today).sort((a,b)=>a.time.localeCompare(b.time)),
    [health.water, today]);

  const latestBw = useMemo(() => {
    const sorted = [...workout.bodyweight].sort((a,b)=>b.date.localeCompare(a.date));
    return sorted[0]?.weightKg ?? 70;
  }, [workout.bodyweight]);

  const goal = waterGoalMl(latestBw, health.profile.climateMult);
  const totalMl = todayEntries.reduce((s,e)=>s+e.ml*BEVERAGES.find(b=>b.id===e.beverage)!.net, 0);
  const caffeineMg = todayEntries.reduce((s,e)=>s+(e.caffeineMg ?? 0), 0);
  const electrolytesHit = todayEntries.some(e => e.electrolytes);

  // Each "glass" click fills a default-sized water entry; toggling reverses last.
  const filledGlasses = Math.min(8, Math.floor(totalMl / glassMl));

  const addQuickDrink = (beverage: Bev, ml?: number) => {
    const spec = BEVERAGES.find(b=>b.id===beverage)!;
    const time = new Date().toTimeString().slice(0,5);
    const entry: WaterEntry = {
      id: uid(),
      date: today,
      time,
      ml: ml ?? (beverage==="coffee"||beverage==="tea" ? 150 : beverage==="coconut" ? 300 : glassMl),
      beverage,
      electrolytes: beverage === "coconut" || beverage === "sports" || beverage === "ors" ? true : electrolytes,
      caffeineMg: spec.caffeineMg,
    };
    updateHealth(h => ({ water: [...h.water, entry] }));
    setElectrolytes(false);
  };

  const undoLast = () => {
    if (todayEntries.length === 0) return;
    const last = todayEntries[todayEntries.length-1];
    updateHealth(h => ({ water: h.water.filter(e => e.id !== last.id) }));
  };

  const toggleGlass = (i: number) => {
    // If clicking at/beyond current fill, add a glass; if clicking within fill, undo last
    if (i >= filledGlasses) {
      addQuickDrink(bev, glassMl);
    } else {
      undoLast();
    }
  };

  const pct = Math.min(100, Math.round(totalMl / goal * 100));

  // Caffeine half-life clock — warn if post-4pm caffeine
  const [now, setNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()), 60_000); return ()=>clearInterval(t); },[]);
  const lateCaffeine = now.getHours() >= 16 && caffeineMg > 0;
  const overCaffeine = caffeineMg > 350;

  return (
    <div style={{display:"flex", flexDirection:"column", gap:18}}>
      {/* Summary */}
      <div className="hlth-card">
        <div className="hlth-card-h">§02 // HYDRATION · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short",timeZone:"Asia/Kolkata"})}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16}}>
          <div>
            <h2 style={{fontFamily:"var(--hlth-font-display)", fontWeight:900, fontSize:24, letterSpacing:"0.05em", margin:"4px 0 2px", color:"#60a5fa"}}>{pct}% hydrated</h2>
            <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
              {formatMl(totalMl)} / {formatMl(goal)} · {Math.max(0, goal-Math.round(totalMl))}ml to go
            </div>
          </div>
          <div style={{display:"flex", gap:10, alignItems:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <Badge label={`${caffeineMg}mg caffeine`} color={overCaffeine ? "#ef4444" : caffeineMg>200 ? "#f59e0b" : "#10b981"}/>
            <Badge label={electrolytesHit ? "electrolytes ✓" : "no electrolytes today"} color={electrolytesHit ? "#10b981" : "#64748b"}/>
          </div>
        </div>
        {/* progress bar */}
        <div style={{height:8, background:"var(--hlth-card2)", borderRadius:4, overflow:"hidden", marginTop:14}}>
          <div style={{height:"100%", width:`${pct}%`, background:"linear-gradient(90deg, #3b82f6, #06b6d4)", transition:"width 0.4s", boxShadow:"0 0 12px rgba(59,130,246,0.5)"}}/>
        </div>
        {lateCaffeine && (
          <div style={{display:"flex", alignItems:"center", gap:8, marginTop:10, padding:"8px 10px", borderRadius:6, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <AlertTriangle size={14}/> Caffeine after 4pm may disturb sleep tonight.
          </div>
        )}
        {overCaffeine && (
          <div style={{display:"flex", alignItems:"center", gap:8, marginTop:10, padding:"8px 10px", borderRadius:6, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <AlertTriangle size={14}/> Approaching EFSA safe limit (400mg/day). Switch to water.
          </div>
        )}
      </div>

      {/* Glass grid */}
      <div className="hlth-card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:12}}>
          <div>
            <div className="hlth-card-h">// 8-glass visual</div>
            <div style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>click a glass to log one drink · click within filled to undo</div>
          </div>
          <div style={{display:"flex", gap:8, alignItems:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
            <label style={{color:"var(--hlth-muted)", display:"flex", alignItems:"center", gap:6}}>
              glass size
              <select value={glassMl} onChange={e=>setGlassMl(+e.target.value)}
                style={{background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"4px 6px"}}>
                <option value={200}>200ml</option>
                <option value={250}>250ml</option>
                <option value={300}>300ml</option>
                <option value={330}>330ml (small bottle)</option>
                <option value={500}>500ml (bottle)</option>
                <option value={750}>750ml</option>
              </select>
            </label>
            <button onClick={undoLast} disabled={todayEntries.length===0}
              className="hlth-btn hlth-btn-ghost" style={{padding:"6px 10px", fontSize:10, display:"inline-flex", alignItems:"center", gap:4}}>
              <Undo2 size={10}/> UNDO
            </button>
          </div>
        </div>
        <GlassGrid filled={filledGlasses} onToggle={toggleGlass} size={glassMl}/>
      </div>

      {/* Quick add beverages */}
      <div className="hlth-card">
        <div className="hlth-card-h">// quick-add beverage</div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:8, marginTop:10}}>
          {BEVERAGES.filter(b => b.id !== "alcohol" || health.settings.alcoholOptIn).map(b => (
            <button key={b.id} onClick={()=>addQuickDrink(b.id)}
              style={{
                background: bev===b.id ? `${b.color}22` : "var(--hlth-card2)",
                border:`1px solid ${bev===b.id ? b.color : "var(--hlth-border-soft)"}`,
                color: b.color,
                borderRadius:8, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                fontFamily:"var(--hlth-font-mono)", fontSize:11, letterSpacing:"0.05em",
                transition:"all 0.15s",
              }}>
              {b.icon}
              <span style={{color:"var(--hlth-fg)"}}>{b.label}</span>
              {b.caffeineMg>0 && <span style={{marginLeft:"auto", fontSize:9, color:"var(--hlth-muted)"}}>{b.caffeineMg}mg</span>}
            </button>
          ))}
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center", marginTop:10, flexWrap:"wrap", fontFamily:"var(--hlth-font-mono)", fontSize:11}}>
          <label style={{display:"flex", alignItems:"center", gap:6, color:"var(--hlth-muted)"}}>
            <input type="checkbox" checked={electrolytes} onChange={e=>setElectrolytes(e.target.checked)}
              style={{accentColor:"#06b6d4"}}/>
            + electrolytes (salt/ORS/electrolyte tab)
          </label>
          <label style={{display:"flex", alignItems:"center", gap:6, color:"var(--hlth-muted)"}}>
            custom ml
            <input type="number" min={50} step={50} value={customMl} onChange={e=>setCustomMl(+e.target.value)}
              style={{width:60, background:"var(--hlth-card2)", color:"var(--hlth-fg)", border:"1px solid var(--hlth-border-soft)", borderRadius:4, padding:"3px 6px"}}/>
          </label>
          <button className="hlth-btn" style={{padding:"6px 10px", fontSize:10}} onClick={()=>addQuickDrink(bev, customMl)}>
            LOG {customMl}ml
          </button>
        </div>
      </div>

      {/* Today's log */}
      <div className="hlth-card">
        <div className="hlth-card-h">// today's log</div>
        {todayEntries.length === 0 ? (
          <div style={{padding:"20px", textAlign:"center", fontFamily:"var(--hlth-font-mono)", fontSize:11, color:"var(--hlth-muted)", letterSpacing:"0.1em"}}>
            <Droplets size={20} style={{opacity:0.3, margin:"0 auto 6px", display:"block"}}/>
            nothing logged yet
          </div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:4, marginTop:8}}>
            {todayEntries.slice().reverse().map(e => {
              const b = BEVERAGES.find(x=>x.id===e.beverage)!;
              return (
                <div key={e.id} style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                  padding:"8px 10px", borderRadius:6, background:"var(--hlth-card2)", border:"1px solid var(--hlth-border-soft)", fontSize:12,
                }}>
                  <div style={{display:"flex", alignItems:"center", gap:8}}>
                    <span style={{color:b.color}}>{b.icon}</span>
                    <span style={{fontFamily:"var(--hlth-font-mono)", fontSize:10, color:"var(--hlth-muted)", minWidth:40}}>{e.time}</span>
                    <span style={{fontWeight:600, color:"var(--hlth-fg)"}}>{b.label}</span>
                    {e.electrolytes && <span title="electrolytes"><CheckCircle2 size={12} style={{color:"#06b6d4"}}/></span>}
                    {b.caffeineMg>0 && <span style={{fontSize:10, color:"#f59e0b"}}>+{b.caffeineMg}mg ☕</span>}
                  </div>
                  <span style={{fontFamily:"var(--hlth-font-mono)", fontSize:11, color:b.color, fontWeight:700}}>{e.ml}ml</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      border:`1px solid ${color}55`,
      background:`${color}15`,
      color, padding:"4px 8px", borderRadius:4, fontSize:10, letterSpacing:"0.1em",
      display:"inline-flex", alignItems:"center", gap:4,
    }}>{label}</span>
  );
}
