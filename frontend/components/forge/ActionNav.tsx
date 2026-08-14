"use client";
/**
 * ActionNav — the animated STRIKE (hammer) button in ForgePage.
 *
 * Lives top-left of the Forge chrome. Clicking it toggles the ActionPanel
 * (command card) and fires a 14-particle amber spark burst for that satisfying
 * "hot metal" feel. Particle trajectories are pre-computed per render for
 * determinism; colors span molten-amber/cream gradient.
 */
import { Hammer } from "lucide-react";
import { useTheme } from "../../lib/theme";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Spark {
  id: number;
  dx: number;
  dy: number;
  size: number;
  dur: number;
  color: string;
}

const SPARK_COLORS = ["#fde68a", "#f59e0b", "#ea580c", "#fb923c", "#fffbeb"];

export default function ActionNav({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  const light = theme === "light";
  const color = light ? "#92400e" : "#f59e0b";
  const bg = light ? "rgba(146,64,14,0.08)" : "rgba(245,158,11,0.12)";
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const strike = useCallback(() => {
    // Generate a spray of sparks radiating from the hammer head
    const n = 14;
    const burst: Spark[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (-Math.PI * 0.85) + Math.random() * Math.PI * 0.7; // upward fan
      const dist = 26 + Math.random() * 46;
      burst.push({
        id: Date.now() + i,
        dx: Math.cos(angle) * dist * (Math.random() < 0.5 ? -1 : 1) * 0.9,
        dy: Math.sin(angle) * dist - Math.random() * 14,
        size: 2 + Math.random() * 3,
        dur: 0.45 + Math.random() * 0.35,
        color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      });
    }
    setSparks(prev => [...prev, ...burst]);
    window.setTimeout(() => {
      setSparks(prev => prev.filter(s => !burst.find(b => b.id === s.id)));
    }, 900);
    // Trigger the global burst too (big ambient shower)
    window.dispatchEvent(new CustomEvent("career:burst", { detail: { color, count: 18 } }));
    onToggle();
  }, [color, onToggle]);

  return (
    <button ref={btnRef} onClick={strike}
      className="relative px-3 py-1.5 rounded-sm steel-plate flex items-center gap-2 text-[11px] tracking-[0.25em] font-black transition hover:scale-[1.03] overflow-visible"
      style={{
        color,
        background: bg,
        borderColor: color,
        boxShadow: open ? `0 0 18px ${color}88, inset 0 0 12px ${color}33` : "none",
      }}
      title="STRIKE (n or /)">
      <span className="riv-tl"/><span className="riv-tr"/><span className="riv-bl"/><span className="riv-br"/>
      <motion.span
        animate={open ? { rotate: [0, -35, 0] } : { rotate: 0 }}
        transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
        className="inline-flex">
        <Hammer size={14}/>
      </motion.span>
      <span>STRIKE</span>

      {/* Spark particles */}
      <AnimatePresence>
        {sparks.map(s => (
          <motion.span key={s.id}
            initial={{ x: 18, y: -2, opacity: 1, scale: 1 }}
            animate={{ x: 18 + s.dx, y: -2 + s.dy, opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: s.dur, ease: [0.22,1,0.36,1] }}
            className="pointer-events-none absolute rounded-full"
            style={{
              width: s.size, height: s.size,
              background: s.color,
              boxShadow: `0 0 8px ${s.color}, 0 0 16px ${s.color}88`,
              left: 0, top: "50%",
              marginTop: -s.size/2,
            }}/>
        ))}
      </AnimatePresence>

      {/* Hotkey chip */}
      <span className="hidden md:inline-flex mono text-[9px] font-black tracking-widest px-1 py-[1px] rounded-sm ml-1"
        style={{
          color,
          border: `1px solid ${color}88`,
          background: "transparent",
          opacity: 0.8,
        }}>⌘K</span>
    </button>
  );
}
