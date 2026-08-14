"use client";
/**
 * ProjectDrill — single project detail. Rich editing: brief, why, budget,
 * milestones, stakeholders, premortem, risks, issues, quality checks, comms,
 * health status, obituary-write on kill.
 */
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Hammer, AlertTriangle, CheckCircle2, XCircle, CircleDot,
  Plus, Trash2, Target, Flame, DollarSign, Users, Calendar, Skull,
  ShieldAlert, Bug, ClipboardCheck, MessageSquare, Scale, X, Save,
  Archive, RotateCcw, Send, BookOpen, Briefcase, FileText, Link2,
  FileUp, Factory, Gauge as GaugeIcon, GitBranch, Handshake, ThumbsUp, ThumbsDown,
  PackageOpen, Scroll, Receipt, Activity,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type {
  ForgeProject, ProjectHealth, ProjectMilestone, ProjectStakeholder,
  PremortemItem, RiskItem, IssueItem, QualityCheck, CommsLogEntry,
  ChangeRequest, Resource, QualityMetric, WeeklyReport, GoNoGo,
} from "../../../lib/forgeTypes";
import type { PortfolioProject } from "../../../lib/careerTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

const HEALTH: Record<ProjectHealth, { label: string; color: string; Icon: any }> = {
  "on-track":  { label: "ON TRACK",  color: "#22c55e", Icon: CheckCircle2 },
  "blocked":   { label: "BLOCKED",   color: "#f59e0b", Icon: AlertTriangle },
  "off-track": { label: "OFF TRACK", color: "#ef4444", Icon: XCircle },
  "paused":    { label: "PAUSED",    color: "#94a3b8", Icon: CircleDot },
  "done":      { label: "SHIPPED",   color: "#22c55e", Icon: CheckCircle2 },
  "dead":      { label: "DEAD",      color: "#7f1d1d", Icon: Skull },
};

type Tab = "brief" | "tasks" | "stakeholders" | "risks" | "ops" | "comms" | "post";

