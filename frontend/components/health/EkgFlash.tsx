"use client";

/**
 * EkgFlash — horizontal lime-green EKG pulse sweeps across the screen on section
 * transitions. Signature transition for the Health space (distinct from
 * HammerStrike vertical amber / HudFlash cyan / SectionSlash katana).
 */

import { motion, AnimatePresence } from "framer-motion";

export default function EkgFlash() {
  return (
    <AnimatePresence>
      <motion.div
        key="ekg-flash"
        aria-hidden
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 1] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, times: [0, 0.2, 0.6, 1] }}
        className="fixed inset-0 pointer-events-none z-[55]"
        style={{
          background:
            "linear-gradient(180deg, transparent 48%, #34d399 49%, #ffffff 50%, #10b981 51%, transparent 52%)",
          mixBlendMode: "screen",
          transformOrigin: "left",
        }}
      />
      <motion.div
        key="ekg-glow"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 pointer-events-none z-[54]"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(52,211,153,0.18), transparent 60%)",
        }}
      />
    </AnimatePresence>
  );
}
