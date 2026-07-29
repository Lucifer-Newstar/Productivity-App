"use client";

/**
 * Career page — composed view (standalone route: /career).
 *
 * Hero header with live stats, a global track filter (TrackTabs), section tabs
 * (Roadmap / Notes / Posts / Goals / Achievements) with an animated sliding pill,
 * and the currently-selected section filtered by activeTrackId.
 */

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, StickyNote, Send, Target, Trophy, Briefcase, ArrowLeft } from "lucide-react";
import TrackTabs from "../../components/career/TrackTabs";
import Roadmap from "../../components/career/Roadmap";
import CareerNotes from "../../components/career/CareerNotes";
import Posts from "../../components/career/Posts";
import Goals from "../../components/career/Goals";
import AchievementVault from "../../components/career/AchievementVault";
import { useStore } from "../../lib/store";

type Section = "roadmap" | "notes" | "posts" | "goals" | "vault";

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: "roadmap", label: "Roadmap",      icon: Map },
  { id: "notes",   label: "Notes",        icon: StickyNote },
  { id: "posts",   label: "Posts",        icon: Send },
  { id: "goals",   label: "Goals",        icon: Target },
  { id: "vault",   label: "Achievements", icon: Trophy },
];

export default function CareerPage() {
  const [section, setSection] = useState<Section>("roadmap");
  const [activeTrackId, setActiveTrackId] = useState<string | "all">("all");
  const { career } = useStore();

  // Aggregate sub-concept progress across visible tracks (respects activeTrackId)
  const completedSubs = career.tracks.reduce(
    (n, t) => n + (activeTrackId === "all" || t.id === activeTrackId
      ? t.concepts.reduce((m, c) => m + c.subConcepts.filter((s) => s.done).length, 0)
      : 0),
    0,
  );
  const totalSubs = career.tracks.reduce(
    (n, t) => n + (activeTrackId === "all" || t.id === activeTrackId
      ? t.concepts.reduce((m, c) => m + c.subConcepts.length, 0)
      : 0),
    0,
  );
  const achievedCount = activeTrackId === "all"
    ? career.achievements.length
    : career.achievements.filter((a) => a.trackId === activeTrackId).length;
  const trackCount = activeTrackId === "all" ? career.tracks.length : 1;

  return (
    // Force dark styling for career internals — the colored tinted panels and
    // gradients were designed for the dark theme and look best that way.
    <div className="dark space-y-8 max-w-5xl mx-auto text-gray-100">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Hero header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 glass border border-black/10 dark:border-white/10 shadow-sm">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-xl glow-cyan">
            <Briefcase size={30} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Career
              {activeTrackId !== "all" && (
                <span className="ml-3 text-2xl align-middle opacity-60">
                  · {career.tracks.find((t) => t.id === activeTrackId)?.name}
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">Own your path — tracks, notes, posts, goals, and wins — all in one place.</p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4 mt-8">
          <Stat label={activeTrackId === "all" ? "Tracks" : "Track"} value={trackCount} color="#06b6d4" />
          <Stat label="Sub-concepts done" value={`${completedSubs}/${totalSubs}`} color="#a3e635" />
          <Stat label="Achievements" value={achievedCount} color="#f59e0b" />
        </div>
      </motion.div>

      {/* Global track filter */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Filter by track</p>
        <TrackTabs activeTrackId={activeTrackId} onChange={setActiveTrackId} />
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-bg-card/60 rounded-xl border border-white/5 w-fit">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
                active ? "text-white" : "text-gray-400 hover:text-gray-200"
              }`}>
              {active && (
                <motion.div layoutId="career-section-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/20 to-accent-cyan/10 border border-accent/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
              )}
              <Icon size={15} className="relative z-10" />
              <span className="relative z-10">{s.label}</span>
            </button>
          );
        })}
      </div>

      <motion.div key={`${section}-${activeTrackId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {section === "roadmap" && (
          <Section title="Roadmap" subtitle={activeTrackId === "all" ? "Switch between tracks with the tabs above, or filter to a single track." : `${career.tracks.find((t) => t.id === activeTrackId)?.name} milestones.`}>
            <Roadmap activeTrackId={activeTrackId} />
          </Section>
        )}
        {section === "notes" && (
          <Section title="Notes" subtitle="Track-specific notes — prep, reflections, interview questions, resources.">
            <CareerNotes activeTrackId={activeTrackId} />
          </Section>
        )}
        {section === "posts" && (
          <Section title="Posts" subtitle="LinkedIn, portfolio and resume — your public presence.">
            <Posts activeTrackId={activeTrackId} />
          </Section>
        )}
        {section === "goals" && (
          <Section title="Goals" subtitle="Double-click to rename. Assign to a track, set a deadline.">
            <Goals activeTrackId={activeTrackId} />
          </Section>
        )}
        {section === "vault" && (
          <Section title="Achievement Vault" subtitle="Every win counts — log them here.">
            <AchievementVault activeTrackId={activeTrackId} />
          </Section>
        )}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/5">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-1 text-white" style={{ color }}>{value}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
