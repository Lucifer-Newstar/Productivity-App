"use client";

/**
 * CertsSection — Courses & certifications tracker.
 *   - HUD themed (cyan/green/gold/red accents, CSS variables for blueprint light).
 *   - Expiry countdown VISUAL PROGRESS BAR (2-year validity window default).
 *   - Course progress bar when not completed (endDate vs startDate → today).
 *   - Rating, hours, key takeaways, application notes.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Award, Clock, Trash2, Calendar, Star, AlertTriangle,
  CheckCircle2, BookOpen,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import type { CareerCourse } from "../../../lib/careerTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);
const DAY = 86400000;
// Default validity window for rendering countdown bars (2 years).
const VALIDITY_WINDOW = 730;

const COLORS = {
  cyan: "var(--cr-accent)",
  green: "var(--cr-accent3)",
  gold: "#facc15",
  red: "#f87171",
  amber: "#fb923c",
  pink: "#f472b6",
  violet: "#a78bfa",
};

export default function CertsSection() {
  const { career, updateCareer } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Partial<CareerCourse>>({
    name: "", provider: "", startDate: today(), endDate: "", certReceived: false, completed: false,
    hoursInvested: 0, rating: 5, notes: "", keyTakeaways: "", applicationNotes: "",
  });

  const add = () => {
    if (!draft.name?.trim() || !draft.provider?.trim()) return;
    const course: CareerCourse = {
      id: uid(), name: draft.name!, provider: draft.provider!, startDate: draft.startDate,
      endDate: draft.endDate || undefined, completed: !!draft.endDate, certReceived: !!draft.certReceived,
      expiryDate: draft.expiryDate, hoursInvested: Number(draft.hoursInvested)||0, rating: Number(draft.rating)||5,
      notes: draft.notes, keyTakeaways: draft.keyTakeaways, applicationNotes: draft.applicationNotes,
    };
    updateCareer((c) => ({ courses: [course, ...c.courses] }));
    setShowForm(false);
    setDraft({ name:"", provider:"", startDate:today(), completed:false, certReceived:false, hoursInvested:0, rating:5 });
  };

  const upd = (id: string, patch: Partial<CareerCourse>) =>
    updateCareer(c => ({ courses: c.courses.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const del = (id: string) => {
    if (!confirm("Delete course/cert?")) return;
    updateCareer(c => ({ courses: c.courses.filter(x => x.id !== id) }));
  };

  // Expiry info: returns days remaining + state
  const expiryInfo = (c: CareerCourse) => {
    if (!c.expiryDate) return null;
    const exp = new Date(c.expiryDate).getTime();
    const issued = c.endDate ? new Date(c.endDate).getTime() : exp - VALIDITY_WINDOW*DAY;
    const total = Math.max(1, (exp - issued) / DAY);
    const remaining = (exp - Date.now()) / DAY;
    const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
    if (remaining < 0) return { text: `Expired ${Math.ceil(-remaining)}d ago`, color: COLORS.red,   warn: true, pct: 0,  state: "expired" as const };
    if (remaining < 30) return { text: `Expires in ${Math.ceil(remaining)}d`,      color: COLORS.red,   warn: true, pct,       state: "critical" as const };
    if (remaining < 90) return { text: `Expires in ${Math.ceil(remaining)}d`,      color: COLORS.amber, warn: true, pct,       state: "warn" as const };
    return                        { text: `Expires ${c.expiryDate}`,                color: COLORS.green, warn: false,pct,       state: "ok" as const };
  };

  // Course progress (start->end vs today)
  const progressInfo = (c: CareerCourse) => {
    if (c.completed || !c.startDate || !c.endDate) return null;
    const s = new Date(c.startDate).getTime();
    const e = new Date(c.endDate).getTime();
    const now = Date.now();
    const total = Math.max(1, (e - s) / DAY);
    const done = Math.max(0, Math.min(total, (now - s) / DAY));
    return { pct: Math.max(0, Math.min(100, (done/total)*100)) };
  };

  const totalHours = career.courses.reduce((n,c)=>n+(c.hoursInvested||0),0);
  const completed = career.courses.filter(c=>c.completed).length;
  const earned = career.courses.filter(c=>c.certReceived).length;
  const expiring = career.courses.filter(c => { const i = expiryInfo(c); return i?.warn; }).length;
  const inProgress = career.courses.filter(c => !c.completed).length;

  const card = { background: "var(--cr-card)", border: "1px solid var(--cr-borderSoft)" };
  const inputStyle = { background: "transparent", border: "1px solid var(--cr-borderSoft)", color: "var(--cr-fg)" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider flex items-center gap-2" style={{color:"var(--cr-fg)"}}>
            <Award size={22} style={{color:COLORS.green}}/> certs.courses
          </h2>
          <p className="text-[11px] tracking-widest mt-1" style={{color:"var(--cr-fgMuted)"}}>
            &gt; credentials logged · expiry auto-counted · hours tallied
          </p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          className="text-[11px] tracking-[0.25em] font-bold px-4 py-2 rounded-sm hud-corner flex items-center gap-2 transition hover:scale-105"
          style={{background:COLORS.cyan,color:"var(--cr-bg)",border:`1px solid ${COLORS.cyan}`}}>
          <span className="c-tr"/><span className="c-bl"/>
          <Plus size={13}/> LOG COURSE
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <Stat label="Tracked" value={career.courses.length} color={COLORS.cyan}/>
        <Stat label="Completed" value={completed} color={COLORS.green}/>
        <Stat label="Certs" value={earned} color={COLORS.gold}/>
        <Stat label="Active" value={inProgress} color={COLORS.violet}/>
        <Stat label="Expiring" value={expiring} color={expiring>0?COLORS.red:COLORS.amber}/>
        <Stat label="Hours" value={totalHours} color={COLORS.pink}/>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={(e)=>{e.preventDefault();add();}}
            initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="rounded-sm p-4 grid md:grid-cols-2 gap-3 hud-corner relative"
            style={{...card, border: `1px solid ${COLORS.cyan}66`}}>
            <span className="c-tr"/><span className="c-bl"/>
            <Input label="Course / Cert name" value={draft.name??""} onChange={v=>setDraft(d=>({...d,name:v}))}/>
            <Input label="Provider" value={draft.provider??""} onChange={v=>setDraft(d=>({...d,provider:v}))}/>
            <Input label="Start date" type="date" value={draft.startDate??""} onChange={v=>setDraft(d=>({...d,startDate:v}))}/>
            <Input label="End date" type="date" value={draft.endDate??""} onChange={v=>setDraft(d=>({...d,endDate:v,completed:!!v}))}/>
            <Input label="Expiry (if cert)" type="date" value={draft.expiryDate??""} onChange={v=>setDraft(d=>({...d,expiryDate:v}))}/>
            <Input label="Hours invested" type="number" value={String(draft.hoursInvested??0)} onChange={v=>setDraft(d=>({...d,hoursInvested:Number(v)}))}/>
            <label className="flex items-center gap-2 text-xs tracking-widest font-bold" style={{color:"var(--cr-fg)"}}>
              <input type="checkbox" checked={!!draft.certReceived} onChange={e=>setDraft(d=>({...d,certReceived:e.target.checked}))}
                style={{accentColor:COLORS.gold}}/> CERT RECEIVED
            </label>
            <div>
              <div className="text-[9px] tracking-widest font-bold mb-1" style={{color:"var(--cr-fgMuted)"}}>RATING</div>
              <select value={draft.rating??5} onChange={e=>setDraft(d=>({...d,rating:Number(e.target.value)}))}
                className="w-full bg-transparent px-2 py-1.5 rounded-sm outline-none text-xs" style={inputStyle}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><Input label="Key takeaways" value={draft.keyTakeaways??""} onChange={v=>setDraft(d=>({...d,keyTakeaways:v}))}/></div>
            <div className="md:col-span-2"><Input label="Application notes" value={draft.applicationNotes??""} onChange={v=>setDraft(d=>({...d,applicationNotes:v}))}/></div>
            <div className="md:col-span-2"><Input label="Notes" value={draft.notes??""} onChange={v=>setDraft(d=>({...d,notes:v}))}/></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="text-[11px] tracking-widest font-bold px-4 py-2 rounded-sm"
                style={{background:COLORS.cyan,color:"var(--cr-bg)"}}>Save</button>
              <button type="button" onClick={()=>setShowForm(false)} className="text-xs px-3" style={{color:"var(--cr-fgMuted)"}}>Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {career.courses.length === 0 && !showForm && (
        <div className="rounded-sm p-10 text-center hud-corner relative"
          style={{background:"var(--cr-card2)",border:"1px dashed var(--cr-border)"}}>
          <span className="c-tr"/><span className="c-bl"/>
          <Award size={24} className="mx-auto mb-2" style={{color:COLORS.cyan}}/>
          <p className="text-xs tracking-widest font-bold" style={{color:COLORS.cyan}}>No courses logged yet.</p>
          <p className="text-[11px] mt-1 tracking-wide" style={{color:"var(--cr-fgMuted)"}}>Start one. Log it. Watch the stack grow.</p>
        </div>
      )}

      <div className="space-y-2">
        {career.courses.map(c => {
          const exp = expiryInfo(c);
          const prog = progressInfo(c);
          const accent = exp?.color ?? COLORS.cyan;
          return (
            <motion.div key={c.id} layout
              className="rounded-sm p-4 hud-corner relative"
              style={{...card, borderColor: exp?.warn ? exp.color : "var(--cr-borderSoft)"}}>
              <span className="c-tr"/><span className="c-bl"/>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{background:`${accent}22`,border:`1px solid ${accent}66`,color:accent}}>
                  {c.certReceived ? <Award size={16}/> : <BookOpen size={16}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input value={c.name} onChange={e=>upd(c.id,{name:e.target.value})}
                      className="bg-transparent font-bold text-sm md:text-base outline-none min-w-[180px] flex-1"
                      style={{color:"var(--cr-fg)"}}/>
                    <span className="text-[9px] tracking-widest font-bold px-1.5 py-0.5 rounded-sm"
                      style={{color:COLORS.cyan,background:`${COLORS.cyan}22`,border:`1px solid ${COLORS.cyan}44`}}>{c.provider}</span>
                    {c.completed && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                      style={{color:COLORS.green,background:`${COLORS.green}22`,border:`1px solid ${COLORS.green}44`}}>
                      <CheckCircle2 size={9}/>COMPLETED</span>}
                    {c.certReceived && <span className="text-[9px] tracking-widest font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
                      style={{color:COLORS.gold,background:`${COLORS.gold}22`,border:`1px solid ${COLORS.gold}44`}}>
                      <Award size={9}/>CERT</span>}
                    {!c.completed && prog && <span className="text-[9px] tracking-widest font-bold" style={{color:COLORS.violet}}>
                      {Math.round(prog.pct)}% IN PROGRESS
                    </span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] tracking-wider flex-wrap" style={{color:"var(--cr-fgMuted)"}}>
                    {c.startDate && <span className="flex items-center gap-1"><Calendar size={10}/>{c.startDate}{c.endDate?` → ${c.endDate}`:""}</span>}
                    {c.hoursInvested ? <span className="flex items-center gap-1"><Clock size={10}/>{c.hoursInvested}h</span> : null}
                    {c.rating && <span className="flex items-center gap-0.5" style={{color:COLORS.gold}}><Star size={10}/>{c.rating}/10</span>}
                  </div>

                  {/* Course progress bar */}
                  {!c.completed && prog && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{background:"var(--cr-borderSoft)"}}>
                        <div className="h-full rounded-full transition-all" style={{width:`${prog.pct}%`,background:COLORS.violet,boxShadow:`0 0 6px ${COLORS.violet}80`}}/>
                      </div>
                    </div>
                  )}

                  {/* Expiry countdown bar */}
                  {exp && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[9px] tracking-widest font-bold mb-1">
                        <span className="flex items-center gap-1" style={{color:exp.color}}>
                          {exp.warn && <AlertTriangle size={9}/>}{exp.text}
                        </span>
                        <span style={{color:"var(--cr-fgMuted)"}}>{Math.round(exp.pct)}% VALID</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden relative" style={{background:"var(--cr-borderSoft)"}}>
                        <div className="h-full rounded-full transition-all"
                          style={{width:`${exp.pct}%`,
                            background: exp.state==="expired"
                              ? `repeating-linear-gradient(45deg,${COLORS.red},${COLORS.red} 6px,#000 6px,#000 12px)`
                              : `linear-gradient(90deg, ${exp.color}, ${exp.color}aa)`,
                            boxShadow: exp.warn ? `0 0 6px ${exp.color}80` : "none"}}/>
                      </div>
                    </div>
                  )}

                  {(c.keyTakeaways || c.notes || c.applicationNotes) && (
                    <div className="mt-2 text-xs space-y-1">
                      {c.keyTakeaways && <p style={{color:"var(--cr-fg)"}}>
                        <span className="text-[9px] tracking-widest font-bold mr-1" style={{color:COLORS.cyan}}>TAKEAWAYS</span>
                        {c.keyTakeaways}
                      </p>}
                      {c.applicationNotes && <p style={{color:"var(--cr-fg)"}}>
                        <span className="text-[9px] tracking-widest font-bold mr-1" style={{color:COLORS.amber}}>APPLIED</span>
                        {c.applicationNotes}
                      </p>}
                      {c.notes && <p className="text-[11px] italic" style={{color:"var(--cr-fgMuted)"}}>{c.notes}</p>}
                    </div>
                  )}
                </div>
                <button onClick={()=>del(c.id)} className="p-1.5 rounded-sm self-start" style={{color:COLORS.red}}><Trash2 size={12}/></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({label,value,color}:{label:string;value:number|string;color:string}) {
  return (
    <div className="rounded-sm p-2.5 hud-corner relative"
      style={{background:"var(--cr-card)",border:`1px solid ${color}55`}}>
      <span className="c-tr"/><span className="c-bl"/>
      <div className="text-[9px] tracking-widest font-bold" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-lg font-black leading-tight mt-0.5" style={{color:"var(--cr-fg)"}}>{value}</div>
    </div>
  );
}

function Input({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}) {
  return (
    <label className="block">
      <div className="text-[9px] tracking-widest font-bold mb-1" style={{color:"var(--cr-fgMuted)"}}>{label.toUpperCase()}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        className="w-full bg-transparent px-3 py-1.5 rounded-sm outline-none text-xs"
        style={{background:"transparent",border:"1px solid var(--cr-borderSoft)",color:"var(--cr-fg)"}}/>
    </label>
  );
}
