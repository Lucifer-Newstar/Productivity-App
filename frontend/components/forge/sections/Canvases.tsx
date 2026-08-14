"use client";
/**
 * Canvases — strategic / UX / research canvases for the Smelter.
 *
 * Fully working editors exported from here:
 *   · BMCTab          - Business Model Canvas (9-block Osterwalder grid)
 *   · VPCTab          - Value Proposition Canvas (product vs customer)
 *   · LeanTab         - Lean Canvas (Ash Maurya variant)
 *   · PorterTab       - Porter's Five Forces industry analysis
 *   · PestelTab       - PESTEL macro-environmental scan
 *   · StoriesTab      - User Story kanban (backlog→ready→doing→shipped)
 *   · AffinityTab     - Affinity diagram / cluster grouping
 *   · BuyAFeatureTab  - Buy-a-Feature prioritization game
 *   · PairedTab       - Paired-comparison ranking with auto-results
 *   · JourneyTab      - Customer journey map (stages × thoughts/pains/opps/sat)
 *   · BlueprintTab    - Service Blueprint (customer/onstage/backstage/support/evidence)
 *   · EventStormTab   - Event Storming board (events/commands/aggregates/policies)
 *   · MindmapTab      - Radial tree mind-map with click-to-add children
 *   · CanvasTab       - Free-form draggable sticky/box/arrow canvas
 *   · WireframeTab    - Wireframe screen list with notes + link-outs
 *   · VoiceTab        - Voice note recorder (MediaRecorder) + transcription box
 *
 * Every tab uses the shared ProjPP project picker (scope to one heat or "all heats"),
 * creates its own entities via updateForge, and supports add/rename/delete. Empty
 * states render a + NEW CTA plate in the forge accent color.
 */
import { useState, useRef, useEffect } from "react";
import { useStore } from "../../../lib/store";
import type {
  BusinessModelCanvas, ValuePropCanvas, LeanCanvas, PorterFive, Pestel,
  UserStory, AffinityGroup, BuyAFeature, PairedComparison,
  JourneyMap, ServiceBlueprint, EventStorm, Mindmap, IdeaCanvas,
  CanvasItem, Wireframe, VoiceNote, MindmapNode,
} from "../../../lib/forgeTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

/* ---------------- shared project picker ---------------- */

function ProjPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const {forge} = useStore();
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="mono text-[10px] px-2 py-1 rounded-sm outline-none"
      style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
      <option value="">all heats</option>
      {forge.projects.filter(p=>!p.archived).map(p=><option key={p.id} value={p.id}>{p.icon} {p.codename}</option>)}
    </select>
  );
}

/* ---------------- shared list-block editor ---------------- */

