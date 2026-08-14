"use client";

/**
 * ProjectsHub — SECTOR::09 "unified.hub"
 * Cross-cutting mission control tying every module together:
 *   - Active roadmaps + live progress donuts
 *   - Roadmap "in-flight" projects (milestone CareerProject items)
 *   - Portfolio projects (shipped wins)
 *   - Active job pipeline (apps beyond applied stage)
 *   - Skill heatmap (hot skills vs skills needing love)
 *   - Upcoming follow-ups (network + jobs)
 *   - Today's focus (from daily standup)
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FolderKanban, Map as MapIcon, Trophy, Briefcase, Brain, Users,
  ClipboardList, TrendingUp, AlertCircle, CheckCircle2, Clock, Target,
  Flame, Zap, ArrowRight, Sparkles, Calendar, Building2, Cpu,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { CareerProject, JobApplication, PortfolioProject, CareerRoadmap, CareerSkill } from "../../../lib/careerTypes";

const CYAN = "var(--cr-accent)";
const VIOLET = "var(--cr-violet,#a78bfa)";
const PINK = "var(--cr-pink,#f472b6)";
const GREEN = "var(--cr-accent3)";
const ORANGE = "var(--cr-accent2)";
const YELLOW = "var(--cr-yellow,#facc15)";
const RED = "var(--cr-red,#f87171)";
const MUTED = "var(--cr-fgMuted)";
const CARD = "var(--cr-card)";
const CARD2 = "var(--cr-card2)";
const BORDER = "var(--cr-border)";
const BORDER_SOFT = "var(--cr-borderSoft)";
const FG = "var(--cr-fg)";

function HudCorner({ color = CYAN }: { color?: string }) {
  return (
    <>
      <span className="pointer-events-none absolute top-0 left-0 w-3 h-3" style={{ borderTop:`1.5px solid ${color}`, borderLeft:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute top-0 right-0 w-3 h-3" style={{ borderTop:`1.5px solid ${color}`, borderRight:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute bottom-0 left-0 w-3 h-3" style={{ borderBottom:`1.5px solid ${color}`, borderLeft:`1.5px solid ${color}` }}/>
      <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3" style={{ borderBottom:`1.5px solid ${color}`, borderRight:`1.5px solid ${color}` }}/>
    </>
  );
}

function Donut({ pct, color, size = 48, stroke = 5 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - clamped/100)} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: "stroke-dashoffset 0.6s" }}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize={size/4.5} fontFamily="monospace" fontWeight="700" fill={color}>{Math.round(clamped)}%</text>
    </svg>
  );
}

function Tile({ label, value, sub, color, icon }: { label: string; value: number|string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="relative rounded-lg p-3 flex items-center gap-3" style={{ background: CARD2, border: `1px solid ${color}44` }}>
      <HudCorner color={color}/>
      <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-mono tracking-[0.25em]" style={{ color: MUTED }}>{label}</div>
        <div className="text-xl font-black font-mono leading-tight" style={{ color }}>{value}</div>
        {sub && <div className="text-[10px] font-mono" style={{ color: MUTED }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionHeader({ code, title, icon, color, href, hint }: {
  code: string; title: string; icon: React.ReactNode; color: string; href: string; hint?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2 mb-2">
      <span className="text-[9px] font-mono tracking-[0.3em]" style={{ color }}>{code}</span>
      <span className="flex items-center gap-1.5 font-mono text-xs tracking-widest font-bold" style={{ color }}>
        {icon} {title}
      </span>
      {hint && <span className="text-[10px] font-mono ml-2 hidden sm:inline" style={{ color: MUTED }}>{hint}</span>}
      <ArrowRight size={12} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" style={{ color }}/>
    </Link>
  );
}

export default function ProjectsHub() {
  const { career } = useStore();

  // ------- Aggregate metrics -------
  const activeRoadmaps = career.roadmaps.filter(r => r.status === "active");
  const completedRoadmaps = career.roadmaps.filter(r => r.status === "completed");
  const pausedRoadmaps = career.roadmaps.filter(r => r.status === "paused");
  const archivedRoadmaps = career.roadmaps.filter(r => r.status === "archived");

  const roadmapStats = useMemo(() => {
    let totalMs = 0, doneMs = 0, totalHours = 0, doneHours = 0;
    activeRoadmaps.forEach(r => r.phases.forEach(ph => ph.milestones.forEach(ms => {
      totalMs++;
      totalHours += ms.hoursEstimate;
      if (ms.done) { doneMs++; doneHours += ms.hoursActual || ms.hoursEstimate; }
    })));
    return { totalMs, doneMs, totalHours, doneHours, pct: totalMs ? Math.round((doneMs/totalMs)*100) : 0 };
  }, [activeRoadmaps]);

  // In-flight projects from roadmap milestones (first 8 incomplete ones across active roadmaps)
  const inflightProjects = useMemo(() => {
    const out: { rp: CareerProject; roadmap: CareerRoadmap; msTitle: string; pct: number }[] = [];
    activeRoadmaps.forEach(r => {
      r.phases.forEach(ph => ph.milestones.forEach(ms => {
        if (!ms.done) ms.projects.forEach(p => {
          const total = (ms.resources.length||0) + (ms.labChecklist.length||0) + 1;
          const done = (ms.resources.filter(x=>x.completed).length + ms.labChecklist.filter(x=>x.done).length + (ms.done?1:0));
          out.push({ rp: p, roadmap: r, msTitle: ms.title, pct: total ? Math.round((done/total)*100) : 0 });
        });
      }));
    });
    return out.slice(0, 6);
  }, [activeRoadmaps]);

  // Active pipeline jobs (beyond "applied" stage)
  const activeJobs = useMemo(() => {
    const active = career.applications.filter(a => !["rejected","ghosted","researching"].includes(a.stage));
    const order: Record<string, number> = {
      applied: 1, "phone-screen": 2, "tech-interview": 3, onsite: 4, offer: 5, accepted: 6,
    };
    return active
      .sort((a,b) => (order[b.stage]||0) - (order[a.stage]||0) || b.appliedAt.localeCompare(a.appliedAt))
      .slice(0, 6);
  }, [career.applications]);

  // Recent portfolio (shipped)
  const shipped = useMemo(() => [...career.projects].filter(p => !p.private).slice(0, 4), [career.projects]);

  // Skill heat: top 3 hot (high proficiency+interest) + bottom 3 cold (low proficiency vs desired)
  const skillHeat = useMemo(() => {
    const hot = [...career.skills]
      .map(s => ({ s, score: s.proficiency * 0.6 + s.interest * 0.4 }))
      .sort((a,b) => b.score - a.score)
      .slice(0, 3).map(x => x.s);
    const cold = [...career.skills]
      .map(s => ({ s, gap: (s.desiredLevel || s.interest) - s.proficiency }))
      .filter(x => x.gap > 0)
      .sort((a,b) => b.gap - a.gap)
      .slice(0, 3).map(x => x.s);
    return { hot, cold };
  }, [career.skills]);

  // Upcoming follow-ups: jobs nextFollowUpAt + network nextFollowUpAt (next 7 days)
  const followUps = useMemo(() => {
    const now = new Date();
    const week = new Date(now.getTime() + 7*86400000);
    const items: { kind: "job"|"contact"; name: string; sub: string; date: string; color: string; overdue: boolean }[] = [];
    career.applications.forEach(a => {
      if (a.nextFollowUpAt) {
        const d = new Date(a.nextFollowUpAt);
        if (d <= week) {
          items.push({ kind: "job", name: a.role, sub: a.companyId ? "" : "", date: a.nextFollowUpAt, color: ORANGE, overdue: d < now });
        }
      }
    });
    career.contacts.forEach(c => {
      if (c.nextFollowUpAt) {
        const d = new Date(c.nextFollowUpAt);
        const iso = new Date(c.nextFollowUpAt).toISOString().slice(0,10);
        if (d <= week) {
          items.push({ kind: "contact", name: c.name, sub: c.company || "", date: iso, color: PINK, overdue: d < now });
        }
      }
    });
    return items.sort((a,b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [career.applications, career.contacts]);

  // Today's focus — meetings/tasks today
  const today = new Date().toISOString().slice(0,10);
  const todaysMeetings = career.meetings.filter(m => m.date === today);
  const openFollowUps = career.meetings.reduce((acc,m) => acc + (m.followUps||[]).filter(f=>!f.done).length, 0);

  // Recent timeline events (last 5)
  const recentTimeline = [...career.timeline].sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="relative rounded-lg p-4" style={{ background: CARD2, border: `1px solid ${GREEN}66` }}>
        <HudCorner color={GREEN}/>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] tracking-[0.3em] font-mono" style={{ color: GREEN }}>SECTOR::09</span>
              <span className="text-[10px] font-mono" style={{ color: MUTED }}>// unified.mission_control</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono tracking-tight flex items-center gap-2" style={{ color: FG }}>
              <FolderKanban size={20} style={{ color: GREEN }}/>
              PROJECTS <span style={{ color: GREEN }}>HUB</span>
            </h2>
            <p className="text-[11px] font-mono mt-1" style={{ color: MUTED }}>
              <span style={{ color: CYAN }}>&gt;</span> roadmap · pipeline · portfolio · network — all in one HUD
            </p>
          </div>
          <div className="text-right text-[10px] font-mono space-y-0.5" style={{ color: MUTED }}>
            <div><span style={{ color: GREEN }} className="inline-block w-1.5 h-1.5 rounded-full animate-pulse mr-1"/>all systems nominal</div>
            <div>tracks::active <span style={{ color: CYAN }}>{activeRoadmaps.length}</span> · archived <span style={{ color: MUTED }}>{archivedRoadmaps.length}</span></div>
          </div>
        </div>
      </div>

      {/* STAT TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <Tile label="ROADMAPS" value={activeRoadmaps.length} sub={`${pausedRoadmaps.length} paused`} color={CYAN} icon={<MapIcon size={16}/>}/>
        <Tile label="MILESTONES" value={`${roadmapStats.doneMs}/${roadmapStats.totalMs}`} sub={`${roadmapStats.pct}% complete`} color={VIOLET} icon={<Target size={16}/>}/>
        <Tile label="HOURS LOGGED" value={`${roadmapStats.doneHours|0}h`} sub={`of ${roadmapStats.totalHours|0}h est.`} color={GREEN} icon={<Clock size={16}/>}/>
        <Tile label="PIPELINE" value={activeJobs.length} sub="active apps" color={ORANGE} icon={<Briefcase size={16}/>}/>
        <Tile label="SHIPPED" value={career.projects.length} sub="portfolio entries" color={YELLOW} icon={<Trophy size={16}/>}/>
        <Tile label="NETWORK" value={career.contacts.length} sub={`${followUps.filter(f=>f.kind==="contact").length} follow-ups`} color={PINK} icon={<Users size={16}/>}/>
      </div>

      {/* MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* ACTIVE ROADMAPS */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={CYAN}/>
            <SectionHeader code="TRK::01" title="ACTIVE TRACKS" icon={<MapIcon size={11}/>} color={CYAN} href="/career/roadmaps" hint="click to open"/>
            {activeRoadmaps.length === 0 && (
              <div className="text-[11px] font-mono text-center py-6" style={{ color: MUTED }}>
                <AlertCircle size={20} className="mx-auto mb-2" style={{ color: ORANGE }}/>
                No active tracks. <Link href="/career/roadmaps" style={{ color: CYAN }}>Forge a roadmap →</Link>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-2.5">
              {activeRoadmaps.map(r => {
                let tot=0, done=0;
                r.phases.forEach(ph => ph.milestones.forEach(ms => { tot++; if (ms.done) done++; }));
                const pct = tot ? Math.round((done/tot)*100) : 0;
                return (
                  <Link key={r.id} href="/career/roadmaps" className="relative rounded-md p-3 block transition hover:brightness-110 group"
                    style={{ background: CARD2, border: `1px solid ${r.color}44`, borderLeft: `3px solid ${r.color}` }}>
                    <div className="flex items-start gap-2.5">
                      <Donut pct={pct} color={r.color} size={44} stroke={4}/>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs font-bold truncate" style={{ color: FG }}>{r.name}</div>
                        <div className="text-[10px] font-mono flex items-center gap-2 mt-0.5" style={{ color: MUTED }}>
                          <span>{r.phases.length} phases</span>
                          <span>·</span>
                          <span>{done}/{tot} done</span>
                        </div>
                        <div className="h-1 mt-1.5 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: r.color, boxShadow: `0 0 6px ${r.color}` }}/>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[9px] font-mono tracking-wider flex-wrap">
                          <span style={{ color: ORANGE }}>LVL {r.startLevel}→{r.targetLevel}</span>
                          <span style={{ color: YELLOW }}>P{r.priority}</span>
                          <span className="ml-auto opacity-0 group-hover:opacity-100 transition" style={{ color: r.color }}>open →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* IN-FLIGHT PROJECTS */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={VIOLET}/>
            <SectionHeader code="WIP::" title="IN-FLIGHT PROJECTS" icon={<Cpu size={11}/>} color={VIOLET} href="/career/roadmaps" hint={`${inflightProjects.length} active`}/>
            {inflightProjects.length === 0 ? (
              <div className="text-[11px] font-mono text-center py-5" style={{ color: MUTED }}>
                <CheckCircle2 size={20} className="mx-auto mb-2" style={{ color: GREEN }}/>
                No active sub-projects. Start one from a roadmap milestone.
              </div>
            ) : (
              <div className="space-y-2">
                {inflightProjects.map((p, i) => (
                  <div key={p.rp.id + i} className="rounded p-2.5 flex items-start gap-2.5"
                    style={{ background: CARD2, border: `1px solid ${BORDER_SOFT}`, borderLeft: `2px solid ${VIOLET}` }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: `${VIOLET}18`, color: VIOLET }}>
                      <Flame size={12}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold" style={{ color: FG }}>{p.rp.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ color: p.roadmap.color, background: `${p.roadmap.color}18`, border: `1px solid ${p.roadmap.color}44` }}>
                          {p.roadmap.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: MUTED }}>↳ {p.msTitle}</div>
                      {p.rp.skillsUsed && p.rp.skillsUsed.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {p.rp.skillsUsed.slice(0,4).map(s => (
                            <span key={s} className="text-[9px] font-mono px-1 py-0.5 rounded"
                              style={{ color: CYAN, background: `${CYAN}12`, border: `1px solid ${CYAN}22` }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono font-bold" style={{ color: p.pct>60?GREEN:p.pct>30?YELLOW:ORANGE }}>{p.pct}%</div>
                      <div className="w-12 h-1 mt-1 rounded overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded" style={{ width: `${p.pct}%`, background: p.pct>60?GREEN:p.pct>30?YELLOW:ORANGE }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SHIPPED */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={YELLOW}/>
            <SectionHeader code="SHIP::" title="SHIPPED WINS" icon={<Trophy size={11}/>} color={YELLOW} href="/career/portfolio"/>
            {shipped.length === 0 ? (
              <div className="text-[11px] font-mono text-center py-5" style={{ color: MUTED }}>
                <Trophy size={20} className="mx-auto mb-2" style={{ color: YELLOW }}/>
                Log your first shipped project in the portfolio.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {shipped.map(p => (
                  <Link key={p.id} href="/career/portfolio" className="rounded p-2.5 block transition hover:brightness-110"
                    style={{ background: CARD2, border: `1px solid ${YELLOW}33`, borderLeft: `2px solid ${YELLOW}` }}>
                    <div className="flex items-start gap-2">
                      <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: YELLOW }}/>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-xs font-bold truncate" style={{ color: FG }}>{p.title}</div>
                        {p.role && <div className="text-[10px] font-mono" style={{ color: YELLOW }}>{p.role}</div>}
                        {p.results && <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: GREEN }}>⚡ {p.results}</div>}
                        {p.technologies && p.technologies.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {p.technologies.slice(0,3).map(t => (
                              <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded"
                                style={{ color: VIOLET, background: `${VIOLET}12`, border: `1px solid ${VIOLET}22` }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-3">
          {/* JOB PIPELINE */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={ORANGE}/>
            <SectionHeader code="PIPE::" title="JOB PIPELINE" icon={<Briefcase size={11}/>} color={ORANGE} href="/career/jobs"/>
            {activeJobs.length === 0 ? (
              <div className="text-[11px] font-mono text-center py-4" style={{ color: MUTED }}>
                <Building2 size={18} className="mx-auto mb-2" style={{ color: MUTED }}/>
                No active applications.
              </div>
            ) : (
              <div className="space-y-1.5">
                {activeJobs.map((a: JobApplication) => {
                  const stageColor = a.stage==="offer"||a.stage==="accepted"?GREEN
                    : a.stage==="onsite"?YELLOW
                    : a.stage==="phone-screen"||a.stage==="tech-interview"?CYAN : ORANGE;
                  return (
                    <Link key={a.id} href="/career/jobs" className="rounded p-2 flex items-center gap-2 block transition hover:brightness-110"
                      style={{ background: CARD2, border: `1px solid ${BORDER_SOFT}` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: stageColor, boxShadow: `0 0 6px ${stageColor}` }}/>
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[11px] font-bold truncate" style={{ color: FG }}>{a.role}</div>
                        {a.recruiter && <div className="text-[10px] font-mono truncate" style={{ color: MUTED }}>via {a.recruiter}</div>}
                      </div>
                      <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded uppercase shrink-0"
                        style={{ color: stageColor, background: `${stageColor}18`, border: `1px solid ${stageColor}44` }}>
                        {a.stage}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOLLOW-UPS */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={PINK}/>
            <SectionHeader code="WAIT::" title="FOLLOW-UPS (7d)" icon={<Calendar size={11}/>} color={PINK} href={followUps.some(f=>f.kind==="job")?"/career/jobs":"/career/network"}/>
            {followUps.length === 0 ? (
              <div className="text-[11px] font-mono text-center py-4" style={{ color: GREEN }}>
                <CheckCircle2 size={18} className="mx-auto mb-2"/>
                Inbox zero. No follow-ups due.
              </div>
            ) : (
              <div className="space-y-1.5">
                {followUps.map((f, i) => (
                  <div key={i} className="rounded p-2 flex items-center gap-2"
                    style={{ background: CARD2, border: `1px solid ${f.overdue ? RED : BORDER_SOFT}`, borderLeft: `2px solid ${f.overdue?RED:f.color}` }}>
                    {f.kind === "job"
                      ? <Briefcase size={11} className="shrink-0" style={{ color: f.color }}/>
                      : <Users size={11} className="shrink-0" style={{ color: f.color }}/>}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11px] truncate" style={{ color: FG, fontWeight: f.overdue ? 700 : 400 }}>{f.name}</div>
                      {f.sub && <div className="text-[10px] font-mono truncate" style={{ color: MUTED }}>{f.sub}</div>}
                    </div>
                    <span className="text-[9px] font-mono shrink-0" style={{ color: f.overdue?RED:MUTED }}>
                      {new Date(f.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SKILL HEAT */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={VIOLET}/>
            <SectionHeader code="SKL::" title="SKILL HEAT" icon={<Brain size={11}/>} color={VIOLET} href="/career/skills"/>
            <div className="space-y-2">
              <div>
                <div className="text-[9px] font-mono tracking-widest mb-1 flex items-center gap-1" style={{ color: GREEN }}>
                  <Flame size={9}/> HOT
                </div>
                {skillHeat.hot.length === 0 ? (
                  <div className="text-[10px] font-mono" style={{ color: MUTED }}>No skills logged.</div>
                ) : skillHeat.hot.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-mono text-[11px] flex-1 truncate" style={{ color: FG }}>{s.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({length:10}).map((_,i) => (
                        <span key={i} className="w-1 h-3 rounded-sm"
                          style={{ background: i < s.proficiency ? GREEN : "rgba(255,255,255,0.08)", boxShadow: i<s.proficiency?`0 0 3px ${GREEN}`:"none" }}/>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono w-5 text-right" style={{ color: GREEN }}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
              <div className="pt-1" style={{ borderTop: `1px dashed ${BORDER_SOFT}` }}>
                <div className="text-[9px] font-mono tracking-widest mb-1 flex items-center gap-1" style={{ color: ORANGE }}>
                  <TrendingUp size={9}/> NEEDS LOVE
                </div>
                {skillHeat.cold.length === 0 ? (
                  <div className="text-[10px] font-mono" style={{ color: MUTED }}>All skills at desired level.</div>
                ) : skillHeat.cold.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-mono text-[11px] flex-1 truncate" style={{ color: FG }}>{s.name}</span>
                    <div className="flex gap-0.5">
                      {Array.from({length:10}).map((_,i) => (
                        <span key={i} className="w-1 h-3 rounded-sm"
                          style={{ background: i < s.proficiency ? ORANGE : "rgba(255,255,255,0.08)" }}/>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono w-5 text-right" style={{ color: ORANGE }}>{s.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TODAY */}
          <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <HudCorner color={YELLOW}/>
            <SectionHeader code="TODAY::" title="TODAY" icon={<ClipboardList size={11}/>} color={YELLOW} href="/career/daily"/>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded p-2 text-center" style={{ background: CARD2, border: `1px solid ${BORDER_SOFT}` }}>
                <div className="text-lg font-black font-mono" style={{ color: YELLOW }}>{todaysMeetings.length}</div>
                <div className="text-[9px] font-mono tracking-widest" style={{ color: MUTED }}>MEETINGS</div>
              </div>
              <div className="rounded p-2 text-center" style={{ background: CARD2, border: `1px solid ${BORDER_SOFT}` }}>
                <div className="text-lg font-black font-mono" style={{ color: openFollowUps>0?ORANGE:GREEN }}>{openFollowUps}</div>
                <div className="text-[9px] font-mono tracking-widest" style={{ color: MUTED }}>OPEN F/U</div>
              </div>
            </div>
          </div>

          {/* RECENT TIMELINE */}
          {recentTimeline.length > 0 && (
            <div className="relative rounded-lg p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <HudCorner color={MUTED}/>
              <div className="text-[9px] font-mono tracking-widest mb-2" style={{ color: MUTED }}>// recent.log</div>
              <div className="space-y-1.5 relative pl-3">
                <div className="absolute left-[5px] top-1 bottom-1 w-px" style={{ background: BORDER_SOFT }}/>
                {recentTimeline.map(ev => {
                  const c: Record<string,string> = {
                    milestone: CYAN, skill: VIOLET, cert: GREEN, job: ORANGE, promotion: YELLOW,
                    project: VIOLET, win: YELLOW, milestone_complete: CYAN,
                  };
                  const col = c[ev.type] || MUTED;
                  return (
                    <div key={ev.id} className="relative">
                      <span className="absolute -left-[9px] top-1 w-2 h-2 rounded-full" style={{ background: col, boxShadow: `0 0 4px ${col}` }}/>
                      <div className="font-mono text-[11px] leading-tight" style={{ color: FG }}>{ev.title}</div>
                      <div className="text-[9px] font-mono" style={{ color: MUTED }}>{ev.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
