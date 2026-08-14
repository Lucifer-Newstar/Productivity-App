"use client";

/**
 * JobsSection — application kanban + question bank + company dossiers.
 * Stages: researching → applied → phone → tech → onsite → offer → accepted / rejected / ghosted.
 * Ghosted auto-detect (>14d since lastContactAt, visual only).
 * New features:
 *   - Weighted decision matrix (compensation / growth / wlb / team / mission / location), auto-scored 0-10.
 *   - Counter-offer fields (initial offer → counter → final).
 *   - Rejection feedback capture (reason + learnings).
 *   - Follow-up reminder (nextFollowUpAt date).
 *   - HUD-themed via CSS variables (blueprint auto-works).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Briefcase, Trash2, Ghost, Clock, Building2, HelpCircle,
  Search, Star, CheckCircle2, Circle, X,
  AlertTriangle, HandCoins, Scale, Timer, Heart,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { JobApplication, AppStage, AppQuestion, CompanyDossier } from "../../../lib/careerTypes";

type Tab = "pipeline" | "qbank" | "dossiers";

const STAGES: { id: AppStage; label: string; color: string }[] = [
  { id: "researching",  label: "Researching", color: "#22d3ee" },
  { id: "applied",      label: "Applied",     color: "#06b6d4" },
  { id: "phone-screen", label: "Phone",       color: "#a78bfa" },
  { id: "tech-interview", label: "Tech",      color: "#f472b6" },
  { id: "onsite",       label: "Onsite",      color: "#fb923c" },
  { id: "offer",        label: "Offer",       color: "#34d399" },
  { id: "accepted",     label: "Accepted",    color: "#facc15" },
  { id: "rejected",     label: "Rejected",    color: "#f87171" },
  { id: "ghosted",      label: "Ghosted",     color: "#64748b" },
];

// Decision-matrix dimensions (weighted, sum 100)
const MATRIX: { key: keyof NonNullable<JobApplication["decisionMatrix"]>; label: string; weight: number }[] = [
  { key: "comp",     label: "Compensation", weight: 25 },
  { key: "growth",   label: "Growth",       weight: 20 },
  { key: "wlb",      label: "Work/Life",    weight: 15 },
  { key: "team",     label: "Team/Manager", weight: 15 },
  { key: "mission",  label: "Mission",      weight: 15 },
  { key: "location", label: "Location",     weight: 10 },
];

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const DAY = 86400000;

const COLORS = {
  cyan: "var(--cr-accent)",
  violet: "#a78bfa",
  pink: "#f472b6",
  orange: "var(--cr-accent2)",
  green: "var(--cr-accent3)",
  yellow: "#facc15",
  red: "#f87171",
  slate: "#64748b",
};

export default function JobsSection() {
  const { career, updateCareer } = useStore();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dossOpen, setDossOpen] = useState<string | null>(null);

  const addApp = () => {
    if (!role.trim() || !company.trim()) return;
    const existing = career.companies.find(c => c.name.toLowerCase() === company.trim().toLowerCase());
    const co = existing || { id: uid(), name: company.trim() };
    const app: JobApplication = {
      id: uid(), role: role.trim(), companyId: co.id, appliedAt: today(), stage: "researching",
      recruiter: "", notes: "",
      decisionMatrix: { comp: 5, growth: 5, wlb: 5, team: 5, mission: 5, location: 5 },
    };
    updateCareer(s => ({
      applications: [app, ...s.applications],
      companies: existing ? s.companies : [...s.companies, co],
    }));
    setRole(""); setCompany(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<JobApplication>) =>
    updateCareer(s => ({ applications: s.applications.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const del = (id: string) => {
    if (!confirm("Delete application?")) return;
    updateCareer(s => ({ applications: s.applications.filter(a => a.id !== id) }));
  };

  const byStage = useMemo(() => {
    const map: Record<AppStage, JobApplication[]> = {} as any;
    STAGES.forEach(s => map[s.id] = []);
    for (const a of career.applications) {
      const lastTs = a.lastContactAt ? new Date(a.lastContactAt).getTime() : new Date(a.appliedAt).getTime();
      const daysSince = (Date.now() - lastTs) / DAY;
      const autoGhost = !["rejected","accepted","ghosted"].includes(a.stage) && daysSince > 14;
      const stage: AppStage = autoGhost ? "ghosted" : a.stage;
      (map[stage] || map.researching).push(a);
    }
    return map;
  }, [career.applications]);

  const total = career.applications.length;
  const offers = career.applications.filter(a => a.stage === "offer" || a.stage === "accepted").length;
  const ghosted = byStage.ghosted.length;
  const rejections = career.applications.filter(a => a.stage === "rejected").length;
  const rate = total ? Math.round((career.applications.filter(a => ["onsite","offer","accepted"].includes(a.stage)).length/total)*100) : 0;
  const bestOffer = Math.max(0, ...career.applications.map(a => a.offerFinal || a.offerBase || 0));
  const followUpsDue = career.applications.filter(a => {
    if (!a.nextFollowUpAt) return false;
    if (["rejected","accepted"].includes(a.stage)) return false;
    return new Date(a.nextFollowUpAt).getTime() <= Date.now() + DAY;
  }).length;

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2" style={{color:"var(--cr-fg)"}}>
            <Briefcase size={22} style={{color:COLORS.orange}}/> jobs.campaign
          </h2>
          <p className="text-[11px] tracking-widest mt-1" style={{color:"var(--cr-fgMuted)"}}>
            &gt; pipeline kanban · q-bank · intel dossiers · decision matrix
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-sm overflow-hidden hud-corner" style={card}>
            {(["pipeline","qbank","dossiers"] as Tab[]).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                className="text-[10px] tracking-widest font-bold px-3 py-1.5 transition"
                style={{background: tab===t ? `${COLORS.orange}33` : "transparent",
                        color: tab===t ? COLORS.orange : "var(--cr-fgMuted)",
                        borderRight: "1px solid var(--cr-borderSoft)"}}>
                {t==="pipeline"?"PIPELINE":t==="qbank"?"Q BANK":"DOSSIERS"}
              </button>
            ))}
          </div>
          {tab === "pipeline" && (
            <button onClick={()=>setAdding(v=>!v)}
              className="text-[11px] tracking-[0.25em] font-bold px-4 py-2 rounded-sm hud-corner flex items-center gap-2 transition hover:scale-105"
              style={{background:COLORS.orange,color:"var(--cr-bg)",border:`1px solid ${COLORS.orange}`}}>
              <span className="c-tr"/><span className="c-bl"/>
              <Plus size={13}/> NEW APP
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Active" value={total} color={COLORS.orange}/>
        <Stat label="Offers" value={offers} color={COLORS.green}/>
        <Stat label="Rejected" value={rejections} color={COLORS.red}/>
        <Stat label="Ghosted" value={ghosted} color={COLORS.slate}/>
        <Stat label="Follow-ups" value={followUpsDue} color={COLORS.violet}/>
        <Stat label="Best TC" value={bestOffer ? `$${(bestOffer/1000).toFixed(0)}k` : "—"} color={COLORS.yellow}/>
      </div>

      <AnimatePresence mode="wait">
        {tab === "pipeline" && (
          <motion.div key="pipe" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
            {adding && (
              <div className="rounded-sm p-3 flex flex-wrap gap-2 items-center hud-corner relative"
                style={{...card, borderColor: `${COLORS.orange}88`}}>
                <span className="c-tr"/><span className="c-bl"/>
                <input value={role} onChange={e=>setRole(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addApp()}
                  placeholder="Role (e.g. Senior SRE)"
                  className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-sm" style={inputStyle}/>
                <input value={company} onChange={e=>setCompany(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addApp()}
                  placeholder="Company"
                  className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-sm" style={inputStyle}/>
                <button onClick={addApp} className="text-[11px] tracking-widest font-bold px-4 py-2 rounded-sm"
                  style={{background:COLORS.orange,color:"var(--cr-bg)"}}>Add</button>
                <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2" style={{color:"var(--cr-fgMuted)"}}>Cancel</button>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
              {STAGES.map(col => (
                <div key={col.id} className="shrink-0 w-64 md:w-72">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] tracking-widest font-bold" style={{color:col.color}}>{col.label.toUpperCase()}</span>
                    <span className="text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold"
                      style={{background:`${col.color}22`,color:col.color}}>{byStage[col.id].length}</span>
                  </div>
                  <div className="space-y-2 rounded-sm p-2"
                    style={{background:"var(--cr-card2)",border:`1px solid ${col.color}33`,minHeight:120}}>
                    {byStage[col.id].map(a => {
                      const open = a.id === openId;
                      const co = career.companies.find(c=>c.id===a.companyId);
                      const lastTs = a.lastContactAt ? new Date(a.lastContactAt).getTime() : new Date(a.appliedAt).getTime();
                      const daysSince = Math.floor((Date.now() - lastTs)/DAY);
                      const followUpDue = a.nextFollowUpAt && new Date(a.nextFollowUpAt).getTime() <= Date.now() + DAY
                        && !["rejected","accepted"].includes(a.stage);
                      const score = decisionScore(a);
                      return (
                        <motion.div key={a.id} layout
                          className="rounded-sm p-2.5 cursor-pointer relative"
                          onClick={()=>setOpenId(open?null:a.id)}
                          style={{background:"var(--cr-card)",border:`1px solid ${col.color}66`}}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate" style={{color:"var(--cr-fg)"}}>{a.role}</div>
                              <div className="text-[11px] flex items-center gap-1" style={{color:"var(--cr-fgMuted)"}}>
                                <Building2 size={10}/>{co?.name || "—"}
                              </div>
                            </div>
                            {score != null && a.stage !== "rejected" && (
                              <div className="text-[9px] font-black tracking-widest shrink-0 rounded-sm px-1 py-0.5"
                                style={{color: score >= 7 ? COLORS.green : score >= 5 ? COLORS.yellow : COLORS.red,
                                        background: `${score >= 7 ? COLORS.green : score >= 5 ? COLORS.yellow : COLORS.red}22`}}>
                                {score.toFixed(1)}
                              </div>
                            )}
                            {a.offerFinal || a.offerBase ? (
                              <div className="text-[10px] font-black shrink-0" style={{color:COLORS.green}}>
                                ${(((a.offerFinal||a.offerBase)||0)/1000).toFixed(0)}k
                              </div>
                            ) : null}
                          </div>
                          <div className="text-[10px] flex items-center gap-2 mt-1 flex-wrap" style={{color:"var(--cr-fgMuted)"}}>
                            <span className="flex items-center gap-0.5"><Clock size={9}/>{a.appliedAt} · {daysSince}d</span>
                            {col.id === "ghosted" && <span className="flex items-center gap-0.5" style={{color:COLORS.slate}}><Ghost size={9}/>GHOST</span>}
                            {followUpDue && <span className="flex items-center gap-0.5" style={{color:COLORS.violet}}><AlertTriangle size={9}/>FOLLOW UP</span>}
                            {a.vibeScore != null && <span className="flex items-center gap-0.5" style={{color:COLORS.yellow}}><Star size={9} fill={COLORS.yellow}/>{a.vibeScore}/5</span>}
                          </div>
                          <AnimatePresence>
                            {open && (
                              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                                onClick={e=>e.stopPropagation()} className="overflow-hidden mt-2 pt-2 border-t"
                                style={{borderColor:"var(--cr-borderSoft)"}}>
                                {/* Stage picker */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {STAGES.map(s => (
                                    <button key={s.id} onClick={()=>upd(a.id,{stage:s.id,lastContactAt:s.id==="ghosted"?a.lastContactAt:today()})}
                                      className="text-[9px] tracking-widest font-bold px-1.5 py-1 rounded-sm"
                                      style={{background:a.stage===s.id?`${s.color}33`:"var(--cr-card2)",
                                              color:s.color,
                                              border:`1px solid ${a.stage===s.id?s.color+"88":"var(--cr-borderSoft)"}`}}>
                                      {s.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="grid grid-cols-2 gap-1 mb-2">
                                  <input defaultValue={a.recruiter||""} onBlur={e=>upd(a.id,{recruiter:e.target.value})} placeholder="Recruiter contact"
                                    className="bg-transparent text-[11px] p-1.5 rounded-sm outline-none" style={inputStyle}/>
                                  <input type="date" defaultValue={a.nextFollowUpAt||""}
                                    onBlur={e=>upd(a.id,{nextFollowUpAt:e.target.value||undefined})}
                                    className="bg-transparent text-[11px] p-1.5 rounded-sm outline-none" style={inputStyle}/>
                                  <div className="col-span-2 flex items-center gap-1 text-[10px] px-1.5 py-1 rounded-sm"
                                    style={{border:`1px solid ${COLORS.yellow}44`}}>
                                    <Star size={10} style={{color:COLORS.yellow}}/>
                                    {[1,2,3,4,5].map(n=>(
                                      <button key={n} onClick={()=>upd(a.id,{vibeScore:n})}
                                        style={{color:(a.vibeScore||0)>=n?COLORS.yellow:"var(--cr-fgDim)"}}>★</button>
                                    ))}
                                    <span className="ml-auto tracking-widest font-bold" style={{color:"var(--cr-fgMuted)"}}>VIBE</span>
                                  </div>
                                </div>

                                <textarea defaultValue={a.notes??""} onBlur={e=>upd(a.id,{notes:e.target.value})} placeholder="Notes / prep..." rows={2}
                                  className="w-full bg-transparent text-[11px] p-1.5 rounded-sm outline-none resize-none" style={inputStyle}/>

                                {/* Offer/Counter block */}
                                {["offer","accepted","rejected"].includes(a.stage) && (
                                  <div className="mt-2 p-2 rounded-sm" style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.green}44`}}>
                                    <div className="text-[9px] tracking-widest font-bold mb-1 flex items-center gap-1" style={{color:COLORS.green}}>
                                      <HandCoins size={10}/> COMPENSATION
                                    </div>
                                    <div className="grid grid-cols-3 gap-1">
                                      <NumInput label="INITIAL" defaultValue={a.offerBase||""} onCommit={v=>upd(a.id,{offerBase:v||undefined})} color={COLORS.cyan}/>
                                      <NumInput label="COUNTER" defaultValue={a.counterOffer||""} onCommit={v=>upd(a.id,{counterOffer:v||undefined})} color={COLORS.orange}/>
                                      <NumInput label="FINAL TC" defaultValue={a.offerFinal||""} onCommit={v=>upd(a.id,{offerFinal:v||undefined})} color={COLORS.green}/>
                                    </div>
                                  </div>
                                )}

                                {/* Rejection feedback */}
                                {a.stage === "rejected" && (
                                  <div className="mt-2 p-2 rounded-sm" style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.red}44`}}>
                                    <div className="text-[9px] tracking-widest font-bold mb-1 flex items-center gap-1" style={{color:COLORS.red}}>
                                      <AlertTriangle size={10}/> REJECTION POST-MORTEM
                                    </div>
                                    <input defaultValue={a.rejectionReason||""} onBlur={e=>upd(a.id,{rejectionReason:e.target.value})}
                                      placeholder="Reason given (e.g. 'went with more senior')"
                                      className="w-full bg-transparent text-[11px] p-1.5 rounded-sm outline-none mb-1" style={inputStyle}/>
                                    <textarea defaultValue={a.learnings||""} onBlur={e=>upd(a.id,{learnings:e.target.value})}
                                      placeholder="Learnings — what to drill next time?" rows={2}
                                      className="w-full bg-transparent text-[11px] p-1.5 rounded-sm outline-none resize-none" style={inputStyle}/>
                                  </div>
                                )}

                                {/* Decision matrix for offers/onsite */}
                                {["onsite","offer","accepted"].includes(a.stage) && (
                                  <div className="mt-2 p-2 rounded-sm" style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.violet}44`}}>
                                    <div className="text-[9px] tracking-widest font-bold mb-2 flex items-center gap-1" style={{color:COLORS.violet}}>
                                      <Scale size={10}/> DECISION MATRIX · {score?.toFixed(1)}/10
                                    </div>
                                    <div className="space-y-1">
                                      {MATRIX.map((m) => {
                                        const dm = (a.decisionMatrix || { comp:5, growth:5, wlb:5, team:5, mission:5, location:5 });
                                        const v = dm[m.key];
                                        return (
                                          <div key={m.key} className="flex items-center gap-2 text-[10px]">
                                            <span className="w-20 tracking-widest font-bold" style={{color:"var(--cr-fgMuted)"}}>{m.label}</span>
                                            <input type="range" min={0} max={10} value={v}
                                              onChange={e=>upd(a.id,{decisionMatrix:{...dm,[m.key]:Number(e.target.value)}})}
                                              className="flex-1" style={{accentColor:COLORS.violet}}/>
                                            <span className="w-5 text-right font-black" style={{color:COLORS.violet}}>{v}</span>
                                            <span className="w-8 text-right text-[9px]" style={{color:"var(--cr-fgDim)"}}>×{m.weight}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Time spent tracker */}
                                <div className="mt-2 p-2 rounded-sm flex items-center gap-2 flex-wrap"
                                  style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.cyan}44`}}>
                                  <Timer size={10} style={{color:COLORS.cyan}}/>
                                  <span className="text-[9px] tracking-widest font-bold" style={{color:COLORS.cyan}}>TIME_SPENT</span>
                                  <span className="text-[10px] font-mono font-black" style={{color:COLORS.cyan}}>{(a.timeSpentMin||0)}min</span>
                                  <div className="ml-auto flex gap-1">
                                    {[15,30,60].map(m => (
                                      <button key={m} onClick={()=>upd(a.id,{timeSpentMin:(a.timeSpentMin||0)+m})}
                                        className="text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
                                        style={{background:`${COLORS.cyan}15`,color:COLORS.cyan,border:`1px solid ${COLORS.cyan}33`}}>+{m}m</button>
                                    ))}
                                    <button onClick={()=>upd(a.id,{timeSpentMin:0})}
                                      className="text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
                                      style={{color:COLORS.red}}>reset</button>
                                  </div>
                                </div>

                                {/* Culture checklist */}
                                <div className="mt-2 p-2 rounded-sm" style={{background:"var(--cr-card2)",border:`1px solid ${COLORS.pink}44`}}>
                                  <div className="text-[9px] tracking-widest font-bold mb-1 flex items-center gap-1" style={{color:COLORS.pink}}>
                                    <Heart size={10}/> CULTURE_CHECK
                                  </div>
                                  {(() => {
                                    const cc = co?.cultureChecks || [];
                                    const score = cc.filter(c => c.value === "✓").length;
                                    return (
                                      <>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                          {["Remote-friendly","Fast pace","Mentorship","Strong eng bar","Good WLB","Mission fit","Comp fair","Diverse team"].map(lbl => {
                                            const existing = cc.find(c => c.label === lbl);
                                            const val = existing?.value || "?";
                                            const cycle = () => {
                                              const next = val === "?" ? "✓" : val === "✓" ? "✗" : "?";
                                              const newArr = existing
                                                ? cc.map(c => c.label===lbl ? {...c,value:next} : c)
                                                : [...cc, {label:lbl,value:next}];
                                              updateCareer(s => ({ companies: s.companies.map(x => x.id===(co?.id||"") ? {...x, cultureChecks:newArr} : x) }));
                                            };
                                            const col = val === "✓" ? COLORS.green : val === "✗" ? COLORS.red : "var(--cr-fgMuted)";
                                            return (
                                              <button key={lbl} onClick={cycle}
                                                className="text-[10px] font-mono text-left px-1 py-0.5 rounded flex items-center gap-1 hover:bg-white/5">
                                                <span style={{color:col,fontWeight:700,width:10}}>{val}</span>
                                                <span className="truncate" style={{color:"var(--cr-fg)"}}>{lbl}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                        {co && (
                                          <div className="mt-1 text-[9px] tracking-widest font-mono" style={{color: score>=6?COLORS.green:score>=4?COLORS.yellow:COLORS.orange}}>
                                            match: {score}/8
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {co && (
                                    <button onClick={()=>{setTab("dossiers");setDossOpen(co.id);}}
                                      className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
                                      style={{background:`${COLORS.cyan}22`,color:COLORS.cyan,border:`1px solid ${COLORS.cyan}44`}}>
                                      <Building2 size={9} className="inline mr-1"/>Dossier
                                    </button>
                                  )}
                                  <button onClick={()=>upd(a.id,{lastContactAt:today()})}
                                    className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
                                    style={{background:`${COLORS.green}22`,color:COLORS.green,border:`1px solid ${COLORS.green}44`}}>
                                    <CheckCircle2 size={9} className="inline mr-1"/>Heard back
                                  </button>
                                  <button onClick={()=>{
                                    const q: AppQuestion = { id: uid(), question: "", tags: [co?.name||"?"] };
                                    updateCareer(s => ({ questions: [q, ...s.questions] }));
                                    setTab("qbank");
                                  }} className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
                                    style={{background:`${COLORS.pink}22`,color:COLORS.pink,border:`1px solid ${COLORS.pink}44`}}>
                                    <HelpCircle size={9} className="inline mr-1"/>+ Question
                                  </button>
                                  <button onClick={()=>del(a.id)} className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm ml-auto"
                                    style={{color:COLORS.red}}>Delete</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                    {byStage[col.id].length === 0 && <div className="text-[10px] text-center py-4" style={{color:"var(--cr-fgDim)"}}>—</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "qbank" && <QBank key="qb"/>}
        {tab === "dossiers" && <Dossiers key="ds" openId={dossOpen} setOpenId={setDossOpen}/>}
      </AnimatePresence>
    </div>
  );
}

function decisionScore(a: JobApplication): number | null {
  const m = a.decisionMatrix;
  if (!m) return null;
  let total = 0, wsum = 0;
  for (const dim of MATRIX) {
    const v = (m as any)[dim.key];
    if (typeof v === "number") { total += v * dim.weight; wsum += dim.weight; }
  }
  return wsum ? total / wsum : null;
}

function NumInput({ label, defaultValue, onCommit, color }: { label: string; defaultValue: number | string; onCommit: (v: number) => void; color: string }) {
  return (
    <label className="block">
      <div className="text-[8px] tracking-widest font-bold mb-0.5" style={{color:"var(--cr-fgMuted)"}}>{label}</div>
      <input type="number" defaultValue={defaultValue} onBlur={e=>onCommit(Number(e.target.value))}
        className="w-full bg-transparent text-[11px] p-1.5 rounded-sm outline-none font-bold"
        style={{border:`1px solid ${color}55`,color}}/>
    </label>
  );
}

// ---------- Question Bank ----------
function QBank() {
  const { career, updateCareer } = useStore();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [filter, setFilter] = useState("");

  const addQ = () => {
    if (!q.trim()) return;
    const item: AppQuestion = { id: uid(), question: q.trim(), tags: tag ? tag.split(",").map(s=>s.trim()).filter(Boolean) : [], answer: "" };
    updateCareer(s => ({ questions: [item, ...s.questions] }));
    setQ(""); setTag("");
  };
  const updQ = (id: string, patch: Partial<AppQuestion>) =>
    updateCareer(s => ({ questions: s.questions.map(x => x.id===id?{...x,...patch}:x) }));
  const delQ = (id: string) => updateCareer(s => ({ questions: s.questions.filter(x => x.id!==id) }));
  const toggleStar = (id: string) => {
    const item = career.questions.find(x=>x.id===id); if (!item) return;
    updQ(id, { frequency: (item.frequency||0) >= 3 ? 0 : (item.frequency||0)+1 });
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    career.questions.forEach(q => (q.tags||[]).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [career.questions]);

  const filtered = career.questions.filter(q => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return q.question.toLowerCase().includes(f) || (q.tags||[]).some(t => t.toLowerCase().includes(f));
  });

  const mastered = career.questions.filter(q => q.answer && q.answer.length > 20).length;

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total Q" value={career.questions.length} color={COLORS.pink}/>
        <Stat label="Answered" value={mastered} color={COLORS.green}/>
        <Stat label="Tags" value={allTags.length} color={COLORS.cyan}/>
      </div>

      <div className="rounded-sm p-3 flex flex-wrap gap-2 items-center hud-corner relative"
        style={{...card, borderColor: `${COLORS.pink}66`}}>
        <span className="c-tr"/><span className="c-bl"/>
        <HelpCircle size={14} style={{color:COLORS.pink}}/>
        <input value={q} onChange={e=>setQ(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&addQ()}
          placeholder="New question (e.g. Design a rate limiter)"
          className="flex-1 min-w-[220px] bg-transparent outline-none text-sm" style={{color:"var(--cr-fg)"}}/>
        <input value={tag} onChange={e=>setTag(e.target.value)} placeholder="tags (comma sep)"
          className="w-48 bg-transparent outline-none text-xs px-2 py-1 rounded-sm" style={inputStyle}/>
        <button onClick={addQ} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
          style={{background:COLORS.pink,color:"var(--cr-bg)"}}>ADD</button>
      </div>

      <div className="flex gap-1 flex-wrap items-center rounded-sm p-2" style={card}>
        <Search size={11} style={{color:"var(--cr-fgMuted)"}}/>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search..."
          className="flex-1 min-w-[150px] bg-transparent text-xs px-2 py-1 rounded-sm outline-none" style={inputStyle}/>
        <button onClick={()=>setFilter("")} className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
          style={{background:!filter?`${COLORS.cyan}33`:"var(--cr-card2)",color:!filter?COLORS.cyan:"var(--cr-fgMuted)"}}>ALL</button>
        {allTags.slice(0,12).map(t => (
          <button key={t} onClick={()=>setFilter(filter===t?"":t)}
            className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
            style={{background:filter===t?`${COLORS.cyan}33`:"var(--cr-card2)",color:filter===t?COLORS.cyan:"var(--cr-fgMuted)"}}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(q => (
          <QRow key={q.id} q={q} updQ={updQ} delQ={delQ} toggleStar={toggleStar}/>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-sm p-8 text-center text-xs tracking-wide hud-corner"
            style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
            <span className="c-tr"/><span className="c-bl"/>
            <p style={{color:"var(--cr-fgMuted)"}}>No questions yet. Capture every question they throw at you.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QRow({ q, updQ, delQ, toggleStar }: {
  q: AppQuestion; updQ: (id:string, p:Partial<AppQuestion>)=>void; delQ:(id:string)=>void;
  toggleStar:(id:string)=>void;
}) {
  const [open, setOpen] = useState(false);
  const stars = q.frequency || 0;
  const answered = q.answer && q.answer.length > 20;
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };
  return (
    <motion.div layout
      className="rounded-sm p-3 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${answered?`${COLORS.green}55`:`${COLORS.pink}55`}`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="flex items-start gap-2">
        <button onClick={()=>setOpen(o=>!o)} className="mt-0.5" style={{color:answered?COLORS.green:"var(--cr-fgMuted)"}}>
          {answered ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
        </button>
        <input value={q.question} onChange={e=>updQ(q.id,{question:e.target.value})}
          className="flex-1 bg-transparent text-sm font-semibold outline-none" style={{color:"var(--cr-fg)"}}/>
        <button onClick={()=>toggleStar(q.id)} className="flex gap-0.5 text-xs">
          {[1,2,3].map(n => <Star key={n} size={11} style={{color:n<=stars?COLORS.yellow:"var(--cr-fgDim)"}} fill={n<=stars?COLORS.yellow:"none"}/>)}
        </button>
        <button onClick={()=>delQ(q.id)} style={{color:COLORS.red}}><X size={12}/></button>
      </div>
      <div className="flex gap-1 flex-wrap mt-1.5 ml-6">
        {(q.tags||[]).map(t => (
          <span key={t} className="text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
            style={{background:`${COLORS.cyan}22`,color:COLORS.cyan,border:`1px solid ${COLORS.cyan}44`}}>{t}</span>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <textarea defaultValue={q.answer||""} onBlur={e=>updQ(q.id,{answer:e.target.value})}
              placeholder="Your answer / key points / STAR framework..." rows={4}
              className="w-full mt-2 bg-transparent text-[12px] p-2 rounded-sm outline-none resize-none"
              style={{...inputStyle,minHeight:80}}/>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Dossiers ----------
function Dossiers({ openId, setOpenId }: { openId: string | null; setOpenId: (id: string | null)=>void }) {
  const { career, updateCareer } = useStore();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) return;
    const d: CompanyDossier = { id: uid(), name: name.trim() };
    updateCareer(s => ({ companies: [d, ...s.companies] }));
    setName("");
  };
  const upd = (id: string, p: Partial<CompanyDossier>) =>
    updateCareer(s => ({ companies: s.companies.map(c => c.id===id?{...c,...p}:c) }));
  const del = (id: string) => {
    if (!confirm("Delete dossier?")) return;
    updateCareer(s => ({ companies: s.companies.filter(c => c.id!==id) }));
  };

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
      <div className="rounded-sm p-3 flex flex-wrap gap-2 items-center hud-corner relative"
        style={{...card, borderColor:`${COLORS.cyan}66`}}>
        <span className="c-tr"/><span className="c-bl"/>
        <Building2 size={14} style={{color:COLORS.cyan}}/>
        <input value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&add()}
          placeholder="New company (adds to research list)"
          className="flex-1 min-w-[220px] bg-transparent outline-none text-sm" style={{color:"var(--cr-fg)"}}/>
        <button onClick={add} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
          style={{background:COLORS.cyan,color:"var(--cr-bg)"}}>ADD</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {career.companies.map(c => {
          const open = openId === c.id;
          const apps = career.applications.filter(a => a.companyId === c.id);
          return (
            <motion.div key={c.id} layout
              className="rounded-sm p-3 cursor-pointer hud-corner relative"
              onClick={()=>setOpenId(open?null:c.id)}
              style={{...card, borderColor: open ? `${COLORS.cyan}88` : "var(--cr-borderSoft)"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <div className="flex items-center gap-2">
                <Building2 size={14} style={{color:COLORS.cyan}}/>
                <input value={c.name} onChange={e=>upd(c.id,{name:e.target.value})} onClick={e=>e.stopPropagation()}
                  className="flex-1 bg-transparent font-bold text-sm outline-none" style={{color:COLORS.cyan}}/>
                <span className="text-[9px] tracking-widest font-bold" style={{color:"var(--cr-fgMuted)"}}>{apps.length} app{apps.length===1?"":"s"}</span>
                <button onClick={e=>{e.stopPropagation();del(c.id);}} style={{color:COLORS.red}}><X size={12}/></button>
              </div>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                    onClick={e=>e.stopPropagation()} className="overflow-hidden mt-2 space-y-2">
                    <LabeledField label="Products" value={c.products||""} onChange={v=>upd(c.id,{products:v})}/>
                    <LabeledField label="Funding / stage" value={c.funding||""} onChange={v=>upd(c.id,{funding:v})}/>
                    <LabeledField label="Recent news" value={c.recentNews||""} onChange={v=>upd(c.id,{recentNews:v})} textarea/>
                    <LabeledField label="Competitors" value={c.competitors||""} onChange={v=>upd(c.id,{competitors:v})}/>
                    <LabeledField label="Culture notes" value={c.interviewNotes||""} onChange={v=>upd(c.id,{interviewNotes:v})} textarea/>
                    <LabeledField label="Pros" value={c.pros||""} onChange={v=>upd(c.id,{pros:v})} textarea/>
                    <LabeledField label="Cons" value={c.cons||""} onChange={v=>upd(c.id,{cons:v})} textarea/>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {career.companies.length === 0 && (
          <div className="md:col-span-2 rounded-sm p-8 text-center text-xs tracking-wide hud-corner"
            style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
            <span className="c-tr"/><span className="c-bl"/>
            <p style={{color:"var(--cr-fgMuted)"}}>No dossiers. Start researching companies you'd want to join.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LabeledField({ label, value, onChange, textarea }: { label: string; value: string; onChange:(v:string)=>void; textarea?:boolean }) {
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };
  return (
    <div>
      <div className="text-[9px] tracking-widest font-bold mb-1" style={{color:"var(--cr-fgMuted)"}}>{label.toUpperCase()}</div>
      {textarea ? (
        <textarea defaultValue={value} onBlur={e=>onChange(e.target.value)} rows={2}
          className="w-full bg-transparent text-[11px] p-2 rounded-sm outline-none resize-none" style={inputStyle}/>
      ) : (
        <input defaultValue={value} onBlur={e=>onChange(e.target.value)}
          className="w-full bg-transparent text-[11px] p-2 rounded-sm outline-none" style={inputStyle}/>
      )}
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


