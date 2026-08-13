"use client";

/**
 * BattleNav — the BATTLE trigger button.
 *
 * This component is ONLY the trigger button. The actual navigation card
 * (BattleCard) renders inline in the page content (via WorkoutPage →
 * WorkoutShell `battleCard` prop) so it lives below the top strip and is
 * clearly "in the page", not stuck to the nav bar as a modal.
 *
 * Props:
 *   open    — whether the card is currently shown
 *   onToggle— fired when the button is clicked
 */

import { motion } from "framer-motion";
import { Swords } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function BattleNav({ open, onToggle }: Props) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={open ? { boxShadow: "0 0 30px -2px rgba(212,175,55,0.9)" } : {}}
      className="relative overflow-hidden px-4 md:px-5 py-2 rounded-xl emperor-title font-black tracking-[0.25em] text-xs md:text-sm flex items-center gap-2 shrink-0"
      style={{
        background: open
          ? "linear-gradient(135deg, #d4af37 0%, #9c7a1a 50%, #d4af37 100%)"
          : "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 50%, #b91c1c 100%)",
        color: open ? "#1a0f0a" : "#fff8e4",
        border: "2px solid rgba(253,230,138,0.5)",
        textShadow: open ? "none" : "0 1px 2px rgba(0,0,0,0.6), 0 0 10px rgba(253,230,138,0.3)",
        boxShadow: open
          ? "0 8px 24px -8px rgba(212,175,55,0.9), inset 0 1px 0 rgba(255,255,255,0.3)"
          : "0 8px 24px -8px rgba(185,28,28,0.9), inset 0 1px 0 rgba(253,230,138,0.3)",
      }}>
      {/* Pulsing gold halo when closed */}
      {!open && (
        <motion.span aria-hidden
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 20px -2px rgba(212,175,55,0.5)",
              "0 0 40px 2px rgba(212,175,55,0.8)",
              "0 0 20px -2px rgba(212,175,55,0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* Shimmer */}
      <span aria-hidden className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(110deg, transparent 30%, rgba(253,230,138,0.45) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2.8s linear infinite",
        }} />
      <Swords size={16} className="relative" />
      <span className="relative">{open ? "CLOSE" : "BATTLE"}</span>
      <Swords size={16} className="relative" style={{ transform: "scaleX(-1)" }} />
    </motion.button>
  );
}
