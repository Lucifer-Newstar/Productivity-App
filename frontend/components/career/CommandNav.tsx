"use client";

/**
 * CommandNav — the ⚔ COMMAND ⚔ trigger button for the Career space.
 * Mirrors BattleNav but uses the Career cyan/gold palette instead of red/gold.
 */

import { motion } from "framer-motion";
import { Swords } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function CommandNav({ open, onToggle }: Props) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={open ? { boxShadow: "0 0 30px -2px rgba(103,232,249,0.9)" } : {}}
      className="relative overflow-hidden px-4 md:px-5 py-2 rounded-xl emperor-title font-black tracking-[0.25em] text-xs md:text-sm flex items-center gap-2 shrink-0"
      style={{
        background: open
          ? "linear-gradient(135deg, #67e8f9 0%, #0e7490 50%, #67e8f9 100%)"
          : "linear-gradient(135deg, #0e7490 0%, #164e63 50%, #0e7490 100%)",
        color: open ? "#0a0709" : "#cffafe",
        border: "2px solid rgba(103,232,249,0.55)",
        textShadow: open ? "none" : "0 1px 2px rgba(0,0,0,0.6), 0 0 10px rgba(103,232,249,0.3)",
        boxShadow: open
          ? "0 8px 24px -8px rgba(6,182,212,0.9), inset 0 1px 0 rgba(255,255,255,0.35)"
          : "0 8px 24px -8px rgba(6,182,212,0.9), inset 0 1px 0 rgba(186,230,253,0.3)",
      }}>
      {!open && (
        <motion.span aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 20px -2px rgba(212,175,55,0.4)",
              "0 0 40px 2px rgba(103,232,249,0.7)",
              "0 0 20px -2px rgba(212,175,55,0.4)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <span aria-hidden className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(110deg, transparent 30%, rgba(186,230,253,0.45) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2.8s linear infinite",
        }} />
      <Swords size={16} className="relative" />
      <span className="relative">{open ? "CLOSE" : "COMMAND"}</span>
      <Swords size={16} className="relative" style={{ transform: "scaleX(-1)" }} />
    </motion.button>
  );
}
