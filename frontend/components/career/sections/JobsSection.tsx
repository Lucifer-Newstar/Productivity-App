"use client";

/**
 * JobsSection — application kanban + quick tracking.
 * Stages: researching → applied → phone-screen → tech-interview → onsite → offer → accepted / rejected / ghosted.
 * Ghosted timer: 14 days without update → red.
 * Simple add/edit, drag-to-move via click (MVP — no dnd lib needed).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Briefcase, Trash2, Ghost, TrendingUp, Clock, Building2, Star } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { JobApplication, AppStage } from "../../../lib/careerTypes";

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

export default function JobsSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const addApp = () => {
    if (!role.trim() || !company.trim()) return;
    const app: JobApplication = {
      id: uid(), role: role.trim(), appliedAt: today(), stage: "researching", recruiter:"", notes:"",
    };
    const coId = uid();
    const dossier = { id: coId, name: company.trim() };
    updateCareer(s => ({
      applications: [app, ...s.applications],
      companies: [...s.companies, dossier],
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
      const ghosted = a.lastContactAt ? (Date.now() - new Date(a.lastContactAt).getTime() > 14*86400000) : (Date.now() - new Date(a.appliedAt).getTime() > 14*86400000);
      const stage: AppStage = (a.stage === "rejected" || a.stage === "accepted" || a.stage === "ghosted" || a.stage === "offer")
        ? a.stage
        : (ghosted && ["applied","phone-screen","tech-interview","onsite"].includes(a.stage)) ? "ghosted" : a.stage;
      (map[stage] || map.researching).push(a);
    }
    return map;
  }, [career.applications]);

  const total = career.applications.length;
  const offers = career.applications.filter(a => a.stage === "offer").length;
  const ghosted = career.applications.filter(a => byStage.ghosted.includes(a)).length;
  const rate = total ? Math.round((career.applications.filter(a => ["onsite","offer","accepted"].includes(a.stage)).length/total)*100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Job Campaign</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>Pipeline control — every application tracked, every ghost visible.</p>
        </div>
        <button onClick={()=>setAdding(v=>!v)}
          className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
          style={{background:"linear-gradient(135deg,#b45309,#78350f)",color:"#fef3c7",border:"1.5px solid rgba(245,158,11,0.6)",boxShadow:"0 8px 20px -8px rgba(245,158,11,0.8)"}}>
          <Plus size={14}/> NEW APP
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Active" value={total} color="#f59e0b"/>
        <Stat label="Offers" value={offers} color="#a3e635"/>
        <Stat label="Ghosted" value={ghosted} color="#ef4444"/>
        <Stat label="Conv. → late" value={`${rate}%`} color="#06b6d4"/>
      </div>

      {adding && (
        <div className="rounded-xl p-4 flex flex-wrap gap-2 items-center"
          style={{background:isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)",border:"1px solid rgba(245,158,11,0.4)"}}>
          <input value={role} onChange={e=>setRole(e.target.value)} placeholder="Role (e.g. Senior SRE)"
            className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
            style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
          <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company"
            className="flex-1 min-w-[180px] bg-transparent outline-none text-sm px-3 py-2 rounded-lg"
            style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
          <button onClick={addApp} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg" style={{background:"#b45309",color:"white"}}>Add</button>
          <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2 text-gray-400">Cancel</button>
        </div>
      )}

      {/* Kanban board */}
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
                return (
                  <motion.div key={a.id} layout
                    className="rounded-lg p-2.5 cursor-pointer relative"
                    onClick={()=>setOpenId(open?null:a.id)}
                    style={{background:isDark?"rgba(0,0,0,0.35)":"rgba(255,255,255,0.9)",border:`1px solid ${col.color}55`}}>
                    <div className="text-sm font-bold" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{a.role}</div>
                    <div className="text-[11px] flex items-center gap-1" style={{color:"#8b9eb0"}}>
                      <Building2 size={10}/>{a.companyId ? career.companies.find(c=>c.id===a.companyId)?.name : ""}
                    </div>
                    <div className="text-[10px] flex items-center gap-2 mt-1" style={{color:"#6b7280"}}>
                      <span className="flex items-center gap-0.5"><Clock size={9}/>{a.appliedAt}</span>
                      {col.id === "ghosted" && <span className="flex items-center gap-0.5 text-red-400"><Ghost size={9}/>GHOST</span>}
                    </div>
                    <AnimatePresence>
                      {open && (
                        <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                          onClick={e=>e.stopPropagation()} className="overflow-hidden mt-2 pt-2 border-t" style={{borderColor:"rgba(255,255,255,0.08)"}}>
                          <div className="grid grid-cols-2 gap-1 mb-2">
                            {STAGES.filter(s => !["accepted"].includes(s.id)).map(s => (
                              <button key={s.id} onClick={()=>upd(a.id,{stage:s.id,lastContactAt:today()})}
                                className="text-[9px] emperor-title px-1.5 py-1 rounded"
                                style={{background:a.stage===s.id?`${s.color}33`:"rgba(255,255,255,0.04)",color:s.color,border:`1px solid ${a.stage===s.id?s.color+"88":"transparent"}`}}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                          <textarea defaultValue={a.notes??""} onBlur={e=>upd(a.id,{notes:e.target.value})} placeholder="Notes / prep..." rows={2}
                            className="w-full bg-transparent text-[11px] p-1.5 rounded outline-none resize-none"
                            style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
                          <input type="number" defaultValue={a.offerBase||""} onBlur={e=>upd(a.id,{offerBase:Number(e.target.value)||undefined})} placeholder="Base salary offer"
                            className="w-full mt-1 bg-transparent text-[11px] p-1.5 rounded outline-none"
                            style={{border:"1px solid rgba(163,230,53,0.3)"}}/>
                          <div className="flex gap-1 mt-1">
                            <button onClick={()=>upd(a.id,{lastContactAt:today()})} className="text-[9px] emperor-title px-2 py-1 rounded" style={{background:"rgba(103,232,249,0.15)",color:"#67e8f9"}}>Heard back</button>
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
