"use client";

/**
 * CelebrationModal — full-screen overlay for achievements.
 *
 * Accepts a title, emoji, subtitle and a CTA button. Auto-dismisses after 6s
 * or when user clicks outside/Continue. Used for PRs, goal hits, unlocks and
 * badge grants.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CheckCircle2 } from "lucide-react";
import Confetti from "./Confetti";

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  emoji?: string;
  color?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export default function CelebrationModal({
  open, title, subtitle, emoji = "🏆", color = "#f59e0b", actionLabel = "Let's go", onAction, onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={onClose}>
          <Confetti active={open} />
          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-sm w-full rounded-3xl glass border border-white/10 p-8 text-center"
            style={{ borderColor: `${color}60`, boxShadow: `0 20px 80px -20px ${color}80` }}>
            <motion.div
              initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{ background: `radial-gradient(circle at 30% 30%, ${color}, ${color}50)` }}>
              {emoji}
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            {subtitle && <p className="text-gray-400 text-sm mb-6">{subtitle}</p>}
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => { onAction?.(); onClose(); }}
                className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                <CheckCircle2 size={14} className="inline mr-1" />{actionLabel}
              </button>
            </div>
            <Trophy className="absolute top-4 right-4 opacity-20" size={40} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
