"use client";

/**
 * CertsSection — Courses & certifications tracker.
 * Fields: name, provider, start, end, certReceived, expiry, hours, rating, notes.
 * Expiry countdown: < 90 days → yellow, < 30 days / expired → red.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Award, Clock, Trash2, Calendar, Star, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useStore } from "../../../lib/store";
import { useTheme } from "../../../lib/theme";
import type { CareerCourse } from "../../../lib/careerTypes";

const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().slice(0,10);

export default function CertsSection() {
  const isDark = useTheme().theme === "dark";
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

  const upd = (id: string, patch: Partial<CareerCourse>) => updateCareer(c => ({ courses: c.courses.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const del = (id: string) => { if (confirm("Delete course/cert?")) updateCareer(c => ({ courses: c.courses.filter(x => x.id !== id) })); };

  const expiryInfo = (d?: string) => {
    if (!d) return null;
    const ms = new Date(d).getTime() - Date.now();
    const days = Math.ceil(ms/86400000);
    if (days < 0) return { text: `Expired ${-days}d ago`, color: "#ef4444", warn: true };
    if (days < 30) return { text: `Expires in ${days}d`, color: "#ef4444", warn: true };
    if (days < 90) return { text: `Expires in ${days}d`, color: "#f59e0b", warn: true };
    return { text: `Expires ${d}`, color: "#67e8f9", warn: false };
  };

  const totalHours = career.courses.reduce((n,c)=>n+(c.hoursInvested||0),0);
  const completed = career.courses.filter(c=>c.completed).length;
  const earned = career.courses.filter(c=>c.certReceived).length;
  const expiring = career.courses.filter(c => { const i = expiryInfo(c.expiryDate); return i?.warn; }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl imperial-name" style={{ color: isDark ? "#fde68a" : "#1a0f0a" }}>Certs & Courses</h2>
          <p className="text-sm serif-body italic mt-1" style={{ color: isDark ? "#a8b8c8" : "#7c5a44" }}>
            Log every course, book and credential — expiry tracked automatically.
          </p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)}
          className="emperor-title text-xs tracking-[0.25em] px-4 py-2.5 rounded-xl flex items-center gap-2 font-black transition hover:scale-105"
          style={{ background: "linear-gradient(135deg,#0e7490,#164e63)", color:"#cffafe", border:"1.5px solid rgba(103,232,249,0.6)", boxShadow:"0 8px 20px -8px rgba(6,182,212,0.8)" }}>
          <Plus size={14}/> LOG COURSE
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Tracked" value={career.courses.length} color="#06b6d4"/>
        <Stat label="Completed" value={completed} color="#a3e635"/>
        <Stat label="Certs earned" value={earned} color="#d4af37"/>
        <Stat label="Total hours" value={totalHours} color="#ec4899"/>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form onSubmit={(e)=>{e.preventDefault();add();}}
            initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="rounded-xl p-4 grid md:grid-cols-2 gap-3"
            style={{ background: isDark?"rgba(12,26,34,0.8)":"rgba(255,248,228,0.9)", border:"1px solid rgba(103,232,249,0.35)" }}>
            <Input label="Course / Cert name" value={draft.name??""} onChange={v=>setDraft(d=>({...d,name:v}))} />
            <Input label="Provider" value={draft.provider??""} onChange={v=>setDraft(d=>({...d,provider:v}))} />
            <Input label="Start date" type="date" value={draft.startDate??""} onChange={v=>setDraft(d=>({...d,startDate:v}))}/>
            <Input label="End date" type="date" value={draft.endDate??""} onChange={v=>setDraft(d=>({...d,endDate:v,completed:!!v}))}/>
            <Input label="Expiry (if cert)" type="date" value={draft.expiryDate??""} onChange={v=>setDraft(d=>({...d,expiryDate:v}))}/>
            <Input label="Hours invested" type="number" value={String(draft.hoursInvested??0)} onChange={v=>setDraft(d=>({...d,hoursInvested:Number(v)}))}/>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.certReceived} onChange={e=>setDraft(d=>({...d,certReceived:e.target.checked}))}/> Cert received</label>
            <div>
              <div className="text-[10px] emperor-title tracking-widest mb-1" style={{color:"#8b9eb0"}}>RATING</div>
              <select value={draft.rating??5} onChange={e=>setDraft(d=>({...d,rating:Number(e.target.value)}))}
                className="w-full bg-transparent px-2 py-2 rounded outline-none text-sm"
                style={{border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.15)"}`}}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n} style={{background:"#0a0709"}}>{n}/10</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><Input label="Key takeaways" value={draft.keyTakeaways??""} onChange={v=>setDraft(d=>({...d,keyTakeaways:v}))}/></div>
            <div className="md:col-span-2"><Input label="Application notes" value={draft.applicationNotes??""} onChange={v=>setDraft(d=>({...d,applicationNotes:v}))}/></div>
            <div className="md:col-span-2"><Input label="Notes" value={draft.notes??""} onChange={v=>setDraft(d=>({...d,notes:v}))}/></div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="emperor-title text-xs tracking-widest px-4 py-2 rounded-lg" style={{background:"#0e7490",color:"#cffafe"}}>Save</button>
              <button type="button" onClick={()=>setShowForm(false)} className="text-sm text-gray-400 px-3">Cancel</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {career.courses.length === 0 && !showForm && (
        <div className="rounded-2xl p-10 text-center" style={{background:"rgba(12,26,34,0.4)",border:"1px dashed rgba(103,232,249,0.25)"}}>
          <Award size={28} className="mx-auto mb-2" style={{color:"#67e8f9"}}/>
          <p className="imperial-title tracking-widest text-sm" style={{color:"#cffafe"}}>No courses logged yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {career.courses.map(c => {
          const exp = expiryInfo(c.expiryDate);
          return (
            <motion.div key={c.id} layout
              className="rounded-xl p-4"
              style={{ background: isDark ? "linear-gradient(145deg,rgba(12,26,34,0.7),rgba(10,20,24,0.5))" : "rgba(255,248,228,0.9)",
                border: `1px solid ${exp?.warn ? exp.color+"66" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`}}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{background:"rgba(6,182,212,0.18)",border:"1px solid rgba(103,232,249,0.5)",color:"#67e8f9"}}>
                  {c.certReceived ? <Award size={18}/> : <BookOpen size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input value={c.name} onChange={e=>upd(c.id,{name:e.target.value})}
                      className="bg-transparent font-bold text-sm md:text-base outline-none"
                      style={{color: isDark?"#f3e9d2":"#1a0f0a",minWidth:180}}/>
                    <span className="text-[10px] emperor-title px-1.5 py-0.5 rounded" style={{color:"#67e8f9",background:"rgba(6,182,212,0.12)"}}>{c.provider}</span>
                    {c.completed && <span className="text-[10px] flex items-center gap-0.5" style={{color:"#a3e635"}}><CheckCircle2 size={10}/>COMPLETED</span>}
                    {exp && <span className="text-[10px] flex items-center gap-0.5" style={{color:exp.color}}><AlertTriangle size={10}/>{exp.text}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px]" style={{color:isDark?"#8b9eb0":"#6b513d"}}>
                    {c.startDate && <span className="flex items-center gap-1"><Calendar size={10}/>{c.startDate}{c.endDate?` → ${c.endDate}`:""}</span>}
                    {c.hoursInvested ? <span className="flex items-center gap-1"><Clock size={10}/>{c.hoursInvested}h</span> : null}
                    {c.rating && <span className="flex items-center gap-0.5 text-amber-400"><Star size={10}/>{c.rating}/10</span>}
                  </div>
                  {(c.keyTakeaways || c.notes || c.applicationNotes) && (
                    <div className="mt-2 text-xs space-y-1" style={{color:isDark?"#c4cfd9":"#3a2a1d"}}>
                      {c.keyTakeaways && <p><span className="emperor-title text-[10px] tracking-widest text-cyan-400 mr-1">TAKEAWAYS</span>{c.keyTakeaways}</p>}
                      {c.applicationNotes && <p><span className="emperor-title text-[10px] tracking-widest text-amber-400 mr-1">APPLIED</span>{c.applicationNotes}</p>}
                      {c.notes && <p style={{color:isDark?"#8b9eb0":"#6b513d"}} className="serif-body italic">{c.notes}</p>}
                    </div>
                  )}
                </div>
                <button onClick={()=>del(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 self-start"><Trash2 size={12}/></button>
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
    <div className="rounded-xl p-3" style={{background:"rgba(12,26,34,0.6)",border:`1px solid ${color}33`}}>
      <div className="text-[10px] emperor-title tracking-widest" style={{color}}>{label.toUpperCase()}</div>
      <div className="text-xl font-black mt-1" style={{color:"#f3e9d2"}}>{value}</div>
    </div>
  );
}

function Input({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}) {
  return (
    <label className="block">
      <div className="text-[10px] emperor-title tracking-widest mb-1" style={{color:"#8b9eb0"}}>{label.toUpperCase()}</div>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        className="w-full bg-transparent px-3 py-2 rounded outline-none text-sm"
        style={{border:"1px solid rgba(255,255,255,0.1)"}}/>
    </label>
  );
}

function BookOpen({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
