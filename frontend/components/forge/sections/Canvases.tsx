"use client";
import { useState } from "react";
import { useStore } from "../../../lib/store";
import type { BusinessModelCanvas, ValuePropCanvas, LeanCanvas, PorterFive, Pestel, UserStory, AffinityGroup, BuyAFeature, PairedComparison } from "../../../lib/forgeTypes";
const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

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
function ProjPP({v,on}:{v:string;on:(s:string)=>void}){return <ProjPicker value={v} onChange={on}/>;}

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
function makeList<T extends {id:string}>():{add:(it:T)=>void;remove:(id:string)=>void}{return {add:()=>{},remove:()=>{}};}

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
  if(!cur) return (<div className="text-center py-12"><button onClick={add} className="mono text-[11px] font-black tracking-widest px-4 py-3 rounded-sm steel-plate" style={{background:"#f59e0b",color:"#000"}}>+ NEW BMC</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>);
  const B=(t:keyof BusinessModelCanvas,c:string)=><BlockEditor title={t as string} items={(cur[t]||[]) as string[]} color={c} onAdd={v=>push(t,v)} onRemove={i=>rm(t,i)}/>;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ProjPP v={pid} on={setPid}/>
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
export function VPCTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.vpc.filter(v=>v.projectId===pid):forge.vpc;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(v=>v.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),products:[],painRelievers:[],gainCreators:[],customerJobs:[],pains:[],gains:[]};updateForge(f=>({vpc:[v,...f.vpc]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#22c55e",color:"#000"}}>+ NEW VPC</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>;
  const patch=(p:Partial<ValuePropCanvas>)=>updateForge(f=>({vpc:f.vpc.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const B=(k:keyof ValuePropCanvas,c:string,t:string)=><BlockEditor title={t} items={(cur[k]||[]) as string[]} color={c} onAdd={v=>patch({[k]:[...((cur[k]||[]) as string[]),v]} as any)} onRemove={i=>patch({[k]:((cur[k]||[]) as string[]).filter((_,j)=>j!==i)} as any)}/>;
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPP v={pid} on={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-2 gap-2">
    <div className="space-y-2 p-2 rounded-sm" style={{border:"2px dashed #ec489966",background:"rgba(236,72,153,0.04)"}}><div className="mono text-[10px] font-black text-center" style={{color:"#ec4899"}}>PRODUCT</div>{B("products","#f59e0b","PRODUCTS")}{B("painRelievers","#ef4444","PAIN RELIEVERS")}{B("gainCreators","#22c55e","GAIN CREATORS")}</div>
    <div className="space-y-2 p-2 rounded-sm" style={{border:"2px dashed #06b6d466",background:"rgba(6,182,212,0.04)"}}><div className="mono text-[10px] font-black text-center" style={{color:"#06b6d4"}}>CUSTOMER</div>{B("customerJobs","#a78bfa","JOBS")}{B("pains","#ef4444","PAINS")}{B("gains","#22c55e","GAINS")}</div>
  </div></div>);
}
export function LeanTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.lean.filter(l=>l.projectId===pid):forge.lean;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(l=>l.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),problem:[],solution:[],keyMetrics:[],uniqueValue:"",unfairAdvantage:"",channels:[],customerSegments:[],costStructure:[],revenueStreams:[]};updateForge(f=>({lean:[v,...f.lean]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#a78bfa",color:"#000"}}>+ NEW LEAN</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>;
  const patch=(p:Partial<LeanCanvas>)=>updateForge(f=>({lean:f.lean.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const L=(k:keyof LeanCanvas,c:string,t:string,ml=false)=>(<div className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:`2px solid ${c}44`}}>
    <div className="mono text-[10px] tracking-widest font-black mb-1" style={{color:c}}>{t}</div>
    {ml?(<textarea value={(cur[k] as string)||""} onChange={e=>patch({[k]:e.target.value} as any)} rows={2} className="w-full bg-transparent outline-none pencil text-xs" style={{color:"var(--fr-fg)"}}/>):(<><div className="space-y-0.5">{((cur[k] as string[])||[]).map((it,i)=>(<div key={i} className="text-xs pencil flex items-start gap-1"><span style={{color:c}}>▸</span><span className="flex-1">{it}</span><button onClick={()=>patch({[k]:((cur[k] as string[])||[]).filter((_,j)=>j!==i)} as any)} className="opacity-50 mono text-[9px]" style={{color:"var(--fr-red)"}}>✕</button></div>))}</div><input className="w-full bg-transparent outline-none mono text-[10px] mt-1" placeholder="+ add" onKeyDown={e=>{const t=e.currentTarget;if(e.key==="Enter"&&t.value.trim()){patch({[k]:[...((cur[k] as string[])||[]),t.value.trim()]} as any);t.value="";}}}/></>)}
  </div>);
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPP v={pid} on={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-3 gap-2">{L("problem","#ef4444","PROBLEM")}{L("solution","#22c55e","SOLUTION")}{L("keyMetrics","#06b6d4","KEY METRICS")}{L("uniqueValue","#f59e0b","UVP",true)}{L("unfairAdvantage","#a78bfa","ADVANTAGE",true)}{L("channels","#ec4899","CHANNELS")}{L("customerSegments","#fb923c","CUSTOMERS")}{L("costStructure","#94a3b8","COSTS")}{L("revenueStreams","#facc15","REVENUE")}</div></div>);
}
export function PorterTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.porter.filter(p=>p.projectId===pid):forge.porter;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(p=>p.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),rivals:[],suppliers:[],buyers:[],entrants:[],substitutes:[]};updateForge(f=>({porter:[v,...f.porter]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#ef4444",color:"#000"}}>+ NEW PORTER</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>;
  const patch=(p:Partial<PorterFive>)=>updateForge(f=>({porter:f.porter.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const B=(k:keyof PorterFive,c:string,t:string)=><BlockEditor title={t} items={(cur[k]||[]) as string[]} color={c} onAdd={v=>patch({[k]:[...((cur[k]||[]) as string[]),v]} as any)} onRemove={i=>patch({[k]:((cur[k]||[]) as string[]).filter((_,j)=>j!==i)} as any)}/>;
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPP v={pid} on={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid grid-cols-6 gap-2"><div className="col-span-2">{B("rivals","#ef4444","RIVALRY")}</div><div className="flex flex-col gap-2">{B("entrants","#f59e0b","ENTRANTS")}{B("suppliers","#a78bfa","SUPPLIERS")}</div>
  <div className="rounded-sm p-2 flex items-center justify-center steel-plate" style={{color:"var(--fr-amber)"}}><div className="text-center mono"><div className="text-[10px] tracking-widest" style={{color:"var(--fr-fgMuted)"}}>THE</div><div className="text-xl font-black">INDUSTRY</div></div></div>
  <div className="flex flex-col gap-2">{B("buyers","#06b6d4","BUYERS")}{B("substitutes","#22c55e","SUBS")}</div></div></div>);
}
export function PestelTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.pestel.filter(p=>p.projectId===pid):forge.pestel;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(p=>p.id===active);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),political:"",economic:"",social:"",technological:"",environmental:"",legal:""};updateForge(f=>({pestel:[v,...f.pestel]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#06b6d4",color:"#000"}}>+ NEW PESTEL</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>;
  const patch=(p:Partial<Pestel>)=>updateForge(f=>({pestel:f.pestel.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const keys:[keyof Pestel,string,string][]=[["political","#ef4444","POLITICAL"],["economic","#f59e0b","ECONOMIC"],["social","#ec4899","SOCIAL"],["technological","#06b6d4","TECH"],["environmental","#22c55e","ENV"],["legal","#a78bfa","LEGAL"]];
  return (<div className="space-y-3"><div className="flex items-center gap-2"><ProjPP v={pid} on={setPid}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="grid md:grid-cols-3 gap-2">{keys.map(([k,c,l])=>(<div key={k} className="rounded-sm p-2" style={{background:"var(--fr-card2)",border:`2px solid ${c}44`}}><div className="mono text-[10px] font-black tracking-widest mb-1" style={{color:c}}>{l}</div><textarea value={cur[k] as string} onChange={e=>patch({[k]:e.target.value} as any)} rows={4} className="w-full bg-transparent outline-none pencil text-xs resize-none" style={{color:"var(--fr-fg)"}}/></div>))}</div></div>);
}
export function StoriesTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const[asA,setAsA]=useState("");const[iWant,setIWant]=useState("");const[soThat,setSoThat]=useState("");
  const stories=pid?forge.userStories.filter(s=>s.projectId===pid):forge.userStories;
  const add=()=>{if(!asA.trim()||!iWant.trim())return;const s:UserStory={id:uid(),projectId:pid||undefined,asA:asA.trim(),iWant:iWant.trim(),soThat:soThat.trim(),acceptance:[],priority:"P2",status:"backlog"};updateForge(f=>({userStories:[s,...f.userStories]}));setAsA("");setIWant("");setSoThat("");};
  const patch=(id:string,p:Partial<UserStory>)=>updateForge(f=>({userStories:f.userStories.map(s=>s.id===id?{...s,...p}:s)}));
  const del=(id:string)=>updateForge(f=>({userStories:f.userStories.filter(s=>s.id!==id)}));
  const cols:{id:UserStory["status"];label:string;color:string}[]=[{id:"backlog",label:"BACKLOG",color:"#94a3b8"},{id:"ready",label:"READY",color:"#06b6d4"},{id:"doing",label:"FORGING",color:"#f59e0b"},{id:"done",label:"SHIPPED",color:"#22c55e"}];
  return (<div className="space-y-3"><div className="steel-plate rounded-sm p-3 flex items-end gap-2 flex-wrap" style={{borderColor:"#ec4899"}}><ProjPP v={pid} on={setPid}/>
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
export function BuyAFeatureTab(){
  const {forge,updateForge}=useStore();const[pid,setPid]=useState("");const list=pid?forge.buyAFeature.filter(b=>b.projectId===pid):forge.buyAFeature;const[active,setActive]=useState<string|null>(list[0]?.id||null);const cur=list.find(b=>b.id===active);const[feat,setFeat]=useState("");const[cost,setCost]=useState(10);
  const mk=()=>{const v={id:uid(),projectId:pid||undefined,date:today(),budget:100,features:[]};updateForge(f=>({buyAFeature:[v,...f.buyAFeature]}));setActive(v.id);};
  if(!cur)return <div className="text-center py-12"><button onClick={mk} className="mono text-[11px] font-black px-4 py-3 steel-plate" style={{background:"#22c55e",color:"#000"}}>+ NEW BUY-A-FEATURE</button><div className="mt-3 inline-block"><ProjPP v={pid} on={setPid}/></div></div>;
  const spent=cur.features.filter(f=>f.bought).reduce((n,f)=>n+f.cost,0);
  const patch=(p:Partial<BuyAFeature>)=>updateForge(f=>({buyAFeature:f.buyAFeature.map(x=>x.id===cur.id?{...x,...p}:x)}));
  const addFeat=()=>{if(!feat.trim())return;patch({features:[...cur.features,{id:uid(),text:feat.trim(),cost,bought:false}]});setFeat("");setCost(10);};
  return (<div className="space-y-3"><div className="flex items-center gap-2 flex-wrap"><ProjPP v={pid} on={setPid}/><label className="mono text-[10px]" style={{color:"var(--fr-fgMuted)"}}>BUDGET</label><input type="number" value={cur.budget} onChange={e=>patch({budget:Number(e.target.value)||0})} className="w-20 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><button onClick={mk} className="mono text-[10px] px-2 py-1 ml-auto" style={{color:"var(--fr-cyan)",border:"1px solid var(--fr-cyan)"}}>+ NEW</button></div>
  <div className="rounded-sm steel-plate p-3"><div className="flex justify-between mono text-[10px] tracking-widest mb-1"><span style={{color:spent>cur.budget?"var(--fr-red)":"var(--fr-green)"}}>SPENT ${spent}</span><span style={{color:"var(--fr-fgMuted)"}}>BUDGET ${cur.budget}</span></div><div className="h-2 rounded-full overflow-hidden" style={{background:"var(--fr-borderSoft)"}}><div className="h-full" style={{width:`${Math.min(100,spent/Math.max(1,cur.budget)*100)}%`,background:spent>cur.budget?"var(--fr-red)":"var(--fr-green)"}}/></div></div>
  <div className="flex gap-2 steel-plate p-2"><input placeholder="feature..." value={feat} onChange={e=>setFeat(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addFeat();}} className="flex-1 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><input type="number" value={cost} onChange={e=>setCost(Number(e.target.value)||0)} className="w-16 mono text-xs px-2 py-1" style={{background:"var(--fr-card2)",border:"1px solid var(--fr-borderSoft)",color:"var(--fr-fg)"}}/><button onClick={addFeat} className="mono text-[10px] font-black px-3" style={{background:"var(--fr-amber)",color:"#000"}}>+ ADD</button></div>
  <div className="space-y-1">{cur.features.map(f=>(<div key={f.id} className="flex items-center gap-2 p-2 rounded-sm" style={{background:f.bought?"rgba(34,197,94,0.1)":"var(--fr-card2)",border:`1px solid ${f.bought?"var(--fr-green)":"var(--fr-borderSoft)"}`}}>
    <input type="checkbox" checked={f.bought} onChange={()=>patch({features:cur.features.map(x=>x.id===f.id?{...x,bought:!x.bought}:x)})} className="accent-green-500"/>
    <span className={`flex-1 text-sm ${f.bought?"line-through opacity-60":""}`}>{f.text}</span><span className="mono text-[10px]" style={{color:"var(--fr-amber)"}}>${f.cost}</span>
    <button onClick={()=>patch({features:cur.features.filter(x=>x.id!==f.id)})} className="opacity-40 hover:opacity-100" style={{color:"var(--fr-red)"}}>✕</button>
  </div>))}</div></div>);
}
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
export function JourneyTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Journey map: use Affinity + User Stories above.</div>;}
export function BlueprintTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Service blueprint: use Affinity + User Stories above.</div>;}
export function EventStormTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Event storming: use the timeline with BMC for domain flows.</div>;}
export function MindmapTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Mindmap canvas: use Scratch + STRIKE panel for freeform nodes.</div>;}
export function CanvasTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Drawing canvas: use Smelter scratch.</div>;}
export function WireframeTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Wireframes: link Figma/Sketch files in BRIEF → file links.</div>;}
export function VoiceTab(){return <div className="p-8 text-center pencil italic" style={{color:"var(--fr-fgMuted)"}}>Voice notes: MediaRecorder API scaffolding slated for v1.3.</div>;}
