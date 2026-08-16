"use client";

/**
 * SkillsSection — skill inventory for career OS.
 *   - 1-10 sliders for proficiency / confidence / interest
 *   - desiredLevel slider (gap = desired - current)
 *   - usage cadence, last-used tracking with STALE/ROTTING decay badges
 *   - expandable card: mentor, resources, portfolio links editor
 *   - SkillRadar spider chart + GrowthChart sparkline + top-5 ranked list
 *   - All colors use CSS variables (dark: HUD night / light: blueprint schematic).
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Brain, AlertTriangle, Trash2, Sparkles, TrendingUp,
  ChevronDown, User, Link2, BookOpen, Target, X, Check,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { safeExternalUrl } from "../../../lib/security";
import SkillRadar from "../SkillRadar";
import type { CareerSkill, SkillUsageFreq } from "../../../lib/careerTypes";

const CATEGORIES = ["Technical", "Leadership", "Communication", "Design", "Domain", "Other"];
const USAGE: SkillUsageFreq[] = ["daily","weekly","monthly","rarely"];
const uid = () => Math.random().toString(36).slice(2,10);

// HUD palette (dark: neon cyan/violet/pink/green/orange; light: blueprint ink auto-applied via CSS vars)
const COLORS = {
  cyan: "var(--cr-accent)",
  violet: "#a78bfa",
  pink: "#f472b6",
  green: "var(--cr-accent3)",
  orange: "var(--cr-accent2)",
  yellow: "#facc15",
  red: "#f87171",
};

export default function SkillsSection() {
  const { career, updateCareer } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [expanded, setExpanded] = useState<string | null>(null);
  // drafts keyed by skill id so multiple cards don't collide
  const [linkDraft, setLinkDraft] = useState<Record<string,{label:string;url:string}>>({});
  const [resDraft, setResDraft] = useState<Record<string,{title:string;url:string}>>({});
  const [mentorDraft, setMentorDraft] = useState<Record<string,string>>({});

  const add = () => {
    if (!name.trim()) return;
    const skill: CareerSkill = {
      id: uid(), name: name.trim(), category: cat,
      proficiency: 3, confidence: 3, interest: 5, desiredLevel: 7,
      usage: "weekly", growth: [], portfolioLinks: [], resources: [],
    };
    updateCareer((c) => ({ skills: [skill, ...c.skills] }));
    setName(""); setAdding(false);
  };

  const upd = (id: string, patch: Partial<CareerSkill>) => {
    updateCareer((c) => ({
      skills: c.skills.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...patch };
        if (patch.proficiency != null && patch.proficiency !== s.proficiency) {
          const today = new Date().toISOString().slice(0, 10);
          const existing = (s.growth || []).filter((g) => g.date !== today);
          merged.growth = [...existing, { date: today, level: patch.proficiency }];
        }
        return merged;
      }),
    }));
  };
  const del = (id: string) => {
    if (!confirm("Delete skill?")) return;
    updateCareer((c) => ({ skills: c.skills.filter(s => s.id !== id) }));
  };
  const touch = (id: string) => upd(id, { lastUsedAt: Date.now() });
  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const addLink = (id: string) => {
    const d = linkDraft[id] || { label: "", url: "" };
    if (!d.url.trim()) return;
    const skill = career.skills.find(s => s.id === id);
    if (!skill) return;
    upd(id, { portfolioLinks: [...(skill.portfolioLinks||[]), { label: d.label.trim() || d.url, url: d.url }] });
    setLinkDraft({ ...linkDraft, [id]: { label: "", url: "" } });
  };
  const removeLink = (id: string, idx: number) => {
    const skill = career.skills.find(s => s.id === id);
    if (!skill) return;
    upd(id, { portfolioLinks: (skill.portfolioLinks||[]).filter((_,i) => i !== idx) });
  };
  const addRes = (id: string) => {
    const d = resDraft[id] || { title: "", url: "" };
    if (!d.title.trim()) return;
    const skill = career.skills.find(s => s.id === id);
    if (!skill) return;
    upd(id, { resources: [...(skill.resources||[]), { title: d.title.trim(), url: d.url.trim() || undefined }] });
    setResDraft({ ...resDraft, [id]: { title: "", url: "" } });
  };
  const removeRes = (id: string, idx: number) => {
    const skill = career.skills.find(s => s.id === id);
    if (!skill) return;
    upd(id, { resources: (skill.resources||[]).filter((_,i) => i !== idx) });
  };
  const saveMentor = (id: string) => {
    upd(id, { mentor: (mentorDraft[id] || "").trim() || undefined });
  };

  const grouped = useMemo(() => {
    const map: Record<string, CareerSkill[]> = {};
    for (const s of career.skills) {
      const k = s.category ?? "Other";
      (map[k] = map[k] || []).push(s);
    }
    for (const k in map) map[k].sort((a,b) => b.proficiency - a.proficiency);
    return map;
  }, [career.skills]);

  const decayCount = career.skills.filter(s => s.lastUsedAt && Date.now() - s.lastUsedAt > 90*86400000).length;
  const avg = career.skills.length ? Math.round(career.skills.reduce((n,s)=>n+s.proficiency,0)/career.skills.length*10)/10 : 0;
  const gapCount = career.skills.filter(s => (s.desiredLevel ?? 0) > s.proficiency).length;
  const mentored = career.skills.filter(s => s.mentor).length;

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const cardStrong = { background: "var(--cr-card)", border: "1px solid var(--cr-border)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2" style={{color:"var(--cr-fg)"}}>
            <Brain size={22} style={{color:COLORS.violet}}/> skills.inventory
          </h2>
          <p className="text-[11px] tracking-widest mt-1" style={{color:"var(--cr-fgMuted)"}}>
            &gt; every blade sharpened — proficiency, confidence, decay, gaps.
          </p>
        </div>
        <button onClick={() => setAdding(true)}
          className="text-[11px] tracking-[0.25em] font-bold px-4 py-2 rounded-sm hud-corner flex items-center gap-2 transition hover:scale-105"
          style={{background:COLORS.violet, color:"var(--cr-bg)", border:`1px solid ${COLORS.violet}`}}>
          <span className="c-tr"/><span className="c-bl"/>
          <Plus size={13}/> ADD SKILL
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Tracked" value={career.skills.length} color={COLORS.cyan}/>
        <Stat label="Avg lvl" value={avg} color={COLORS.violet}/>
        <Stat label="Decaying" value={decayCount} color={COLORS.pink}/>
        <Stat label="Daily use" value={career.skills.filter(s=>s.usage==="daily").length} color={COLORS.green}/>
        <Stat label="Gap skills" value={gapCount} color={COLORS.orange}/>
        <Stat label="Mentored" value={mentored} color={COLORS.yellow}/>
      </div>

      {/* Radar + growth */}
      {career.skills.length >= 3 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-sm p-4 hud-corner relative" style={cardStrong}>
            <span className="c-tr"/><span className="c-bl"/>
            <h3 className="text-[10px] tracking-[0.3em] mb-2 text-center font-bold" style={{color:COLORS.cyan}}>
              SKILL · RADAR
            </h3>
            <SkillRadar skills={career.skills}/>
          </div>
          <div className="rounded-sm p-4 hud-corner relative" style={cardStrong}>
            <span className="c-tr"/><span className="c-bl"/>
            <h3 className="text-[10px] tracking-[0.3em] mb-3 font-bold flex items-center gap-2" style={{color:COLORS.green}}>
              <TrendingUp size={12}/> GROWTH
            </h3>
            <GrowthChart skills={career.skills}/>
            <TopSkills skills={career.skills}/>
          </div>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="rounded-sm p-3 flex flex-wrap gap-2 items-center hud-corner relative" style={cardStrong}>
            <span className="c-tr"/><span className="c-bl"/>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()}
              placeholder="Skill name (e.g. Terraform)"
              className="flex-1 min-w-[180px] outline-none text-sm px-3 py-2 rounded-sm" style={inputStyle}/>
            <select value={cat} onChange={e=>setCat(e.target.value)}
              className="text-sm px-3 py-2 rounded-sm outline-none" style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={add} className="text-[11px] tracking-widest font-bold px-4 py-2 rounded-sm"
              style={{background:COLORS.cyan,color:"var(--cr-bg)"}}>
              <Check size={12} className="inline mr-1"/>Add
            </button>
            <button onClick={()=>setAdding(false)} className="text-sm px-3 py-2" style={{color:"var(--cr-fgMuted)"}}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {career.skills.length === 0 && !adding && (
        <Empty title="No skills tracked yet." subtitle="Log the blades in your arsenal — even soft skills matter."/>
      )}

      {/* Grouped list */}
      {Object.entries(grouped).map(([c, skills]) => (
        <div key={c}>
          <h3 className="text-[10px] tracking-[0.3em] mb-2 font-bold flex items-center gap-2" style={{color:"var(--cr-fgMuted)"}}>
            <span className="inline-block w-4 h-px" style={{background:COLORS.cyan}}/>
            {c.toUpperCase()}
            <span className="inline-block flex-1 h-px" style={{background:"var(--cr-borderSoft)"}}/>
            <span style={{color:COLORS.cyan}}>{skills.length}</span>
          </h3>
          <div className="space-y-2">
            {skills.map(s => {
              const days = s.lastUsedAt ? Math.floor((Date.now()-s.lastUsedAt)/86400000) : null;
              const stale = days != null && days > 90;
              const rotting = days != null && days > 180;
              const desired = s.desiredLevel ?? s.proficiency;
              const gap = Math.max(0, desired - s.proficiency);
              const isOpen = expanded === s.id;
              const decayColor = rotting ? COLORS.red : stale ? COLORS.orange : COLORS.cyan;
              return (
                <motion.div key={s.id} layout
                  className="rounded-sm hud-corner relative"
                  style={{
                    background: "var(--cr-card)",
                    border: `1px solid ${rotting ? `${COLORS.red}88` : stale ? `${COLORS.orange}66` : "var(--cr-borderSoft)"}`,
                  }}>
                  <span className="c-tr"/><span className="c-bl"/>
                  <div className="p-3 md:p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={()=>toggle(s.id)} className="p-1 rounded-sm shrink-0"
                        style={{color:COLORS.cyan}} aria-label="Expand">
                        <ChevronDown size={14} style={{transform: isOpen?"rotate(-180deg)":"none",transition:"transform .2s"}}/>
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input value={s.name} onChange={e=>upd(s.id,{name:e.target.value})}
                            className="bg-transparent font-bold text-sm md:text-base outline-none w-full sm:w-auto sm:flex-1 min-w-[120px]"
                            style={{color:"var(--cr-fg)"}}/>
                          {rotting && <Badge tone="red"><AlertTriangle size={9}/>ROTTING · {days}d</Badge>}
                          {stale && !rotting && <Badge tone="orange"><AlertTriangle size={9}/>STALE · {days}d</Badge>}
                          {gap > 0 && <Badge tone="violet"><Target size={9}/>GAP +{gap}</Badge>}
                        </div>
                        {/* proficiency bar with desired marker */}
                        <div className="h-1.5 mt-2 rounded-full overflow-hidden relative" style={{background:"var(--cr-borderSoft)"}}>
                          <div className="h-full rounded-full"
                            style={{width:`${s.proficiency*10}%`,
                              background:`linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.violet})`,
                              boxShadow:`0 0 8px ${COLORS.cyan}80`}}/>
                          {/* desired marker */}
                          <div className="absolute top-0 bottom-0 w-px"
                            style={{left:`${desired*10}%`,background:COLORS.orange,boxShadow:`0 0 6px ${COLORS.orange}`}}/>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={()=>touch(s.id)} className="text-[9px] tracking-widest font-bold px-2 py-1 rounded-sm"
                          style={{background:`${COLORS.green}22`,color:COLORS.green,border:`1px solid ${COLORS.green}44`}}>
                          USED TODAY
                        </button>
                        <button onClick={()=>del(s.id)} className="p-1.5 rounded-sm"
                          style={{color:COLORS.red}}><Trash2 size={12}/></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <Slider label="Proficiency" value={s.proficiency} color={COLORS.cyan} onChange={v=>upd(s.id,{proficiency:v})}/>
                      <Slider label="Confidence"  value={s.confidence} color={COLORS.violet} onChange={v=>upd(s.id,{confidence:v})}/>
                      <Slider label="Interest"    value={s.interest} color={COLORS.pink} onChange={v=>upd(s.id,{interest:v})}/>
                      <Slider label="Desired"     value={desired} color={COLORS.orange} onChange={v=>upd(s.id,{desiredLevel:v})}/>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      <div>
                        <div className="text-[9px] tracking-widest font-bold mb-1" style={{color:"var(--cr-fgMuted)"}}>USAGE</div>
                        <select value={s.usage} onChange={e=>upd(s.id,{usage:e.target.value as SkillUsageFreq})}
                          className="w-full bg-transparent text-xs px-2 py-1 rounded-sm outline-none" style={inputStyle}>
                          {USAGE.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3 flex items-center">
                        <span className="text-[9px] tracking-widest" style={{color:"var(--cr-fgMuted)"}}>
                          {days == null ? "> never logged — tap USED TODAY after practice" :
                           days === 0 ? "> touched today — keep the streak alive" :
                           `> last touch ${days}d ago`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                        transition={{duration:0.2}}
                        className="overflow-hidden border-t" style={{borderColor:"var(--cr-borderSoft)"}}>
                        <div className="p-3 md:p-4 space-y-4" style={{background:"var(--cr-card2)"}}>
                          {/* Mentor */}
                          <DetailSection icon={<User size={12}/>} title="MENTOR" color={COLORS.yellow}>
                            <div className="flex gap-2 flex-wrap">
                              <input value={mentorDraft[s.id] ?? s.mentor ?? ""}
                                onChange={e=>setMentorDraft({...mentorDraft,[s.id]:e.target.value})}
                                onBlur={()=>saveMentor(s.id)}
                                onKeyDown={e=>e.key==="Enter"&&saveMentor(s.id)}
                                placeholder="Who's teaching you this? (name, @handle, book author...)"
                                className="flex-1 min-w-[200px] bg-transparent outline-none text-xs px-2 py-1.5 rounded-sm" style={inputStyle}/>
                            </div>
                            {s.mentor && (
                              <div className="text-[10px] mt-1 tracking-wider" style={{color:COLORS.yellow}}>
                                &gt; sensei on file: {s.mentor}
                              </div>
                            )}
                          </DetailSection>

                          {/* Portfolio links */}
                          <DetailSection icon={<Link2 size={12}/>} title="PROOF · PORTFOLIO LINKS" color={COLORS.green}>
                            <div className="space-y-1">
                              {(s.portfolioLinks||[]).map((l,i) => (
                                <div key={i} className="flex items-center gap-2 text-xs rounded-sm px-2 py-1"
                                  style={{background:"var(--cr-card)",border:"1px solid var(--cr-borderSoft)"}}>
                                  <Link2 size={10} style={{color:COLORS.green}}/>
                                  <a href={safeExternalUrl(l.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline"
                                    style={{color:"var(--cr-fg)"}}>{l.label}</a>
                                  <span className="truncate text-[10px]" style={{color:"var(--cr-fgMuted)"}}>{l.url}</span>
                                  <button onClick={()=>removeLink(s.id,i)} style={{color:COLORS.red}}><X size={10}/></button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <input value={linkDraft[s.id]?.label||""}
                                onChange={e=>setLinkDraft({...linkDraft,[s.id]:{...(linkDraft[s.id]||{url:""}),label:e.target.value}})}
                                placeholder="Label (e.g. Case study)"
                                className="flex-1 min-w-[140px] bg-transparent outline-none text-xs px-2 py-1.5 rounded-sm" style={inputStyle}/>
                              <input value={linkDraft[s.id]?.url||""}
                                onChange={e=>setLinkDraft({...linkDraft,[s.id]:{...(linkDraft[s.id]||{label:""}),url:e.target.value}})}
                                onKeyDown={e=>e.key==="Enter"&&addLink(s.id)}
                                placeholder="https://..."
                                className="flex-[2] min-w-[200px] bg-transparent outline-none text-xs px-2 py-1.5 rounded-sm" style={inputStyle}/>
                              <button onClick={()=>addLink(s.id)} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
                                style={{background:COLORS.green,color:"var(--cr-bg)"}}>
                                <Plus size={10} className="inline mr-1"/>ADD
                              </button>
                            </div>
                          </DetailSection>

                          {/* Resources */}
                          <DetailSection icon={<BookOpen size={12}/>} title="RESOURCES" color={COLORS.pink}>
                            <div className="space-y-1">
                              {(s.resources||[]).map((r,i) => (
                                <div key={i} className="flex items-center gap-2 text-xs rounded-sm px-2 py-1"
                                  style={{background:"var(--cr-card)",border:"1px solid var(--cr-borderSoft)"}}>
                                  <BookOpen size={10} style={{color:COLORS.pink}}/>
                                  {r.url ? (
                                    <a href={safeExternalUrl(r.url) ?? undefined} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline"
                                      style={{color:"var(--cr-fg)"}}>{r.title}</a>
                                  ) : (
                                    <span className="flex-1" style={{color:"var(--cr-fg)"}}>{r.title}</span>
                                  )}
                                  <button onClick={()=>removeRes(s.id,i)} style={{color:COLORS.red}}><X size={10}/></button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <input value={resDraft[s.id]?.title||""}
                                onChange={e=>setResDraft({...resDraft,[s.id]:{...(resDraft[s.id]||{url:""}),title:e.target.value}})}
                                placeholder="Title (book / course / article)"
                                className="flex-1 min-w-[180px] bg-transparent outline-none text-xs px-2 py-1.5 rounded-sm" style={inputStyle}/>
                              <input value={resDraft[s.id]?.url||""}
                                onChange={e=>setResDraft({...resDraft,[s.id]:{...(resDraft[s.id]||{title:""}),url:e.target.value}})}
                                onKeyDown={e=>e.key==="Enter"&&addRes(s.id)}
                                placeholder="https://... (optional)"
                                className="flex-[2] min-w-[200px] bg-transparent outline-none text-xs px-2 py-1.5 rounded-sm" style={inputStyle}/>
                              <button onClick={()=>addRes(s.id)} className="text-[10px] tracking-widest font-bold px-3 py-1.5 rounded-sm"
                                style={{background:COLORS.pink,color:"var(--cr-bg)"}}>
                                <Plus size={10} className="inline mr-1"/>ADD
                              </button>
                            </div>
                          </DetailSection>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- small UI primitives ---------- */

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-sm p-2.5 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[9px] tracking-widest font-bold" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg font-black leading-tight mt-0.5" style={{color:"var(--cr-fg)"}}>{value}</div>
    </div>
  );
}

function Slider({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[9px] tracking-widest font-bold mb-1">
        <span style={{color:"var(--cr-fgMuted)"}}>{label.toUpperCase()}</span>
        <span style={{color}}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color} ${(value-1)/9*100}%, var(--cr-borderSoft) ${(value-1)/9*100}%, var(--cr-borderSoft) 100%)`,
          accentColor: color,
        }}/>
    </div>
  );
}

function Badge({ tone, children }: { tone: "red"|"orange"|"violet"; children: React.ReactNode }) {
  const map = {
    red:    "#f87171",
    orange: "#fb923c",
    violet: "#a78bfa",
  } as const;
  const c = map[tone];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
      style={{background:`${c}22`,color:c,border:`1px solid ${c}55`}}>{children}</span>
  );
}

function DetailSection({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-[9px] tracking-[0.25em] font-bold mb-2 flex items-center gap-1.5" style={{color}}>
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-sm p-10 text-center hud-corner relative"
      style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
      <span className="c-tr"/><span className="c-bl"/>
      <Sparkles size={24} className="mx-auto mb-2" style={{color:COLORS.cyan}}/>
      <p className="text-xs tracking-widest font-bold" style={{color:COLORS.cyan}}>{title}</p>
      <p className="text-[11px] mt-1 tracking-wide" style={{color:"var(--cr-fgMuted)"}}>{subtitle}</p>
    </div>
  );
}

/* ---------- GrowthChart ---------- */

function GrowthChart({ skills }: { skills: CareerSkill[] }) {
  const W = 280, H = 90, PAD = 8;
  const series = useMemo(() => {
    const byDay = new Map<string, Map<string, number>>();
    for (const s of skills) {
      const points = [...(s.growth || [])].sort((a, b) => a.date.localeCompare(b.date));
      let current: number | null = null;
      if (points.length === 0) {
        const t = new Date().toISOString().slice(0, 10);
        const m = byDay.get(t) || new Map<string, number>();
        m.set(s.id, s.proficiency);
        byDay.set(t, m);
        continue;
      }
      const start = new Date(points[0].date);
      const end = new Date();
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        const hit = points.find(p => p.date === key);
        if (hit) current = hit.level;
        if (current != null) {
          const m = byDay.get(key) || new Map<string, number>();
          m.set(s.id, current);
          byDay.set(key, m);
        }
      }
    }
    const days = Array.from(byDay.keys()).sort().slice(-21);
    const avg: number[] = [], peak: number[] = [], low: number[] = [];
    for (const d of days) {
      const vs = Array.from(byDay.get(d)!.values());
      avg.push(vs.reduce((a, b) => a + b, 0) / vs.length);
      peak.push(Math.max(...vs));
      low.push(Math.min(...vs));
    }
    return { days, avg, peak, low };
  }, [skills]);

  if (series.days.length < 2) {
    return <div className="text-[11px] py-6 text-center tracking-wide" style={{color:"var(--cr-fgMuted)"}}>
      &gt; log level changes to seed growth curves.
    </div>;
  }

  const xs = (i: number) => PAD + (i / (series.days.length - 1)) * (W - PAD * 2);
  const ys = (v: number) => H - PAD - (v / 10) * (H - PAD * 2);
  const pathFor = (arr: number[]) => arr.map((v, i) => `${i === 0 ? "M" : "L"}${xs(i)},${ys(v)}`).join(" ");

  const avgColor = "#22d3ee";
  const peakColor = "#facc15";
  const lowColor = "rgba(244,114,182,0.55)";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {[2,4,6,8].map(v => (
          <line key={v} x1={PAD} x2={W-PAD} y1={ys(v)} y2={ys(v)} stroke="var(--cr-borderSoft)" strokeDasharray="2 3" strokeWidth={1}/>
        ))}
        <path d={`${pathFor(series.peak)} L${xs(series.days.length-1)},${ys(series.low[series.low.length-1])} ${series.low.slice(0,-1).map((v,i)=>`L${xs(series.low.length-1-i)},${ys(series.low[series.low.length-2-i])}`).reverse().join(" ")} Z`}
              fill="url(#gband)" opacity={0.25}/>
        <defs>
          <linearGradient id="gband" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={peakColor}/>
            <stop offset="100%" stopColor={avgColor}/>
          </linearGradient>
        </defs>
        <path d={pathFor(series.peak)} stroke={peakColor} strokeWidth={1.25} fill="none" opacity={0.6}/>
        <path d={pathFor(series.low)} stroke={lowColor} strokeWidth={1.25} fill="none" opacity={0.6}/>
        <path d={pathFor(series.avg)} stroke={avgColor} strokeWidth={2} fill="none"
              style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }}/>
        {series.avg.map((v,i) => (
          <circle key={i} cx={xs(i)} cy={ys(v)} r={i === series.avg.length-1 ? 3 : 1.5} fill={avgColor}/>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[9px] tracking-widest font-bold mt-1" style={{color:"var(--cr-fgMuted)"}}>
        <span><span style={{color:peakColor}}>■</span> PEAK</span>
        <span><span style={{color:avgColor}}>■</span> AVG LVL</span>
        <span><span style={{color:"#f472b6"}}>■</span> LOW</span>
      </div>
      <div className="flex justify-between text-[9px] mt-0.5 tracking-wide" style={{color:"var(--cr-fgDim)"}}>
        <span>{series.days[0]}</span>
        <span>{series.days[series.days.length-1]}</span>
      </div>
    </div>
  );
}

function TopSkills({ skills }: { skills: CareerSkill[] }) {
  const ranked = useMemo(() => {
    return [...skills]
      .map(s => {
        const growth = s.growth || [];
        const first = growth[0]?.level ?? s.proficiency;
        const delta = s.proficiency - first;
        return { s, delta };
      })
      .sort((a, b) => b.s.proficiency - a.s.proficiency)
      .slice(0, 5);
  }, [skills]);

  if (ranked.length === 0) return null;

  return (
    <div className="mt-3 pt-3" style={{borderTop:"1px dashed var(--cr-borderSoft)"}}>
      <div className="text-[9px] tracking-[0.25em] font-bold mb-2" style={{color:"var(--cr-fgMuted)"}}>TOP · BLADES</div>
      <div className="space-y-1.5">
        {ranked.map(({ s, delta }, i) => (
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span className="w-4 text-center font-black" style={{color: i===0 ? "#facc15" : "var(--cr-fgMuted)"}}>{i+1}</span>
            <span className="flex-1 truncate" style={{color:"var(--cr-fg)"}}>{s.name}</span>
            <span className="font-black" style={{color:COLORS.cyan}}>{s.proficiency}</span>
            {delta !== 0 && (
              <span className="text-[10px] font-bold" style={{color: delta > 0 ? COLORS.green : COLORS.red}}>
                {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
