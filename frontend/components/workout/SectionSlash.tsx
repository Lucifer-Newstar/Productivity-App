"use client";

/**
 * SectionSlash — quick slash-wipe overlay that flashes when the user switches
 * between workout sub-pages (Overview → Charts, etc.).
 *
 * Controlled by the `active` prop (true = mid-transition). Parent mounts this
 * during the AnimatePresence gap; we play a katana diagonal + red/gold flash
 * in ~380ms.
 */

import { motion } from "framer-motion";

export default function SectionSlash() {
  return (
    <motion.div
      key="slash-transition"
      className="fixed inset-0 z-[60] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, times: [0, 0.15, 0.55, 1] }}
    >
      {/* Diagonal slash */}
      <motion.div aria-hidden
        initial={{ clipPath: "polygon(0 0, 0 0, -10% 10%, -10% 0)" }}
        animate={{ clipPath: "polygon(0 0, 110% 110%, 120% 120%, 10% 0)" }}
        transition={{ duration: 0.25, ease: [0.7,0,0.3,1] }}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, transparent 46%, rgba(253,230,138,0.8) 49%, rgba(185,28,28,0.7) 51%, transparent 54%)",
          filter: "drop-shadow(0 0 12px rgba(253,230,138,0.9)) drop-shadow(0 0 28px rgba(185,28,28,0.6))",
        }}
      />
      {/* Flash burst */}
      <motion.div aria-hidden
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.6, 0], scale: [0.3, 2, 3] }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 flex items-center justify-center">
        <div className="w-[60vmin] h-[60vmin] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(253,230,138,0.7) 0%, rgba(185,28,28,0.4) 30%, transparent 70%)",
            filter: "blur(10px)",
          }}
      />
      </motion.div>
    </motion.div>
  );
}
