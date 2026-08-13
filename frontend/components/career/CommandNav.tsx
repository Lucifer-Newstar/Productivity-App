"use client";

/**
 * CommandNav — terminal-style `> cmd_` trigger for the Career space.
 * Replaces the workout katana/swords icon with a terminal chevron prompt.
 */

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function CommandNav({ open, onToggle }: Props) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative font-mono font-bold tracking-[0.2em] text-xs md:text-sm px-3.5 py-2 rounded-sm flex items-center gap-2 shrink-0 hud-corner"
      style={{
        color: open ? "#05080d" : "#22d3ee",
        background: open ? "#22d3ee" : "rgba(34,211,238,0.08)",
        border: `1px solid ${open ? "#22d3ee" : "rgba(34,211,238,0.55)"}`,
        textShadow: open ? "none" : "0 0 8px rgba(34,211,238,0.6)",
        boxShadow: open
          ? "0 0 24px rgba(34,211,238,0.6), inset 0 0 12px rgba(255,255,255,0.2)"
          : "0 0 18px -6px rgba(34,211,238,0.5)",
      }}>
      <span className="c-tr"/><span className="c-bl"/>
      <Terminal size={13} />
      <span className="hidden sm:inline">{open ? ":wq" : "cmd"}</span>
      {!open && <span aria-hidden className="inline-block w-1.5 h-3" style={{background:"#22d3ee",animation:"k-blink 1s steps(2) infinite",marginLeft:2}}/>}
    </motion.button>
  );
}
