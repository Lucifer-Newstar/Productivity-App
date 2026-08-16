"use client";
/**
 * VaultSection — /projects/vault
 * Archive of shipped projects + dead projects w/ obituaries, export backup,
 * CSV export/import of tasks, JSON backup restore, cold-storage toggle.
 */
import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Archive, Skull, CheckCircle2, Download, RotateCcw, Upload,
  BookOpen, Trash2, FileText,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { ProjectTask, ForgeProject } from "../../../lib/forgeTypes";
import { assertImportFileSize, csvCell, parseSafeJsonFile } from "../../../lib/security";

const uid = () => Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const today = () => new Date().toISOString().slice(0,10);

function tasksToCSV(tasks:ProjectTask[], projects:Record<string,any>){
  const rows = [["id","title","project","status","priority","dueDate","estimateMins","actualMins","pomodoros","effort","impact","energy","focus","tags","createdAt","completedAt"]];
  for(const t of tasks){
    rows.push([t.id,t.title.replace(/"/g,'""'),projects[t.projectId]?.codename||"",t.status,t.priority,t.dueDate||"",String(t.estimateMins||""),String(t.actualMins||""),String(t.pomodoros||0),String(t.effort||""),String(t.impact||""),String(t.energy||""),String(t.focus||""),(t.tags||[]).join("|"),t.createdAt,t.completedAt||""]);
  }
  return rows.map(r=>r.map(csvCell).join(",")).join("\n");
}

function parseCSV(text:string): string[][] {
  // minimal RFC-4180-ish parser (handles quoted fields + "" escapes)
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i=0;i<text.length;i++){
    const c = text[i];
    if (inQ){
      if (c==='"' && text[i+1]==='"'){ field+='"'; i++; }
      else if (c==='"'){ inQ=false; }
      else field+=c;
    } else {
      if (c==='"') inQ=true;
      else if (c===','){ row.push(field); field=""; }
      else if (c==='\n'){ row.push(field); rows.push(row); row=[]; field=""; }
      else if (c==='\r'){ /* skip */ }
      else field+=c;
    }
  }
  if (field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r=>r.some(c=>c!==""));
}

function csvToTasks(text:string, existingTasks:ProjectTask[], projects:any[]): ProjectTask[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const header = rows[0].map(h=>h.trim().toLowerCase());
  const idx = (name:string) => header.indexOf(name);
  const codenameToId: Record<string,string> = {};
  for (const p of projects) codenameToId[(p.codename||"").toLowerCase()] = p.id;

  const existingIds = new Set(existingTasks.map(t=>t.id));
  const imported: ProjectTask[] = [];
  for (let r=1;r<rows.length;r++){
    const row = rows[r];
    const get = (n:string) => { const i=idx(n); return i>=0 ? (row[i]??"") : ""; };
    const title = get("title").trim();
    if (!title) continue;
    let projectId = get("projectid").trim() || codenameToId[(get("project")||"").toLowerCase()] || projects[0]?.id || "";
    if (!projectId) continue;
    const rawId = get("id").trim();
    const id = rawId && !existingIds.has(rawId) ? rawId : "t-imp-"+uid();
    if (rawId) existingIds.add(rawId);
    const num = (v:string)=>{ const n=parseFloat(v); return isNaN(n)?0:n; };
    const clamp = (v:number, lo:number, hi:number, d:number) => {
      if (!v) return d;
      return Math.max(lo, Math.min(hi, Math.round(v))) as any;
    };
    const bool = (v:string) => /^(true|1|yes|y)$/i.test(v.trim());
    imported.push({
      id,
      title,
      projectId,
      notes: get("notes") || "",
      status: (get("status") as any) || "todo",
      priority: (get("priority") as any) || "P3",
      dueDate: get("duedate") || "",
      estimateMins: num(get("estimatemins")) || 0,
      actualMins: num(get("actualmins")) || 0,
      pomodoros: num(get("pomodoros")) || 0,
      effort: clamp(num(get("effort"))||3,1,5,3),
      impact: clamp(num(get("impact"))||3,1,5,3),
      energy: clamp(num(get("energy"))||3,1,5,3),
      focus: clamp(num(get("focus"))||3,1,5,3),
      importance: clamp(num(get("importance"))||5,1,10,5),
      urgency: clamp(num(get("urgency"))||5,1,10,5),
      tags: (get("tags")||"").split("|").map(s=>s.trim()).filter(Boolean),
      subtaskIds: [],
      comments: [],
      dependsOn: [],
      createdAt: get("createdat") || today(),
      completedAt: get("completedat") || "",
      doneAt: get("completedat") || get("doneat") || "",
      today: bool(get("today")),
      stuck: bool(get("stuck")),
      stuckNote: get("stucknote") || get("stuck") || "",
      nextAction: bool(get("nextaction")),
    });
  }
  return imported;
}

export default function VaultSection() {
  const { forge, updateForge, logForgeAction } = useStore();
  const [tab, setTab] = useState<"shipped"|"dead"|"archive">("shipped");
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const projCsvRef = useRef<HTMLInputElement>(null);
  const projectById: Record<string,any> = Object.fromEntries(forge.projects.map(p=>[p.id,p]));

  const shipped = forge.projects.filter(p => p.status === "done");
  const dead = forge.projects.filter(p => p.status === "dead");
  const archived = forge.projects.filter(p => p.archived && p.status!=="dead" && p.status!=="done");

  const restore = (id: string) => updateForge(f => ({
    projects: f.projects.map(p => p.id===id ? { ...p, archived:false, status:"on-track", obituary:undefined } : p),
  }));
  const kill = (id: string) => updateForge(f => ({
    projects: f.projects.map(p => p.id===id ? { ...p, status:"dead", archived:true, obituary: p.obituary || { whyStopped:"", learned:"", startAgain:"no" } } : p),
  }));
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(forge, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `kaizen-forge-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"BACKUP SAVED",sub:"JSON downloaded",color:"#22c55e",icon:"check"}}));
  };
  const exportCSV = () => {
    const csv = tasksToCSV(forge.tasks, projectById);
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`kaizen-tasks-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"CSV EXPORTED",sub:`${forge.tasks.length} blocks`,color:"#06b6d4",icon:"check"}}));
  };
  const importJSON = (file:File) => {
    try { assertImportFileSize(file); } catch (error) { alert(error instanceof Error ? error.message : "Invalid backup."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseSafeJsonFile(file, reader.result as string) as Record<string, unknown>;
        if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) throw new Error("Invalid backup shape.");
        if (data.projects.length > 2_000 || data.tasks.length > 10_000) throw new Error("Backup has too many records.");
        if(confirm("Replace current Forge state with this backup?")){
          updateForge(() => data as any);
          window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#22c55e",count:30}}));
          window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"RESTORED",sub:"Backup loaded",color:"#22c55e",icon:"check"}}));
        }
      } catch(e){ alert("Invalid forge backup file"); }
    };
    reader.readAsText(file);
  };
  const importCSV = (file:File) => {
    try { assertImportFileSize(file); } catch (error) { alert(error instanceof Error ? error.message : "Invalid import."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = csvToTasks(reader.result as string, forge.tasks, forge.projects);
        if (imported.length === 0){ alert("No rows imported (check headers)."); return; }
        const msg = `Import ${imported.length} task${imported.length>1?"s":""} into the quarry? (Existing IDs are preserved when unique.)`;
        if (!confirm(msg)) return;
        updateForge(f => {
          const seen = new Set(f.tasks.map(t=>t.id));
          const fresh = imported.filter(t => !seen.has(t.id));
          return { tasks: [...fresh, ...f.tasks] };
        });
        window.dispatchEvent(new CustomEvent("career:burst",{detail:{color:"#06b6d4",count:28}}));
        window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"CSV IMPORTED",sub:`${imported.length} blocks added`,color:"#06b6d4",icon:"check"}}));
      } catch(e){ console.error(e); alert("Failed to parse CSV"); }
    };
    reader.readAsText(file);
  };

  const exportProjectCSV = () => {
    const rows = [["id","codename","title","brief","why","status","priority","color","icon","createdAt","deadline","completedAt","tags","budget_est","budget_actual"]];
    for (const p of forge.projects) {
      rows.push([p.id,p.codename,p.title.replace(/"/g,'""'),p.brief.replace(/"/g,'""'),p.why.replace(/"/g,'""'),p.status,String(p.priority),p.color,p.icon,p.createdAt,p.deadline||"",p.completedAt||"",(p.tags||[]).join("|"),String(p.budget?.estimated||""),String(p.budget?.actual||0)]);
    }
    const csv = rows.map(r=>r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`kaizen-projects-${today()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const importProjectCSV = (file:File) => {
    try { assertImportFileSize(file); } catch (error) { alert(error instanceof Error ? error.message : "Invalid import."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(reader.result as string);
        if (rows.length<2) return;
        const header = rows[0].map(h=>h.trim().toLowerCase());
        const idx = (n:string) => header.indexOf(n);
        const num = (v:string)=>{const n=parseFloat(v); return isNaN(n)?0:n;};
        const existingIds = new Set(forge.projects.map(p=>p.id));
        const incoming: ForgeProject[] = [];
        for (let r=1;r<rows.length;r++){
          const row = rows[r];
          const get = (n:string) => { const i=idx(n); return i>=0?(row[i]??""):""; };
          const title = get("title").trim(); if(!title) continue;
          const rawId = get("id").trim();
          const id = rawId && !existingIds.has(rawId) ? rawId : "p-imp-"+uid();
          if (rawId) existingIds.add(rawId);
          const codename = get("codename").trim().toUpperCase() || title.slice(0,6).toUpperCase();
          const color = get("color").trim() || "#f59e0b";
          const icon = get("icon").trim() || "🔥";
          const status = (get("status").trim() || "on-track") as any;
          incoming.push({
            id,codename,title,brief:get("brief"),why:get("why"),
            successMetrics:"",rejectionCriteria:"",
            status: ["on-track","blocked","off-track","paused","done","dead"].includes(status)?status:"on-track",
            priority: Math.max(1,Math.min(10,num(get("priority"))||5)),
            energyDemand:5,complexity:5,color,icon,
            createdAt: get("createdat")||today(),
            deadline: get("deadline")||undefined,
            startedAt: get("createdat")||today(),
            completedAt: get("completedat")||undefined,
            archived: status==="dead",
            checkinFreq:"weekly",
            budget:{ estimated:num(get("budget_est"))||0, actual:num(get("budget_actual"))||0, currency:"$" },
            stakeholders:[],milestones:[],premortem:[],risks:[],issues:[],qualityChecks:[],comms:[],
            scope:"",tags:(get("tags")||"").split("|").map(s=>s.trim()).filter(Boolean),links:[],velocityPoints:[],
          });
        }
        if(!incoming.length){ alert("No projects parsed."); return; }
        if(!confirm(`Import ${incoming.length} project(s)? Existing IDs preserved if unique.`)) return;
        updateForge(f => {
          const seen = new Set(f.projects.map(p=>p.id));
          const fresh = incoming.filter(p=>!seen.has(p.id));
          return { projects: [...fresh,...f.projects] };
        });
        incoming.forEach(p=>logForgeAction("project.import",p.id,p.codename));
        window.dispatchEvent(new CustomEvent("career:toast",{detail:{title:"PROJECTS IMPORTED",sub:`${incoming.length} heats loaded`,color:"#f59e0b",icon:"zap"}}));
      } catch(e){ console.error(e); alert("Failed to parse projects CSV"); }
    };
    reader.readAsText(file);
  };

  const list = tab==="shipped" ? shipped : tab==="dead" ? dead : archived;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-wider flex items-center gap-2">
            <Archive size={26} style={{color:"var(--fr-steel)"}}/> the.vault
          </h2>
          <p className="mono text-[11px] tracking-widest mt-1 italic" style={{color:"var(--fr-fgMuted)"}}>
            // shipped, dead, and cold-storage — the graveyard of finished work
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <FileText size={12}/> CSV↓
          </button>
          <button onClick={()=>csvRef.current?.click()}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-cyan)",color:"var(--fr-cyan)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Upload size={12}/> TASK↑
          </button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importCSV(f);e.target.value="";}}/>
          <button onClick={exportProjectCSV}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <FileText size={12}/> PROJ↓
          </button>
          <button onClick={()=>projCsvRef.current?.click()}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-amber)",color:"var(--fr-amber)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Upload size={12}/> PROJ↑
          </button>
          <input ref={projCsvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importProjectCSV(f);e.target.value="";}}/>
          <button onClick={exportJSON}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Download size={12}/> BACKUP
          </button>
          <button onClick={()=>fileRef.current?.click()}
            className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
            style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
            <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
            <Upload size={12}/> RESTORE
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importJSON(f);e.target.value="";}}/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([["shipped","SHIPPED", shipped.length, "#22c55e", CheckCircle2],
           ["dead",   "DEAD",    dead.length,    "#ef4444", Skull],
           ["archive","COLD",   archived.length,"#94a3b8", Archive],
        ] as const).map(([id,lbl,n,c,Icon]) => (
          <button key={id} onClick={()=>setTab(id as any)}
            className="mono text-[10px] md:text-xs tracking-widest font-black px-3 py-2 rounded-sm flex items-center gap-1.5"
            style={{
              background: tab===id ? `${c}33` : "var(--fr-card2)",
              color: tab===id ? c : "var(--fr-fgMuted)",
              border: `1px solid ${tab===id?`${c}88`:"var(--fr-borderSoft)"}`,
            }}>
            <Icon size={11}/>{lbl}<span className="opacity-70">({n})</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-sm steel-plate p-12 text-center" style={{borderColor:"var(--fr-borderSoft)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <BookOpen size={40} className="mx-auto mb-2" style={{color:"var(--fr-fgDim)"}}/>
          <p className="mono text-[11px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>Vault is empty.</p>
          <p className="pencil text-[11px] italic mt-1" style={{color:"var(--fr-fgDim)"}}>Ship or kill something first.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map(p => {
            const isShipped = p.status==="done";
            const isDead = p.status==="dead";
            const color = isShipped ? "#22c55e" : isDead ? "#ef4444" : "#94a3b8";
            return (
              <motion.div key={p.id} layout
                className="rounded-sm steel-plate p-5 relative opacity-90" style={{borderColor:`${color}66`}}>
                <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
                <div className="flex items-start gap-3">
                  <div className="text-3xl w-14 h-14 rounded-sm flex items-center justify-center shrink-0"
                    style={{background:`${color}22`,border:`2px solid ${color}66`}}>{p.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="mono text-[10px] tracking-widest" style={{color}}>{p.codename}</span>
                      <span className="forge-stamp text-[9px]" style={{color}}>
                        {isShipped?"SHIPPED":isDead?"DEAD":"COLD"}
                      </span>
                    </div>
                    <h4 className="font-black text-lg leading-tight">{p.title}</h4>
                    {p.brief && <p className="pencil text-xs italic mt-1" style={{color:"var(--fr-fgMuted)"}}>{p.brief.slice(0,140)}{p.brief.length>140?"…":""}</p>}
                    {isDead && p.obituary && (
                      <div className="mt-3 p-2 rounded-sm" style={{background:"rgba(239,68,68,0.08)",border:"1px dashed rgba(239,68,68,0.4)"}}>
                        <div className="mono text-[9px] tracking-widest mb-1" style={{color:"#ef4444"}}>OBITUARY</div>
                        {p.obituary.whyStopped && <p className="pencil text-xs" style={{color:"var(--fr-fg)"}}><b>Why stopped:</b> {p.obituary.whyStopped}</p>}
                        {p.obituary.learned && <p className="pencil text-xs mt-1" style={{color:"var(--fr-fg)"}}><b>Learned:</b> {p.obituary.learned}</p>}
                        <div className="mono text-[10px] mt-1" style={{color:"var(--fr-fgMuted)"}}>Start again? <b style={{color}}>{p.obituary.startAgain}</b></div>
                      </div>
                    )}
                    {isShipped && p.completedAt && (
                      <div className="mono text-[10px] mt-2" style={{color:"var(--fr-fgMuted)"}}>
                        <CheckCircle2 size={10} className="inline -mt-0.5 mr-1" style={{color}}/>
                        Shipped {p.completedAt}
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <Link href={`/projects/p/${p.id}`}
                        className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm"
                        style={{background:color,color:"#000"}}>OPEN</Link>
                      {!isDead && !isShipped ? (
                        <button onClick={()=>kill(p.id)}
                          className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm"
                          style={{background:"transparent",border:"1px solid #ef444488",color:"#ef4444"}}>KILL</button>
                      ) : null}
                      {p.archived && (
                        <button onClick={()=>restore(p.id)}
                          className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm flex items-center gap-1"
                          style={{background:"transparent",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fgMuted)"}}>
                          <RotateCcw size={9}/> REHEAT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
