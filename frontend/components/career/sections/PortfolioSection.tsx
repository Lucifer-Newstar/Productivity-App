"use client";

/**
 * PortfolioSection — achievements + project portfolio.
 * - Achievement vault: quick-add wins with category + icon + impact metric.
 * - Projects: title, role, tech stack, results, challenges, learnings, URL.
 * - Privacy toggle.
 * - Category filter chips.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trophy, Trash2, Link2, Eye, EyeOff, ExternalLink, Sparkles, Star } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { Achievement, AchievementCategory, PortfolioProject } from "../../../lib/careerTypes";

const CATS: { id: AchievementCategory; label: string; color: string }[] = [
  { id: "technical", label: "Technical", color: "#06b6d4" },
  { id: "leadership", label: "Leadership", color: "#d4af37" },
  { id: "sales", label: "Sales", color: "#a3e635" },
  { id: "product", label: "Product", color: "#ec4899" },
  { id: "process", label: "Process", color: "#8b5cf6" },
  { id: "personal", label: "Personal", color: "#f43f5e" },
  { id: "other", label: "Other", color: "#94a3b8" },
];

const ICONS = ["🏆","🚀","⭐","🎓","💡","🔥","🥇","📜","⚔️","🛡️","👑","🎯","💼","✨"];
const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

export default function PortfolioSection() {
  const isDark = useTheme().theme === "dark";
  const { career, updateCareer } = useStore();
  const [tab, setTab] = useState<"achievements"|"projects">("achievements");
  const [cat, setCat] = useState<AchievementCategory|"all">("all");
  const [addingA, setAddingA] = useState(false);
  const [addingP, setAddingP] = useState(false);
  const [aDraft, setADraft] = useState<Partial<Achievement>>({ title:"", category:"technical", date:today(), icon:"🏆" });
  const [pDraft, setPDraft] = useState<Partial<PortfolioProject>>({ title:"", role:"", summary:"", technologies:[], private:false });
  const [techInput, setTechInput] = useState("");

  const visibleAch = useMemo(() => career.achievements.filter(a => cat === "all" || a.category === cat), [career.achievements, cat]);
  const catCount = career.achievements.reduce((acc,a) => { acc[a.category] = (acc[a.category]||0)+1; return acc; }, {} as Record<string,number>);

  const addAch = () => {
    if (!aDraft.title?.trim()) return;
    const a: Achievement = {
      id: uid(), title: aDraft.title!, date: aDraft.date || today(),
      category: aDraft.category || "other", description: aDraft.description,
      impact: aDraft.impact, icon: aDraft.icon || "🏆", tags: aDraft.tags,
    };
    updateCareer(s => ({ achievements: [a, ...s.achievements] }));
    setADraft({ title:"", category:"technical", date:today(), icon:"🏆" });
    setAddingA(false);
  };

  const addProj = () => {
    if (!pDraft.title?.trim()) return;
    const p: PortfolioProject = {
      id: uid(), title: pDraft.title!, role: pDraft.role, summary: pDraft.summary,
      technologies: pDraft.technologies || [], results: pDraft.results, challenges: pDraft.challenges,
      learnings: pDraft.learnings, url: pDraft.url, repoUrl: pDraft.repoUrl, private: !!pDraft.private,
    };
    updateCareer(s => ({ projects: [p, ...s.projects] }));
    setPDraft({ title:"", role:"", summary:"", technologies:[], private:false });
    setTechInput(""); setAddingP(false);
  };

  const upP = (id: string, patch: Partial<PortfolioProject>) => updateCareer(s => ({ projects: s.projects.map(p => p.id===id ? { ...p, ...patch } : p) }));
  const delP = (id: string) => { if (confirm("Delete project?")) updateCareer(s => ({ projects: s.projects.filter(p => p.id!==id) })); };
  const delA = (id: string) => { if (confirm("Delete achievement?")) updateCareer(s => ({ achievements: s.achievements.filter(a => a.id!==id) })); };
  const addTech = (id: string | null) => {
    if (!techInput.trim()) return;
    if (id) {
      const p = career.projects.find(x=>x.id===id);
      if (p) upP(id, { technologies: [...(p.technologies||[]), techInput.trim()] });
    } else {
      setPDraft(d => ({ ...d, technologies: [...(d.technologies||[]), techInput.trim()] }));
    }
    setTechInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Achievements & Portfolio</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
            Every win stored — quantified, tagged, ready for your resume.
          </p>
        </div>
        <div className="flex gap-2">
          <TabBtn active={tab==="achievements"} color="#a3e635" onClick={()=>setTab("achievements")}>Vault ({career.achievements.length})</TabBtn>
          <TabBtn active={tab==="projects"} color="#d4af37" onClick={()=>setTab("projects")}>Projects ({career.projects.length})</TabBtn>
        </div>
      </div>

      {tab === "achievements" && (
        <>
          <div className="flex flex-wrap gap-2">
            <Chip active={cat==="all"} color="#cbd5e1" onClick={()=>setCat("all")}>All ({career.achievements.length})</Chip>
            {CATS.map(c => <Chip key={c.id} active={cat===c.id} color={c.color} onClick={()=>setCat(c.id)}>{c.label} ({catCount[c.id]||0})</Chip>)}
          </div>

          <button onClick={()=>setAddingA(v=>!v)}
            className="w-full emperor-title text-xs tracking-[0.25em] px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition hover:scale-[1.01]"
            style={{background:"linear-gradient(135deg,#4d7c0f,#365314)",color:"#d9f99d",border:"1.5px solid rgba(163,230,53,0.5)"}}>
            <Plus size={14}/> LOG A WIN
          </button>

          <AnimatePresence>
            {addingA && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="rounded-xl p-4 space-y-2"
                style={{background:isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)",border:"1px solid rgba(163,230,53,0.4)"}}>
                <div className="flex gap-2">
                  <input value={aDraft.title??""} onChange={e=>setADraft(d=>({...d,title:e.target.value}))} placeholder="What did you achieve?"
                    className="flex-1 bg-transparent px-3 py-2 rounded text-sm outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                  <input type="date" value={aDraft.date??today()} onChange={e=>setADraft(d=>({...d,date:e.target.value}))}
                    className="bg-transparent px-2 py-2 rounded text-xs outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                </div>
                <input value={aDraft.impact??""} onChange={e=>setADraft(d=>({...d,impact:e.target.value}))} placeholder="Quantified impact (e.g. reduced latency 40%)"
                  className="w-full bg-transparent px-3 py-2 rounded text-sm outline-none"
                  style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                <div className="flex flex-wrap gap-2 items-center">
                  <select value={aDraft.category} onChange={e=>setADraft(d=>({...d,category:e.target.value as AchievementCategory}))}
                    className="bg-transparent px-2 py-2 rounded text-xs outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}>
                    {CATS.map(c => <option key={c.id} value={c.id} style={{background:"#0a0709"}}>{c.label}</option>)}
                  </select>
                  <div className="flex gap-1">
                    {ICONS.map(i => (
                      <button key={i} onClick={()=>setADraft(d=>({...d,icon:i}))}
                        className={`w-8 h-8 rounded text-lg ${aDraft.icon===i?"ring-2":""}`}
                        style={{background: aDraft.icon===i ? "rgba(163,230,53,0.25)" : "rgba(255,255,255,0.04)"}}>{i}</button>
                    ))}
                  </div>
                  <button onClick={addAch} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg ml-auto" style={{background:"#4d7c0f",color:"white"}}>Save</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {visibleAch.length === 0 && !addingA && (
            <div className="rounded-2xl p-10 text-center" style={{background:"rgba(12,26,34,0.4)",border:"1px dashed rgba(163,230,53,0.25)"}}>
              <Trophy size={28} className="mx-auto mb-2" style={{color:"#a3e635"}}/>
              <p className="imperial-title tracking-widest text-sm" style={{color:"#d9f99d"}}>The vault is empty.</p>
              <p className="serif-body italic text-xs mt-1" style={{color:"#8b9eb0"}}>Every win counts — even the small ones.</p>
            </div>
          )}

          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px" style={{background:"linear-gradient(to bottom, rgba(163,230,53,0.5), rgba(212,175,55,0.3), transparent)"}}/>
            {visibleAch.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a => {
              const c = CATS.find(x=>x.id===a.category) || CATS[CATS.length-1];
              return (
                <motion.div key={a.id} layout
                  className="relative rounded-xl p-3 mb-2"
                  style={{background:isDark?"linear-gradient(145deg,rgba(12,26,34,0.7),rgba(10,20,24,0.5))":"rgba(255,248,228,0.9)",border:`1px solid ${c.color}44`}}>
                  <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full" style={{background:c.color,boxShadow:`0 0 8px ${c.color}`}}/>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{a.title}</h4>
                        <span className="text-[9px] emperor-title px-1.5 py-0.5 rounded" style={{color:c.color,background:`${c.color}18`}}>{c.label}</span>
                        <span className="text-[10px]" style={{color:"#6b7280"}}>{a.date}</span>
                      </div>
                      {a.impact && <p className="text-xs mt-1" style={{color:"#fde68a"}}>⚡ {a.impact}</p>}
                      {a.description && <p className="text-[11px] mt-0.5 serif-body italic" style={{color:"#8b9eb0"}}>{a.description}</p>}
                    </div>
                    <button onClick={()=>delA(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 self-start"><Trash2 size={11}/></button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {tab === "projects" && (
        <>
          <button onClick={()=>setAddingP(v=>!v)}
            className="w-full emperor-title text-xs tracking-[0.25em] px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black transition hover:scale-[1.01]"
            style={{background:"linear-gradient(135deg,#92400e,#78350f)",color:"#fde68a",border:"1.5px solid rgba(212,175,55,0.5)"}}>
            <Plus size={14}/> NEW PROJECT
          </button>

          <AnimatePresence>
            {addingP && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="rounded-xl p-4 space-y-2"
                style={{background:isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)",border:"1px solid rgba(212,175,55,0.4)"}}>
                <input value={pDraft.title??""} onChange={e=>setPDraft(d=>({...d,title:e.target.value}))} placeholder="Project title"
                  className="w-full bg-transparent px-3 py-2 rounded text-sm outline-none"
                  style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                <div className="grid md:grid-cols-2 gap-2">
                  <input value={pDraft.role??""} onChange={e=>setPDraft(d=>({...d,role:e.target.value}))} placeholder="Your role"
                    className="bg-transparent px-3 py-2 rounded text-sm outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                  <input value={pDraft.url??""} onChange={e=>setPDraft(d=>({...d,url:e.target.value}))} placeholder="Live URL"
                    className="bg-transparent px-3 py-2 rounded text-sm outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                </div>
                <textarea value={pDraft.summary??""} onChange={e=>setPDraft(d=>({...d,summary:e.target.value}))} placeholder="Summary" rows={2}
                  className="w-full bg-transparent px-3 py-2 rounded text-sm outline-none resize-none"
                  style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                <textarea value={pDraft.results??""} onChange={e=>setPDraft(d=>({...d,results:e.target.value}))} placeholder="Results (metrics & impact)" rows={2}
                  className="w-full bg-transparent px-3 py-2 rounded text-sm outline-none resize-none"
                  style={{border:"1px solid rgba(163,230,53,0.3)"}}/>
                <div className="flex gap-2">
                  <input value={techInput} onChange={e=>setTechInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTech(null);}}} placeholder="Add tech tag + Enter"
                    className="flex-1 bg-transparent px-3 py-2 rounded text-xs outline-none"
                    style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}/>
                  <button onClick={()=>addTech(null)} className="text-xs px-3 rounded" style={{background:"rgba(212,175,55,0.2)",color:"#d4af37"}}>+</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(pDraft.technologies||[]).map((t,i) => (
                    <span key={i} className="text-[10px] emperor-title px-2 py-0.5 rounded" style={{background:"rgba(6,182,212,0.15)",color:"#67e8f9"}}>{t} <button onClick={()=>setPDraft(d=>({...d,technologies:d.technologies?.filter((_,j)=>j!==i)}))}>×</button></span>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!pDraft.private} onChange={e=>setPDraft(d=>({...d,private:e.target.checked}))}/> Private (not shown in public portfolio)</label>
                <button onClick={addProj} className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg" style={{background:"#92400e",color:"white"}}>Save project</button>
              </motion.div>
            )}
          </AnimatePresence>

          {career.projects.length === 0 && !addingP && (
            <div className="rounded-2xl p-10 text-center" style={{background:"rgba(12,26,34,0.4)",border:"1px dashed rgba(212,175,55,0.25)"}}>
              <Star size={28} className="mx-auto mb-2" style={{color:"#d4af37"}}/>
              <p className="imperial-title tracking-widest text-sm" style={{color:"#fde68a"}}>No projects yet.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {career.projects.map(p => (
              <motion.div key={p.id} layout
                className="rounded-xl p-4 relative"
                style={{background:isDark?"linear-gradient(145deg,rgba(12,26,34,0.7),rgba(10,20,24,0.5))":"rgba(255,248,228,0.9)",border:`1px solid ${p.private?"rgba(107,114,128,0.4)":"rgba(212,175,55,0.4)"}`}}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm" style={{color:isDark?"#f3e9d2":"#1a0f0a"}}>{p.title}</h4>
                      {p.private && <span className="text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{color:"#94a3b8",background:"rgba(100,116,139,0.15)"}}><EyeOff size={9}/>PRIVATE</span>}
                      {p.url && <a href={p.url} target="_blank" rel="noopener" className="text-cyan-400"><ExternalLink size={11}/></a>}
                    </div>
                    {p.role && <p className="text-[11px] mt-0.5" style={{color:"#d4af37"}}>{p.role}</p>}
                  </div>
                  <button onClick={()=>upP(p.id,{private:!p.private})} className="p-1 rounded hover:bg-white/10 text-gray-400">{p.private?<EyeOff size={12}/>:<Eye size={12}/>}</button>
                  <button onClick={()=>delP(p.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400"><Trash2 size={12}/></button>
                </div>
                {p.summary && <p className="text-[11px] serif-body italic mt-2" style={{color:"#8b9eb0"}}>{p.summary}</p>}
                {p.results && <p className="text-xs mt-2" style={{color:"#a3e635"}}>⚡ {p.results}</p>}
                {p.technologies && p.technologies.length>0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.technologies.map((t,i) => <span key={i} className="text-[9px] emperor-title px-1.5 py-0.5 rounded" style={{background:"rgba(6,182,212,0.15)",color:"#67e8f9"}}>{t}</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TabBtn({active,color,onClick,children}:{active:boolean;color:string;onClick:()=>void;children:React.ReactNode}) {
  return (
    <button onClick={onClick}
      className="emperor-title text-[10px] md:text-xs tracking-widest px-3 py-2 rounded-lg transition"
      style={{background:active?`${color}25`:"rgba(12,26,34,0.5)",color:active?color:"#8b9eb0",border:`1px solid ${active?color+"88":"rgba(255,255,255,0.08)"}`}}>
      {children}
    </button>
  );
}

function Chip({active,color,onClick,children}:{active:boolean;color:string;onClick:()=>void;children:React.ReactNode}) {
  return (
    <button onClick={onClick}
      className="text-[10px] emperor-title tracking-wider px-2.5 py-1 rounded-lg transition"
      style={{background:active?`${color}25`:"rgba(12,26,34,0.4)",color:active?color:"#8b9eb0",border:`1px solid ${active?color+"88":"rgba(255,255,255,0.08)"}`}}>
      {children}
    </button>
  );
}
