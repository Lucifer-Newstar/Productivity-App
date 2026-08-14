"use client";
/**
 * VaultSection — /projects/vault
 * Archive of shipped projects + dead projects w/ obituaries, export backup,
 * and cold-storage toggle from active list.
 */
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Archive, Skull, CheckCircle2, Download, RotateCcw,
  BookOpen, Trash2,
} from "lucide-react";
import { useStore } from "../../../lib/store";

export default function VaultSection() {
  const { forge, updateForge } = useStore();
  const [tab, setTab] = useState<"shipped"|"dead"|"archive">("shipped");

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
        <button onClick={exportJSON}
          className="relative px-3 py-2 rounded-sm steel-plate mono text-[10px] font-black tracking-widest flex items-center gap-1"
          style={{background:"var(--fr-card2)",borderColor:"var(--fr-borderSoft)",color:"var(--fr-fg)"}}>
          <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
          <Download size={12}/> EXPORT
        </button>
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
