"use client";

/**
 * NetworkSection — contact tracker MVP.
 * - Health 1-10, influence, relationship type, last-contact (auto-stale >90 days).
 * - Favor bank: given vs received imbalance highlighted.
 * - Quick "log interaction" adds a dated entry with summary + gold nuggets.
 * - Group chips filter (mentor/peer/report/client/prospect/recruiter/friend).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Trash2, Phone, Mail, Clock, MessageSquare, HeartHandshake, Sparkles, AlertTriangle } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { NetworkContact, RelationshipType, NetworkInteraction } from "../../../lib/careerTypes";

const REL_GROUPS: { id: RelationshipType | "all"; label: string; color: string }[] = [
  { id: "all", label: "All", color: "#67e8f9" },
  { id: "mentor", label: "Mentors", color: "#d4af37" },
  { id: "peer", label: "Peers", color: "#06b6d4" },
  { id: "report", label: "Reports", color: "#a3e635" },
  { id: "client", label: "Clients", color: "#ec4899" },
  { id: "prospect", label: "Prospects", color: "#f59e0b" },
  { id: "recruiter", label: "Recruiters", color: "#8b5cf6" },
  { id: "friend", label: "Friends", color: "#f43f5e" },
];

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

export default function NetworkSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState<RelationshipType>("peer");
  const [filter, setFilter] = useState<RelationshipType | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logText, setLogText] = useState("");
  const [logNugget, setLogNugget] = useState("");

  const addContact = () => {
    if (!name.trim()) return;
    const c: NetworkContact = {
      id: uid(), name: name.trim(), relationship: rel, healthScore: 7, influenceScore: 5,
      favorsGiven: 0, favorsReceived: 0, interactions: [],
      lastContactAt: Date.now(),
    };
    updateCareer(s => ({ contacts: [c, ...s.contacts] }));
    setName(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<NetworkContact>) =>
    updateCareer(s => ({ contacts: s.contacts.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const del = (id: string) => { if (confirm("Delete contact?")) updateCareer(s => ({ contacts: s.contacts.filter(c => c.id !== id) })); };

  const logInteraction = (id: string) => {
    if (!logText.trim()) return;
    const entry: NetworkInteraction = { id: uid(), date: today(), type: "message", summary: logText, goldNuggets: logNugget || undefined };
    upd(id, {
      interactions: [entry, ...(career.contacts.find(c=>c.id===id)?.interactions ?? [])],
      lastContactAt: Date.now(),
    });
    setLogFor(null); setLogText(""); setLogNugget("");
  };

  const visible = useMemo(() => career.contacts.filter(c => filter === "all" || c.relationship === filter), [career.contacts, filter]);
  const staleCount = career.contacts.filter(c => !c.lastContactAt || Date.now() - c.lastContactAt > 90*86400000).length;
  const imbalance = career.contacts.filter(c => Math.abs(c.favorsGiven - c.favorsReceived) >= 3).length;

  const active = career.contacts.find(c => c.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Network</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Your court — nurture it. Stale ties turn cold; favors imbalanced rust.</p>
        </div>
        <button onClick={()=>setAdding(v=>!v)}
          className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
          style={{background:"linear-gradient(135deg,#be185d,#831843)",color:"#fbcfe8",border:"1.5px solid rgba(236,72,153,0.6)",boxShadow:"0 8px 20px -8px rgba(236,72,153,0.8)"}}>
          <Plus size={14}/> ADD CONTACT
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Contacts" value={career.contacts.length} color="#ec4899"/>
        <Stat label="Stale (90d+)" value={staleCount} color="#f59e0b"/>
        <Stat label="Favor imbalances" value={imbalance} color="#b91c1c"/>
        <Stat label="Mentors" value={career.contacts.filter(c=>c.relationship==="mentor").length} color="#d4af37"/>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {REL_GROUPS.map(g => (
          <button key={g.id} onClick={()=>setFilter(g.id)}
            className="text-[11px] emperor-title tracking-wider px-3 py-1.5 rounded-lg transition"
            style={{
              background: filter === g.id ? `${g.color}25` : "rgba(12,26,34,0.4)",
              color: filter === g.id ? g.color : "#8b9eb0",
              border: `1px solid ${filter === g.id ? g.color+"66" : "rgba(255,255,255,0.08)"}`,
            }}>{g.label}</button>
        ))}
      </div>

      {adding && (
        <div className="rounded-xl p-4 flex flex-wrap gap-2 items-center"
          style={{background:isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)",border:"1px solid rgba(236,72,153,0.4)"}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"
            className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
            style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
          <select value={rel} onChange={e=>setRel(e.target.value as RelationshipType)}
            className="bg-transparent text-sm px-3 py-2 rounded-lg outline-none"
            style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}>
            {REL_GROUPS.filter(g=>g.id!=="all").map(g => <option key={g.id} value={g.id} style={{background:"#0a0709"}}>{g.label}</option>)}
          </select>
          <button onClick={addContact} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg" style={{background:"#be185d",color:"white"}}>Add</button>
          <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2 text-gray-400">Cancel</button>
        </div>
      )}

      {visible.length === 0 && !adding && (
        <div className="rounded-2xl p-10 text-center" style={{background:"rgba(12,26,34,0.4)",border:"1px dashed rgba(236,72,153,0.25)"}}>
          <Users size={28} className="mx-auto mb-2" style={{color:"#ec4899"}}/>
          <p className="imperial-title tracking-widest text-sm" style={{color:"#fbcfe8"}}>Your court is empty.</p>
          <p className="serif-body italic text-xs mt-1" style={{color:"#8b9eb0"}}>Add a mentor, peer, or recruiter — start tending the garden.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map(c => {
          const days = c.lastContactAt ? Math.floor((Date.now()-c.lastContactAt)/86400000) : 999;
          const stale = days > 90;
          const rotting = days > 180;
          const favorDelta = c.favorsGiven - c.favorsReceived;
          const active = c.id === activeId;
          return (
            <motion.div key={c.id} layout
              className="rounded-xl p-4 cursor-pointer"
              onClick={() => setActiveId(active?null:c.id)}
              style={{background:isDark?"linear-gradient(145deg,rgba(12,26,34,0.7),rgba(10,20,24,0.5))":"rgba(255,248,228,0.9)",
                border:`1px solid ${active?"#ec489999":(rotting?"rgba(239,68,68,0.5)":stale?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.08)")}`}}>
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black shrink-0"
                  style={{background:"rgba(236,72,153,0.18)",border:"1px solid rgba(236,72,153,0.5)",color:"#fbcfe8"}}>
                  {c.name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm md:text-base" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{c.name}</h4>
                    <span className="text-[9px] emperor-title px-1.5 py-0.5 rounded" style={{background:"rgba(236,72,153,0.15)",color:"#ec4899"}}>{c.relationship}</span>
                    {rotting && <span className="text-[9px] flex items-center gap-0.5 text-red-400"><AlertTriangle size={9}/>COLD</span>}
                    {stale && !rotting && <span className="text-[9px] flex items-center gap-0.5 text-amber-400"><Clock size={9}/>STALE</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] mt-1" style={{color:"#8b9eb0"}}>
                    {c.company && <span>{c.company}</span>}
                    {c.role && <span>· {c.role}</span>}
                    <span>· {days === 0 ? "Today" : `${days}d ago`}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] emperor-title">
                    <Mini label="HEALTH" value={c.healthScore} color="#ec4899"/>
                    <Mini label="INFLUENCE" value={c.influenceScore} color="#d4af37"/>
                    <span className={`flex items-center gap-1 ${favorDelta>=3?"text-red-400":favorDelta<=-3?"text-amber-300":"text-gray-500"}`}>
                      <HeartHandshake size={10}/> {favorDelta>=0?"+":""}{favorDelta}
                    </span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {active && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden mt-3" onClick={e=>e.stopPropagation()}>
                    <div className="pt-3 border-t space-y-2" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                      <div className="grid grid-cols-2 gap-2">
                        <Sliders label="Health" value={c.healthScore} color="#ec4899" onChange={v=>upd(c.id,{healthScore:v})}/>
                        <Sliders label="Influence" value={c.influenceScore} color="#d4af37" onChange={v=>upd(c.id,{influenceScore:v})}/>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <input placeholder="Company" value={c.company??""} onChange={e=>upd(c.id,{company:e.target.value})}
                          className="flex-1 min-w-[120px] bg-transparent px-2 py-1 rounded text-xs outline-none"
                          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                        <input placeholder="Role" value={c.role??""} onChange={e=>upd(c.id,{role:e.target.value})}
                          className="flex-1 min-w-[120px] bg-transparent px-2 py-1 rounded text-xs outline-none"
                          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                      </div>
                      <div className="flex gap-2 items-center text-xs">
                        <button onClick={()=>upd(c.id,{favorsGiven:c.favorsGiven+1})} className="px-2 py-1 rounded" style={{background:"rgba(163,230,53,0.15)",color:"#a3e635"}}>+1 Given</button>
                        <button onClick={()=>upd(c.id,{favorsReceived:c.favorsReceived+1})} className="px-2 py-1 rounded" style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>+1 Received</button>
                        <button onClick={()=>upd(c.id,{lastContactAt:Date.now()})} className="px-2 py-1 rounded" style={{background:"rgba(103,232,249,0.15)",color:"#67e8f9"}}>Touch base today</button>
                        <button onClick={()=>setLogFor(c.id)} className="px-2 py-1 rounded flex items-center gap-1" style={{background:"rgba(236,72,153,0.15)",color:"#fbcfe8"}}><MessageSquare size={11}/> Log</button>
                        <button onClick={()=>del(c.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400 ml-auto"><Trash2 size={11}/></button>
                      </div>
                      {logFor === c.id && (
                        <div className="space-y-1">
                          <textarea value={logText} onChange={e=>setLogText(e.target.value)} placeholder="What happened?" rows={2}
                            className="w-full bg-transparent px-2 py-1 rounded text-xs outline-none resize-none"
                            style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                          <input value={logNugget} onChange={e=>setLogNugget(e.target.value)} placeholder="Gold nugget / quote (optional)"
                            className="w-full bg-transparent px-2 py-1 rounded text-xs outline-none"
                            style={{border:"1px solid rgba(212,175,55,0.25)",color:"#fde68a"}}/>
                          <div className="flex gap-2">
                            <button onClick={()=>logInteraction(c.id)} className="text-[10px] emperor-title px-2 py-1 rounded" style={{background:"#be185d",color:"white"}}>Save</button>
                            <button onClick={()=>setLogFor(null)} className="text-[10px] text-gray-400">Cancel</button>
                          </div>
                        </div>
                      )}
                      {c.interactions.length > 0 && (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {c.interactions.slice(0,5).map(i => (
                            <div key={i.id} className="text-[11px] p-2 rounded" style={{background:"rgba(0,0,0,0.25)"}}>
                              <div className="text-[9px] emperor-title tracking-widest" style={{color:"#ec4899"}}>{i.date}</div>
                              <div>{i.summary}</div>
                              {i.goldNuggets && <div className="mt-0.5 serif-body italic" style={{color:"#fde68a"}}>💬 "{i.goldNuggets}"</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}33`}}>
      <div className="text-[10px] emperor-title tracking-widest" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-xl font-black mt-1" style={{color:"#f3e9d2"}}>{value}</div>
    </div>
  );
}

function Mini({label,value,color}:{label:string;value:number;color:string}) {
  return (
    <span className="flex items-center gap-1">
      <span style={{color:"#8b9eb0"}}>{label}</span>
      <span style={{color}}>{value}/10</span>
    </span>
  );
}

function Sliders({label,value,color,onChange}:{label:string;value:number;color:string;onChange:(v:number)=>void}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] emperor-title"><span style={{color:"#8b9eb0"}}>{label.toUpperCase()}</span><span style={{color}}>{value}/10</span></div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full" style={{accentColor:color}}/>
    </div>
  );
}
