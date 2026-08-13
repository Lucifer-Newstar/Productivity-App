"use client";

/**
 * JobsSection — application kanban + interview question bank + company dossiers.
 * Stages: researching → applied → phone-screen → tech-interview → onsite → offer → accepted / rejected / ghosted.
 * Ghosted timer: 14 days without update → auto-moved to "ghosted" bucket (visual only).
 * Tabs: PIPELINE / Q BANK / DOSSIERS.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Briefcase, Trash2, Ghost, Clock, Building2, HelpCircle, FileText,
  Search, Star, DollarSign, CheckCircle2, Circle, X,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { JobApplication, AppStage, AppQuestion, CompanyDossier } from "../../../lib/careerTypes";

type Tab = "pipeline" | "qbank" | "dossiers";

const STAGES: { id: AppStage; label: string; color: string }[] = [
  { id: "researching", label: "Researching", color: "#67e8f9" },
  { id: "applied", label: "Applied", color: "#06b6d4" },
  { id: "phone-screen", label: "Phone", color: "#8b5cf6" },
  { id: "tech-interview", label: "Tech", color: "#ec4899" },
  { id: "onsite", label: "Onsite", color: "#f59e0b" },
  { id: "offer", label: "Offer", color: "#a3e635" },
  { id: "rejected", label: "Rejected", color: "#ef4444" },
  { id: "ghosted", label: "Ghosted", color: "#64748b" },
];

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const DAY = 86400000;

export default function JobsSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [tab, setTab] = useState<Tab>("pipeline");
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dossOpen, setDossOpen] = useState<string | null>(null);

  // ---------- pipeline ----------
  const addApp = () => {
    if (!role.trim() || !company.trim()) return;
    // Reuse existing dossier if name matches, else create.
    const existing = career.companies.find(c => c.name.toLowerCase() === company.trim().toLowerCase());
    const co = existing || { id: uid(), name: company.trim() };
    const app: JobApplication = {
      id: uid(), role: role.trim(), companyId: co.id, appliedAt: today(), stage: "researching",
      recruiter: "", notes: "",
    };
    updateCareer(s => ({
      applications: [app, ...s.applications],
      companies: existing ? s.companies : [...s.companies, co],
    }));
    setRole(""); setCompany(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<JobApplication>) =>
    updateCareer(s => ({ applications: s.applications.map(a => a.id === id ? { ...a, ...patch } : a) }));
  const del = (id: string) => { if (confirm("Delete application?")) updateCareer(s => ({ applications: s.applications.filter(a => a.id !== id) })); };

  const byStage = useMemo(() => {
    const map: Record<AppStage, JobApplication[]> = {} as any;
    STAGES.forEach(s => map[s.id] = []);
    for (const a of career.applications) {
      const lastTs = a.lastContactAt ? new Date(a.lastContactAt).getTime() : new Date(a.appliedAt).getTime();
      const daysSince = (Date.now() - lastTs) / DAY;
      const autoGhost = !["rejected","accepted","ghosted","offer"].includes(a.stage) && daysSince > 14;
      const stage: AppStage = autoGhost ? "ghosted" : a.stage;
      (map[stage] || map.researching).push(a);
    }
    return map;
  }, [career.applications]);

  const total = career.applications.length;
  const offers = career.applications.filter(a => a.stage === "offer" || a.stage === "accepted").length;
  const ghosted = byStage.ghosted.length;
  const rate = total ? Math.round((career.applications.filter(a => ["onsite","offer","accepted"].includes(a.stage)).length/total)*100) : 0;
  const bestOffer = Math.max(0, ...career.applications.map(a => a.offerFinal || a.offerBase || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Job Campaign</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Pipeline control, question bank, intel — every angle covered.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl overflow-hidden" style={{border:"1px solid rgba(245,158,11,0.35)"}}>
            {(["pipeline","qbank","dossiers"] as Tab[]).map(t => (
              <button key={t} onClick={()=>setTab(t)}
                className="text-[10px] emperor-title tracking-widest px-3 py-2 transition"
                style={{background: tab===t ? "rgba(245,158,11,0.25)" : "transparent", color: tab===t ? "#fbbf24" : "#8b9eb0"}}>
                {t==="pipeline"?"PIPELINE":t==="qbank"?"Q BANK":"DOSSIERS"}
              </button>
            ))}
          </div>
          {tab === "pipeline" && (
            <button onClick={()=>setAdding(v=>!v)}
              className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
              style={{background:"linear-gradient(135deg,#b45309,#78350f)",color:"#fef3c7",border:"1.5px solid rgba(245,158,11,0.6)",boxShadow:"0 8px 20px -8px rgba(245,158,11,0.8)"}}>
              <Plus size={14}/> NEW APP
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Active" value={total} color="#f59e0b"/>
        <Stat label="Offers" value={offers} color="#a3e635"/>
        <Stat label="Ghosted" value={ghosted} color="#ef4444"/>
        <Stat label="Conv. → late" value={`${rate}%`} color="#06b6d4"/>
        <Stat label="Best offer" value={bestOffer ? `$${(bestOffer/1000).toFixed(0)}k` : "—"} color="#d4af37"/>
      </div>

      <AnimatePresence mode="wait">
        {tab === "pipeline" && (
          <motion.div key="pipe" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-4">
            {adding && (
              <div className="rounded-xl p-4 flex flex-wrap gap-2 items-center"
                style={{background:isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)",border:"1px solid rgba(245,158,11,0.4)"}}>
                <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Senior SRE)"
                  className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
                  style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`,color:isDark?"#f3e9d2":"#1a0f0a"}}/>
                <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company"
                  className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
                  style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`,color:isDark?"#f3e9d2":"#1a0f0a"}}/>
                <button onClick={addApp} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg" style={{background:"#b45309",color:"white"}}>Add</button>
                <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2 text-gray-400">Cancel</button>
              </div>
            )}

            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
              {STAGES.map(col => (
                <div key={col.id} className="shrink-0 w-64 md:w-72">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] emperor-title tracking-widest" style={{color:col.color}}>{col.label.toUpperCase()}</span>
                    <span className="text-[10px] w-5 h-5 rounded-full flex items-center justify-center" style={{background:`${col.color}22`,color:col.color}}>{byStage[col.id].length}</span>
                  </div>
                  <div className="space-y-2 rounded-xl p-2 min-h-[100px]"
                    style={{background:isDark?"rgba(12,26,34,0.4)":"rgba(0,0,0,0.04)",border:`1px solid ${col.color}22`,minHeight:120}}>
                    {byStage[col.id].map(a => {
                      const open = a.id === openId;
                      const co = career.companies.find(c=>c.id===a.companyId);
                      const lastTs = a.lastContactAt ? new Date(a.lastContactAt).getTime() : new Date(a.appliedAt).getTime();
                      const daysSince = Math.floor((Date.now() - lastTs)/DAY);
                      return (
                        <motion.div key={a.id} layout
                          className="rounded-lg p-2.5 cursor-pointer relative"
                          onClick={()=>setOpenId(open?null:a.id)}
                          style={{background:isDark?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.9)",border:`1px solid ${col.color}55`}}>
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{a.role}</div>
                              <div className="text-[11px] flex items-center gap-1" style={{color:"#8b9eb0"}}>
                                <Building2 size={10}/>{co?.name || "—"}
                              </div>
                            </div>
                            {a.offerFinal || a.offerBase ? (
                              <div className="text-[10px] font-black shrink-0" style={{color:"#a3e635"}}>
                                ${(((a.offerFinal||a.offerBase)||0)/1000).toFixed(0)}k
                              </div>
                            ) : null}
                          </div>
                          <div className="text-[10px] flex items-center gap-2 mt-1" style={{color:"#6b7280"}}>
                            <span className="flex items-center gap-0.5"><Clock size={9}/>{a.appliedAt} · {daysSince}d</span>
                            {col.id === "ghosted" && <span className="flex items-center gap-0.5 text-red-400"><Ghost size={9}/>GHOST</span>}
                            {a.vibeScore != null && <span className="flex items-center gap-0.5" style={{color:"#fbbf24"}}><Star size={9} fill="#fbbf24"/>{a.vibeScore}/5</span>}
                          </div>
                          <AnimatePresence>
                            {open && (
                              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                                onClick={e=>e.stopPropagation()} className="overflow-hidden mt-2 pt-2 border-t" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                                <div className="grid grid-cols-4 gap-1 mb-2">
                                  {STAGES.filter(s => s.id!=="accepted").map(s => (
                                    <button key={s.id} onClick={()=>upd(a.id,{stage:s.id,lastContactAt:s.id==="ghosted"?a.lastContactAt:today()})}
                                      className="text-[9px] emperor-title px-1 py-1 rounded"
                                      style={{background:a.stage===s.id?`${s.color}33`:"rgba(255,255,255,0.04)",color:s.color,border:`1px solid ${a.stage===s.id?s.color+"88":"transparent"}`}}>
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-1 mb-2">
                                  <input defaultValue={a.recruiter||""} onBlur={e=>upd(a.id,{recruiter:e.target.value})} placeholder="Recruiter"
                                    className="bg-transparent text-[11px] p-1.5 rounded outline-none"
                                    style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                                  <div className="flex items-center gap-1 text-[10px] px-1.5 rounded" style={{border:"1px solid rgba(251,191,36,0.3)"}}>
                                    <Star size={10} style={{color:"#fbbf24"}}/>
                                    {[1,2,3,4,5].map(n=>(
                                      <button key={n} onClick={()=>upd(a.id,{vibeScore:n})}
                                        style={{color: (a.vibeScore||0)>=n?"#fbbf24":"#3f3f46"}}>★</button>
                                    ))}
                                  </div>
                                </div>
                                <textarea defaultValue={a.notes??""} onBlur={e=>upd(a.id,{notes:e.target.value})} placeholder="Notes / prep..." rows={2}
                                  className="w-full bg-transparent text-[11px] p-1.5 rounded outline-none resize-none"
                                  style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                                <div className="grid grid-cols-3 gap-1 mt-1">
                                  <input type="number" defaultValue={a.offerBase||""} onBlur={e=>upd(a.id,{offerBase:Number(e.target.value)||undefined})} placeholder="Base"
                                    className="bg-transparent text-[11px] p-1.5 rounded outline-none" style={{border:"1px solid rgba(163,230,53,0.3)"}}/>
                                  <input type="number" defaultValue={a.offerBonus||""} onBlur={e=>upd(a.id,{offerBonus:Number(e.target.value)||undefined})} placeholder="Bonus"
                                    className="bg-transparent text-[11px] p-1.5 rounded outline-none" style={{border:"1px solid rgba(163,230,53,0.3)"}}/>
                                  <input type="number" defaultValue={a.offerFinal||""} onBlur={e=>upd(a.id,{offerFinal:Number(e.target.value)||undefined})} placeholder="Final TC"
                                    className="bg-transparent text-[11px] p-1.5 rounded outline-none" style={{border:"1px solid rgba(163,230,53,0.5)"}}/>
                                </div>
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {co && (
                                    <button onClick={()=>{setTab("dossiers");setDossOpen(co.id);}}
                                      className="text-[9px] emperor-title px-2 py-1 rounded" style={{background:"rgba(103,232,249,0.15)",color:"#67e8f9"}}>
                                      <Building2 size={9} className="inline mr-1"/>Dossier
                                    </button>
                                  )}
                                  <button onClick={()=>upd(a.id,{lastContactAt:today()})} className="text-[9px] emperor-title px-2 py-1 rounded" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>Heard back</button>
                                  <button onClick={()=>{
                                    const q: AppQuestion = { id: uid(), question: "", tags: [co?.name||"?"] };
                                    updateCareer(s => ({ questions: [q, ...s.questions] }));
                                    setTab("qbank");
                                  }} className="text-[9px] emperor-title px-2 py-1 rounded" style={{background:"rgba(236,72,153,0.15)",color:"#f472b6"}}>+ Question</button>
                                  <button onClick={()=>del(a.id)} className="text-[9px] emperor-title px-2 py-1 rounded text-red-400 ml-auto">Delete</button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                    {byStage[col.id].length === 0 && <div className="text-[10px] text-center py-4" style={{color:"#6b7280"}}>—</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "qbank" && <QBank key="qb" isDark={isDark} openApp={id=>{setTab("pipeline");setOpenId(id);}}/>}
        {tab === "dossiers" && <Dossiers key="ds" isDark={isDark} openId={dossOpen} setOpenId={setDossOpen}/>}
      </AnimatePresence>
    </div>
  );
}

// ---------- Question Bank ----------
function QBank({ isDark, openApp }: { isDark: boolean; openApp: (id: string)=>void }) {
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

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Q" value={career.questions.length} color="#ec4899"/>
        <Stat label="Answered" value={mastered} color="#a3e635"/>
        <Stat label="Tags" value={allTags.length} color="#06b6d4"/>
      </div>

      <div className="rounded-xl p-3 flex flex-wrap gap-2 items-center"
        style={{background:isDark?"rgba(12,26,34,0.6)":"rgba(255,248,228,0.9)",border:"1px solid rgba(236,72,153,0.35)"}}>
        <HelpCircle size={14} style={{color:"#f472b6"}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="New question (e.g. Design a rate limiter)"
          className="flex-1 min-w-[220px] bg-transparent outline-none text-sm"
          style={{color:isDark?"#f3e9d2":"#1a0f0a"}}/>
        <input value={tag} onChange={e=>setTag(e.target.value)} placeholder="tags (comma sep)"
          className="w-48 bg-transparent outline-none text-xs px-2 py-1 rounded"
          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
        <button onClick={addQ} className="emperor-title text-[10px] tracking-widest px-3 py-1.5 rounded"
          style={{background:"#be185d",color:"#fce7f3"}}>ADD</button>
      </div>

      <div className="flex gap-1 flex-wrap items-center">
        <Search size={11} style={{color:"#6b7280"}}/>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search..."
          className="flex-1 min-w-[150px] bg-transparent text-xs px-2 py-1 rounded outline-none"
          style={{border:"1px solid rgba(255,255,255,0.08)"}}/>
        <button onClick={()=>setFilter("")} className="text-[9px] emperor-title tracking-widest px-2 py-1 rounded"
          style={{background:!filter?"rgba(6,182,212,0.25)":"rgba(255,255,255,0.04)",color:!filter?"#67e8f9":"#8b9eb0"}}>ALL</button>
        {allTags.slice(0,12).map(t => (
          <button key={t} onClick={()=>setFilter(filter===t?"":t)}
            className="text-[9px] emperor-title tracking-widest px-2 py-1 rounded"
            style={{background:filter===t?"rgba(6,182,212,0.25)":"rgba(255,255,255,0.04)",color:filter===t?"#67e8f9":"#8b9eb0"}}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(q => (
          <QRow key={q.id} q={q} updQ={updQ} delQ={delQ} toggleStar={toggleStar} openApp={openApp}/>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl p-8 text-center text-xs italic serif-body" style={{color:"#6b7280",border:"1px dashed rgba(236,72,153,0.25)"}}>
            No questions yet. Capture every question they throw at you.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QRow({ q, updQ, delQ, toggleStar, openApp }: {
  q: AppQuestion; updQ: (id:string, p:Partial<AppQuestion>)=>void; delQ:(id:string)=>void;
  toggleStar:(id:string)=>void; openApp:(id:string)=>void;
}) {
  const [open, setOpen] = useState(false);
  const stars = q.frequency || 0;
  const answered = q.answer && q.answer.length > 20;
  return (
    <motion.div layout
      className="rounded-xl p-3"
      style={{background:"rgba(12,26,34,0.55)",border:`1px solid ${answered?"rgba(163,230,53,0.25)":"rgba(236,72,153,0.25)"}`}}>
      <div className="flex items-start gap-2">
        <button onClick={()=>setOpen(o=>!o)} className="mt-0.5" style={{color:answered?"#a3e635":"#6b7280"}}>
          {answered ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
        </button>
        <input value={q.question} onChange={e=>updQ(q.id,{question:e.target.value})}
          className="flex-1 bg-transparent text-sm font-semibold outline-none"
          style={{color: answered?"#d1fae5":"#f3e9d2"}}/>
        <button onClick={()=>toggleStar(q.id)} className="flex gap-0.5 text-xs">
          {[1,2,3].map(n => <Star key={n} size={11} style={{color: n<=stars?"#fbbf24":"#3f3f46"}} fill={n<=stars?"#fbbf24":"none"}/>)}
        </button>
        <button onClick={()=>delQ(q.id)} className="text-red-400 p-1"><X size={12}/></button>
      </div>
      <div className="flex gap-1 flex-wrap mt-1.5 ml-6">
        {(q.tags||[]).map(t => (
          <span key={t} className="text-[9px] emperor-title tracking-widest px-1.5 py-0.5 rounded"
            style={{background:"rgba(6,182,212,0.12)",color:"#67e8f9"}}>{t}</span>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <textarea defaultValue={q.answer||""} onBlur={e=>updQ(q.id,{answer:e.target.value})}
              placeholder="Your answer / key points / STAR framework..." rows={4}
              className="w-full mt-2 bg-transparent text-[12px] p-2 rounded outline-none resize-none serif-body"
              style={{border:"1px solid rgba(163,230,53,0.2)",color:"#c4cfd9",minHeight:80}}/>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Dossiers ----------
function Dossiers({ isDark, openId, setOpenId }: { isDark: boolean; openId: string | null; setOpenId: (id: string | null)=>void }) {
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
  const del = (id: string) => { if (confirm("Delete dossier?")) updateCareer(s => ({ companies: s.companies.filter(c => c.id!==id) })); };

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="space-y-3">
      <div className="rounded-xl p-3 flex flex-wrap gap-2 items-center"
        style={{background:isDark?"rgba(12,26,34,0.6)":"rgba(255,248,228,0.9)",border:"1px solid rgba(103,232,249,0.35)"}}>
        <Building2 size={14} style={{color:"#67e8f9"}}/>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="New company (adds to research list)"
          className="flex-1 min-w-[220px] bg-transparent outline-none text-sm" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}/>
        <button onClick={add} className="emperor-title text-[10px] tracking-widest px-3 py-1.5 rounded"
          style={{background:"#0e7490",color:"#cffafe"}}>ADD</button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {career.companies.map(c => {
          const open = openId === c.id;
          const apps = career.applications.filter(a => a.companyId === c.id);
          return (
            <motion.div key={c.id} layout
              className="rounded-xl p-3 cursor-pointer"
              onClick={()=>setOpenId(open?null:c.id)}
              style={{background:"rgba(12,26,34,0.55)",border:`1px solid ${open?"rgba(103,232,249,0.5)":"rgba(103,232,249,0.18)"}`}}>
              <div className="flex items-center gap-2">
                <Building2 size={14} style={{color:"#67e8f9"}}/>
                <input value={c.name} onChange={e=>upd(c.id,{name:e.target.value})} onClick={e=>e.stopPropagation()}
                  className="flex-1 bg-transparent font-bold text-sm outline-none" style={{color:"#67e8f9"}}/>
                <span className="text-[9px] emperor-title" style={{color:"#8b9eb0"}}>{apps.length} app{apps.length===1?"":"s"}</span>
                <button onClick={e=>{e.stopPropagation();del(c.id);}} className="text-red-400 p-1"><X size={12}/></button>
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
          <div className="md:col-span-2 rounded-xl p-8 text-center text-xs italic serif-body"
            style={{color:"#6b7280",border:"1px dashed rgba(103,232,249,0.25)"}}>
            No dossiers. Start researching companies you'd want to join.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LabeledField({ label, value, onChange, textarea }: { label: string; value: string; onChange:(v:string)=>void; textarea?:boolean }) {
  return (
    <div>
      <div className="text-[9px] emperor-title tracking-widest mb-1" style={{color:"#8b9eb0"}}>{label.toUpperCase()}</div>
      {textarea ? (
        <textarea defaultValue={value} onBlur={e=>onChange(e.target.value)} rows={2}
          className="w-full bg-transparent text-[11px] p-2 rounded outline-none resize-none"
          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
      ) : (
        <input defaultValue={value} onBlur={e=>onChange(e.target.value)}
          className="w-full bg-transparent text-[11px] p-2 rounded outline-none"
          style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
      )}
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
