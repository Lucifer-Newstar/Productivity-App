"use client";

/**
 * NetworkSection — contact graph.
 *   - Health 1-10, influence, relationship group, last-contact auto-decay (>90d STALE, >180d COLD)
 *   - Favor imbalance (≥3 delta → highlight)
 *   - Interaction log with gold-nugget quotes
 *   - Birthday / preferred channel / interests / next-talk prep / next-follow-up / job history
 *   - Referral log (sent/received, company/role/outcome)
 *   - Reach-out queue auto-priority = days*2 - health*3
 *   - HUD-themed via CSS variables (night HUD + blueprint schematic)
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Trash2, Phone, Mail, Clock, MessageSquare,
  HeartHandshake, Sparkles, AlertTriangle, Cake, Star, Briefcase,
  ChevronDown, ArrowRightLeft, Calendar, Send, Inbox,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { NetworkContact, RelationshipType, NetworkInteraction } from "../../../lib/careerTypes";

const REL_GROUPS: { id: RelationshipType | "all"; label: string; color: string }[] = [
  { id: "all",       label: "All",        color: "#22d3ee" },
  { id: "mentor",    label: "Mentors",    color: "#facc15" },
  { id: "peer",      label: "Peers",      color: "#22d3ee" },
  { id: "report",    label: "Reports",    color: "#34d399" },
  { id: "client",    label: "Clients",    color: "#f472b6" },
  { id: "prospect",  label: "Prospects",  color: "#fb923c" },
  { id: "recruiter", label: "Recruiters", color: "#a78bfa" },
  { id: "friend",    label: "Friends",    color: "#f43f5e" },
];

const CHANNELS = ["message", "email", "call", "coffee", "meeting", "event"] as const;
type Channel = typeof CHANNELS[number];

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const DAY = 86400000;

const COLORS = {
  pink: "#f472b6",
  yellow: "#facc15",
  cyan: "var(--cr-accent)",
  green: "var(--cr-accent3)",
  orange: "var(--cr-accent2)",
  violet: "#a78bfa",
  red: "#f87171",
};

export default function NetworkSection() {
  const { career, updateCareer } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState<RelationshipType>("peer");
  const [filter, setFilter] = useState<RelationshipType | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"details"|"log"|"referrals"|"history">("details");
  const [logFor, setLogFor] = useState<string | null>(null);
  const [logText, setLogText] = useState("");
  const [logNugget, setLogNugget] = useState("");
  const [logChannel, setLogChannel] = useState<Channel>("message");
  const [refDraft, setRefDraft] = useState({ direction: "sent" as "sent"|"received", company: "", role: "", outcome: "", notes: "" });

  const addContact = () => {
    if (!name.trim()) return;
    const c: NetworkContact = {
      id: uid(), name: name.trim(), relationship: rel, healthScore: 7, influenceScore: 5,
      favorsGiven: 0, favorsReceived: 0, interactions: [],
      lastContactAt: Date.now(),
      jobHistory: [], referralLog: [],
    };
    updateCareer(s => ({ contacts: [c, ...s.contacts] }));
    setName(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<NetworkContact>) =>
    updateCareer(s => ({ contacts: s.contacts.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const del = (id: string) => {
    if (!confirm("Delete contact?")) return;
    updateCareer(s => ({ contacts: s.contacts.filter(c => c.id !== id) }));
    if (activeId === id) setActiveId(null);
  };

  const logInteraction = (id: string) => {
    if (!logText.trim()) return;
    const entry: NetworkInteraction = {
      id: uid(), date: today(), type: logChannel, summary: logText,
      goldNuggets: logNugget || undefined,
    };
    upd(id, {
      interactions: [entry, ...(career.contacts.find(c=>c.id===id)?.interactions ?? [])],
      lastContactAt: Date.now(),
    });
    setLogFor(null); setLogText(""); setLogNugget(""); setLogChannel("message");
  };

  const addReferral = (id: string) => {
    if (!refDraft.company.trim() && !refDraft.role.trim()) return;
    const c = career.contacts.find(x=>x.id===id); if (!c) return;
    const entry = { date: today(), ...refDraft };
    upd(id, { referralLog: [entry, ...(c.referralLog||[])] });
    setRefDraft({ direction:"sent", company:"", role:"", outcome:"", notes:"" });
  };

  const addJobHistory = (id: string, company: string, role: string) => {
    if (!company.trim() && !role.trim()) return;
    const c = career.contacts.find(x=>x.id===id); if (!c) return;
    upd(id, { jobHistory: [...(c.jobHistory||[]), { company, role, startedAt: today() }] });
  };

  const visible = useMemo(() => career.contacts.filter(c => filter === "all" || c.relationship === filter), [career.contacts, filter]);
  const staleCount = career.contacts.filter(c => !c.lastContactAt || Date.now() - c.lastContactAt > 90*DAY).length;
  const coldCount  = career.contacts.filter(c => c.lastContactAt && Date.now() - c.lastContactAt > 180*DAY).length;
  const imbalance = career.contacts.filter(c => Math.abs(c.favorsGiven - c.favorsReceived) >= 3).length;
  const birthdaysThisMonth = career.contacts.filter(c => {
    if (!c.birthday) return false;
    const m = new Date(c.birthday).getMonth();
    return m === new Date().getMonth();
  }).length;
  const totalReferrals = career.contacts.reduce((n,c)=>n+(c.referralLog?.length||0),0);

  const reachQueue = useMemo(() => {
    return [...career.contacts]
      .map(c => {
        const days = c.lastContactAt ? Math.floor((Date.now()-c.lastContactAt)/DAY) : 365;
        const priority = days*2 - c.healthScore*3;
        return { c, days, priority };
      })
      .sort((a,b) => b.priority - a.priority)
      .slice(0, 5);
  }, [career.contacts]);

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  const active = career.contacts.find(c => c.id === activeId) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2" style={{color:"var(--cr-fg)"}}>
            <Users size={22} style={{color:COLORS.pink}}/> network.court
          </h2>
          <p className="text-[11px] tracking-widest mt-1" style={{color:"var(--cr-fgMuted)"}}>
            &gt; nurture your ties · stale = cold · favor imbalances rust
          </p>
        </div>
        <button onClick={()=>setAdding(v=>!v)}
          className="text-[11px] tracking-[0.25em] font-bold px-4 py-2 rounded-sm hud-corner flex items-center gap-2 transition hover:scale-105"
          style={{background:COLORS.pink,color:"var(--cr-bg)",border:`1px solid ${COLORS.pink}`}}>
          <span className="c-tr"/><span className="c-bl"/>
          <Plus size={13}/> ADD CONTACT
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Contacts" value={career.contacts.length} color={COLORS.pink}/>
        <Stat label="Stale 90d+" value={staleCount} color={COLORS.orange}/>
        <Stat label="Cold 180d+" value={coldCount} color={COLORS.red}/>
        <Stat label="Imbalance" value={imbalance} color={COLORS.yellow}/>
        <Stat label="B'days" value={birthdaysThisMonth} color={COLORS.violet}/>
        <Stat label="Referrals" value={totalReferrals} color={COLORS.green}/>
      </div>

      {/* Reach-out queue */}
      {career.contacts.length > 0 && (() => {
        // Radial graph: contacts placed by relationship-type angle + health-score radius.
        const CX = 200, CY = 200, MAXR = 170;
        const groups: Record<string, typeof career.contacts> = {};
        career.contacts.forEach(c => {
          const k = c.relationship || "peer";
          (groups[k] = groups[k] || []).push(c);
        });
        const groupKeys = Object.keys(groups);
        const ANGLE_SPAN = Math.PI * 1.8; // leave a gap
        const nodes = career.contacts.map((c, i) => {
          const gi = groupKeys.indexOf(c.relationship || "peer");
          const group = groups[c.relationship || "peer"];
          const idxInGroup = group.indexOf(c);
          const ga = -Math.PI/2 + gi * (ANGLE_SPAN/Math.max(1,groupKeys.length));
          const spread = (ANGLE_SPAN/Math.max(1,groupKeys.length)) * 0.85;
          const a = ga + (group.length>1 ? (idxInGroup/(group.length-1) - 0.5) * spread : 0);
          const health = (c.healthScore ?? 5) / 10;
          const r = MAXR * (1 - health * 0.65) + Math.sin(i*1.3)*8;
          return { c, x: CX + Math.cos(a)*r, y: CY + Math.sin(a)*r, a, color: COLORS.pink, active: activeId===c.id, stale: !c.lastContactAt || Date.now()-c.lastContactAt>90*86400000 };
        });
        return (
          <div className="rounded-sm p-3 hud-corner relative" style={{background:"var(--cr-card)",border:`1px solid ${COLORS.pink}44`}}>
            <span className="c-tr"/><span className="c-bl"/>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] tracking-widest font-bold flex items-center gap-1" style={{color:COLORS.pink}}>
                <Users size={11}/> CONTACT · GRAPH
              </div>
              <div className="text-[9px] font-mono flex items-center gap-3" style={{color:"var(--cr-fgMuted)"}}>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{background:COLORS.green}}/>hot</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{background:COLORS.orange}}/>stale</span>
                <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{background:COLORS.pink}}/>selected</span>
              </div>
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 400 400" style={{width:"100%",maxWidth:420}}>
                {/* Concentric rings */}
                {[0.33,0.66,1].map(f => (
                  <circle key={f} cx={CX} cy={CY} r={MAXR*f} fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4"/>
                ))}
                <circle cx={CX} cy={CY} r={30} fill={`${COLORS.pink}22`} stroke={COLORS.pink} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 8px ${COLORS.pink}88)`}}/>
                <text x={CX} y={CY+4} textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="700" fill={COLORS.pink}>YOU</text>
                {/* Edges from center */}
                {nodes.map(n => (
                  <line key={"e-"+n.c.id} x1={CX} y1={CY} x2={n.x} y2={n.y}
                    stroke={n.active?COLORS.pink:n.stale?COLORS.orange:"rgba(244,114,182,0.2)"}
                    strokeWidth={n.active?1.5:0.7} strokeDasharray={n.stale?"3 3":""}/>
                ))}
                {/* Nodes */}
                {nodes.map(n => {
                  const col = n.active?COLORS.pink:n.stale?COLORS.orange:COLORS.green;
                  const r = Math.max(3, Math.min(9, 3 + (n.c.healthScore||5)/3));
                  return (
                    <g key={n.c.id} className="cursor-pointer" onClick={()=>setActiveId(n.active?null:n.c.id)}>
                      <circle cx={n.x} cy={n.y} r={r+2} fill="transparent"/>
                      <circle cx={n.x} cy={n.y} r={r} fill={col} stroke={n.active?"#fff":"transparent"} strokeWidth={n.active?1.5:0}
                        style={{filter:`drop-shadow(0 0 4px ${col}aa)`}}/>
                      {(n.active || r>=6) && (
                        <text x={n.x+6+r} y={n.y+3} fontSize="9" fontFamily="monospace" fill="var(--cr-fg)">{n.c.name.split(" ")[0]}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        );
      })()}

      {career.contacts.length > 0 && (
        <div className="rounded-sm p-3 hud-corner relative"
          style={{background:"var(--cr-card)",border:`1px solid ${COLORS.orange}66`}}>
          <span className="c-tr"/><span className="c-bl"/>
          <div className="flex items-center gap-2 text-[10px] tracking-widest font-bold mb-2" style={{color:COLORS.orange}}>
            <AlertTriangle size={11}/> REACH · QUEUE
          </div>
          <div className="flex gap-2 flex-wrap">
            {reachQueue.map(({c, days}) => {
              const cold = days > 180;
              return (
                <button key={c.id} onClick={()=>{ setActiveId(c.id); setFilter("all"); }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-[11px] font-bold transition hover:scale-105"
                  style={{background: cold ? `${COLORS.red}22` : `${COLORS.orange}22`,
                          border: `1px solid ${cold ? `${COLORS.red}66` : `${COLORS.orange}66`}`,
                          color: cold ? COLORS.red : COLORS.orange}}>
                  <span>{c.name}</span>
                  <span className="text-[9px] opacity-80">{days}d</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        {REL_GROUPS.map(g => (
          <button key={g.id} onClick={()=>setFilter(g.id)}
            className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm transition"
            style={{background: filter === g.id ? `${g.color}33` : "var(--cr-card2)",
                    color: filter === g.id ? g.color : "var(--cr-fgMuted)",
                    border: `1px solid ${filter === g.id ? `${g.color}88` : "var(--cr-borderSoft)"}`}}>
            {g.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="rounded-sm p-3 flex flex-wrap gap-2 items-center hud-corner relative"
            style={{...card, borderColor:`${COLORS.pink}88`}}>
            <span className="c-tr"/><span className="c-bl"/>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addContact()}
              placeholder="Name"
              className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-sm" style={inputStyle}/>
            <select value={rel} onChange={e=>setRel(e.target.value as RelationshipType)}
              className="bg-transparent text-sm px-3 py-2 rounded-sm outline-none" style={inputStyle}>
              {REL_GROUPS.filter(g=>g.id!=="all").map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <button onClick={addContact} className="text-[11px] tracking-widest font-bold px-4 py-2 rounded-sm"
              style={{background:COLORS.pink,color:"var(--cr-bg)"}}>Add</button>
            <button onClick={()=>setAdding(false)} className="text-xs px-3 py-2" style={{color:"var(--cr-fgMuted)"}}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {visible.length === 0 && !adding && (
        <div className="rounded-sm p-10 text-center hud-corner relative"
          style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
          <span className="c-tr"/><span className="c-bl"/>
          <Users size={24} className="mx-auto mb-2" style={{color:COLORS.pink}}/>
          <p className="text-xs tracking-widest font-bold" style={{color:COLORS.pink}}>Your court is empty.</p>
          <p className="text-[11px] mt-1 tracking-wide" style={{color:"var(--cr-fgMuted)"}}>Add a mentor, peer, or recruiter — start tending the garden.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map(c => {
          const days = c.lastContactAt ? Math.floor((Date.now()-c.lastContactAt)/DAY) : 999;
          const stale = days > 90;
          const cold = days > 180;
          const favorDelta = c.favorsGiven - c.favorsReceived;
          const isOpen = c.id === activeId;
          const grp = REL_GROUPS.find(g => g.id === c.relationship);
          const accent = grp?.color || COLORS.pink;
          const followUpDue = c.nextFollowUpAt && c.nextFollowUpAt <= Date.now() + DAY;
          const birthdaySoon = c.birthday && (() => {
            const b = new Date(c.birthday); const now = new Date();
            const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
            if (next < now) next.setFullYear(now.getFullYear()+1);
            return (next.getTime() - now.getTime()) / DAY < 30;
          })();
          const initials = c.name.split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();

          return (
            <motion.div key={c.id} layout
              className="rounded-sm hud-corner relative"
              onClick={() => setActiveId(isOpen?null:c.id)}
              style={{...card,
                borderColor: isOpen ? `${accent}aa` : cold ? `${COLORS.red}66` : stale ? `${COLORS.orange}66` : "var(--cr-borderSoft)"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-sm flex items-center justify-center text-sm font-black shrink-0"
                    style={{background:`${accent}22`,border:`1px solid ${accent}66`,color:accent}}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm md:text-base" style={{color:"var(--cr-fg)"}}>{c.name}</h4>
                      <span className="text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
                        style={{background:`${accent}22`,color:accent,border:`1px solid ${accent}44`}}>{c.relationship}</span>
                      {cold && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                        style={{background:`${COLORS.red}22`,color:COLORS.red}}><AlertTriangle size={9}/>COLD</span>}
                      {stale && !cold && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                        style={{background:`${COLORS.orange}22`,color:COLORS.orange}}><Clock size={9}/>STALE</span>}
                      {followUpDue && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                        style={{background:`${COLORS.violet}22`,color:COLORS.violet}}><Calendar size={9}/>FOLLOW UP</span>}
                      {birthdaySoon && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                        style={{background:`${COLORS.yellow}22`,color:COLORS.yellow}}><Cake size={9}/>BIRTHDAY</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] mt-1 flex-wrap" style={{color:"var(--cr-fgMuted)"}}>
                      {c.company && <span className="flex items-center gap-1"><Briefcase size={10}/>{c.company}{c.role?` · ${c.role}`:""}</span>}
                      {c.email && <span className="flex items-center gap-1 truncate"><Mail size={10}/>{c.email}</span>}
                      {c.phone && <span className="flex items-center gap-1"><Phone size={10}/>{c.phone}</span>}
                      <span>· {days === 0 ? "today" : `${days}d ago`}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold tracking-widest flex-wrap">
                      <Mini label="HLTH" value={c.healthScore} color={COLORS.pink}/>
                      <Mini label="INFL" value={c.influenceScore} color={COLORS.yellow}/>
                      <span className="flex items-center gap-1" style={{color:Math.abs(favorDelta)>=3?(favorDelta>0?COLORS.red:COLORS.green):"var(--cr-fgMuted)"}}>
                        <HeartHandshake size={10}/> {favorDelta>=0?"+":""}{favorDelta}
                      </span>
                      {(c.referralLog?.length??0) > 0 && (
                        <span className="flex items-center gap-1" style={{color:COLORS.green}}>
                          <ArrowRightLeft size={10}/> {c.referralLog!.length} ref
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();del(c.id);}} className="p-1.5 rounded-sm self-start"
                    style={{color:COLORS.red}}><Trash2 size={12}/></button>
                </div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                    className="overflow-hidden" onClick={e=>e.stopPropagation()}>
                    <div className="px-4 pb-4 border-t" style={{borderColor:"var(--cr-borderSoft)",background:"var(--cr-card2)"}}>
                      {/* Tab strip */}
                      <div className="flex gap-1 my-2 -mx-1">
                        {(["details","log","referrals","history"] as const).map(t => (
                          <button key={t} onClick={()=>setTab(t)}
                            className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
                            style={{background: tab===t ? `${COLORS.pink}33` : "transparent",
                                    color: tab===t ? COLORS.pink : "var(--cr-fgMuted)",
                                    border:`1px solid ${tab===t?`${COLORS.pink}66`:"transparent"}`}}>
                            {t.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      {tab === "details" && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Sliders label="Health" value={c.healthScore} color={COLORS.pink} onChange={v=>upd(c.id,{healthScore:v})}/>
                            <Sliders label="Influence" value={c.influenceScore} color={COLORS.yellow} onChange={v=>upd(c.id,{influenceScore:v})}/>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Company" value={c.company??""} onChange={e=>upd(c.id,{company:e.target.value})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                            <input placeholder="Role" value={c.role??""} onChange={e=>upd(c.id,{role:e.target.value})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                            <input placeholder="Email" value={c.email??""} onChange={e=>upd(c.id,{email:e.target.value})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                            <input placeholder="Phone" value={c.phone??""} onChange={e=>upd(c.id,{phone:e.target.value})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                            <div>
                              <div className="text-[9px] tracking-widest font-bold mb-0.5" style={{color:"var(--cr-fgMuted)"}}>PREFERRED CHANNEL</div>
                              <select value={c.preferredChannel||"message"} onChange={e=>upd(c.id,{preferredChannel:e.target.value})}
                                className="w-full bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}>
                                {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                              </select>
                            </div>
                            <input type="date" placeholder="Birthday" value={c.birthday??""} onChange={e=>upd(c.id,{birthday:e.target.value})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                            <input type="date" value={c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString().slice(0,10) : ""}
                              onChange={e=>upd(c.id,{nextFollowUpAt: e.target.value ? new Date(e.target.value).getTime() : undefined})}
                              className="bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle} title="Next follow-up"/>
                          </div>
                          <input placeholder="Interests (hobbies, kids, pets, sports)" value={c.interests??""}
                            onChange={e=>upd(c.id,{interests:e.target.value})}
                            className="w-full bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                          <input placeholder="Next-talk prep — ask about X next time" value={c.nextTalkPrep??""}
                            onChange={e=>upd(c.id,{nextTalkPrep:e.target.value})}
                            className="w-full bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none" style={inputStyle}/>
                          <textarea placeholder="Private notes" value={c.notes??""} onChange={e=>upd(c.id,{notes:e.target.value})} rows={2}
                            className="w-full bg-transparent px-2 py-1.5 rounded-sm text-xs outline-none resize-none" style={inputStyle}/>
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={()=>upd(c.id,{favorsGiven:c.favorsGiven+1})}
                              className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                              style={{background:`${COLORS.green}22`,color:COLORS.green,border:`1px solid ${COLORS.green}44`}}>+1 Given</button>
                            <button onClick={()=>upd(c.id,{favorsReceived:c.favorsReceived+1})}
                              className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                              style={{background:`${COLORS.yellow}22`,color:COLORS.yellow,border:`1px solid ${COLORS.yellow}44`}}>+1 Received</button>
                            <button onClick={()=>upd(c.id,{lastContactAt:Date.now()})}
                              className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                              style={{background:`${COLORS.cyan}22`,color:"var(--cr-accent)",border:"1px solid var(--cr-border)"}}>
                              Touch base today
                            </button>
                            <button onClick={()=>setLogFor(logFor===c.id?null:c.id)}
                              className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm ml-auto"
                              style={{background:`${COLORS.pink}22`,color:COLORS.pink,border:`1px solid ${COLORS.pink}44`}}>
                              <MessageSquare size={10} className="inline mr-1"/>Log interaction
                            </button>
                          </div>
                        </div>
                      )}

                      {tab === "log" && (
                        <div className="space-y-2">
                          <button onClick={()=>setLogFor(logFor===c.id?null:c.id)}
                            className="text-[10px] tracking-widest font-bold px-2 py-1 rounded-sm"
                            style={{background:`${COLORS.pink}22`,color:COLORS.pink,border:`1px solid ${COLORS.pink}44`}}>
                            <MessageSquare size={10} className="inline mr-1"/>New entry
                          </button>
                          {logFor === c.id && (
                            <div className="space-y-1 p-2 rounded-sm" style={{background:"var(--cr-card)",border:`1px solid ${COLORS.pink}44`}}>
                              <div className="flex gap-1 flex-wrap">
                                {CHANNELS.map(ch => (
                                  <button key={ch} onClick={()=>setLogChannel(ch)}
                                    className="text-[9px] tracking-widest font-bold px-2 py-0.5 rounded-sm"
                                    style={{background:logChannel===ch?`${COLORS.pink}44`:"var(--cr-card2)",
                                            color: logChannel===ch?COLORS.pink:"var(--cr-fgMuted)",
                                            border:`1px solid ${logChannel===ch?COLORS.pink:"var(--cr-borderSoft)"}`}}>
                                    {ch}
                                  </button>
                                ))}
                              </div>
                              <textarea value={logText} onChange={e=>setLogText(e.target.value)} placeholder="What happened?" rows={2}
                                className="w-full bg-transparent px-2 py-1 rounded-sm text-xs outline-none resize-none" style={inputStyle}/>
                              <input value={logNugget} onChange={e=>setLogNugget(e.target.value)} placeholder="Gold nugget / quote (optional)"
                                className="w-full bg-transparent px-2 py-1 rounded-sm text-xs outline-none"
                                style={{...inputStyle, borderColor:`${COLORS.yellow}66`}}/>
                              <div className="flex gap-2">
                                <button onClick={()=>logInteraction(c.id)}
                                  className="text-[10px] tracking-widest font-bold px-3 py-1 rounded-sm"
                                  style={{background:COLORS.pink,color:"var(--cr-bg)"}}>Save</button>
                                <button onClick={()=>setLogFor(null)} className="text-[10px] px-3 py-1" style={{color:"var(--cr-fgMuted)"}}>Cancel</button>
                              </div>
                            </div>
                          )}
                          {c.interactions.length === 0 && !logFor && (
                            <p className="text-[11px] text-center py-3" style={{color:"var(--cr-fgMuted)"}}>No interactions logged.</p>
                          )}
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {c.interactions.slice(0,20).map(i => (
                              <div key={i.id} className="text-[11px] p-2 rounded-sm"
                                style={{background:"var(--cr-card)",border:"1px solid var(--cr-borderSoft)"}}>
                                <div className="text-[9px] tracking-widest font-bold flex items-center gap-1" style={{color:COLORS.pink}}>
                                  {i.date} · <span className="uppercase">{i.type||"log"}</span>
                                </div>
                                <div style={{color:"var(--cr-fg)"}}>{i.summary}</div>
                                {i.goldNuggets && <div className="mt-0.5 italic" style={{color:COLORS.yellow}}>💬 "{i.goldNuggets}"</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tab === "referrals" && (
                        <div className="space-y-2">
                          <div className="p-2 rounded-sm space-y-1" style={{background:"var(--cr-card)",border:`1px solid ${COLORS.green}44`}}>
                            <div className="flex gap-1">
                              <button onClick={()=>setRefDraft({...refDraft,direction:"sent"})}
                                className="text-[9px] tracking-widest font-bold px-2 py-0.5 rounded-sm flex items-center gap-1"
                                style={{background:refDraft.direction==="sent"?`${COLORS.green}44`:"var(--cr-card2)",
                                        color: refDraft.direction==="sent"?COLORS.green:"var(--cr-fgMuted)",
                                        border:`1px solid ${refDraft.direction==="sent"?COLORS.green:"var(--cr-borderSoft)"}`}}>
                                <Send size={9}/> SENT
                              </button>
                              <button onClick={()=>setRefDraft({...refDraft,direction:"received"})}
                                className="text-[9px] tracking-widest font-bold px-2 py-0.5 rounded-sm flex items-center gap-1"
                                style={{background:refDraft.direction==="received"?`${COLORS.violet}44`:"var(--cr-card2)",
                                        color: refDraft.direction==="received"?COLORS.violet:"var(--cr-fgMuted)",
                                        border:`1px solid ${refDraft.direction==="received"?COLORS.violet:"var(--cr-borderSoft)"}`}}>
                                <Inbox size={9}/> RECEIVED
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <input placeholder="Company" value={refDraft.company} onChange={e=>setRefDraft({...refDraft,company:e.target.value})}
                                className="bg-transparent px-2 py-1 rounded-sm text-[11px] outline-none" style={inputStyle}/>
                              <input placeholder="Role" value={refDraft.role} onChange={e=>setRefDraft({...refDraft,role:e.target.value})}
                                className="bg-transparent px-2 py-1 rounded-sm text-[11px] outline-none" style={inputStyle}/>
                              <input placeholder="Outcome (hired/interviewed/pass)" value={refDraft.outcome}
                                onChange={e=>setRefDraft({...refDraft,outcome:e.target.value})}
                                className="col-span-2 bg-transparent px-2 py-1 rounded-sm text-[11px] outline-none" style={inputStyle}/>
                            </div>
                            <button onClick={()=>addReferral(c.id)}
                              className="text-[10px] tracking-widest font-bold px-3 py-1 rounded-sm"
                              style={{background:COLORS.green,color:"var(--cr-bg)"}}>Add referral</button>
                          </div>
                          {(c.referralLog||[]).length === 0 && (
                            <p className="text-[11px] text-center py-3" style={{color:"var(--cr-fgMuted)"}}>No referrals tracked.</p>
                          )}
                          <div className="space-y-1">
                            {(c.referralLog||[]).map((r,idx) => (
                              <div key={idx} className="text-[11px] p-2 rounded-sm flex items-start gap-2"
                                style={{background:"var(--cr-card)",border:"1px solid var(--cr-borderSoft)"}}>
                                {r.direction==="sent"
                                  ? <Send size={11} style={{color:COLORS.green,marginTop:2}}/>
                                  : <Inbox size={11} style={{color:COLORS.violet,marginTop:2}}/>}
                                <div className="flex-1">
                                  <div className="text-[9px] tracking-widest font-bold" style={{color:r.direction==="sent"?COLORS.green:COLORS.violet}}>
                                    {r.date} · {r.direction.toUpperCase()}
                                  </div>
                                  <div style={{color:"var(--cr-fg)"}}>{[r.company,r.role].filter(Boolean).join(" — ")||"(no detail)"}</div>
                                  {r.outcome && <div style={{color:COLORS.yellow}}>→ {r.outcome}</div>}
                                  {r.notes && <div className="text-[10px] italic" style={{color:"var(--cr-fgMuted)"}}>{r.notes}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tab === "history" && (
                        <div className="space-y-2">
                          <JobHistoryAdder onAdd={(co,ro)=>addJobHistory(c.id,co,ro)} inputStyle={inputStyle}/>
                          {(c.jobHistory||[]).length === 0 && (
                            <p className="text-[11px] text-center py-3" style={{color:"var(--cr-fgMuted)"}}>No job moves tracked.</p>
                          )}
                          <div className="space-y-1">
                            {[...(c.jobHistory||[])].reverse().map((j,i) => (
                              <div key={i} className="text-[11px] p-2 rounded-sm flex items-center gap-2"
                                style={{background:"var(--cr-card)",border:"1px solid var(--cr-borderSoft)"}}>
                                <Briefcase size={11} style={{color:COLORS.cyan}}/>
                                <span style={{color:"var(--cr-fg)"}}><b>{j.role||"(role)"}</b> @ {j.company||"(?)"}</span>
                                {j.startedAt && <span className="text-[9px] tracking-widest ml-auto" style={{color:"var(--cr-fgMuted)"}}>from {j.startedAt}</span>}
                              </div>
                            ))}
                          </div>
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

function JobHistoryAdder({ onAdd, inputStyle }: { onAdd: (c: string, r: string)=>void; inputStyle: React.CSSProperties }) {
  const [co, setCo] = useState(""); const [ro, setRo] = useState("");
  return (
    <div className="p-2 rounded-sm flex gap-1 flex-wrap" style={{background:"var(--cr-card)",border:`1px solid ${COLORS.cyan}44`}}>
      <input placeholder="Company" value={co} onChange={e=>setCo(e.target.value)}
        className="flex-1 min-w-[120px] bg-transparent px-2 py-1 rounded-sm text-[11px] outline-none" style={inputStyle}/>
      <input placeholder="Role" value={ro} onChange={e=>setRo(e.target.value)}
        className="flex-1 min-w-[120px] bg-transparent px-2 py-1 rounded-sm text-[11px] outline-none" style={inputStyle}/>
      <button onClick={()=>{ onAdd(co,ro); setCo(""); setRo(""); }}
        className="text-[10px] tracking-widest font-bold px-3 py-1 rounded-sm"
        style={{background:COLORS.cyan,color:"var(--cr-bg)"}}>Track move</button>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-sm p-2.5 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[9px] tracking-widest font-bold" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg font-black leading-tight mt-0.5" style={{color:"var(--cr-fg)"}}>{value}</div>
    </div>
  );
}

function Mini({label,value,color}:{label:string;value:number;color:string}) {
  return (
    <span className="flex items-center gap-1">
      <span style={{color:"var(--cr-fgMuted)"}}>{label}</span>
      <span style={{color}}>{value}/10</span>
    </span>
  );
}

function Sliders({label,value,color,onChange}:{label:string;value:number;color:string;onChange:(v:number)=>void}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] tracking-widest font-bold mb-1">
        <span style={{color:"var(--cr-fgMuted)"}}>{label.toUpperCase()}</span>
        <span style={{color}}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-full" style={{accentColor:color}}/>
    </div>
  );
}

// Suppress unused import
void Sparkles;
