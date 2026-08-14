"use client";

/**
 * CommandNav — terminal-style `> cmd_` trigger for the Career space.
 * Reads colors from the career-root CSS variables so it inverts automatically
 * between night-HUD and blueprint light mode.
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
      className="relative font-mono font-bold tracking-[0.2em] text-xs md:text-sm px-3.5 py-2 rounded-sm flex items-center gap-2 shrink-0 hud-corner cmd-nav"
      style={{
        color: "var(--cr-accent)",
        background: open ? "var(--cr-accent)" : "transparent",
        border: `1px solid ${open ? "var(--cr-accent)" : "color-mix(in srgb, var(--cr-accent) 55%, transparent)"}`,
        textShadow: open ? "none" : "0 0 8px color-mix(in srgb, var(--cr-accent) 60%, transparent)",
        boxShadow: open
          ? "0 0 24px color-mix(in srgb, var(--cr-accent) 60%, transparent), inset 0 0 12px rgba(255,255,255,0.2)"
          : "0 0 18px -6px color-mix(in srgb, var(--cr-accent) 50%, transparent)",
      }}>
      <span className="c-tr"/><span className="c-bl"/>
      <Terminal size={13}/>
      <span className="hidden sm:inline" style={{ color: open ? "var(--cr-bg)" : "var(--cr-accent)" }}>
        {open ? ":wq" : "cmd"}
      </span>
      {!open && (
        <span aria-hidden className="inline-block w-1.5 h-3"
          style={{ background: "var(--cr-accent2)", animation: "k-blink 1s steps(2) infinite", marginLeft: 2 }}/>
      )}
    </motion.button>
  );
}
