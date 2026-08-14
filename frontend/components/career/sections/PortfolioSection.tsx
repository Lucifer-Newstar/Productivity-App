"use client";

/**
 * PortfolioSection — HUD-themed achievements vault, projects, resume bullets, ATS scanner, testimonials.
 * Primary accent: yellow (#facc15) per CAREER_NAV color map.
 * Uses --cr-* CSS vars so blueprint light mode auto-themes via [data-lt] override.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trophy, Trash2, ExternalLink, Eye, EyeOff, Sparkles, Star, Terminal, Copy, CheckCircle2, Target } from "lucide-react";
import { useStore } from "../../../lib/store";
import type { Achievement, AchievementCategory, PortfolioProject, ResumeBullet, Testimonial } from "../../../lib/careerTypes";

// HUD palette — portfolio = yellow primary
const YELLOW = "var(--cr-yellow,#facc15)";
const CYAN = "var(--cr-accent)";
const VIOLET = "var(--cr-violet,#a78bfa)";
const PINK = "var(--cr-pink,#f472b6)";
const GREEN = "var(--cr-accent3)";
const ORANGE = "var(--cr-accent2)";
const RED = "var(--cr-red,#f87171)";
const MUTED = "var(--cr-fgMuted)";
const CARD = "var(--cr-card)";
const CARD2 = "var(--cr-card2)";
const BORDER = "var(--cr-border)";
const BORDER_SOFT = "var(--cr-borderSoft)";
const FG = "var(--cr-fg)";

const CATS: { id: AchievementCategory; label: string; color: string; hex: string }[] = [
  { id: "technical",  label: "TECHNICAL",  color: "var(--cr-accent)",   hex: "#22d3ee" },
  { id: "leadership", label: "LEADERSHIP", color: YELLOW,               hex: "#facc15" },
  { id: "sales",      label: "SALES",      color: GREEN,                hex: "#34d399" },
  { id: "product",    label: "PRODUCT",    color: PINK,                 hex: "#f472b6" },
  { id: "process",    label: "PROCESS",    color: VIOLET,               hex: "#a78bfa" },
  { id: "personal",   label: "PERSONAL",   color: ORANGE,               hex: "#fb923c" },
  { id: "other",      label: "OTHER",      color: MUTED,                hex: "#94a3b8" },
];

const ICONS = ["🏆","🚀","⭐","🎓","💡","🔥","🥇","📜","⚔️","🛡️","👑","🎯","💼","✨"];
const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

// HUD corner bracket
function HudCorner({ color = YELLOW }: { color?: string }) {
  return (
    <>
      <span className="pointer-events-none absolute top-0 left-0 w-3 h-3" style={{ borderTop:`1.5px solid ${color}`, borderLeft:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute top-0 right-0 w-3 h-3" style={{ borderTop:`1.5px solid ${color}`, borderRight:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3" style={{ borderBottom:`1.5px solid ${color}`, borderLeft:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3" style={{ borderBottom:`1.5px solid ${color}`, borderRight:`1.5px solid ${color}` }}/>
    </>
  );
}

export default function PortfolioSection() {
  const { career, updateCareer } = useStore();
  const [tab, setTab] = useState<"achievements"|"projects"|"bullets"|"testimonials">("achievements");
  const [cat, setCat] = useState<AchievementCategory|"all">("all");
  const [addingA, setAddingA] = useState(false);
  const [addingP, setAddingP] = useState(false);
  const [bulletDraft, setBulletDraft] = useState("");
  const [bulletTags, setBulletTags] = useState("");
  const [copiedId, setCopiedId] = useState<string|null>(null);
  const [testDraft, setTestDraft] = useState<Partial<Testimonial>>({ from:"", role:"", quote:"" });
  const [atsKeywords, setAtsKeywords] = useState("");
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
  const upB = (id: string, patch: Partial<ResumeBullet>) => updateCareer(s => ({ bullets: s.bullets.map(b => b.id===id ? { ...b, ...patch } : b) }));
  const delB = (id: string) => updateCareer(s => ({ bullets: s.bullets.filter(b => b.id!==id) }));
  const addB = () => {
    if (!bulletDraft.trim()) return;
    const b: ResumeBullet = {
      id: uid(), text: bulletDraft.trim(),
      tags: bulletTags ? bulletTags.split(",").map(s=>s.trim()).filter(Boolean) : [],
    };
    updateCareer(s => ({ bullets: [b, ...s.bullets] }));
    setBulletDraft(""); setBulletTags("");
  };
  const addT = () => {
    if (!testDraft.from?.trim() || !testDraft.quote?.trim()) return;
    const t: Testimonial = { id: uid(), from: testDraft.from!.trim(), role: testDraft.role, quote: testDraft.quote!.trim(), date: today() };
    updateCareer(s => ({ testimonials: [t, ...s.testimonials] }));
    setTestDraft({ from:"", role:"", quote:"" });
  };
  const delT = (id: string) => updateCareer(s => ({ testimonials: s.testimonials.filter(t => t.id!==id) }));

  const copyBullet = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    setCopiedId(id);
    setTimeout(()=>setCopiedId(null), 1200);
  };

  // ATS scorer
  const atsScore = useMemo(() => {
    const kws = atsKeywords.split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
    if (kws.length === 0) return { score: 0, hits: 0, total: 0, miss: [] as string[] };
    const blob = [
      ...career.bullets.map(b => b.text + " " + (b.tags||[]).join(" ")),
      ...career.achievements.map(a => a.title + " " + (a.description||"") + " " + (a.impact||"")),
      ...career.projects.map(p => [p.title,p.role,p.summary,p.results,p.challenges,p.learnings,...(p.technologies||[])].filter(Boolean).join(" ")),
    ].join(" ").toLowerCase();
    const hits = kws.filter(k => blob.includes(k));
    const miss = kws.filter(k => !blob.includes(k));
    return { score: Math.round((hits.length/kws.length)*100), hits: hits.length, total: kws.length, miss };
  }, [atsKeywords, career.bullets, career.achievements, career.projects]);

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

  const inputStyle = { background: "transparent", border: `1px solid ${BORDER_SOFT}`, color: FG } as React.CSSProperties;
  const cardStyle = { background: CARD, border: `1px solid ${BORDER}` } as React.CSSProperties;

  const TABS: { id: typeof tab; label: string; count: number; accent: string; icon: React.ReactNode }[] = [
    { id: "achievements", label: "VAULT",       count: career.achievements.length, accent: YELLOW,  icon: <Trophy size={11}/> },
    { id: "projects",     label: "PROJECTS",    count: career.projects.length,     accent: CYAN,    icon: <Star size={11}/> },
    { id: "bullets",      label: "BULLETS",     count: career.bullets.length,      accent: VIOLET,  icon: <Terminal size={11}/> },
    { id: "testimonials", label: "ENDORSEMENTS",count: career.testimonials.length, accent: PINK,    icon: <Sparkles size={11}/> },
  ];

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="relative rounded-lg p-4" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
        <HudCorner color={YELLOW}/>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.3em] font-mono" style={{ color: YELLOW }}>SECTOR::06</span>
              <span className="text-[10px] font-mono" style={{ color: MUTED }}>// portfolio.vault</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono tracking-tight flex items-center gap-2" style={{ color: FG }}>
              <Trophy size={20} style={{ color: YELLOW }}/>
              ACHIEVEMENTS <span style={{ color: YELLOW }}>&amp;</span> PORTFOLIO
            </h2>
            <p className="text-[11px] font-mono mt-1" style={{ color: MUTED }}>
              <span style={{ color: CYAN }}>&gt;</span> every win logged · quantified · tagged · resume-ready
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: MUTED }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }}/>
            <span>SYNC::LOCAL</span>
          </div>
        </div>
      </div>

      {/* TABS — HUD terminal style */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="relative font-mono text-[10px] md:text-[11px] tracking-[0.2em] px-3 py-2 rounded transition-all"
              style={{
                background: active ? t.accent : CARD,
                color: active ? "#000" : MUTED,
                border: `1px solid ${active ? t.accent : BORDER_SOFT}`,
                boxShadow: active ? `0 0 12px ${t.accent}55` : "none",
              }}>
              <span className="inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
                <span className="font-bold px-1.5 py-0.5 rounded text-[9px]"
                  style={{ background: active ? "rgba(0,0,0,0.25)" : `${t.accent}22`, color: active ? "#fff" : t.accent }}>
                  {String(t.count).padStart(2,"0")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ============ ACHIEVEMENTS / VAULT ============ */}
      {tab === "achievements" && (
        <>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-1.5">
            <HudChip active={cat==="all"} color={MUTED} onClick={()=>setCat("all")}
              label="ALL" count={career.achievements.length}/>
            {CATS.map(c => (
              <HudChip key={c.id} active={cat===c.id} color={c.color} onClick={()=>setCat(c.id)}
                label={c.label} count={catCount[c.id]||0}/>
            ))}
          </div>

          {/* Add button */}
          <HudAddBtn open={addingA} onClick={()=>setAddingA(v=>!v)} color={YELLOW} label="LOG A WIN" icon={<Plus size={13}/>}/>

          <AnimatePresence>
            {addingA && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="relative rounded-lg p-4 space-y-2" style={{ background: CARD, border: `1px solid ${YELLOW}66` }}>
                <HudCorner color={YELLOW}/>
                <div className="text-[9px] font-mono tracking-[0.25em] mb-1" style={{ color: YELLOW }}>// new_achievement.input</div>
                <div className="flex gap-2 flex-col md:flex-row">
                  <input value={aDraft.title??""} onChange={e=>setADraft(d=>({...d,title:e.target.value}))} placeholder="What did you achieve?"
                    className="flex-1 px-3 py-2 rounded text-sm font-mono outline-none" style={inputStyle}/>
                  <input type="date" value={aDraft.date??today()} onChange={e=>setADraft(d=>({...d,date:e.target.value}))}
                    className="px-2 py-2 rounded text-xs font-mono outline-none" style={inputStyle}/>
                </div>
                <input value={aDraft.impact??""} onChange={e=>setADraft(d=>({...d,impact:e.target.value}))} placeholder="Quantified impact (e.g. reduced latency 40%)"
                  className="w-full px-3 py-2 rounded text-sm font-mono outline-none"
                  style={{ ...inputStyle, border: `1px solid ${GREEN}55` }}/>
                <input value={aDraft.description??""} onChange={e=>setADraft(d=>({...d,description:e.target.value}))} placeholder="Notes / context (optional)"
                  className="w-full px-3 py-2 rounded text-xs font-mono outline-none" style={inputStyle}/>
                <div className="flex flex-wrap gap-2 items-center">
                  <select value={aDraft.category} onChange={e=>setADraft(d=>({...d,category:e.target.value as AchievementCategory}))}
                    className="px-2 py-2 rounded text-xs font-mono outline-none cursor-pointer" style={inputStyle}>
                    {CATS.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>)}
                  </select>
                  <div className="flex gap-1 flex-wrap">
                    {ICONS.map(i => (
                      <button key={i} onClick={()=>setADraft(d=>({...d,icon:i}))}
                        className="w-7 h-7 rounded text-base transition"
                        style={{
                          background: aDraft.icon===i ? `${YELLOW}33` : "transparent",
                          border: `1px solid ${aDraft.icon===i ? YELLOW : BORDER_SOFT}`,
                        }}>{i}</button>
                    ))}
                  </div>
                  <button onClick={addAch}
                    className="font-mono text-[10px] tracking-[0.25em] px-4 py-2 rounded ml-auto transition hover:brightness-110"
                    style={{ background: YELLOW, color: "#000", fontWeight: 700 }}>
                    [ SAVE ]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {visibleAch.length === 0 && !addingA && (
            <EmptyState icon={<Trophy size={26}/>} color={YELLOW} code="ERR::EMPTY_VAULT"
              msg="No wins logged yet" hint="Even small wins count — log them all."/>
          )}

          {/* Timeline */}
          <div className="relative pl-5 space-y-2">
            <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: `linear-gradient(to bottom, ${YELLOW}88, ${BORDER_SOFT})` }}/>
            {visibleAch.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a => {
              const c = CATS.find(x=>x.id===a.category) || CATS[CATS.length-1];
              return (
                <motion.div key={a.id} layout
                  className="relative rounded-lg p-3 group transition hover:translate-x-0.5"
                  style={{ background: CARD, border: `1px solid ${BORDER_SOFT}`, borderLeft: `2px solid ${c.color}` }}>
                  <div className="absolute -left-[17px] top-4 w-3 h-3 rounded-full"
                    style={{ background: c.color, boxShadow:`0 0 8px ${c.color}`, border: "2px solid var(--cr-bg,#05080d)" }}/>
                  <div className="flex items-start gap-3">
                    <div className="text-xl leading-none pt-0.5">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold" style={{ color: FG }}>{a.title}</span>
                        <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: c.color, background: `${c.color}18` }}>{c.label}</span>
                        <span className="text-[10px] font-mono" style={{ color: MUTED }}>{a.date}</span>
                      </div>
                      {a.impact && (
                        <p className="text-[11px] font-mono mt-1 flex items-center gap-1" style={{ color: GREEN }}>
                          <span style={{ color: YELLOW }}>&#9656;</span> {a.impact}
                        </p>
                      )}
                      {a.description && <p className="text-[11px] font-mono mt-0.5" style={{ color: MUTED }}>{a.description}</p>}
                    </div>
                    <button onClick={()=>delA(a.id)} className="p-1.5 rounded transition opacity-0 group-hover:opacity-100 hover:bg-red-500/20" style={{ color: RED }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ============ PROJECTS ============ */}
      {tab === "projects" && (
        <>
          <HudAddBtn open={addingP} onClick={()=>setAddingP(v=>!v)} color={CYAN} label="NEW PROJECT" icon={<Plus size={13}/>}/>

          <AnimatePresence>
            {addingP && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                className="relative rounded-lg p-4 space-y-2" style={{ background: CARD, border: `1px solid ${CYAN}66` }}>
                <HudCorner color={CYAN}/>
                <div className="text-[9px] font-mono tracking-[0.25em] mb-1" style={{ color: CYAN }}>// new_project.input</div>
                <input value={pDraft.title??""} onChange={e=>setPDraft(d=>({...d,title:e.target.value}))} placeholder="Project title"
                  className="w-full px-3 py-2 rounded text-sm font-mono outline-none" style={inputStyle}/>
                <div className="grid md:grid-cols-2 gap-2">
                  <input value={pDraft.role??""} onChange={e=>setPDraft(d=>({...d,role:e.target.value}))} placeholder="Your role"
                    className="px-3 py-2 rounded text-sm font-mono outline-none" style={inputStyle}/>
                  <input value={pDraft.url??""} onChange={e=>setPDraft(d=>({...d,url:e.target.value}))} placeholder="Live URL"
                    className="px-3 py-2 rounded text-sm font-mono outline-none" style={inputStyle}/>
                </div>
                <textarea value={pDraft.summary??""} onChange={e=>setPDraft(d=>({...d,summary:e.target.value}))} placeholder="Summary" rows={2}
                  className="w-full px-3 py-2 rounded text-xs font-mono outline-none resize-none" style={inputStyle}/>
                <textarea value={pDraft.results??""} onChange={e=>setPDraft(d=>({...d,results:e.target.value}))} placeholder="Results (metrics & impact)" rows={2}
                  className="w-full px-3 py-2 rounded text-xs font-mono outline-none resize-none"
                  style={{ ...inputStyle, border: `1px solid ${GREEN}55` }}/>
                <textarea value={pDraft.challenges??""} onChange={e=>setPDraft(d=>({...d,challenges:e.target.value}))} placeholder="Hardest challenge / problem solved" rows={2}
                  className="w-full px-3 py-2 rounded text-xs font-mono outline-none resize-none"
                  style={{ ...inputStyle, border: `1px solid ${ORANGE}55` }}/>
                <textarea value={pDraft.learnings??""} onChange={e=>setPDraft(d=>({...d,learnings:e.target.value}))} placeholder="Key learnings / takeaways" rows={2}
                  className="w-full px-3 py-2 rounded text-xs font-mono outline-none resize-none"
                  style={{ ...inputStyle, border: `1px solid ${CYAN}55` }}/>
                <div className="flex gap-2">
                  <input value={techInput} onChange={e=>setTechInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTech(null);}}} placeholder="Add tech tag + Enter"
                    className="flex-1 px-3 py-2 rounded text-xs font-mono outline-none" style={inputStyle}/>
                  <button onClick={()=>addTech(null)} className="text-xs font-mono px-3 rounded transition hover:brightness-125"
                    style={{ background: `${CYAN}22`, color: CYAN, border: `1px solid ${CYAN}55` }}>[ + ]</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(pDraft.technologies||[]).map((t,i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1"
                      style={{ background:`${CYAN}15`, color: CYAN, border: `1px solid ${CYAN}33` }}>
                      {t}
                      <button onClick={()=>setPDraft(d=>({...d,technologies:d.technologies?.filter((_,j)=>j!==i)}))} className="hover:text-red-400">×</button>
                    </span>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-[11px] font-mono cursor-pointer" style={{ color: MUTED }}>
                  <input type="checkbox" checked={!!pDraft.private} onChange={e=>setPDraft(d=>({...d,private:e.target.checked}))}
                    className="accent-yellow-400"/>
                  <span>PRIVATE :: exclude from public portfolio</span>
                </label>
                <button onClick={addProj} className="font-mono text-[10px] tracking-[0.25em] px-4 py-2 rounded transition hover:brightness-110"
                  style={{ background: CYAN, color:"#000", fontWeight:700 }}>[ SAVE_PROJECT ]</button>
              </motion.div>
            )}
          </AnimatePresence>

          {career.projects.length === 0 && !addingP && (
            <EmptyState icon={<Star size={26}/>} color={CYAN} code="ERR::NO_PROJECTS"
              msg="No projects catalogued" hint="Add your shipped work — results, challenges, learnings."/>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {career.projects.map(p => (
              <motion.div key={p.id} layout
                className="relative rounded-lg p-4 group transition hover:translate-y-[-1px]"
                style={{
                  background: CARD,
                  border: `1px solid ${p.private ? BORDER_SOFT : `${CYAN}44`}`,
                }}>
                <HudCorner color={p.private ? MUTED : CYAN}/>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-mono text-sm font-bold" style={{ color: FG }}>{p.title}</h4>
                      {p.private && (
                        <span className="text-[9px] font-mono tracking-widest flex items-center gap-1 px-1.5 py-0.5 rounded"
                          style={{ color: MUTED, background: "rgba(100,116,139,0.15)", border:`1px solid ${BORDER_SOFT}` }}>
                          <EyeOff size={9}/> PRIVATE
                        </span>
                      )}
                      {p.url && <a href={p.url} target="_blank" rel="noopener" className="transition hover:scale-110" style={{ color: CYAN }}><ExternalLink size={11}/></a>}
                    </div>
                    {p.role && <p className="text-[11px] font-mono mt-0.5" style={{ color: YELLOW }}>&#8227; {p.role}</p>}
                  </div>
                  <button onClick={()=>upP(p.id,{private:!p.private})} className="p-1 rounded transition hover:bg-white/10" style={{ color: MUTED }}>
                    {p.private?<EyeOff size={12}/>:<Eye size={12}/>}
                  </button>
                  <button onClick={()=>delP(p.id)} className="p-1 rounded transition hover:bg-red-500/20" style={{ color: RED }}><Trash2 size={12}/></button>
                </div>

                {p.summary && <p className="text-[11px] font-mono mt-2 leading-relaxed" style={{ color: MUTED }}>{p.summary}</p>}

                {p.results && (
                  <div className="mt-2 flex gap-2 items-start">
                    <span className="text-[9px] font-mono tracking-widest mt-0.5 whitespace-nowrap" style={{ color: GREEN }}>RESULTS</span>
                    <p className="text-[11px] font-mono font-bold" style={{ color: GREEN }}>{p.results}</p>
                  </div>
                )}
                {p.challenges && (
                  <div className="mt-1 flex gap-2 items-start">
                    <span className="text-[9px] font-mono tracking-widest mt-0.5 whitespace-nowrap" style={{ color: ORANGE }}>CHALLENGE</span>
                    <p className="text-[11px] font-mono" style={{ color: FG }}>{p.challenges}</p>
                  </div>
                )}
                {p.learnings && (
                  <div className="mt-1 flex gap-2 items-start">
                    <span className="text-[9px] font-mono tracking-widest mt-0.5 whitespace-nowrap" style={{ color: CYAN }}>LEARNED</span>
                    <p className="text-[11px] font-mono" style={{ color: FG }}>{p.learnings}</p>
                  </div>
                )}
                {p.technologies && p.technologies.length>0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {p.technologies.map((t,i) => (
                      <span key={i} className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: `${VIOLET}15`, color: VIOLET, border: `1px solid ${VIOLET}33` }}>{t}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* ============ BULLETS + ATS ============ */}
      {tab === "bullets" && (
        <div className="grid md:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-2">
            <div className="relative rounded-lg p-3 space-y-2" style={{ background: CARD, border: `1px solid ${VIOLET}55` }}>
              <HudCorner color={VIOLET}/>
              <div className="text-[9px] font-mono tracking-[0.25em] mb-1" style={{ color: VIOLET }}>// bullet_forge.input</div>
              <textarea value={bulletDraft} onChange={e=>setBulletDraft(e.target.value)} rows={2}
                placeholder="> Strong bullet: 'Led migration of X to Y reducing latency by 40% for 2M users...'"
                className="w-full text-sm font-mono p-2 rounded outline-none resize-none" style={{ ...inputStyle, background: CARD2 }}/>
              <div className="flex gap-2 flex-wrap items-center">
                <input value={bulletTags} onChange={e=>setBulletTags(e.target.value)} placeholder="tags (aws, leadership, ...)"
                  className="flex-1 min-w-[180px] text-xs font-mono px-2 py-1.5 rounded outline-none" style={inputStyle}/>
                <button onClick={addB}
                  className="font-mono text-[10px] tracking-[0.2em] px-3 py-1.5 rounded transition hover:brightness-110"
                  style={{ background: VIOLET, color: "#000", fontWeight: 700 }}>[ ADD_BULLET ]</button>
              </div>
            </div>

            {career.bullets.length === 0 && (
              <EmptyState icon={<Terminal size={26}/>} color={VIOLET} code="ERR::NO_BULLETS"
                msg="No resume bullets" hint="Store polished, metric-driven lines ready to paste."/>
            )}

            {career.bullets.map(b => (
              <div key={b.id} className="relative rounded-lg p-3 group transition hover:translate-x-0.5"
                style={{ background: CARD, border: `1px solid ${BORDER_SOFT}`, borderLeft: `2px solid ${VIOLET}` }}>
                <textarea defaultValue={b.text} onBlur={e=>upB(b.id,{text:e.target.value})} rows={2}
                  className="w-full text-sm font-mono p-1 rounded outline-none resize-none bg-transparent"
                  style={{ color: FG }}/>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {(b.tags||[]).map((t,i)=>(
                    <span key={i} className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: `${VIOLET}15`, color: VIOLET, border: `1px solid ${VIOLET}33` }}>{t}</span>
                  ))}
                  <button onClick={()=>copyBullet(b.id, b.text)}
                    className="ml-auto text-[9px] font-mono tracking-widest px-2 py-1 rounded flex items-center gap-1 transition hover:brightness-125"
                    style={{ background: copiedId===b.id ? `${GREEN}25` : `${YELLOW}15`, color: copiedId===b.id ? GREEN : YELLOW, border: `1px solid ${copiedId===b.id?GREEN:YELLOW}44` }}>
                    {copiedId===b.id ? <CheckCircle2 size={9}/> : <Copy size={9}/>}
                    {copiedId===b.id ? "COPIED" : "COPY"}
                  </button>
                  <button onClick={()=>delB(b.id)}
                    className="text-[9px] font-mono tracking-widest px-2 py-1 rounded transition hover:bg-red-500/20" style={{ color: RED }}>
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ATS PANEL */}
          <div className="relative rounded-lg p-4 h-fit sticky top-4" style={{ background: CARD2, border: `1px solid ${YELLOW}55` }}>
            <HudCorner color={YELLOW}/>
            <h3 className="font-mono text-[11px] tracking-[0.25em] mb-2 flex items-center gap-2" style={{ color: YELLOW }}>
              <Target size={13}/> ATS::SCANNER
            </h3>
            <p className="text-[10px] font-mono mb-3 leading-relaxed" style={{ color: MUTED }}>
              &gt; paste JD keywords (comma-separated). scoring runs against vault + bullets + projects.
            </p>
            <textarea value={atsKeywords} onChange={e=>setAtsKeywords(e.target.value)} rows={3}
              placeholder="aws, kubernetes, leadership, ci/cd, python, postgres, ..."
              className="w-full text-xs font-mono p-2 rounded outline-none resize-none" style={{ ...inputStyle, background: CARD }}/>

            {atsScore.total > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-[9px] font-mono tracking-[0.25em]" style={{ color: MUTED }}>MATCH_SCORE</span>
                  <span className="text-2xl font-black font-mono" style={{
                    color: atsScore.score>=80?GREEN:atsScore.score>=50?YELLOW:RED,
                    textShadow: `0 0 12px ${atsScore.score>=80?GREEN:atsScore.score>=50?YELLOW:RED}88`,
                  }}>{atsScore.score}<span className="text-sm">%</span></span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width:`${atsScore.score}%`,
                    background: `linear-gradient(90deg, ${atsScore.score>=80?GREEN:atsScore.score>=50?YELLOW:RED}, ${YELLOW})`,
                    boxShadow: `0 0 8px ${atsScore.score>=80?GREEN:atsScore.score>=50?YELLOW:RED}`,
                  }}/>
                </div>
                <div className="text-[10px] font-mono flex justify-between pt-1" style={{ color: MUTED }}>
                  <span><span style={{ color: GREEN }}>{atsScore.hits}</span>/{atsScore.total} keywords hit</span>
                </div>
                {atsScore.miss.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[9px] font-mono tracking-widest mb-1" style={{ color: RED }}>// MISSING</div>
                    <div className="flex flex-wrap gap-1">
                      {atsScore.miss.slice(0,20).map(k => (
                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: `${RED}15`, color: RED, border: `1px solid ${RED}33` }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TESTIMONIALS ============ */}
      {tab === "testimonials" && (
        <>
          <div className="relative rounded-lg p-3 grid md:grid-cols-3 gap-2" style={{ background: CARD, border: `1px solid ${PINK}55` }}>
            <HudCorner color={PINK}/>
            <input value={testDraft.from||""} onChange={e=>setTestDraft(d=>({...d,from:e.target.value}))} placeholder="From (name)"
              className="text-sm font-mono px-2 py-1.5 rounded outline-none" style={inputStyle}/>
            <input value={testDraft.role||""} onChange={e=>setTestDraft(d=>({...d,role:e.target.value}))} placeholder="Their role"
              className="text-sm font-mono px-2 py-1.5 rounded outline-none" style={inputStyle}/>
            <button onClick={addT}
              className="font-mono text-[10px] tracking-[0.2em] rounded transition hover:brightness-110"
              style={{ background: PINK, color:"#000", fontWeight:700 }}>[ ADD_QUOTE ]</button>
            <div className="md:col-span-3">
              <textarea value={testDraft.quote||""} onChange={e=>setTestDraft(d=>({...d,quote:e.target.value}))} rows={2}
                placeholder="&gt; their words about working with you..."
                className="w-full text-sm font-mono p-2 rounded outline-none resize-none italic" style={inputStyle}/>
            </div>
          </div>

          {career.testimonials.length === 0 && (
            <EmptyState icon={<Sparkles size={26}/>} color={PINK} code="ERR::NO_ENDORSEMENTS"
              msg="No testimonials logged" hint="Save peer/manager/client recommendations here."/>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {career.testimonials.map(t => (
              <div key={t.id} className="relative rounded-lg p-4 group transition hover:translate-y-[-1px]"
                style={{ background: CARD, border: `1px solid ${PINK}33` }}>
                <HudCorner color={PINK}/>
                <div className="text-3xl font-mono leading-none mb-1" style={{ color: PINK }}>&ldquo;</div>
                <p className="text-sm font-mono italic leading-relaxed" style={{ color: FG }}>{t.quote}</p>
                <div className="mt-3 pt-2 flex items-center gap-2 text-[11px] font-mono" style={{ borderTop: `1px dashed ${BORDER_SOFT}` }}>
                  <span className="font-bold" style={{ color: PINK }}>&#8212; {t.from}</span>
                  {t.role && <span style={{ color: MUTED }}>· {t.role}</span>}
                  {t.date && <span className="ml-auto" style={{ color: MUTED }}>{t.date}</span>}
                </div>
                <button onClick={()=>delT(t.id)}
                  className="absolute top-2 right-2 p-1 rounded transition opacity-0 group-hover:opacity-100 hover:bg-red-500/20"
                  style={{ color: RED }}><Trash2 size={11}/></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function HudChip({active,color,onClick,label,count}:{active:boolean;color:string;onClick:()=>void;label:string;count:number}) {
  return (
    <button onClick={onClick}
      className="font-mono text-[9px] md:text-[10px] tracking-[0.15em] px-2 py-1 rounded transition"
      style={{
        background: active ? `${color}22` : "var(--cr-card)",
        color: active ? color : "var(--cr-fgMuted)",
        border: `1px solid ${active ? color : "var(--cr-borderSoft)"}`,
        boxShadow: active ? `0 0 8px ${color}44` : "none",
      }}>
      {label} <span className="font-bold opacity-80">{String(count).padStart(2,"0")}</span>
    </button>
  );
}

function HudAddBtn({open,onClick,color,label,icon}:{open:boolean;onClick:()=>void;color:string;label:string;icon:React.ReactNode}) {
  return (
    <button onClick={onClick}
      className="relative w-full font-mono text-[10px] md:text-xs tracking-[0.3em] px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-black transition hover:brightness-110"
      style={{
        background: open ? `${color}22` : `linear-gradient(135deg, ${color}22, var(--cr-card2))`,
        color: color,
        border: `1.5px solid ${open ? color : `${color}66`}`,
        boxShadow: open ? `inset 0 0 20px ${color}22` : `0 0 12px ${color}22`,
      }}>
      <span className="absolute top-0 left-3 text-[8px] font-mono opacity-60">{open ? "[-]" : "[+]"}</span>
      {icon} {label}
      <span className="absolute bottom-0 right-3 text-[8px] font-mono opacity-60">{open ? "close" : "expand"}</span>
    </button>
  );
}

function EmptyState({icon,color,code,msg,hint}:{icon:React.ReactNode;color:string;code:string;msg:string;hint:string}) {
  return (
    <div className="relative rounded-lg p-8 text-center"
      style={{ background: "var(--cr-card)", border: `1px dashed ${color}44` }}>
      <div className="mx-auto mb-2 w-fit" style={{ color }}>{icon}</div>
      <div className="text-[9px] font-mono tracking-[0.3em] mb-1" style={{ color }}>{code}</div>
      <p className="font-mono text-xs tracking-wider" style={{ color: "var(--cr-fg)" }}>{msg}</p>
      <p className="text-[10px] font-mono mt-1" style={{ color: "var(--cr-fgMuted)" }}>&gt; {hint}</p>
    </div>
  );
}