export default function ProjectDrill() {
  const router = useRouter();
  const { forge, updateForge, career, updateCareer } = useStore();
  const id = typeof router.query.id === "string" ? router.query.id : Array.isArray(router.query.id) ? router.query.id[0] : "";
  const project = forge.projects.find(p => p.id === id);
  const [tab, setTab] = useState<Tab>("brief");

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center mono text-sm">
        <div className="text-center">
          <Skull size={42} className="mx-auto mb-2" style={{color:"var(--fr-red)"}}/>
          <p style={{color:"var(--fr-fgMuted)"}}>Heat not found.</p>
          <Link href="/projects" className="mono text-[10px] mt-4 inline-block px-3 py-1.5 rounded-sm"
            style={{background:"var(--fr-amber)",color:"#000"}}>← back to foundry</Link>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<ForgeProject>) => updateForge(f => ({
    projects: f.projects.map(x => x.id === project.id ? { ...x, ...p } : x),
  }));
  const patchField = <K extends keyof ForgeProject>(k: K, v: ForgeProject[K]) => patch({ [k]: v } as any);
  const tasks = forge.tasks.filter(t => t.projectId === project.id);
  const doneTasks = tasks.filter(t=>t.status==="done").length;
  const totalMs = project.milestones.length;
  const doneMs = project.milestones.filter(m=>m.done).length;
  const prog = totalMs ? Math.round(doneMs/totalMs*100) : Math.round(doneTasks/Math.max(tasks.length,1)*100);
  const spentPct = project.budget.estimated ? Math.round((project.budget.actual / project.budget.estimated)*100) : 0;
  const overBudget = project.budget.estimated ? project.budget.actual > project.budget.estimated : false;
  const h = HEALTH[project.status];
  const usedHrs = Math.round(tasks.reduce((n,t)=>n+(t.actualMins||0),0)/60);

  const ship = () => {
    const alreadyInPortfolio = project.portfolioLinkId && career.projects.find(p => p.id === project.portfolioLinkId);
    const push = !alreadyInPortfolio && confirm("Push this project to your Career portfolio? (case-study stub)");
    let portfolioId = project.portfolioLinkId;
    if (push) {
      const pid = "pf-" + uid();
      const stub: PortfolioProject = {
        id: pid,
        title: project.title,
        summary: project.brief,
        role: "Builder / Owner",
        category: project.tags?.[0] ?? "project",
        technologies: [...(project.tags ?? [])],
        results: project.successMetrics,
        learnings: "",
        private: false,
        relevanceTags: [...(project.tags ?? [])],
        caseStudy: { problem: project.why, solution: project.scope || project.brief, results: project.successMetrics },
      };
      updateCareer(c => ({ projects: [stub, ...c.projects] }));
      portfolioId = pid;
      window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"PUSHED→PORTFOLIO",sub:project.title,color:"#06b6d4",icon:"briefcase",timeout:3600}}));
    }
    patch({ status:"done", completedAt: today(), archived:true, portfolioLinkId: portfolioId });
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:60}}));
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"SHIPPED",sub:project.title,color:"#22c55e",icon:"check",timeout:3200}}));
  };
  const kill = () => {
    const reason = prompt("Why did this project die?") || "";
    const learned = prompt("What did you learn?") || "";
    patch({
      status:"dead", archived:true,
      obituary: { whyStopped: reason, learned, startAgain: "maybe", date: today() },
    });
    window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#ef4444",count:40}}));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/projects" className="mono text-[10px] tracking-widest px-2 py-1 rounded-sm flex items-center gap-1"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fgMuted)"}}>
          <ArrowLeft size={10}/> FOUNDRY
        </Link>
      </div>

      {/* Hero plate */}
      <div className="rounded-sm steel-plate p-6 relative overflow-hidden" style={{borderColor:`${project.color}88`}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="absolute left-0 top-0 bottom-0 w-[5px]"
          style={{background:`linear-gradient(180deg,${project.color},${project.color}80)`,boxShadow:`0 0 14px ${project.color}`}}/>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="text-5xl w-20 h-20 rounded-sm flex items-center justify-center"
              style={{background:`${project.color}22`,border:`2.5px solid ${project.color}77`}}>{project.icon}</div>
            <div>
              <div className="flex items-center gap-2 mono text-[11px] tracking-[0.3em]" style={{color:project.color}}>
                {project.codename}
                <span className="px-2 py-0.5 rounded-sm flex items-center gap-1"
                  style={{background:`${h.color}22`,color:h.color,border:`1px solid ${h.color}55`}}>
                  <h.Icon size={10}/>{h.label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mt-1">{project.title}</h1>
              {project.brief && <p className="pencil text-sm italic mt-1 max-w-2xl" style={{color:"var(--fr-fgMuted)"}}>{project.brief}</p>}
              <div className="flex items-center gap-3 mt-2 mono text-[10px] tracking-widest flex-wrap">
                <span style={{color:project.color}}>P{project.priority}</span>
                <span style={{color:"var(--fr-fgDim)"}}>·</span>
                <span style={{color:"var(--fr-fgMuted)"}}>E{project.energyDemand} / C{project.complexity}</span>
                {project.deadline && <><span style={{color:"var(--fr-fgDim)"}}>·</span><span style={{color:"var(--fr-fgMuted)"}}>⏳ {project.deadline}</span></>}
                <span style={{color:"var(--fr-fgDim)"}}>·</span>
                <span style={{color:"var(--fr-fgMuted)"}}>⏱ {usedHrs}h logged</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-1">
              {project.status!=="done" && project.status!=="dead" && (
                <button onClick={ship}
                  className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm flex items-center gap-1"
                  style={{background:"var(--fr-green)",color:"#000",boxShadow:"0 0 14px #22c55e66"}}>
                  <Hammer size={11}/> SHIP IT
                </button>
              )}
              {project.status!=="dead" && project.status!=="done" && (
                <button onClick={kill}
                  className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm flex items-center gap-1"
                  style={{background:"transparent",border:"1px solid #ef4444",color:"#ef4444"}}>
                  <Skull size={11}/> KILL
                </button>
              )}
              {project.archived && (
                <button onClick={()=>patch({archived:false,status:project.status==="dead"?"paused":project.status})}
                  className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm flex items-center gap-1"
                  style={{background:"transparent",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fgMuted)"}}>
                  <RotateCcw size={11}/> REHEAT
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="grid md:grid-cols-3 gap-4 mt-5">
          <Gauge label="PROGRESS" value={`${prog}%`} pct={prog} color={project.color}/>
          <Gauge label={overBudget?"BUDGET (OVER)":"BUDGET"}
            value={`${project.budget.currency}${project.budget.actual}${project.budget.estimated?` / ${project.budget.estimated}`:""}`}
            pct={project.budget.estimated?Math.min(120,spentPct):0}
            color={overBudget?"#ef4444":"#22c55e"}/>
          <Gauge label="TASKS" value={`${doneTasks}/${tasks.length}`}
            pct={tasks.length?Math.round(doneTasks/tasks.length*100):0} color="#06b6d4"/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {([
          ["brief","BRIEF", Target],
          ["tasks","TASKS", Hammer],
          ["stakeholders","CREW", Users],
          ["risks","RISKS", ShieldAlert],
          ["ops","OPS", Factory],
          ["comms","COMMS", MessageSquare],
          ["post","POST-MORTEM", BookOpen],
        ] as const).map(([id,lbl,Icon])=>(
          <button key={id} onClick={()=>setTab(id as Tab)}
            className="mono text-[10px] md:text-xs tracking-widest font-black px-3 py-2 rounded-sm flex items-center gap-1.5"
            style={{
              background:tab===id?`${project.color}28`:"var(--fr-card2)",
              color:tab===id?project.color:"var(--fr-fgMuted)",
              border:`1px solid ${tab===id?`${project.color}88`:"var(--fr-borderSoft)"}`,
            }}>
            <Icon size={11}/>{lbl}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab==="brief" && <motion.div key="b" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="grid md:grid-cols-2 gap-4">
          <SectionPlate icon={<Target size={14}/>} title="THE BRIEF" color={project.color}>
            <LabeledArea label="Brief / goal" value={project.brief} onChange={v=>patchField("brief",v)} placeholder="What are you building?"/>
            <LabeledArea label="Why this matters" value={project.why} onChange={v=>patchField("why",v)} placeholder="The manifesto — re-read when motivation fades." mono={false}/>
            <LabeledArea label="Success metrics" value={project.successMetrics} onChange={v=>patchField("successMetrics",v)} placeholder="What does DONE look like? Numbers."/>
            <LabeledArea label="Rejection criteria" value={project.rejectionCriteria} onChange={v=>patchField("rejectionCriteria",v)} placeholder="When do you kill this? Define it now."/>
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput type="date" label="Deadline" value={project.deadline||""} onChange={v=>patchField("deadline",v||undefined)}/>
              <LabeledInput label="Check-in" value={project.checkinFreq} onChange={v=>patchField("checkinFreq",v as any)} type="select"
                options={[{k:"daily",v:"DAILY"},{k:"weekly",v:"WEEKLY"},{k:"biweekly",v:"BIWEEKLY"},{k:"monthly",v:"MONTHLY"}]}/>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <LabeledSlider label="Priority" value={project.priority} min={1} max={10} onChange={v=>patchField("priority",v)} color={project.color}/>
              <LabeledSlider label="Energy" value={project.energyDemand} min={1} max={10} onChange={v=>patchField("energyDemand",v)} color="#fb923c"/>
              <LabeledSlider label="Complexity" value={project.complexity} min={1} max={10} onChange={v=>patchField("complexity",v)} color="#a78bfa"/>
            </div>
          </SectionPlate>

          <SectionPlate icon={<Flame size={14}/>} title="HEALTH & BUDGET" color={project.color}>
            <div>
              <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>HEAT STATUS</div>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(HEALTH) as ProjectHealth[]).map(hs => {
                  const hx = HEALTH[hs];
                  const active = project.status===hs;
                  return (
                    <button key={hs} onClick={()=>patchField("status",hs)}
                      className="mono text-[9px] font-black tracking-widest py-2 rounded-sm flex items-center justify-center gap-1"
                      style={{
                        background: active?`${hx.color}22`:"var(--fr-card2)",
                        color: active?hx.color:"var(--fr-fgMuted)",
                        border:`1px solid ${active?hx.color:"var(--fr-borderSoft)"}`,
                      }}>
                      <hx.Icon size={10}/>{hx.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <LabeledInput type="number" label="Est. budget" value={project.budget.estimated??""} onChange={v=>patch({budget:{...project.budget,estimated:Number(v)||undefined}})}/>
              <div>
                <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>ACTUAL SPENT</div>
                <div className="flex items-center gap-2">
                  <input type="number" value={project.budget.actual||0} onChange={e=>patch({budget:{...project.budget,actual:Number(e.target.value)||0}})}
                    className="flex-1 bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
                    style={{background:"var(--fr-card2)",border:`1px solid ${overBudget?"#ef4444":"var(--fr-borderSoft)"}`,color:"var(--fr-fg)"}}/>
                  <button onClick={()=>patch({budget:{...project.budget,actual:(project.budget.actual||0)+50}})}
                    className="mono text-[9px] font-black tracking-widest px-2 py-1.5 rounded-sm"
                    style={{background:"var(--fr-amber)",color:"#000"}}>+$50</button>
                </div>
              </div>
            </div>
            <LabeledArea label="Scope baseline" value={project.scope} onChange={v=>patchField("scope",v)} placeholder="In-scope / out-of-scope."/>
            <LabeledArea label="Goal alignment" value={project.goalAlignment||""} onChange={v=>patchField("goalAlignment",v)} placeholder="Which career/life goals does this heat fuel?"/>
            <div>
              <div className="mono text-[9px] tracking-widest mb-1 flex items-center gap-1" style={{color:"var(--fr-fgMuted)"}}>
                <Link2 size={10}/> FILE LINKS
              </div>
              <div className="space-y-1">
                {(project.fileLinks||[]).map((fl,i)=>(
                  <div key={i} className="flex gap-1">
                    <input value={fl.label} onChange={e=>patch({fileLinks:(project.fileLinks||[]).map((x,j)=>j===i?{...x,label:e.target.value}:x)})}
                      placeholder="label" className="w-24 bg-transparent outline-none mono text-[11px] px-2 py-1 rounded-sm"
                      style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                    <input value={fl.path} onChange={e=>patch({fileLinks:(project.fileLinks||[]).map((x,j)=>j===i?{...x,path:e.target.value}:x)})}
                      placeholder="path or URL" className="flex-1 bg-transparent outline-none mono text-[11px] px-2 py-1 rounded-sm"
                      style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                    <button onClick={()=>patch({fileLinks:(project.fileLinks||[]).filter((_,j)=>j!==i)})}
                      style={{color:"var(--fr-red)"}}><X size={11}/></button>
                  </div>
                ))}
                <button onClick={()=>patch({fileLinks:[...(project.fileLinks||[]),{label:"",path:""}]})}
                  className="mono text-[10px] tracking-widest py-1 px-2 rounded-sm"
                  style={{color:"#a78bfa",border:"1px dashed #a78bfa66"}}>+ ADD LINK</button>
              </div>
            </div>
            <LabeledArea label="Handover doc" value={project.handoverDoc||""} onChange={v=>patchField("handoverDoc",v)} placeholder="If you handed this off tomorrow, what would they need?" mono={true}/>
            <LabeledArea label="Continuity plan" value={project.continuityPlan||""} onChange={v=>patchField("continuityPlan",v)} placeholder="What happens if you get sick / pulled away?" mono={true}/>
          </SectionPlate>

          <SectionPlate icon={<DollarSign size={14}/>} title="MILESTONES" color={project.color} className="md:col-span-2">
            <div className="space-y-2">
              {project.milestones.map(m=>(
                <MilestoneRow key={m.id} m={m} color={project.color}
                  onToggle={()=>patch({milestones:project.milestones.map(x=>x.id===m.id?{...x,done:!x.done,doneAt:!x.done?today():undefined}:x)})}
                  onDel={()=>patch({milestones:project.milestones.filter(x=>x.id!==m.id)})}
                  onPatch={(p)=>patch({milestones:project.milestones.map(x=>x.id===m.id?{...x,...p}:x)})}/>
              ))}
              <button onClick={()=>patch({milestones:[...project.milestones,{id:uid(),title:"",date:today(),done:false}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest flex items-center justify-center gap-1"
                style={{color:project.color,border:`1px dashed ${project.color}66`}}>
                <Plus size={11}/> ADD MILESTONE
              </button>
            </div>
            {project.milestones.filter(m=>m.date).length >= 2 && <GanttMini milestones={project.milestones} color={project.color}/>}
          </SectionPlate>

          <SectionPlate icon={<AlertTriangle size={14}/>} title="PREMORTEM (5 FAILURES)" color="#ef4444" className="md:col-span-2">
            <div className="space-y-2">
              {project.premortem.map((p,i)=>(
                <PremortemRow key={p.id} p={p} idx={i+1}
                  onDel={()=>patch({premortem:project.premortem.filter(x=>x.id!==p.id)})}
                  onPatch={(pp)=>patch({premortem:project.premortem.map(x=>x.id===p.id?{...x,...pp}:x)})}/>
              ))}
              {project.premortem.length<5 && (
                <button onClick={()=>patch({premortem:[...project.premortem,{id:uid(),failure:"",mitigation:"",likelihood:"med"}]})}
                  className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                  style={{color:"#ef4444",border:"1px dashed #ef444466"}}>+ ADD FAILURE MODE ({5-project.premortem.length} left)</button>
              )}
            </div>
          </SectionPlate>
        </motion.div>}

        {tab==="tasks" && <motion.div key="t" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          <TaskPanel project={project}/>
        </motion.div>}

        {tab==="stakeholders" && <motion.div key="s" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
          <SectionPlate icon={<Users size={14}/>} title="CREW & ALLIES" color="#06b6d4">
            <PowerInterestMatrix stakeholders={project.stakeholders} color="#06b6d4"/>
            <div className="grid md:grid-cols-2 gap-2 mt-4">
              {project.stakeholders.map(s=>(
                <div key={s.id} className="p-2 rounded-sm space-y-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                  <div className="flex items-center gap-1">
                    <input value={s.name} onChange={e=>patch({stakeholders:project.stakeholders.map(x=>x.id===s.id?{...x,name:e.target.value}:x)})}
                      placeholder="Name" className="flex-1 bg-transparent outline-none text-sm font-bold" style={{color:"var(--fr-fg)"}}/>
                    <button onClick={()=>patch({stakeholders:project.stakeholders.filter(x=>x.id!==s.id)})}
                      style={{color:"var(--fr-red)"}}><Trash2 size={11}/></button>
                  </div>
                  <input value={s.role||""} onChange={e=>patch({stakeholders:project.stakeholders.map(x=>x.id===s.id?{...x,role:e.target.value}:x)})}
                    placeholder="Role" className="w-full bg-transparent outline-none pencil text-xs italic" style={{color:"var(--fr-fgMuted)"}}/>
                  <div className="grid grid-cols-3 gap-1">
                    <select value={s.power} onChange={e=>patch({stakeholders:project.stakeholders.map(x=>x.id===s.id?{...x,power:e.target.value as any}:x)})}
                      className="bg-transparent outline-none mono text-[9px] tracking-widest px-1 py-1 rounded-sm"
                      style={{background:"var(--fr-card)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
                      <option value="low">PWR:LOW</option><option value="med">PWR:MED</option><option value="high">PWR:HIGH</option>
                    </select>
                    <select value={s.interest} onChange={e=>patch({stakeholders:project.stakeholders.map(x=>x.id===s.id?{...x,interest:e.target.value as any}:x)})}
                      className="bg-transparent outline-none mono text-[9px] tracking-widest px-1 py-1 rounded-sm"
                      style={{background:"var(--fr-card)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
                      <option value="low">INT:LOW</option><option value="med">INT:MED</option><option value="high">INT:HIGH</option>
                    </select>
                    <select value={s.stance} onChange={e=>patch({stakeholders:project.stakeholders.map(x=>x.id===s.id?{...x,stance:e.target.value as any}:x)})}
                      className="bg-transparent outline-none mono text-[9px] tracking-widest px-1 py-1 rounded-sm"
                      style={{background:"var(--fr-card)",border:"1px solid var(--fr-borderSoft)",color:stanceColor(s.stance)}}>
                      <option value="champion">CHAMPION</option><option value="ally">ALLY</option><option value="decision-maker">DECIDER</option>
                      <option value="influencer">INFL'CER</option><option value="neutral">NEUTRAL</option><option value="opponent">OPPONENT</option>
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={()=>patch({stakeholders:[...project.stakeholders,{id:uid(),name:"",power:"med",interest:"med",stance:"neutral"}]})}
                className="py-3 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#06b6d4",border:"1px dashed #06b6d466"}}>+ ADD CREW MEMBER</button>
            </div>
            <p className="pencil text-[11px] italic mt-3" style={{color:"var(--fr-fgMuted)"}}>
              Matrix quadrants: top-right = manage closely · top-left = keep satisfied · bottom-right = keep informed · bottom-left = monitor.
            </p>
          </SectionPlate>
        </motion.div>}

        {tab==="risks" && <motion.div key="r" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
          <SectionPlate icon={<ShieldAlert size={14}/>} title="RISK REGISTER" color="#ef4444">
            <div className="space-y-2">
              {project.risks.map(r=>(
                <RiskRow key={r.id} r={r}
                  onDel={()=>patch({risks:project.risks.filter(x=>x.id!==r.id)})}
                  onPatch={(rp)=>patch({risks:project.risks.map(x=>x.id===r.id?{...x,...rp}:x)})}/>
              ))}
              <button onClick={()=>patch({risks:[...project.risks,{id:uid(),description:"",probability:"med",impact:"med",mitigation:"",contingency:"",status:"open"}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#ef4444",border:"1px dashed #ef444466"}}>+ ADD RISK</button>
            </div>
          </SectionPlate>
          <SectionPlate icon={<Bug size={14}/>} title="ISSUE LOG" color="#f59e0b">
            <div className="space-y-2">
              {project.issues.map(i=>(
                <IssueRow key={i.id} i={i}
                  onDel={()=>patch({issues:project.issues.filter(x=>x.id!==i.id)})}
                  onPatch={(ip)=>patch({issues:project.issues.map(x=>x.id===i.id?{...x,...ip}:x)})}/>
              ))}
              <button onClick={()=>patch({issues:[...project.issues,{id:uid(),description:"",impact:"",priority:"med",status:"open",createdAt:today()}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#f59e0b",border:"1px dashed #f59e0b66"}}>+ ADD ISSUE</button>
            </div>
          </SectionPlate>
          <SectionPlate icon={<ClipboardCheck size={14}/>} title="QUALITY CHECKLIST" color="#22c55e">
            <div className="space-y-1.5">
              {project.qualityChecks.map(q=>(
                <div key={q.id} className="flex items-center gap-2 p-2 rounded-sm" style={{background:"var(--fr-card2)"}}>
                  <button onClick={()=>patch({qualityChecks:project.qualityChecks.map(x=>x.id===q.id?{...x,done:!x.done}:x)})}
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{background:q.done?"#22c55e":"transparent",border:`1.5px solid ${q.done?"#22c55e":"var(--fr-fgMuted)"}`}}>
                    {q.done && <CheckCircle2 size={12} color="#000"/>}
                  </button>
                  <input value={q.label} onChange={e=>patch({qualityChecks:project.qualityChecks.map(x=>x.id===q.id?{...x,label:e.target.value}:x)})}
                    className={`flex-1 bg-transparent outline-none text-sm ${q.done?"line-through opacity-60":""}`}
                    style={{color:"var(--fr-fg)"}}/>
                  <button onClick={()=>patch({qualityChecks:project.qualityChecks.filter(x=>x.id!==q.id)})}
                    className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><X size={10}/></button>
                </div>
              ))}
              <button onClick={()=>patch({qualityChecks:[...project.qualityChecks,{id:uid(),label:"",done:false}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#22c55e",border:"1px dashed #22c55e66"}}>+ ADD CHECK</button>
            </div>
          </SectionPlate>
        </motion.div>}

        {tab==="ops" && <motion.div key="o" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">
          {/* Change requests */}
          <SectionPlate icon={<GitBranch size={14}/>} title="CHANGE REQUESTS" color="#a78bfa">
            <div className="space-y-2">
              {(project.changeRequests||[]).map(cr=>(
                <div key={cr.id} className="p-2 rounded-sm space-y-1" style={{background:"var(--fr-card2)",border:`1px solid ${cr.approved==="approved"?"#22c55e66":cr.approved==="rejected"?"#ef444466":"#a78bfa55"}`}}>
                  <div className="flex items-center gap-1">
                    <input type="date" value={cr.date} onChange={e=>patch({changeRequests:(project.changeRequests||[]).map(x=>x.id===cr.id?{...x,date:e.target.value}:x)})}
                      className="bg-transparent outline-none mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}/>
                    <select value={cr.approved} onChange={e=>patch({changeRequests:(project.changeRequests||[]).map(x=>x.id===cr.id?{...x,approved:e.target.value as any}:x)})}
                      className="bg-transparent outline-none mono text-[9px] tracking-widest ml-auto"
                      style={{color:cr.approved==="approved"?"#22c55e":cr.approved==="rejected"?"#ef4444":"#f59e0b"}}>
                      <option value="pending">PENDING</option><option value="approved">APPROVED</option><option value="rejected">REJECTED</option>
                    </select>
                    <button onClick={()=>patch({changeRequests:(project.changeRequests||[]).filter(x=>x.id!==cr.id)})} style={{color:"var(--fr-red)"}}><X size={10}/></button>
                  </div>
                  <input value={cr.description} onChange={e=>patch({changeRequests:(project.changeRequests||[]).map(x=>x.id===cr.id?{...x,description:e.target.value}:x)})}
                    placeholder="Change description..." className="w-full bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
                  <input value={cr.reason} onChange={e=>patch({changeRequests:(project.changeRequests||[]).map(x=>x.id===cr.id?{...x,reason:e.target.value}:x)})}
                    placeholder="Reason" className="w-full bg-transparent outline-none pencil text-xs italic" style={{color:"var(--fr-fgMuted)"}}/>
                  <input value={cr.impact} onChange={e=>patch({changeRequests:(project.changeRequests||[]).map(x=>x.id===cr.id?{...x,impact:e.target.value}:x)})}
                    placeholder="Impact (scope/budget/schedule)" className="w-full bg-transparent outline-none mono text-[10px]" style={{color:"var(--fr-amber)"}}/>
                </div>
              ))}
              <button onClick={()=>patch({changeRequests:[...(project.changeRequests||[]),{id:uid(),date:today(),description:"",reason:"",impact:"",approved:"pending"}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#a78bfa",border:"1px dashed #a78bfa66"}}>+ ADD CHANGE REQUEST</button>
            </div>
          </SectionPlate>

          {/* Resources */}
          <SectionPlate icon={<PackageOpen size={14}/>} title="RESOURCES" color="#06b6d4">
            <div className="space-y-2">
              {(project.resources||[]).map(r=>{
                const pct = r.allocated?Math.round(r.used/r.allocated*100):0;
                const over = r.allocated && r.used>r.allocated;
                return (
                  <div key={r.id} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                    <div className="flex items-center gap-2">
                      <input value={r.name} onChange={e=>patch({resources:(project.resources||[]).map(x=>x.id===r.id?{...x,name:e.target.value}:x)})}
                        placeholder="Resource" className="flex-1 bg-transparent outline-none text-sm font-bold" style={{color:"var(--fr-fg)"}}/>
                      <select value={r.kind} onChange={e=>patch({resources:(project.resources||[]).map(x=>x.id===r.id?{...x,kind:e.target.value as any}:x)})}
                        className="bg-transparent outline-none mono text-[9px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>
                        <option value="people">PEOPLE</option><option value="budget">BUDGET</option>
                        <option value="equipment">EQUIP</option><option value="software">SW</option>
                      </select>
                      <button onClick={()=>patch({resources:(project.resources||[]).filter(x=>x.id!==r.id)})} style={{color:"var(--fr-red)"}}><X size={10}/></button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1 mono text-[10px]">
                      <label className="flex items-center gap-1"><span style={{color:"var(--fr-fgMuted)"}}>ALL:</span>
                        <input type="number" value={r.allocated} onChange={e=>patch({resources:(project.resources||[]).map(x=>x.id===r.id?{...x,allocated:Number(e.target.value)||0}:x)})}
                          className="w-full bg-transparent outline-none" style={{color:"var(--fr-fg)"}}/></label>
                      <label className="flex items-center gap-1"><span style={{color:"var(--fr-fgMuted)"}}>USED:</span>
                        <input type="number" value={r.used} onChange={e=>patch({resources:(project.resources||[]).map(x=>x.id===r.id?{...x,used:Number(e.target.value)||0}:x)})}
                          className="w-full bg-transparent outline-none" style={{color:"var(--fr-fg)"}}/></label>
                      <label className="flex items-center gap-1"><span style={{color:"var(--fr-fgMuted)"}}>UNIT:</span>
                        <input value={r.unit} onChange={e=>patch({resources:(project.resources||[]).map(x=>x.id===r.id?{...x,unit:e.target.value}:x)})}
                          className="w-full bg-transparent outline-none" style={{color:"var(--fr-fg)"}}/></label>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{background:"var(--fr-borderSoft)"}}>
                      <div className="h-full rounded-full" style={{width:`${Math.min(100,pct)}%`,background:over?"#ef4444":"#06b6d4",boxShadow:`0 0 6px ${over?"#ef4444":"#06b6d4"}`}}/>
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>patch({resources:[...(project.resources||[]),{id:uid(),name:"",kind:"people",allocated:0,used:0,unit:"hrs"}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#06b6d4",border:"1px dashed #06b6d466"}}>+ ADD RESOURCE</button>
            </div>
          </SectionPlate>

          {/* Quality metrics */}
          <SectionPlate icon={<GaugeIcon size={14}/>} title="QUALITY METRICS" color="#22c55e">
            <div className="space-y-2">
              {(project.qualityMetrics||[]).map(q=>(
                <div key={q.id} className="p-2 rounded-sm flex items-center gap-2" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                  <input value={q.label} onChange={e=>patch({qualityMetrics:(project.qualityMetrics||[]).map(x=>x.id===q.id?{...x,label:e.target.value}:x)})}
                    placeholder="Metric" className="flex-1 bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
                  <input type="number" value={q.actual??""} onChange={e=>patch({qualityMetrics:(project.qualityMetrics||[]).map(x=>x.id===q.id?{...x,actual:Number(e.target.value)}:x)})}
                    placeholder="actual" className="w-16 bg-transparent outline-none mono text-xs" style={{color:"var(--fr-fg)"}}/>
                  <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>/</span>
                  <input type="number" value={q.target} onChange={e=>patch({qualityMetrics:(project.qualityMetrics||[]).map(x=>x.id===q.id?{...x,target:Number(e.target.value)||0}:x)})}
                    className="w-16 bg-transparent outline-none mono text-xs" style={{color:"var(--fr-green)"}}/>
                  <input value={q.unit} onChange={e=>patch({qualityMetrics:(project.qualityMetrics||[]).map(x=>x.id===q.id?{...x,unit:e.target.value}:x)})}
                    className="w-12 bg-transparent outline-none mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}/>
                  <button onClick={()=>patch({qualityMetrics:(project.qualityMetrics||[]).filter(x=>x.id!==q.id)})} style={{color:"var(--fr-red)"}}><X size={10}/></button>
                </div>
              ))}
              <button onClick={()=>patch({qualityMetrics:[...(project.qualityMetrics||[]),{id:uid(),label:"",target:100,unit:"%"}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#22c55e",border:"1px dashed #22c55e66"}}>+ ADD METRIC</button>
            </div>
          </SectionPlate>

          {/* Cost / benefit calculator */}
          <SectionPlate icon={<Receipt size={14}/>} title="COST / BENEFIT" color="#f59e0b">
            <div className="grid grid-cols-3 gap-2">
              <LabeledInput type="number" label="One-time cost" value={(project.costBenefit as any)?.oneTimeCost??0} onChange={(v:number)=>patch({costBenefit:{...(project.costBenefit||{oneTimeCost:0,ongoingCost:0,projectedBenefit:0}),oneTimeCost:v}})}/>
              <LabeledInput type="number" label="Ongoing/mo" value={(project.costBenefit as any)?.ongoingCost??0} onChange={(v:number)=>patch({costBenefit:{...(project.costBenefit||{oneTimeCost:0,ongoingCost:0,projectedBenefit:0}),ongoingCost:v}})}/>
              <LabeledInput type="number" label="Benefit/mo" value={(project.costBenefit as any)?.projectedBenefit??0} onChange={(v:number)=>patch({costBenefit:{...(project.costBenefit||{oneTimeCost:0,ongoingCost:0,projectedBenefit:0}),projectedBenefit:v}})}/>
            </div>
            {(() => {
              const cb = project.costBenefit || {oneTimeCost:0,ongoingCost:0,projectedBenefit:0};
              const net = cb.projectedBenefit - cb.ongoingCost;
              const payback = net>0 ? Math.ceil(cb.oneTimeCost/net) : null;
              return (
                <div className="grid grid-cols-2 gap-2 mt-2 mono text-[10px]">
                  <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                    <div style={{color:"var(--fr-fgMuted)"}}>NET/MO</div>
                    <div className="text-lg font-black" style={{color:net>=0?"#22c55e":"#ef4444"}}>{project.budget.currency}{net}</div>
                  </div>
                  <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                    <div style={{color:"var(--fr-fgMuted)"}}>PAYBACK</div>
                    <div className="text-lg font-black" style={{color:payback?"var(--fr-amber)":"var(--fr-fgDim)"}}>{payback?`${payback} mo`:"—"}</div>
                  </div>
                </div>
              );
            })()}
            <LabeledArea label="Social / non-financial impact" value={(project.budgetBenefit as any)?.socialImpact||""}
              onChange={v=>patch({budgetBenefit:{...(project.budgetBenefit||{}),socialImpact:v}})} placeholder="Who benefits beyond the P&L?"/>
          </SectionPlate>

          {/* Weekly reports */}
          <SectionPlate icon={<Scroll size={14}/>} title="WEEKLY REPORTS" color="#ec4899">
            <button onClick={()=>{
              const week = new Date().toISOString().slice(0,10);
              const tasksDone = forge.tasks.filter(t=>t.projectId===project.id && t.completedAt && daysBetween(t.completedAt,week)<=7);
              const patchBody = {
                id: uid(), weekOf: week,
                accomplishments: tasksDone.map(t=>`- ${t.title}`).join("\n"),
                nextWeek: "", blockers: "", risks: "", decisionsNeeded: "",
                mood: 3 as const, hoursLogged: Math.round(tasksDone.reduce((n,t)=>n+(t.actualMins||0),0)/60*10)/10,
              };
              patch({weeklyReports:[patchBody,...(project.weeklyReports||[])]});
            }}
              className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm mb-3 flex items-center gap-1"
              style={{background:"#ec4899",color:"#000"}}><FileUp size={11}/> GENERATE THIS WEEK</button>
            <div className="space-y-2">
              {(project.weeklyReports||[]).map(wr=>(
                <details key={wr.id} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
                  <summary className="mono text-[10px] tracking-widest cursor-pointer flex items-center gap-2" style={{color:"#ec4899"}}>
                    <Calendar size={10}/> week of {wr.weekOf} {wr.hoursLogged?`· ${wr.hoursLogged}h`:""}
                  </summary>
                  <div className="space-y-2 mt-2">
                    <LabeledArea label="Accomplishments" value={wr.accomplishments} onChange={v=>patch({weeklyReports:(project.weeklyReports||[]).map(x=>x.id===wr.id?{...x,accomplishments:v}:x)})}/>
                    <LabeledArea label="Next week" value={wr.nextWeek} onChange={v=>patch({weeklyReports:(project.weeklyReports||[]).map(x=>x.id===wr.id?{...x,nextWeek:v}:x)})}/>
                    <LabeledArea label="Blockers" value={wr.blockers} onChange={v=>patch({weeklyReports:(project.weeklyReports||[]).map(x=>x.id===wr.id?{...x,blockers:v}:x)})}/>
                    <LabeledArea label="Risks" value={wr.risks} onChange={v=>patch({weeklyReports:(project.weeklyReports||[]).map(x=>x.id===wr.id?{...x,risks:v}:x)})}/>
                    <LabeledArea label="Decisions needed" value={wr.decisionsNeeded} onChange={v=>patch({weeklyReports:(project.weeklyReports||[]).map(x=>x.id===wr.id?{...x,decisionsNeeded:v}:x)})}/>
                    <button onClick={()=>patch({weeklyReports:(project.weeklyReports||[]).filter(x=>x.id!==wr.id)})}
                      className="mono text-[10px] tracking-widest" style={{color:"var(--fr-red)"}}>DELETE REPORT</button>
                  </div>
                </details>
              ))}
              {!(project.weeklyReports||[]).length && <p className="pencil text-xs italic" style={{color:"var(--fr-fgMuted)"}}>No reports yet. Hit GENERATE to auto-build from completed tasks.</p>}
            </div>
          </SectionPlate>

          {/* Go / No-Go logger */}
          <SectionPlate icon={<Handshake size={14}/>} title="GO / NO-GO GATE" color="#fb923c">
            <div className="space-y-2">
              {(project.goNoGos||[]).map(g=>(
                <div key={g.id} className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:`1px solid ${g.decision==="go"?"#22c55e66":g.decision==="no-go"?"#ef444466":"#f59e0b66"}`}}>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="date" value={g.date} onChange={e=>patch({goNoGos:(project.goNoGos||[]).map(x=>x.id===g.id?{...x,date:e.target.value}:x)})}
                      className="bg-transparent outline-none mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}/>
                    <select value={g.decision} onChange={e=>patch({goNoGos:(project.goNoGos||[]).map(x=>x.id===g.id?{...x,decision:e.target.value as any}:x)})}
                      className="bg-transparent outline-none mono text-[10px] font-black tracking-widest"
                      style={{color:g.decision==="go"?"#22c55e":g.decision==="no-go"?"#ef4444":"#f59e0b"}}>
                      <option value="go">GO</option><option value="hold">HOLD</option><option value="no-go">NO-GO</option>
                    </select>
                    <button onClick={()=>patch({goNoGos:(project.goNoGos||[]).filter(x=>x.id!==g.id)})} className="ml-auto" style={{color:"var(--fr-red)"}}><X size={10}/></button>
                  </div>
                  <input value={g.rationale} onChange={e=>patch({goNoGos:(project.goNoGos||[]).map(x=>x.id===g.id?{...x,rationale:e.target.value}:x)})}
                    placeholder="Rationale" className="w-full bg-transparent outline-none pencil text-xs italic" style={{color:"var(--fr-fg)"}}/>
                  <input type="date" value={g.nextReview||""} onChange={e=>patch({goNoGos:(project.goNoGos||[]).map(x=>x.id===g.id?{...x,nextReview:e.target.value}:x)})}
                    className="bg-transparent outline-none mono text-[10px] mt-1" style={{color:"var(--fr-fgMuted)"}}/>
                </div>
              ))}
              <div className="flex gap-1">
                <button onClick={()=>patch({goNoGos:[...(project.goNoGos||[]),{id:uid(),date:today(),decision:"go",rationale:""}]})}
                  className="flex-1 py-2 rounded-sm mono text-[10px] font-black tracking-widest" style={{background:"#22c55e",color:"#000"}}><ThumbsUp size={10} className="inline mr-1"/>LOG GO</button>
                <button onClick={()=>patch({goNoGos:[...(project.goNoGos||[]),{id:uid(),date:today(),decision:"hold",rationale:""}]})}
                  className="flex-1 py-2 rounded-sm mono text-[10px] font-black tracking-widest" style={{background:"#f59e0b",color:"#000"}}>HOLD</button>
                <button onClick={()=>patch({goNoGos:[...(project.goNoGos||[]),{id:uid(),date:today(),decision:"no-go",rationale:""}]})}
                  className="flex-1 py-2 rounded-sm mono text-[10px] font-black tracking-widest" style={{background:"#ef4444",color:"#fff"}}><ThumbsDown size={10} className="inline mr-1"/>NO-GO</button>
              </div>
            </div>
          </SectionPlate>

          {/* Regulatory */}
          <SectionPlate icon={<ShieldAlert size={14}/>} title="REGULATORY / COMPLIANCE" color="#7f1d1d">
            <div className="space-y-1">
              {(project.regulatoryChecks||[]).map((r,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 rounded-sm" style={{background:"var(--fr-card2)"}}>
                  <button onClick={()=>patch({regulatoryChecks:(project.regulatoryChecks||[]).map((x,j)=>j===i?{...x,checked:!x.checked}:x)})}
                    className="w-4 h-4 rounded-sm shrink-0"
                    style={{background:r.checked?"#22c55e":"transparent",border:`1.5px solid ${r.checked?"#22c55e":"var(--fr-fgMuted)"}`}}>
                    {r.checked && <CheckCircle2 size={12} color="#000"/>}
                  </button>
                  <input value={r.label} onChange={e=>patch({regulatoryChecks:(project.regulatoryChecks||[]).map((x,j)=>j===i?{...x,label:e.target.value}:x)})}
                    className="flex-1 bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
                  <button onClick={()=>patch({regulatoryChecks:(project.regulatoryChecks||[]).filter((_,j)=>j!==i)})} style={{color:"var(--fr-red)"}}><X size={10}/></button>
                </div>
              ))}
              <button onClick={()=>patch({regulatoryChecks:[...(project.regulatoryChecks||[]),{label:"",checked:false}]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#7f1d1d",border:"1px dashed #7f1d1d66"}}>+ ADD COMPLIANCE CHECK</button>
            </div>
          </SectionPlate>

          {/* Satisfaction pulse */}
          <SectionPlate icon={<Activity size={14}/>} title="SATISFACTION PULSE" color="#22c55e">
            <div className="flex items-center gap-2 mb-2">
              <span className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>Log today:</span>
              {[1,2,3,4,5,6,7,8,9,10].map(n=>(
                <button key={n} onClick={()=>patch({satisfactionLog:[{id:uid(),date:today(),score:n},...(project.satisfactionLog||[])]})}
                  className="w-7 h-7 rounded-sm mono text-[10px] font-black"
                  style={{background:n>=8?"#22c55e33":n>=5?"#f59e0b33":"#ef444433",border:`1px solid ${n>=8?"#22c55e":n>=5?"#f59e0b":"#ef4444"}55`,color:"var(--fr-fg)"}}>{n}</button>
              ))}
            </div>
            {(project.satisfactionLog||[]).length>0 && <SatisfactionSpark log={project.satisfactionLog||[]}/>}
          </SectionPlate>
        </motion.div>}

        {tab==="comms" && <motion.div key="c" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          <SectionPlate icon={<MessageSquare size={14}/>} title="STAKEHOLDER COMMS LOG" color="#a78bfa">
            <div className="space-y-2">
              {project.comms.map(c=>(
                <CommsRow key={c.id} c={c}
                  onDel={()=>patch({comms:project.comms.filter(x=>x.id!==c.id)})}
                  onPatch={(cp)=>patch({comms:project.comms.map(x=>x.id===c.id?{...x,...cp}:x)})}/>
              ))}
              <button onClick={()=>patch({comms:[{id:uid(),date:today(),person:"",channel:"",topic:"",summary:"",actionItems:""},...project.comms]})}
                className="w-full py-2 rounded-sm mono text-[10px] tracking-widest"
                style={{color:"#a78bfa",border:"1px dashed #a78bfa66"}}>+ LOG TOUCHPOINT</button>
            </div>
          </SectionPlate>
        </motion.div>}

        {tab==="post" && <motion.div key="p" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
          <SectionPlate icon={<BookOpen size={14}/>} title="POST-MORTEM / LESSONS" color="#7f1d1d">
            {project.status!=="dead" && !project.obituary && (
              <p className="pencil text-sm italic mb-3" style={{color:"var(--fr-fgMuted)"}}>
                Fill this in when the heat dies — shipped or dead. For now, drop lessons into Smelter.
              </p>
            )}
            {project.obituary && (
              <div className="space-y-3">
                <div>
                  <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-red)"}}>WHY IT STOPPED</div>
                  <textarea defaultValue={project.obituary.whyStopped}
                    onBlur={e=>patch({obituary:{...project.obituary!,whyStopped:e.target.value}})}
                    rows={3} className="w-full bg-transparent outline-none pencil text-sm p-2 rounded-sm resize-none"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </div>
                <div>
                  <div className="mono text-[10px] tracking-widest mb-1" style={{color:"var(--fr-amber)"}}>LEARNED</div>
                  <textarea defaultValue={project.obituary.learned}
                    onBlur={e=>patch({obituary:{...project.obituary!,learned:e.target.value}})}
                    rows={3} className="w-full bg-transparent outline-none pencil text-sm p-2 rounded-sm resize-none"
                    style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
                </div>
                <div className="mono text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>START AGAIN?</div>
                <div className="flex gap-1">
                  {(["yes","maybe","no"] as const).map(v=>(
                    <button key={v} onClick={()=>patch({obituary:{...project.obituary!,startAgain:v}})}
                      className="mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-sm"
                      style={{background:project.obituary!.startAgain===v?"var(--fr-amber)":"transparent",
                              color:project.obituary!.startAgain===v?"#000":"var(--fr-fgMuted)",
                              border:`1px solid ${project.obituary!.startAgain===v?"var(--fr-amber)":"var(--fr-borderSoft)"}`}}>
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!project.obituary && project.status==="done" && (
              <button onClick={()=>patch({obituary:{whyStopped:"shipped",learned:"",startAgain:"no",date:today()}})}
                className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm"
                style={{background:"var(--fr-amber)",color:"#000"}}>+ WRITE POST-MORTEM</button>
            )}
          </SectionPlate>
        </motion.div>}
      </AnimatePresence>
    </div>
  );

  /* ---- helpers below ---- */
}

function Gauge({label,value,pct,color}:{label:string;value:string;pct:number;color:string}) {
  return (
    <div>
      <div className="mono text-[9px] tracking-widest mb-1 flex justify-between">
        <span style={{color:"var(--fr-fgMuted)"}}>{label}</span>
        <span style={{color}}>{value}</span>
      </div>
      <div className="h-2 rounded-sm overflow-hidden" style={{background:"var(--fr-borderSoft)"}}>
        <motion.div initial={{width:0}} animate={{width:`${Math.min(100,pct)}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}}
          className="h-full rounded-sm" style={{background:color,boxShadow:`0 0 8px ${color}`}}/>
      </div>
    </div>
  );
}

function SectionPlate({icon,title,color,children,className=""}:{icon:React.ReactNode;title:string;color:string;children:React.ReactNode;className?:string}) {
  return (
    <div className={`rounded-sm steel-plate p-5 relative ${className}`} style={{borderColor:`${color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="flex items-center gap-2 mb-4">
        <span style={{color}}>{icon}</span>
        <h3 className="mono text-[11px] font-black tracking-[0.25em]" style={{color}}>{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LabeledArea({label,value,onChange,placeholder,mono=true}:{label:string;value?:string;onChange:(v:string)=>void;placeholder?:string;mono?:boolean}) {
  return (
    <div>
      <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>{label}</div>
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}
        className={`w-full bg-transparent outline-none text-sm p-2 rounded-sm resize-none ${mono?"mono":"pencil"}`}
        style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
    </div>
  );
}

function LabeledInput({label,value,onChange,type="text",options}:{label:string;value:any;onChange:(v:any)=>void;type?:string;options?:{k:string;v:string}[]}) {
  return (
    <div>
      <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>{label.toUpperCase()}</div>
      {type==="select" ? (
        <select value={value} onChange={e=>onChange(e.target.value)}
          className="w-full bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          {options?.map(o=><option key={o.k} value={o.k}>{o.v}</option>)}
        </select>
      ) : (
        <input type={type} value={value||""} onChange={e=>onChange(type==="number"?Number(e.target.value):e.target.value)}
          className="w-full bg-transparent outline-none mono text-sm px-2 py-1.5 rounded-sm"
          style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
      )}
    </div>
  );
}

function LabeledSlider({label,value,min=1,max=10,onChange,color}:{label:string;value:number;min?:number;max?:number;onChange:(v:number)=>void;color:string}) {
  return (
    <div>
      <div className="mono text-[9px] tracking-widest mb-1 flex justify-between">
        <span style={{color:"var(--fr-fgMuted)"}}>{label.toUpperCase()}</span>
        <span style={{color}}>{value}/{max}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        className="w-full" style={{accentColor:color}}/>
    </div>
  );
}

function MilestoneRow({m,color,onToggle,onDel,onPatch}:{m:ProjectMilestone;color:string;onToggle:()=>void;onDel:()=>void;onPatch:(p:Partial<ProjectMilestone>)=>void}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-sm"
      style={{background:m.done?"rgba(34,197,94,0.08)":"var(--fr-card2)",border:`1px solid ${m.done?"rgba(34,197,94,0.4)":"var(--fr-borderSoft)"}`}}>
      <button onClick={onToggle}
        className="w-5 h-5 rounded-sm shrink-0 flex items-center justify-center"
        style={{background:m.done?color:"transparent",border:`2px solid ${m.done?color:"var(--fr-fgMuted)"}`}}>
        {m.done && <CheckCircle2 size={12} color="#000"/>}
      </button>
      <input value={m.title} onChange={e=>onPatch({title:e.target.value})} placeholder="Milestone"
        className={`flex-1 bg-transparent outline-none text-sm ${m.done?"line-through opacity-60":""}`}
        style={{color:"var(--fr-fg)"}}/>
      <input type="date" value={m.date||""} onChange={e=>onPatch({date:e.target.value})}
        className="bg-transparent outline-none mono text-[10px] w-32" style={{color:"var(--fr-fgMuted)"}}/>
      <button onClick={onDel} className="opacity-60 hover:opacity-100" style={{color:"var(--fr-red)"}}><X size={11}/></button>
    </div>
  );
}

function PremortemRow({p,idx,onDel,onPatch}:{p:PremortemItem;idx:number;onDel:()=>void;onPatch:(pp:Partial<PremortemItem>)=>void}) {
  return (
    <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
      <div className="flex items-start gap-2">
        <span className="mono text-[10px] font-black tracking-widest mt-1 w-5" style={{color:"#ef4444"}}>#{String(idx).padStart(2,"0")}</span>
        <div className="flex-1 space-y-1">
          <input value={p.failure} onChange={e=>onPatch({failure:e.target.value})} placeholder="Failure mode..."
            className="w-full bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
          <input value={p.mitigation} onChange={e=>onPatch({mitigation:e.target.value})} placeholder="Mitigation strategy"
            className="w-full bg-transparent outline-none pencil text-xs italic" style={{color:"var(--fr-fgMuted)"}}/>
        </div>
        <button onClick={onDel} style={{color:"var(--fr-red)"}}><X size={11}/></button>
      </div>
    </div>
  );
}

function RiskRow({r,onDel,onPatch}:{r:RiskItem;onDel:()=>void;onPatch:(p:Partial<RiskItem>)=>void}) {
  const color = r.status==="mitigated"?"#22c55e":r.probability==="high"&&r.impact==="high"?"#ef4444":"#f59e0b";
  return (
    <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:`1px solid ${color}55`}}>
      <div className="flex items-start gap-2">
        <input value={r.description} onChange={e=>onPatch({description:e.target.value})} placeholder="Risk..."
          className="flex-1 bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
        <button onClick={onDel} style={{color:"var(--fr-red)"}}><X size={11}/></button>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {(["probability","impact"] as const).map(k=>(
          <select key={k} value={(r as any)[k]} onChange={e=>onPatch({[k]:e.target.value} as any)}
            className="bg-transparent outline-none mono text-[9px] tracking-widest px-1 py-1 rounded-sm"
            style={{background:"var(--fr-card)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <option value="low">{k.toUpperCase()}:LOW</option>
            <option value="med">{k.toUpperCase()}:MED</option>
            <option value="high">{k.toUpperCase()}:HIGH</option>
          </select>
        ))}
        <select value={r.status} onChange={e=>onPatch({status:e.target.value as RiskItem["status"]})}
          className="bg-transparent outline-none mono text-[9px] tracking-widest px-1 py-1 rounded-sm"
          style={{background:"var(--fr-card)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <option value="open">OPEN</option>
          <option value="mitigated">MITIGATED</option>
          <option value="occurred">OCCURRED</option>
        </select>
      </div>
    </div>
  );
}

function IssueRow({i,onDel,onPatch}:{i:IssueItem;onDel:()=>void;onPatch:(p:Partial<IssueItem>)=>void}) {
  const pc = i.priority==="crit"?"#ef4444":i.priority==="high"?"#f59e0b":"var(--fr-fgMuted)";
  return (
    <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
      <div className="flex items-start gap-2">
        <input value={i.description} onChange={e=>onPatch({description:e.target.value})} placeholder="Issue..."
          className="flex-1 bg-transparent outline-none text-sm" style={{color:"var(--fr-fg)"}}/>
        <select value={i.priority} onChange={e=>onPatch({priority:e.target.value as IssueItem["priority"]})}
          className="bg-transparent outline-none mono text-[9px] tracking-widest"
          style={{color:pc}}>
          <option value="low">LOW</option>
          <option value="med">MED</option>
          <option value="high">HIGH</option>
          <option value="crit">CRIT</option>
        </select>
        <button onClick={onDel} style={{color:"var(--fr-red)"}}><X size={11}/></button>
      </div>
    </div>
  );
}

function CommsRow({c,onDel,onPatch}:{c:CommsLogEntry;onDel:()=>void;onPatch:(p:Partial<CommsLogEntry>)=>void}) {
  return (
    <div className="p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
      <div className="grid grid-cols-4 gap-1 mb-1">
        <input type="date" value={c.date} onChange={e=>onPatch({date:e.target.value})}
          className="bg-transparent outline-none mono text-[9px]" style={{color:"var(--fr-fgMuted)"}}/>
        <input value={c.person} onChange={e=>onPatch({person:e.target.value})} placeholder="Person"
          className="bg-transparent outline-none mono text-[10px] col-span-1" style={{color:"var(--fr-fg)"}}/>
        <input value={c.channel} onChange={e=>onPatch({channel:e.target.value})} placeholder="Channel"
          className="bg-transparent outline-none mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}/>
        <button onClick={onDel} className="justify-self-end" style={{color:"var(--fr-red)"}}><Trash2 size={10}/></button>
      </div>
      <input value={c.topic} onChange={e=>onPatch({topic:e.target.value})} placeholder="Topic"
        className="w-full bg-transparent outline-none text-sm font-bold" style={{color:"var(--fr-fg)"}}/>
      <textarea value={c.summary} onChange={e=>onPatch({summary:e.target.value})} placeholder="Summary..." rows={2}
        className="w-full bg-transparent outline-none pencil text-xs mt-1 resize-none" style={{color:"var(--fr-fgMuted)"}}/>
      <input value={c.actionItems} onChange={e=>onPatch({actionItems:e.target.value})} placeholder="Action items"
        className="w-full bg-transparent outline-none mono text-[10px] mt-1"
        style={{color:"var(--fr-amber)"}}/>
    </div>
  );
}

function TaskPanel({project}:{project:ForgeProject}) {
  const { forge, updateForge } = useStore();
  const [newTitle,setNewTitle] = useState("");
  const tasks = forge.tasks.filter(t=>t.projectId===project.id);
  const add = () => {
    if (!newTitle.trim()) return;
    updateForge(f=>({tasks:[{
      id:uid(),projectId:project.id,title:newTitle.trim(),status:"todo",priority:"P2",
      pomodoros:0,energy:3,focus:3,tags:[],subtaskIds:[],comments:[],createdAt:today(),effort:3,impact:3,
    },...f.tasks]}));
    setNewTitle("");
  };
  const move = (id:string,status:any) => updateForge(f=>({tasks:f.tasks.map(t=>t.id===id?{...t,status,completedAt:status==="done"?today():undefined}:t)}));
  const cols = [
    {id:"todo",label:"TO DO",color:"#94a3b8"},
    {id:"doing",label:"FORGING",color:"#f59e0b"},
    {id:"review",label:"QUENCH",color:"#06b6d4"},
    {id:"blocked",label:"JAMMED",color:"#ef4444"},
    {id:"done",label:"SHIPPED",color:"#22c55e"},
  ] as const;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {cols.map(col=>(
        <div key={col.id} className="rounded-sm steel-plate p-3 relative" style={{borderColor:`${col.color}55`}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <div className="mono text-[10px] font-black tracking-widest mb-2" style={{color:col.color}}>{col.label} ({tasks.filter(t=>t.status===col.id).length})</div>
          <div className="space-y-1.5">
            {tasks.filter(t=>t.status===col.id).map(t=>(
              <div key={t.id} className="p-2 rounded-sm text-xs" style={{background:"var(--fr-card2)",borderLeft:`3px solid ${col.color}`}}>
                <div className="flex items-start gap-1.5">
                  <button onClick={()=>move(t.id,col.id==="done"?"todo":"done")}
                    className="mt-0.5 w-4 h-4 rounded-sm shrink-0"
                    style={{background:t.status==="done"?col.color:"transparent",border:`1.5px solid ${t.status==="done"?col.color:"var(--fr-fgMuted)"}`}}>
                    {t.status==="done" && <CheckCircle2 size={10} color="#000"/>}
                  </button>
                  <span className={`flex-1 ${t.status==="done"?"line-through opacity-60":""}`}>{t.title}</span>
                </div>
                <div className="mono text-[8px] tracking-widest mt-1" style={{color:"var(--fr-fgMuted)"}}>{t.priority}</div>
              </div>
            ))}
            {col.id==="todo" && (
              <div className="flex gap-1">
                <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&add()}
                  placeholder="+block"
                  className="flex-1 bg-transparent outline-none mono text-[10px] px-1 py-1 rounded-sm"
                  style={{border:`1px dashed ${col.color}55`,color:"var(--fr-fg)"}}/>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function stanceColor(s: string): string {
  if (s==="champion"||s==="ally") return "#22c55e";
  if (s==="opponent") return "#ef4444";
  if (s==="decision-maker") return "#f59e0b";
  if (s==="influencer") return "#a78bfa";
  return "var(--fr-fgMuted)";
}

function daysBetween(a:string,b:string):number{
  return Math.round((+new Date(b)- +new Date(a))/86400000);
}

function GanttMini({milestones,color}:{milestones:{title:string;date?:string;done:boolean}[];color:string}){
  const dated = milestones.filter(m=>m.date).sort((a,b)=>a.date!.localeCompare(b.date!));
  if (dated.length<2) return null;
  const start = new Date(dated[0].date!);
  const end = new Date(dated[dated.length-1].date!);
  const spanDays = Math.max(1, Math.round((+end - +start)/86400000));
  const W = 600, H = Math.max(80, dated.length*24+20);
  const pad = 10;
  return (
    <div className="mt-4">
      <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>GANTT · MILESTONE TIMELINE</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{maxHeight: H*0.6}}>
        {Array.from({length:5}).map((_,i)=>{
          const x = pad + (W-pad*2)*(i/4);
          return <line key={i} x1={x} x2={x} y1={0} y2={H-18} stroke="var(--fr-borderSoft)" strokeDasharray="2 3"/>;
        })}
        {dated.map((m,i)=>{
          const d = new Date(m.date!);
          const x = pad + (W-pad*2) * Math.max(0, Math.min(1, (+d - +start)/86400000 / spanDays));
          const y = 12 + i*24;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={m.done?6:5} fill={m.done?color:"var(--fr-card2)"} stroke={m.done?"#000":color} strokeWidth={m.done?2:1.5} style={{filter:m.done?`drop-shadow(0 0 4px ${color})`:"none"}}/>
              <text x={x+9} y={y+4} className="mono" fontSize="10" fill="var(--fr-fgMuted)">{m.title.slice(0,32)}{m.title.length>32?"…":""}</text>
              {i>0 && <line x1={pad + (W-pad*2)*Math.max(0,Math.min(1,(+new Date(dated[i-1].date!)-+start)/86400000/spanDays))} y1={y-24} x2={x} y2={y} stroke={m.done?color:"var(--fr-borderSoft)"} strokeWidth={m.done?1.5:1} strokeDasharray={m.done?"":"3 3"}/>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PowerInterestMatrix({stakeholders,color}:{stakeholders:ProjectStakeholder[];color:string}){
  const W=340,H=280,pad=40;
  const pwr = (p:string)=>p==="high"?1:p==="med"?0.5:0;
  const itr = (i:string)=>i==="high"?1:i==="med"?0.5:0;
  return (
    <div>
      <div className="mono text-[9px] tracking-widest mb-1" style={{color:"var(--fr-fgMuted)"}}>POWER × INTEREST MAP</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
        {/* quadrant tints */}
        <rect x={pad} y={0} width={(W-pad)/2} height={(H-pad)/2} fill="rgba(239,68,68,0.08)"/>
        <rect x={(W+pad)/2} y={0} width={(W-pad)/2} height={(H-pad)/2} fill="rgba(245,158,11,0.1)"/>
        <rect x={pad} y={(H-pad)/2} width={(W-pad)/2} height={(H-pad)/2} fill="rgba(148,163,184,0.05)"/>
        <rect x={(W+pad)/2} y={(H-pad)/2} width={(W-pad)/2} height={(H-pad)/2} fill="rgba(6,182,212,0.08)"/>
        {/* axes */}
        <line x1={pad} y1={H-pad} x2={W} y2={H-pad} stroke="var(--fr-border)"/>
        <line x1={pad} y1={0} x2={pad} y2={H-pad} stroke="var(--fr-border)"/>
        {/* grid */}
        <line x1={pad+(W-pad)/2} y1={0} x2={pad+(W-pad)/2} y2={H-pad} stroke="var(--fr-borderSoft)" strokeDasharray="2 3"/>
        <line x1={pad} y1={(H-pad)/2} x2={W} y2={(H-pad)/2} stroke="var(--fr-borderSoft)" strokeDasharray="2 3"/>
        {/* labels */}
        <text x={W-5} y={14} textAnchor="end" fontSize="9" className="mono" fill="#ef4444">KEEP SATISFIED</text>
        <text x={W-5} y={(H-pad)/2+14} textAnchor="end" fontSize="9" className="mono" fill="#06b6d4">KEEP INFORMED</text>
        <text x={pad+5} y={14} fontSize="9" className="mono" fill="#f59e0b">MONITOR</text>
        <text x={pad+5} y={(H-pad)/2+14} fontSize="9" className="mono" fill="#f59e0b">MANAGE CLOSELY</text>
        <text x={W/2+pad/2} y={H-8} textAnchor="middle" fontSize="9" className="mono" fill="var(--fr-fgMuted)">INTEREST →</text>
        <text x={12} y={H/2-pad/2} fontSize="9" className="mono" fill="var(--fr-fgMuted)" transform={`rotate(-90 12 ${H/2-pad/2})`}>POWER →</text>
        {/* dots */}
        {stakeholders.map((s,i)=>{
          const cx = pad + 20 + (W-pad-40)*itr(s.interest);
          const cy = (H-pad-20) - (H-pad-40)*pwr(s.power);
          const c = stanceColor(s.stance);
          return (
            <g key={s.id}>
              <circle cx={cx} cy={cy} r={10} fill={`${c}33`} stroke={c} strokeWidth="1.5"/>
              <text x={cx} y={cy+3} textAnchor="middle" fontSize="9" className="mono" fill="var(--fr-fg)" fontWeight="bold">{s.name[0]||"?"}</text>
            </g>
          );
        })}
        {stakeholders.length===0 && <text x={W/2+pad/2} y={H/2} textAnchor="middle" fontSize="10" className="mono" fill="var(--fr-fgDim)">add crew members to see them on the map</text>}
      </svg>
    </div>
  );
}

function SatisfactionSpark({log}:{log:{date:string;score:number}[]}){
  const pts = [...log].slice(0,12).reverse();
  if (pts.length<2) return null;
  const W=340,H=80,pad=20;
  const max = 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md">
      <line x1={pad} y1={H-pad} x2={W} y2={H-pad} stroke="var(--fr-borderSoft)"/>
      <line x1={pad} y1={pad} x2={W} y2={pad} stroke="var(--fr-borderSoft)" strokeDasharray="2 3"/>
      {pts.map((p,i)=>{
        const x = pad + (W-pad*2)*(i/(pts.length-1));
        const y = (H-pad) - (H-pad*2)*(p.score/max);
        return <circle key={i} cx={x} cy={y} r={3} fill={p.score>=8?"#22c55e":p.score>=5?"#f59e0b":"#ef4444"}/>;
      })}
      <polyline fill="none" stroke="var(--fr-green)" strokeWidth="1.5"
        points={pts.map((p,i)=>`${pad+(W-pad*2)*(i/(pts.length-1))},${(H-pad)-(H-pad*2)*(p.score/max)}`).join(" ")}/>
    </svg>
  );
}