function BlockEditor({title,items,color,onAdd,onRemove}:{title:string;items:string[];color:string;onAdd:(t:string)=>void;onRemove:(i:number)=>void}){
  const [text,setText] = useState("");
  return (
    <div className="rounded-sm p-2 flex flex-col" style={{background:"var(--fr-card2)",border:`2px solid ${color}44`,minHeight:90}}>
      <div className="mono text-[10px] tracking-widest font-black mb-1" style={{color}}>{title}</div>
      <div className="space-y-0.5 flex-1">
        {items.map((it,i)=>(
          <div key={i} className="flex items-start gap-1 group text-xs pencil">
            <span style={{color}}>▸</span>
            <span className="flex-1">{it}</span>
            <button onClick={()=>onRemove(i)} className="opacity-0 group-hover:opacity-100 mono text-[9px]" style={{color:"var(--fr-red)"}}>✕</button>
          </div>))}
      </div>
      <input value={text} onChange={e=>setText(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"&&text.trim()){onAdd(text.trim());setText("");}}}
        placeholder="+ add"
        className="bg-transparent outline-none mono text-[10px] mt-1"
        style={{borderBottom:`1px dashed ${color}66`,color:"var(--fr-fg)"}}/>
    </div>
  );
}

/* ---------------- helper: section header + empty state ---------------- */

function Header({title,kicker,color,sub,Icon}:{title:string;kicker:string;color:string;sub:string;Icon:any}){
  return (
    <div className="steel-plate rounded-sm p-3 flex items-start gap-3 relative" style={{borderColor:`${color}55`}}>
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0" style={{background:`${color}22`,border:`1.5px solid ${color}88`,color}}>
        <Icon size={16}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mono text-[9px] tracking-widest" style={{color}}>{kicker}</div>
        <h3 className="text-lg font-black tracking-wide leading-tight">{title}</h3>
        <p className="pencil text-xs italic mt-0.5" style={{color:"var(--fr-fgMuted)"}}>{sub}</p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  A) 9-BLOCK BUSINESS MODEL CANVAS (Osterwalder)                     */
/* ================================================================== */

export function BMCTab(){
  const {forge,updateForge} = useStore();
  const [pid,setPid] = useState("");
  const list = pid?forge.bmc.filter(b=>b.projectId===pid):forge.bmc;
  const [active,setActive] = useState<string|null>(list[0]?.id||null);
  const cur = list.find(b=>b.id===active);
  const patch=(p:Partial<BusinessModelCanvas>)=>cur&&updateForge(f=>({bmc:f.bmc.map(b=>b.id===cur.id?{...b,...p}:b)}));
  const push=(k:keyof BusinessModelCanvas,v:string)=>patch({[k]:[...((cur as any)[k]||[]),v]} as any);
  const rm=(k:keyof BusinessModelCanvas,i:number)=>patch({[k]:((cur as any)[k]||[]).filter((_:any,j:number)=>j!==i)} as any);
  const add=()=>{const b:BusinessModelCanvas={id:uid(),projectId:pid||undefined,date:today(),keyPartners:[],keyActivities:[],keyResources:[],valuePropositions:[],customerRelationships:[],channels:[],customerSegments:[],costStructure:[],revenueStreams:[]};updateForge(f=>({bmc:[b,...f.bmc]}));setActive(b.id);};
  const del=(id:string)=>{updateForge(f=>({bmc:f.bmc.filter(x=>x.id!==id)}));setActive(null);};
  if(!cur) return (<div className="text-center py-12"><button onClick={add} className="mono text-[11px] font-black tracking-widest px-4 py-3 rounded-sm steel-plate" style={{background:"#f59e0b",color:"#000"}}>+ NEW BMC</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  const B=(t:keyof BusinessModelCanvas,c:string)=><BlockEditor title={t as string} items={(cur[t]||[]) as string[]} color={c} onAdd={v=>push(t,v)} onRemove={i=>rm(t,i)}/>;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={setPid}/>
        <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>{cur.date}</span>
        <select value={active||""} onChange={e=>setActive(e.target.value)} className="mono text-[10px] px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          {list.map(b=><option key={b.id} value={b.id}>BMC {b.date}</option>)}
        </select>
        <div className="ml-auto flex gap-1">
          <button onClick={add} className="mono text-[10px] px-2 py-1 rounded-sm" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
          <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1 rounded-sm" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {B("keyPartners","#a78bfa")}{B("keyActivities","#f59e0b")}{B("valuePropositions","#22c55e")}
        {B("keyResources","#fb923c")}
        <div className="row-span-2 flex flex-col gap-2">{B("customerRelationships","#06b6d4")}{B("channels","#ec4899")}</div>
        {B("customerSegments","#ef4444")}
        {B("costStructure","#94a3b8")}<div/>{B("revenueStreams","#facc15")}
      </div>
    </div>);
}

/* ================================================================== */
/*  B) VALUE PROPOSITION CANVAS                                        */
/* ================================================================== */

export function VPCTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.vpc.filter(v=>v.projectId===pid):forge.vpc;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(v=>v.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),products:[],painRelievers:[],gainCreators:[],customerJobs:[],pains:[],gains:[]};updateForge(f=>({vpc:[v,...f.vpc]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#22c55e",color:"#000"}}>+ NEW VPC</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>;
  const patch=(p:Partial<ValuePropCanvas>)=>updateForge(f=>({vpc:f.vpc.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const B=(k:keyof ValuePropCanvas,c:string,t:string)=><BlockEditor title={t} items={(cur[k]||[]) as string[]} color={c} onAdd={v=>patch({[k]:[...((cur[k]||[]) as string[]),v]} as any)} onRemove={i=>patch({[k]:((cur[k]||[]) as string[]).filter((_,j)=>j!==i)} as any)}/>;
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPicker value={pid} onChange={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-2 gap-2">
    <div className="space-y-2 p-2 rounded-sm" style={{border:"2px dashed #ec489966",background:"rgba(236,72,153,0.04)"}}><div className="mono text-[10px] font-black text-center" style={{color:"#ec4899"}}>PRODUCT</div>{B("products","#f59e0b","PRODUCTS")}{B("painRelievers","#ef4444","PAIN RELIEVERS")}{B("gainCreators","#22c55e","GAIN CREATORS")}</div>
    <div className="space-y-2 p-2 rounded-sm" style={{border:"2px dashed #06b6d466",background:"rgba(6,182,212,0.04)"}}><div className="mono text-[10px] font-black text-center" style={{color:"#06b6d4"}}>CUSTOMER</div>{B("customerJobs","#a78bfa","JOBS")}{B("pains","#ef4444","PAINS")}{B("gains","#22c55e","GAINS")}</div>
  </div></div>);
}

/* ================================================================== */
/*  C) LEAN CANVAS (Ash Maurya)                                        */
/* ================================================================== */

export function LeanTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.lean.filter(l=>l.projectId===pid):forge.lean;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(l=>l.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),problem:[],solution:[],keyMetrics:[],uniqueValue:"",unfairAdvantage:"",channels:[],customerSegments:[],costStructure:[],revenueStreams:[]};updateForge(f=>({lean:[v,...f.lean]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#a78bfa",color:"#000"}}>+ NEW LEAN</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>;
  const patch=(p:Partial<LeanCanvas>)=>updateForge(f=>({lean:f.lean.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const L=(k:keyof LeanCanvas,c:string,t:string,ml=false)=>(<div className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:`2px solid ${c}44`}}>
    <div className="mono text-[10px] tracking-widest font-black mb-1" style={{color:c}}>{t}</div>
    {ml?(<textarea value={(cur[k] as string)||""} onChange={e=>patch({[k]:e.target.value} as any)} rows={2} className="w-full bg-transparent outline-none pencil text-xs" style={{color:"var(--fr-fg)"}}/>):(<><div className="space-y-0.5">{((cur[k] as string[])||[]).map((it,i)=>(<div key={i} className="text-xs pencil flex items-start gap-1"><span style={{color:c}}>▸</span><span className="flex-1">{it}</span><button onClick={()=>patch({[k]:((cur[k] as string[])||[]).filter((_,j)=>j!==i)} as any)} className="opacity-50 mono text-[9px]" style={{color:"var(--fr-red)"}}>✕</button></div>))}</div><input className="w-full bg-transparent outline-none mono text-[10px] mt-1" placeholder="+ add" onKeyDown={e=>{if(e.key==="Enter"){const t=e.currentTarget;if(t.value.trim()){patch({[k]:[...((cur[k] as string[])||[]),t.value.trim()]} as any);t.value="";}}}}/></>)}
  </div>);
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPicker value={pid} onChange={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-3 gap-2">{L("problem","#ef4444","PROBLEM")}{L("solution","#22c55e","SOLUTION")}{L("keyMetrics","#06b6d4","KEY METRICS")}{L("uniqueValue","#f59e0b","UVP",true)}{L("unfairAdvantage","#a78bfa","ADVANTAGE",true)}{L("channels","#ec4899","CHANNELS")}{L("customerSegments","#fb923c","CUSTOMERS")}{L("costStructure","#94a3b8","COSTS")}{L("revenueStreams","#facc15","REVENUE")}</div></div>);
}

/* ================================================================== */
/*  D) PORTER'S FIVE FORCES                                            */
/* ================================================================== */

export function PorterTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.porter.filter(p=>p.projectId===pid):forge.porter;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(p=>p.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),rivals:[],suppliers:[],buyers:[],entrants:[],substitutes:[]};updateForge(f=>({porter:[v,...f.porter]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#ef4444",color:"#000"}}>+ NEW PORTER</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>;
  const patch=(p:Partial<PorterFive>)=>updateForge(f=>({porter:f.porter.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const B=(k:keyof PorterFive,c:string,t:string)=><BlockEditor title={t} items={(cur[k]||[]) as string[]} color={c} onAdd={v=>patch({[k]:[...((cur[k]||[]) as string[]),v]} as any)} onRemove={i=>patch({[k]:((cur[k]||[]) as string[]).filter((_,j)=>j!==i)} as any)}/>;
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPicker value={pid} onChange={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-6 gap-2"><div className="col-span-2">{B("rivals","#ef4444","RIVALRY")}</div><div className="flex flex-col gap-2">{B("entrants","#f59e0b","ENTRANTS")}{B("suppliers","#a78bfa","SUPPLIERS")}</div>
  <div className="rounded-sm p-2 flex items-center justify-center steel-plate" style={{color:"var(--fr-amber)"}}><div className="text-center mono"><div className="text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>THE</div><div className="text-xl font-black">INDUSTRY</div></div></div>
  <div className="flex flex-col gap-2">{B("buyers","#06b6d4","BUYERS")}{B("substitutes","#22c55e","SUBS")}</div></div></div>);
}

/* ================================================================== */
/*  E) PESTEL                                                          */
/* ================================================================== */

export function PestelTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.pestel.filter(p=>p.projectId===pid):forge.pestel;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(p=>p.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),political:"",economic:"",social:"",technological:"",environmental:"",legal:""};updateForge(f=>({pestel:[v,...f.pestel]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#06b6d4",color:"#000"}}>+ NEW PESTEL</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>;
  const patch=(p:Partial<Pestel>)=>updateForge(f=>({pestel:f.pestel.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const keys:[keyof Pestel,string,string][]=[["political","#ef4444","POLITICAL"],["economic","#f59e0b","ECONOMIC"],["social","#ec4899","SOCIAL"],["technological","#06b6d4","TECH"],["environmental","#22c55e","ENV"],["legal","#a78bfa","LEGAL"]];
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPicker value={pid} onChange={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid md:grid-cols-3 gap-2">{keys.map(([k,c,l])=>(<div key={k} className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:`2px solid ${c}44`}}><div className="mono text-[10px] font-black tracking-widest mb-1" style={{color:c}}>{l}</div><textarea value={cur[k] as string} onChange={e=>patch({[k]:e.target.value} as any)} rows={4} className="w-full bg-transparent outline-none pencil text-xs resize-none" style={{color:"var(--fr-fg)"}}/></div>))}</div></div>);
}

/* ================================================================== */
/*  F) USER STORY KANBAN                                               */
/* ================================================================== */

export function StoriesTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const[asA,setAsA]=useState("");const[iWant,setIWant]=useState("");const[soThat,setSoThat]=useState("");
  const stories=pid?forge.userStories.filter(s=>s.projectId===pid):forge.userStories;
  const add=()=>{if(!asA.trim()||!iWant.trim())return;const s:UserStory={id:uid(),projectId:pid||undefined,asA:asA.trim(),iWant:iWant.trim(),soThat:soThat.trim(),acceptance:[],priority:"P2",status:"backlog"};updateForge(f=>({userStories:[s,...f.userStories]}));setAsA("");setIWant("");setSoThat("");};
  const patch=(id:string,p:Partial<UserStory>)=>updateForge(f=>({userStories:f.userStories.map(s=>s.id===id?{...s,...p}:s)}));
  const del=(id:string)=>updateForge(f=>({userStories:f.userStories.filter(s=>s.id!==id)}));
  const cols:{id:UserStory["status"];label:string;color:string}[]=[{id:"backlog",label:"BACKLOG",color:"#94a3b8"},{id:"ready",label:"READY",color:"#06b6d4"},{id:"doing",label:"FORGING",color:"#f59e0b"},{id:"done",label:"SHIPPED",color:"#22c55e"}];
  return (<div className="space-y-3"><div className="steel-plate rounded-sm p-3 flex items-end gap-2 flex-wrap" style={{borderColor:"#ec4899"}}><ProjPicker value={pid} onChange={setPid}/>
  <input placeholder="As a..." value={asA} onChange={e=>setAsA(e.target.value)} className="flex-1 mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)",minWidth:100}}/>
  <input placeholder="I want..." value={iWant} onChange={e=>setIWant(e.target.value)} className="flex-1 mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)",minWidth:160}}/>
  <input placeholder="So that..." value={soThat} onChange={e=>setSoThat(e.target.value)} className="flex-1 mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)",minWidth:160}}/>
  <button onClick={add} className="mono text-[10px] font-black px-3 py-2 rounded-sm" style={{background:"#ec4899",color:"#000"}}>+ STORY</button></div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{cols.map(col=>(<div key={col.id} className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:`1px solid ${col.color}55`}}>
    <div className="mono text-[10px] font-black tracking-widest mb-2" style={{color:col.color}}>{col.label} ({stories.filter(s=>s.status===col.id).length})</div>
    <div className="space-y-1">{stories.filter(s=>s.status===col.id).map(s=>(<div key={s.id} className="p-1.5 rounded-sm text-[11px]" style={{background:"var(--fr-card)",borderLeft:`2px solid ${col.color}66`}}>
      <div className="pencil italic">As <b>{s.asA}</b>, I want <b>{s.iWant}</b>{s.soThat?<span>, so {s.soThat}</span>:null}.</div>
      <div className="flex items-center gap-1 mt-1">
        <select value={s.status} onChange={e=>patch(s.id,{status:e.target.value as any})} className="mono text-[9px] bg-transparent" style={{color:"var(--fr-fgMuted)"}}>{cols.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select value={s.priority} onChange={e=>patch(s.id,{priority:e.target.value as any})} className="mono text-[9px] bg-transparent" style={{color:"var(--fr-fgMuted)"}}>{["P0","P1","P2","P3"].map(p=><option key={p}>{p}</option>)}</select>
        <button onClick={()=>del(s.id)} className="ml-auto opacity-30 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>
      </div></div>))}</div>
  </div>))}</div></div>);
}

/* ================================================================== */
/*  G) AFFINITY GROUPING                                               */
/* ================================================================== */

export function AffinityTab(){
  const {forge,updateForge}=useStore();const[newGroup,setNewGroup]=useState("");const[newItem,setNewItem]=useState<Record<string,string>>({});
  const addGroup=()=>{if(!newGroup.trim())return;updateForge(f=>({affinity:[{id:uid(),title:newGroup.trim(),items:[]},...f.affinity]}));setNewGroup("");};
  const addItem=(gid:string)=>{if(!newItem[gid]?.trim())return;updateForge(f=>({affinity:f.affinity.map(g=>g.id===gid?{...g,items:[...g.items,{id:uid(),text:newItem[gid].trim()}]}:g)}));setNewItem(s=>({...s,[gid]:""}));};
  return (<div className="space-y-3"><div className="steel-plate p-2 flex gap-2" style={{borderColor:"#06b6d4"}}>
  <input placeholder="+ new group..." value={newGroup} onChange={e=>setNewGroup(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addGroup();}} className="flex-1 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
  <button onClick={addGroup} className="mono text-[10px] font-black px-3 py-1 rounded-sm" style={{background:"#06b6d4",color:"#000"}}>+ GROUP</button></div>
  <div className="grid md:grid-cols-3 gap-2">{forge.affinity.map(g=>(<div key={g.id} className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
    <div className="flex items-center gap-2 mb-2"><input value={g.title} onChange={e=>updateForge(f=>({affinity:f.affinity.map(x=>x.id===g.id?{...x,title:e.target.value}:x)}))} className="flex-1 bg-transparent mono text-sm font-black outline-none" style={{color:"var(--fr-amber)"}}/>
    <button onClick={()=>updateForge(f=>({affinity:f.affinity.filter(x=>x.id!==g.id)}))} className="opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button></div>
    <div className="space-y-1">{g.items.map(i=>(<div key={i.id} className="p-1.5 rounded-sm pencil text-xs flex items-start gap-1" style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)"}}>
      <span className="flex-1">{i.text}</span><button onClick={()=>updateForge(f=>({affinity:f.affinity.map(x=>x.id===g.id?{...x,items:x.items.filter(y=>y.id!==i.id)}:x)}))} className="opacity-30 text-[10px]" style={{color:"var(--fr-red)"}}>✕</button></div>))}</div>
    <input placeholder="+ add" value={newItem[g.id]||""} onChange={e=>setNewItem(s=>({...s,[g.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")addItem(g.id);}} className="w-full mono text-[10px] mt-1 px-1 py-0.5 bg-transparent outline-none" style={{borderBottom:"1px dashed var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
  </div>))}</div></div>);
}

/* ================================================================== */
/*  H) BUY-A-FEATURE                                                   */
/* ================================================================== */

export function BuyAFeatureTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.buyAFeature.filter(b=>b.projectId===pid):forge.buyAFeature;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(b=>b.id===active);const[feat,setFeat]=useState("");const[cost,setCost]=useState(10);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),budget:100,features:[]};updateForge(f=>({buyAFeature:[v,...f.buyAFeature]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#22c55e",color:"#000"}}>+ NEW BUY-A-FEATURE</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>;
  const spent=cur.features.filter(f=>f.bought).reduce((n,f)=>n+f.cost,0);
  const patch=(p:Partial<BuyAFeature>)=>updateForge(f=>({buyAFeature:f.buyAFeature.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const addFeat=()=>{if(!feat.trim())return;patch({features:[...cur.features,{id:uid(),text:feat.trim(),cost,bought:false}]});setFeat("");setCost(10);};
  return (<div className="space-y-3"><div className="flex items-center gap-2 flex-wrap"><ProjPicker value={pid} onChange={setPid}/><label className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>BUDGET</label><input type="number" value={cur.budget} onChange={e=>patch({budget:Number(e.target.value)||0})} className="w-20 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="rounded-sm steel-plate p-3"><div className="flex justify-between mono text-[10px] tracking-widest mb-1"><span style={{color:spent>cur.budget?"var(--fr-red)":"var(--fr-green)"}}>SPENT ${spent}</span><span style={{color:"var(--fr-fgMuted)"}}>BUDGET ${cur.budget}</span></div><div className="h-2 rounded-full overflow-hidden" style={{background:"var(--fr-borderSoft)"}}><div className="h-full" style={{width:`${Math.min(100,spent/Math.max(1,cur.budget)*100)}%`,background:spent>cur.budget?"var(--fr-red)":"var(--fr-green)"}}/></div></div>
  <div className="flex gap-2 steel-plate p-2"><input placeholder="feature..." value={feat} onChange={e=>setFeat(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addFeat();}} className="flex-1 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><input type="number" value={cost} onChange={e=>setCost(Number(e.target.value)||0)} className="w-16 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><button onClick={addFeat} className="mono text-[10px] font-black px-3" style={{background:"var(--fr-amber)",color:"#000"}}>+ ADD</button></div>
  <div className="space-y-1">{cur.features.map(f=>(<div key={f.id} className="flex items-center gap-2 p-2 rounded-sm" style={{background:f.bought?"rgba(34,197,94,0.1)":"var(--fr-card2)",border:`1px solid ${f.bought?"var(--fr-green)":"var(--fr-borderSoft)"}`}}>
    <input type="checkbox" checked={f.bought} onChange={()=>patch({features:cur.features.map(x=>x.id===f.id?{...x,bought:!x.bought}:x)})} className="accent-green-500"/>
    <span className={`flex-1 text-sm ${f.bought?"line-through opacity-60":""}`}>{f.text}</span><span className="mono text-[10px]" style={{color:"var(--fr-amber)"}}>${f.cost}</span>
    <button onClick={()=>patch({features:cur.features.filter(x=>x.id!==f.id)})} className="opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>
  </div>))}</div></div>);
}

/* ================================================================== */
/*  I) PAIRED COMPARISON                                               */
/* ================================================================== */

export function PairedTab(){
  const {forge,updateForge}=useStore();const[opt,setOpt]=useState("");const list=forge.paired;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(p=>p.id===active);
  const mk=()=>{updateForge(f=>({paired:[{id:uid(),date:today(),options:[],votes:{}},...f.paired]}));setActive(list[0]?.id||null);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#a78bfa",color:"#000"}}>+ NEW PAIRED</button></div>;
  const addOpt=()=>{if(!opt.trim())return;const nv={...cur.votes};cur.options.forEach(o=>{nv[o]=nv[o]||{};nv[opt]=nv[opt]||{};});updateForge(f=>({paired:f.paired.map(x=>x.id===cur.id?{...x,options:[...x.options,opt.trim()],votes:nv}:x)}));setOpt("");};
  const vote=(a:string,b:string,w:string)=>{const nv={...cur.votes};nv[a]={...(nv[a]||{}),[b]:w};nv[b]={...(nv[b]||{}),[a]:w};updateForge(f=>({paired:f.paired.map(x=>x.id===cur.id?{...x,votes:nv}:x)}));};
  const wins=(o:string)=>cur.options.filter(x=>x!==o).reduce((n,x)=>n+(cur.votes[o]?.[x]===o?1:0),0);
  const ranked=[...cur.options].sort((a,b)=>wins(b)-wins(a));
  return (<div className="space-y-3"><div className="flex gap-2 items-center steel-plate p-2"><input placeholder="+ option..." value={opt} onChange={e=>setOpt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addOpt();}} className="flex-1 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><button onClick={addOpt} className="mono text-[10px] font-black px-3" style={{background:"#a78bfa",color:"#000"}}>+ ADD</button><button onClick={mk} className="mono text-[10px] px-2" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid md:grid-cols-2 gap-3"><div className="space-y-2"><h4 className="mono text-[11px] font-black tracking-widest" style={{color:"#a78bfa"}}>HEAD-TO-HEAD</h4>
  {cur.options.flatMap((a,i)=>cur.options.slice(i+1).map(b=>({a,b}))).map(({a,b})=>{const w=cur.votes[a]?.[b];return (<div key={a+b} className="rounded-sm p-2 flex items-center gap-2" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}>
    <button onClick={()=>vote(a,b,a)} className="flex-1 mono text-[10px] px-2 py-1 rounded-sm text-left" style={{background:w===a?"var(--fr-amber)":"transparent",color:w===a?"#000":"var(--fr-fg)",border:"1px solid var(--fr-borderSoft)"}}>{a}</button>
    <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>vs</span>
    <button onClick={()=>vote(a,b,b)} className="flex-1 mono text-[10px] px-2 py-1 rounded-sm text-left" style={{background:w===b?"var(--fr-amber)":"transparent",color:w===b?"#000":"var(--fr-fg)",border:"1px solid var(--fr-borderSoft)"}}>{b}</button>
  </div>);})}
  {cur.options.length<2&&<p className="pencil italic text-xs text-center py-4" style={{color:"var(--fr-fgDim)"}}>Add 2+ options.</p>}</div>
  <div className="space-y-1"><h4 className="mono text-[11px] font-black tracking-widest" style={{color:"#22c55e"}}>RANKED</h4>
  {ranked.map((o,i)=>(<div key={o} className="flex items-center gap-2 p-2 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)"}}><span className="mono text-[12px] font-black w-6 text-center" style={{color:["#facc15","#c0c0c0","#cd7f32"][i]||"#94a3b8"}}>#{i+1}</span><span className="flex-1 text-sm">{o}</span><span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>{wins(o)}W</span></div>))}</div></div></div>);
}

/* ================================================================== */
/*  J) CUSTOMER JOURNEY MAP                                            */
/* ================================================================== */

export function JourneyTab(){
  const {forge,updateForge}=useStore();
  const list = forge.journeyMaps;
  const [active,setActive] = useState<string|null>(list[0]?.id||null);
  const [pid,setPid] = useState("");
  const cur = list.find(j=>j.id===active);
  const mk = () => {
    const j: JourneyMap = { id: uid(), projectId: pid||undefined, persona: "Customer", stages: [
      { name: "AWARE", actions:"", thoughts:"", painPoints:"", opportunities:"", satisfaction:5 },
      { name: "CONSIDER", actions:"", thoughts:"", painPoints:"", opportunities:"", satisfaction:5 },
      { name: "DECIDE", actions:"", thoughts:"", painPoints:"", opportunities:"", satisfaction:5 },
      { name: "USE", actions:"", thoughts:"", painPoints:"", opportunities:"", satisfaction:5 },
      { name: "RETAIN", actions:"", thoughts:"", painPoints:"", opportunities:"", satisfaction:5 },
    ]};
    updateForge(f=>({journeyMaps:[j,...f.journeyMaps]}));
    setActive(j.id);
  };
  const patch = (p:Partial<JourneyMap>) => cur && updateForge(f=>({journeyMaps:f.journeyMaps.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const patchStage = (i:number,p:Partial<JourneyMap["stages"][number]>) => cur && patch({stages:cur.stages.map((s,j)=>j===i?{...s,...p}:s)});
  const addStage = () => cur && patch({stages:[...cur.stages,{name:"STAGE",actions:"",thoughts:"",painPoints:"",opportunities:"",satisfaction:5}]});
  const del = (id:string) => { updateForge(f=>({journeyMaps:f.journeyMaps.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#fb923c",color:"#000"}}>+ NEW JOURNEY</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <input value={cur.persona} onChange={e=>patch({persona:e.target.value})} className="mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}} placeholder="Persona name"/>
        <select value={active||""} onChange={e=>setActive(e.target.value)} className="mono text-[10px] px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          {list.map(j=><option key={j.id} value={j.id}>{j.persona}</option>)}
        </select>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {cur.stages.map((s,i)=>(
            <div key={i} className="w-64 rounded-sm p-2 shrink-0" style={{background:"var(--fr-card2)",border:`2px solid ${"#fb923c"}44`}}>
              <input value={s.name} onChange={e=>patchStage(i,{name:e.target.value})} className="w-full bg-transparent mono text-[10px] font-black tracking-widest mb-2 outline-none" style={{color:"#fb923c"}}/>
              {(["actions","thoughts","painPoints","opportunities"] as const).map(k=>(
                <div key={k} className="mb-1">
                  <div className="mono text-[8px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>{k.toUpperCase()}</div>
                  <textarea value={(s as any)[k]} onChange={e=>patchStage(i,{[k]:e.target.value} as any)} rows={2} className="w-full bg-transparent outline-none pencil text-[10px] resize-none" style={{color:"var(--fr-fg)"}}/>
                </div>
              ))}
              <div>
                <div className="mono text-[8px] tracking-widest flex justify-between" style={{color:"var(--fr-fgMuted)"}}><span>SAT</span><span>{s.satisfaction}/10</span></div>
                <input type="range" min={1} max={10} value={s.satisfaction} onChange={e=>patchStage(i,{satisfaction:Number(e.target.value)})} className="w-full" style={{accentColor:"#fb923c"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={addStage} className="mono text-[10px] px-3 py-1.5 rounded-sm" style={{background:"#fb923c",color:"#000"}}>+ STAGE</button>
      {/* Satisfaction curve */}
      <div className="steel-plate rounded-sm p-3 relative" style={{borderColor:"#fb923c55"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="mono text-[10px] tracking-widest font-black mb-2" style={{color:"#fb923c"}}>SATISFACTION CURVE</div>
        <svg viewBox="0 0 600 100" className="w-full h-24">
          <line x1={20} y1={90} x2={580} y2={90} stroke="var(--fr-borderSoft)"/>
          <polyline
            points={cur.stages.map((s,i)=>{
              const x = 20 + (i*(560/Math.max(1,cur.stages.length-1)));
              const y = 85 - ((s.satisfaction-1)/9)*70;
              return `${x},${y}`;
            }).join(" ")}
            fill="none" stroke="#fb923c" strokeWidth={2} style={{filter:"drop-shadow(0 0 4px #fb923c)"}}/>
          {cur.stages.map((s,i)=>{
            const x = 20 + (i*(560/Math.max(1,cur.stages.length-1)));
            const y = 85 - ((s.satisfaction-1)/9)*70;
            return <circle key={i} cx={x} cy={y} r={4} fill="#fb923c"/>;
          })}
        </svg>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  K) SERVICE BLUEPRINT                                               */
/* ================================================================== */

export function BlueprintTab(){
  const {forge,updateForge}=useStore();
  const list = forge.blueprints;
  const [active,setActive]=useState<string|null>(list[0]?.id||null);
  const [pid,setPid]=useState("");
  const cur = list.find(b=>b.id===active);
  const mk = () => {
    const b: ServiceBlueprint = { id: uid(), projectId: pid||undefined, date: today(), customerActions:[], onstage:[], backstage:[], support:[], evidence:[] };
    updateForge(f=>({blueprints:[b,...f.blueprints]})); setActive(b.id);
  };
  const patch = (p:Partial<ServiceBlueprint>) => cur && updateForge(f=>({blueprints:f.blueprints.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const add = (k:keyof ServiceBlueprint, v:string) => patch({[k]:[...((cur as any)[k]||[]),v]} as any);
  const rm = (k:keyof ServiceBlueprint, i:number) => patch({[k]:((cur as any)[k]||[]).filter((_:any,j:number)=>j!==i)} as any);
  const del = (id:string) => { updateForge(f=>({blueprints:f.blueprints.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#facc15",color:"#000"}}>+ NEW BLUEPRINT</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  const rows:[keyof ServiceBlueprint,string,string][] = [
    ["customerActions","CUSTOMER ACTIONS","#22c55e"],
    ["onstage","ONSTAGE (VISIBLE)","#06b6d4"],
    ["backstage","BACKSTAGE (INVISIBLE)","#a78bfa"],
    ["support","SUPPORT PROCESSES","#94a3b8"],
    ["evidence","PHYSICAL EVIDENCE","#f59e0b"],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>{cur.date}</span>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="space-y-2">
        {rows.map(([k,lbl,c])=>(
          <div key={k as string} className="rounded-sm p-2 flex items-start gap-2" style={{background:"var(--fr-card2)",borderTop:`3px solid ${c}`}}>
            <div className="mono text-[10px] font-black tracking-widest w-40 shrink-0" style={{color:c}}>{lbl}</div>
            <div className="flex-1 space-y-0.5">
              {((cur[k]||[]) as string[]).map((it,i)=>(
                <div key={i} className="text-xs pencil flex items-start gap-1 group"><span style={{color:c}}>▸</span><span className="flex-1">{it}</span><button onClick={()=>rm(k,i)} className="opacity-0 group-hover:opacity-100 mono text-[9px]" style={{color:"var(--fr-red)"}}>✕</button></div>
              ))}
              <input className="w-full bg-transparent outline-none mono text-[10px] mt-1" placeholder="+ add" onKeyDown={e=>{const t=e.currentTarget;if(e.key==="Enter"&&t.value.trim()){add(k,t.value.trim());t.value="";}}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  L) EVENT STORMING (DDD)                                            */
/* ================================================================== */

export function EventStormTab(){
  const {forge,updateForge}=useStore();
  const list = forge.eventStorms;
  const [active,setActive]=useState<string|null>(list[0]?.id||null);
  const [pid,setPid]=useState("");
  const cur = list.find(e=>e.id===active);
  const mk = () => {
    const e: EventStorm = { id: uid(), projectId: pid||undefined, date: today(), domain: "Domain", events: [] };
    updateForge(f=>({eventStorms:[e,...f.eventStorms]})); setActive(e.id);
  };
  const patch = (p:Partial<EventStorm>) => cur && updateForge(f=>({eventStorms:f.eventStorms.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const addEvt = (kind:"event"|"command"|"aggregate"|"policy", text:string, x:number) => cur && patch({events:[...cur.events,{id:uid(),text,kind,x}]});
  const rmEvt = (id:string) => cur && patch({events:cur.events.filter(e=>e.id!==id)});
  const del = (id:string) => { updateForge(f=>({eventStorms:f.eventStorms.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#f472b6",color:"#000"}}>+ NEW EVENT STORM</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  const COLORS = { event:"#f59e0b", command:"#06b6d4", aggregate:"#a78bfa", policy:"#22c55e" } as const;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <input value={cur.domain} onChange={e=>patch({domain:e.target.value})} className="mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}} placeholder="Domain"/>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {(["event","command","aggregate","policy"] as const).map(k=>(
          <EventAdder key={k} label={k.toUpperCase()} color={COLORS[k]} onAdd={(t)=>addEvt(k,t,cur.events.length*140+20)}/>
        ))}
      </div>
      <div className="steel-plate rounded-sm p-3 relative overflow-x-auto" style={{borderColor:"#f472b655",minHeight:200}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="relative" style={{height:160, minWidth: 600}}>
          <div className="absolute left-0 right-0" style={{top:"33%",borderTop:"1px dashed var(--fr-borderSoft)"}}/>
          <div className="absolute left-0 right-0" style={{top:"66%",borderTop:"1px dashed var(--fr-borderSoft)"}}/>
          {cur.events.map(ev=>(
            <div key={ev.id} className="absolute mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm flex items-center gap-1 whitespace-nowrap"
              style={{left:ev.x,top: ev.kind==="event"?"5%":ev.kind==="command"?"38%":ev.kind==="aggregate"?"71%":"5%",background:`${COLORS[ev.kind]}22`,color:COLORS[ev.kind],border:`1.5px solid ${COLORS[ev.kind]}`}}>
              {ev.text}
              <button onClick={()=>rmEvt(ev.id)} className="opacity-50 hover:opacity-100 ml-1">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EventAdder({label,color,onAdd}:{label:string;color:string;onAdd:(t:string)=>void}){
  const [text,setText]=useState("");
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-sm" style={{background:`${color}22`,border:`1px solid ${color}55`}}>
      <span className="mono text-[9px] font-black" style={{color}}>{label}</span>
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&text.trim()){onAdd(text.trim());setText("");}}}
        placeholder="add..." className="bg-transparent outline-none mono text-[10px] w-24" style={{color:"var(--fr-fg)"}}/>
    </div>
  );
}

/* ================================================================== */
/*  M) RADIAL MINDMAP                                                  */
/* ================================================================== */

export function MindmapTab(){
  const {forge,updateForge}=useStore();
  const list = forge.mindmaps;
  const [active,setActive]=useState<string|null>(list[0]?.id||null);
  const [pid,setPid]=useState("");
  const cur = list.find(m=>m.id===active);
  const mk = () => {
    const id = uid();
    const rootId = "n-"+uid();
    const m: Mindmap = { id, projectId: pid||undefined, title: "Mindmap", rootId, nodes:{[rootId]:{id:rootId,text:"CORE",x:400,y:220,children:[]}}, createdAt:Date.now() };
    updateForge(f=>({mindmaps:[m,...f.mindmaps]})); setActive(id);
  };
  const patch = (p:Partial<Mindmap>) => cur && updateForge(f=>({mindmaps:f.mindmaps.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const addChild = (parentId:string) => {
    if(!cur) return;
    const parent = cur.nodes[parentId]; if(!parent) return;
    const nid = "n-"+uid();
    const siblings = parent.children.length;
    const newNode: MindmapNode = { id:nid, text:"idea", x:parent.x+180, y:parent.y+siblings*36-36, parentId, color:"#f59e0b", children:[] };
    patch({ nodes:{...cur.nodes, [nid]:newNode, [parentId]:{...parent,children:[...parent.children,nid]} }});
  };
  const editNode = (nid:string,updates:Partial<MindmapNode>) => cur && patch({nodes:{...cur.nodes,[nid]:{...cur.nodes[nid],...updates}}});
  const delNode = (nid:string) => {
    if(!cur) return;
    if(nid===cur.rootId) return;
    const nodes = {...cur.nodes};
    const parent = nodes[nid].parentId;
    const drop = (id:string) => {
      (nodes[id].children||[]).forEach(drop);
      delete nodes[id];
    };
    drop(nid);
    if(parent && nodes[parent]) nodes[parent] = {...nodes[parent], children:nodes[parent].children.filter(c=>c!==nid)};
    patch({nodes});
  };
  const del = (id:string) => { updateForge(f=>({mindmaps:f.mindmaps.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#818cf8",color:"#000"}}>+ NEW MINDMAP</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  const root = cur.nodes[cur.rootId];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <input value={cur.title} onChange={e=>patch({title:e.target.value})} className="mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="steel-plate rounded-sm relative overflow-auto" style={{borderColor:"#818cf866",minHeight:460,backgroundImage:"radial-gradient(rgba(129,140,248,0.1) 1px, transparent 1px)",backgroundSize:"20px 20px"}}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{minHeight:460,minWidth:800}}>
          {Object.values(cur.nodes).flatMap(n=>n.children.map(cid=>{
            const c = cur.nodes[cid]; if(!c) return null;
            return <line key={n.id+"-"+cid} x1={n.x} y1={n.y} x2={c.x} y2={c.y} stroke="#818cf8" strokeWidth={1.5} strokeDasharray="2 3" opacity={0.5}/>;
          }))}
        </svg>
        {Object.values(cur.nodes).map(n=>{
          const isRoot = n.id===cur.rootId;
          return (
            <div key={n.id} className="absolute flex items-center gap-1" style={{left:n.x-40,top:n.y-14}}>
              <button onClick={()=>addChild(n.id)} className="mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center" style={{background:"#818cf8",color:"#000"}} title="Add child">+</button>
              <input value={n.text} onChange={e=>editNode(n.id,{text:e.target.value})}
                className={`mono text-xs font-black outline-none px-2 py-1 rounded-sm text-center ${isRoot?"text-base":""}`}
                style={{background:isRoot?"#818cf8":"var(--fr-card2)",color:isRoot?"#000":"var(--fr-fg)",border:`2px solid ${n.color||"#818cf8"}66`,minWidth:isRoot?100:70}}/>
              {!isRoot && <button onClick={()=>delNode(n.id)} className="mono text-[9px] opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>}
            </div>
          );
        })}
      </div>
      <p className="mono text-[10px] italic text-center" style={{color:"var(--fr-fgMuted)"}}>Click + to branch. Edit node text inline. Drag repositioning slated for v1.2.</p>
    </div>
  );
}

/* ================================================================== */
/*  N) FREE-FORM IDEA CANVAS (sticky/box/arrow)                       */
/* ================================================================== */

export function CanvasTab(){
  const {forge,updateForge}=useStore();
  const list = forge.canvases;
  const [active,setActive]=useState<string|null>(list[0]?.id||null);
  const [pid,setPid]=useState("");
  const [tool,setTool]=useState<"sticky"|"box"|"dot"|"note">("sticky");
  const cur = list.find(c=>c.id===active);
  const mk = () => {
    const c: IdeaCanvas = { id: uid(), projectId: pid||undefined, title: "Canvas", items:[], createdAt:Date.now() };
    updateForge(f=>({canvases:[c,...f.canvases]})); setActive(c.id);
  };
  const patch = (p:Partial<IdeaCanvas>) => cur && updateForge(f=>({canvases:f.canvases.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const placeItem = (e:React.MouseEvent<HTMLDivElement>) => {
    if(!cur) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const item: CanvasItem = { id:uid(), x:Math.round(e.clientX-rect.left), y:Math.round(e.clientY-rect.top), w: tool==="sticky"?120:tool==="box"?160:24, h: tool==="sticky"?80:tool==="box"?60:24, text:tool==="sticky"?"note":tool==="box"?"box":tool==="note"?"✎":"●", color: tool==="sticky"?"#facc15":tool==="box"?"#06b6d4":tool==="note"?"#ec4899":"#ef4444", kind:tool };
    patch({items:[...cur.items,item]});
  };
  const editItem = (id:string,updates:Partial<CanvasItem>) => cur && patch({items:cur.items.map(i=>i.id===id?{...i,...updates}:i)});
  const delItem = (id:string) => cur && patch({items:cur.items.filter(i=>i.id!==id)});
  const del = (id:string) => { updateForge(f=>({canvases:f.canvases.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#f59e0b",color:"#000"}}>+ NEW CANVAS</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  const colors:Record<string,string> = { sticky:"#facc15", box:"#06b6d4", dot:"#ef4444", note:"#ec4899" };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <input value={cur.title} onChange={e=>patch({title:e.target.value})} className="mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <div className="flex gap-1">
          {(["sticky","box","dot","note"] as const).map(t=>(
            <button key={t} onClick={()=>setTool(t)} className="mono text-[9px] font-black tracking-widest px-2 py-1 rounded-sm"
              style={{background:tool===t?colors[t]:"transparent",color:tool===t?"#000":colors[t],border:`1px solid ${colors[t]}`}}>{t.toUpperCase()}</button>
          ))}
        </div>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="steel-plate rounded-sm relative overflow-auto cursor-crosshair" style={{borderColor:"#f59e0b66",height:480,backgroundImage:"linear-gradient(rgba(245,158,11,0.07) 1px, transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.07) 1px, transparent 1px)",backgroundSize:"24px 24px"}}
        onClick={placeItem}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        {cur.items.map(i=>(
          <div key={i.id} className="absolute pencil text-xs p-1 flex items-center justify-center text-center group"
            style={{left:i.x, top:i.y, width:i.w, height:i.h, background:i.kind==="dot"?"transparent":`${i.color}33`, color:"#000", border:`2px solid ${i.color}`, borderRadius:i.kind==="sticky"?2:i.kind==="dot"?"999px":3, boxShadow:i.kind==="sticky"?"2px 3px 0 rgba(0,0,0,0.2)":"none"}}
            onClick={e=>e.stopPropagation()}>
            <span className="pencil text-center break-words" style={{color:i.kind==="dot"?i.color:"#1f2937"}}>{i.text}</span>
            <button onClick={()=>delItem(i.id)} className="absolute -top-2 -right-2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 mono text-[9px]" style={{background:"var(--fr-red)",color:"#000"}}>✕</button>
          </div>
        ))}
      </div>
      <p className="mono text-[10px] italic text-center" style={{color:"var(--fr-fgMuted)"}}>Click the canvas to drop a {tool}. Click the ✕ to remove.</p>
    </div>
  );
}

/* ================================================================== */
/*  O) WIREFRAME SCREENS                                               */
/* ================================================================== */

export function WireframeTab(){
  const {forge,updateForge}=useStore();
  const list = forge.wireframes;
  const [active,setActive]=useState<string|null>(list[0]?.id||null);
  const [pid,setPid]=useState("");
  const cur = list.find(w=>w.id===active);
  const mk = () => {
    const w: Wireframe = { id:uid(), projectId:pid||undefined, title:"Wireframes", screens:[], createdAt:Date.now() };
    updateForge(f=>({wireframes:[w,...f.wireframes]})); setActive(w.id);
  };
  const patch = (p:Partial<Wireframe>) => cur && updateForge(f=>({wireframes:f.wireframes.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const addScreen = () => cur && patch({screens:[...cur.screens,{id:uid(),name:"Screen "+(cur.screens.length+1),notes:"",elements:[]}]});
  const patchScreen = (id:string,p:Partial<Wireframe["screens"][number]>) => cur && patch({screens:cur.screens.map(s=>s.id===id?{...s,...p}:s)});
  const delScreen = (id:string) => cur && patch({screens:cur.screens.filter(s=>s.id!==id)});
  const del = (id:string) => { updateForge(f=>({wireframes:f.wireframes.filter(x=>x.id!==id)})); setActive(null); };
  if(!cur) return (<div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#94a3b8",color:"#000"}}>+ NEW WIREFRAME</button><div className="mt-3 inline-block"><ProjPicker value={pid} onChange={setPid}/></div></div>);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={v=>{setPid(v); if(cur) patch({projectId:v||undefined});}}/>
        <input value={cur.title} onChange={e=>patch({title:e.target.value})} className="mono text-xs px-2 py-1 rounded-sm" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/>
        <button onClick={addScreen} className="mono text-[10px] px-2 py-1" style={{background:"#94a3b8",color:"#000"}}>+ SCREEN</button>
        <button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button>
        <button onClick={()=>del(cur.id)} className="mono text-[10px] px-2 py-1" style={{color:"var(--fr-red)",border:"1px solid var(--fr-red)"}}>✕ DELETE</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cur.screens.map(s=>(
          <div key={s.id} className="rounded-sm p-3" style={{background:"var(--fr-card2)",border:"2px solid #94a3b844"}}>
            <div className="flex items-center gap-2 mb-2">
              <input value={s.name} onChange={e=>patchScreen(s.id,{name:e.target.value})} className="flex-1 bg-transparent mono text-sm font-black outline-none" style={{color:"#94a3b8"}}/>
              <button onClick={()=>delScreen(s.id)} className="opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>
            </div>
            {/* Wireframe sketch box */}
            <div className="rounded-sm relative mb-2" style={{background:"repeating-linear-gradient(0deg,transparent 0 11px,rgba(148,163,184,0.12) 11px 12px)",border:"1.5px solid #94a3b8",height:180}}>
              <div className="absolute top-2 left-2 right-2 h-6 rounded-sm" style={{border:"1px dashed #94a3b8",background:"rgba(148,163,184,0.08)"}}/>
              <div className="absolute top-10 left-2 w-1/3 h-10 rounded-sm" style={{border:"1px dashed #94a3b8"}}/>
              <div className="absolute top-10 right-2 w-1/3 h-10 rounded-full" style={{border:"1px dashed #94a3b8"}}/>
              <div className="absolute bottom-10 left-2 right-2 h-6 rounded-sm" style={{background:"rgba(148,163,184,0.2)"}}/>
              <div className="absolute bottom-2 left-1/3 right-1/3 h-7 rounded-sm" style={{background:"rgba(148,163,184,0.5)"}}/>
              <span className="absolute top-1 right-1 mono text-[8px]" style={{color:"#94a3b8"}}>375×667</span>
            </div>
            <textarea value={s.notes} onChange={e=>patchScreen(s.id,{notes:e.target.value})} rows={2} placeholder="notes / figma link / copy..." className="w-full bg-transparent outline-none pencil text-xs resize-none" style={{borderBottom:"1px dashed #94a3b866",color:"var(--fr-fg)"}}/>
          </div>
        ))}
      </div>
      <p className="mono text-[10px] italic text-center" style={{color:"var(--fr-fgMuted)"}}>Wireframe placeholders use sketch boxes — link to Figma files in notes.</p>
    </div>
  );
}

/* ================================================================== */
/*  P) VOICE NOTES (MediaRecorder)                                     */
/* ================================================================== */

export function VoiceTab(){
  const {forge,updateForge}=useStore();
  const [pid,setPid]=useState("");
  const [recording,setRecording] = useState(false);
  const [elapsed,setElapsed] = useState(0);
  const mediaRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number|null>(null);

  useEffect(() => () => { stop(); }, []);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t=>t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        const note: VoiceNote = { id:uid(), projectId:pid||undefined, createdAt:Date.now(), durationSec:elapsed, transcript:"" };
        // attach a blob URL via a global map (not persisted; session-only playback)
        (window as any).__forgeVoice = (window as any).__forgeVoice || {};
        (window as any).__forgeVoice[note.id] = url;
        updateForge(f=>({voiceNotes:[note,...f.voiceNotes]}));
        setElapsed(0);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      const t0 = Date.now();
      timerRef.current = window.setInterval(()=>setElapsed(Math.round((Date.now()-t0)/1000)),1000);
    } catch(e) {
      alert("Microphone access denied or unavailable. Transcript field works offline — just type.");
    }
  };
  const stop = () => {
    if(timerRef.current){ clearInterval(timerRef.current); timerRef.current=null; }
    if(mediaRef.current && mediaRef.current.state!=="inactive"){ try{mediaRef.current.stop();}catch{} }
    setRecording(false);
  };
  const del = (id:string) => {
    const url = (window as any).__forgeVoice?.[id];
    if(url) URL.revokeObjectURL(url);
    updateForge(f=>({voiceNotes:f.voiceNotes.filter(v=>v.id!==id)}));
  };
  const patchNote = (id:string,p:Partial<VoiceNote>) => updateForge(f=>({voiceNotes:f.voiceNotes.map(v=>v.id===id?{...v,...p}:v)}));
  const list = pid ? forge.voiceNotes.filter(v=>v.projectId===pid) : forge.voiceNotes;
  const mmss = (s:number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPicker value={pid} onChange={setPid}/>
        <button onClick={recording?stop:start}
          className="mono text-[10px] font-black tracking-widest px-3 py-2 rounded-sm flex items-center gap-2"
          style={{background:recording?"var(--fr-red)":"var(--fr-pink,#f472b6)",color:"#000"}}>
          <span className={`w-2 h-2 rounded-full ${recording?"animate-pulse":""}`} style={{background:"#000"}}/>
          {recording?`REC ${mmss(elapsed)} — STOP`:"RECORD VOICE NOTE"}
        </button>
        <span className="pencil text-xs italic ml-auto" style={{color:"var(--fr-fgMuted)"}}>
          Tip: no transcription API wired — type in the transcript box below after recording.
        </span>
      </div>
      {list.length===0 && (
        <div className="steel-plate rounded-sm p-10 text-center" style={{borderColor:"#f472b666"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <p className="mono text-[11px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>No voice notes yet.</p>
          <p className="pencil text-xs italic mt-1" style={{color:"var(--fr-fgDim)"}}>
            Capture raw thoughts quickly — hammer details out in Smelter later.
          </p>
        </div>
      )}
      <div className="space-y-2">
        {list.map(v=>{
          const url = (window as any).__forgeVoice?.[v.id];
          const dt = new Date(v.createdAt);
          return (
            <div key={v.id} className="steel-plate rounded-sm p-3 relative" style={{borderColor:"#f472b655"}}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center gap-3 mb-2">
                <span className="mono text-[11px] font-black" style={{color:"#f472b6"}}>▶ VOICE · {mmss(v.durationSec)}</span>
                <span className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>{dt.toLocaleString()}</span>
                <button onClick={()=>del(v.id)} className="ml-auto opacity-50 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>
              </div>
              {url && <audio src={url} controls className="w-full mb-2" style={{height:28}}/>}
              <textarea value={v.transcript||""} onChange={e=>patchNote(v.id,{transcript:e.target.value})} rows={2}
                placeholder="transcript / notes..."
                className="w-full bg-transparent outline-none pencil text-xs resize-none p-1" style={{border:"1px dashed #f472b666",color:"var(--fr-fg)"}}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}
