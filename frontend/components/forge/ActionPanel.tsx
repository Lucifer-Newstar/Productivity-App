"use client";
/**
 * ActionPanel — the "command card" for the Forge. Chunky steel plates
 * numbered §01–§04 for each section, plus a quick ADD PROJECT hammer tile.
 */
import { motion } from "framer-motion";
import { Plus, Hammer } from "lucide-react";
import { FORGE_NAV, type ForgeSectionId } from "./ForgeShell";
import { useTheme } from "../../lib/theme";
import { useStore } from "../../lib/store";
import { useState } from "react";

const uid = () => Math.random().toString(36).slice(2,10);

export default function ActionPanel({ current, onPick }: {
  current: ForgeSectionId;
  onPick: (s: ForgeSectionId) => void;
}) {
  const { theme } = useTheme();
  const { updateForge } = useStore();
  const light = theme === "light";
  const [name, setName] = useState("");
  const [forging, setForging] = useState(false);

  const quickForge = () => {
    if (!name.trim()) return;
    const id = "p-" + uid();
    const today = new Date().toISOString().slice(0,10);
    updateForge(f => ({
      projects: [{
        id, codename: "NEW-" + String(f.projects.length+1).padStart(2,"0"),
        title: name.trim(), brief: "", why: "", successMetrics: "", rejectionCriteria: "",
        status: "on-track", priority: 5, energyDemand: 5, complexity: 5,
        color: "#f59e0b", icon: "🔥",
        createdAt: today, archived: false, checkinFreq: "weekly",
        budget: { actual: 0, currency: "$" },
        stakeholders: [], milestones: [], premortem: [], risks: [], issues: [],
        qualityChecks: [], comms: [], scope: "", tags: [], links: [], velocityPoints: [],
      }, ...f.projects],
    }));
    setName(""); setForging(false);
    window.dispatchEvent(new CustomEvent("career:burst", { detail: { color: "#f59e0b", count: 40 } }));
    window.dispatchEvent(new CustomEvent("career:toast", {
      detail: { title:"NEW HEAT", sub:"project added to foundry", color:"#f59e0b", icon:"zap", timeout:2400 },
    }));
  };

  const bg = light ? "rgba(255,252,244,0.88)" : "rgba(15,13,11,0.95)";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-widest uppercase flex items-center gap-2">
            <Hammer size={22} style={{color:"var(--fr-amber)"}}/> strike.anvil
          </h2>
          <p className="mono text-[11px] tracking-widest italic mt-1" style={{color:"var(--fr-fgMuted)"}}>
            // pick a section, or forge a new project
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {FORGE_NAV.map((n, i) => {
          const color = light ? n.colorLight : n.color;
          const isActive = current === n.id;
          return (
            <motion.button key={n.id}
              onClick={() => onPick(n.id)}
              whileHover={{ y: -3 }} whileTap={{ y: 0 }}
              className="relative rounded-sm steel-plate p-5 text-left"
              style={{
                background: bg,
                borderColor: isActive ? color : "var(--fr-borderSoft)",
                boxShadow: isActive ? `0 14px 36px -10px ${color}aa` : "none",
              }}>
              <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-[10px] tracking-widest" style={{color}}>§{n.code}</span>
                <n.icon size={18} style={{color}}/>
              </div>
              <div className="text-lg font-black tracking-wide uppercase" style={{color:"var(--fr-fg)"}}>{n.label}</div>
              <div className="mono text-[10px] mt-1" style={{color:"var(--fr-fgMuted)"}}>{n.description}</div>
              <div className="mt-3 h-[2px]" style={{background:color, opacity:isActive?1:0.3}}/>
            </motion.button>
          );
        })}
      </div>

      {/* Quick forge */}
      <div className="relative rounded-sm steel-plate p-5"
        style={{ background: bg, borderColor:"var(--fr-orange)" }}>
        <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
        <div className="flex items-center gap-2 mb-3">
          <span className="mono text-[10px] tracking-widest" style={{color:"var(--fr-orange)"}}>§QUICK_FORGE</span>
          <div className="h-px flex-1" style={{background:"var(--fr-borderSoft)"}}/>
          {!forging && <button onClick={()=>setForging(true)} className="mono text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm"
            style={{background:"var(--fr-orange)",color:"#000"}}>+ NEW PROJECT</button>}
        </div>
        {forging ? (
          <div className="flex gap-2 items-center">
            <input autoFocus value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") quickForge(); if(e.key==="Escape") setForging(false); }}
              placeholder="project codename..."
              className="flex-1 px-3 py-2 rounded-sm outline-none mono text-sm"
              style={{background:"var(--fr-card2)", border:"1px solid var(--fr-border)", color:"var(--fr-fg)"}}/>
            <button onClick={quickForge}
              className="mono text-[10px] font-black tracking-widest px-4 py-2 rounded-sm flex items-center gap-1"
              style={{background:"var(--fr-amber)",color:"#000"}}>
              <Plus size={12}/> FORGE
            </button>
            <button onClick={()=>setForging(false)}
              className="mono text-[10px] tracking-widest px-2 py-2 rounded-sm"
              style={{color:"var(--fr-fgMuted)"}}>ESC</button>
          </div>
        ) : (
          <p className="mono text-[11px] italic" style={{color:"var(--fr-fgMuted)"}}>
            Heat a new blank. Name it; you'll hammer the rest on the anvil.
          </p>
        )}
      </div>
    </div>
  );
}
