"use client";

/**
 * WorkoutPage — shared wrapper for all /workout/* sub-routes.
 *
 * - WorkoutShell: top strip + content area (no left rail / bottom tabs).
 * - BattleNav: the ⚔ BATTLE ⚔ button in the top strip.
 * - BattleCard: the ornate Hall of Blades card rendered INLINE in the page
 *   content (not a modal / fixed overlay) when BATTLE is toggled open.
 *   Picking a section closes the card and routes.
 * - SectionSlash plays a quick katana flash between section navigations.
 * - Active-session takeover renders full-screen without chrome.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import WorkoutShell, { type WorkoutSectionId } from "./WorkoutShell";
import ActiveWorkout from "./ActiveWorkout";
import FreestyleWorkout from "./FreestyleWorkout";
import BattleNav from "./BattleNav";
import BattleCard from "./BattleCard";
import SectionSlash from "./SectionSlash";
import { AnimatePresence } from "framer-motion";
import { useStore } from "../../lib/store";

interface Props {
  section: WorkoutSectionId;
  children: React.ReactNode;
}

export default function WorkoutPage({ section, children }: Props) {
  const router = useRouter();
  const { workout, startSession } = useStore();

  const [cardOpen, setCardOpen] = useState(false);
  const [slashing, setSlashing] = useState(false);
  const prevSection = useRef<WorkoutSectionId | null>(null);

  // Close card when a route change completes (belt-and-suspenders)
  useEffect(() => {
    const onRoute = () => setCardOpen(false);
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  // Section-slash when user navigates (from the card or otherwise)
  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setSlashing(true);
      const t = window.setTimeout(() => setSlashing(false), 450);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  const navTo = useCallback((s: WorkoutSectionId) => {
    const route =
      s === "overview"     ? "/workout/overview" :
      s === "library"      ? "/workout/library" :
      s === "pr"           ? "/workout/prs" :
      s === "skills"       ? "/workout/skills" :
      s === "schedule"     ? "/workout/schedule" :
      s === "calisthenics" ? "/workout/calisthenics" :
      s === "gym"          ? "/workout/gym" :
      s === "cardio"       ? "/workout/cardio" :
      s === "charts"       ? "/workout/charts" :
      s === "kanban"       ? "/workout/kanban" :
      s === "global"       ? "/workout/tools" :
      "/workout/overview";
    // Close card first, then route (slash animation plays on section change)
    setCardOpen(false);
    router.push(route, undefined, { scroll: false });
  }, [router]);

  const todaysRoutine = workout.routines.find((r) => r.dayOfWeek === new Date().getDay());
  const todayIso = new Date().toISOString().slice(0,10);
  const todayReadiness = workout.readiness.find((r) => r.date === todayIso);
  const handleStartTodays = useCallback(() => {
    if (!todaysRoutine) { router.push("/workout/schedule"); return; }
    startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score);
  }, [todaysRoutine, todayReadiness, startSession, router]);
  void handleStartTodays;

  // Active-session takeover
  if (workout.activeSessionId) {
    const activeSession = workout.sessions.find((s) => s.id === workout.activeSessionId);
    const isFreestyle = !activeSession?.routineId;
    return (
      <div className="dark min-h-screen w-full text-gray-100 flex items-center justify-center p-4 md:p-8"
        style={{
          background:
            "radial-gradient(at 15% 10%, rgba(236,72,153,0.2) 0, transparent 45%)," +
            "radial-gradient(at 85% 90%, rgba(6,182,212,0.15) 0, transparent 45%)," +
            "#08080d",
        }}>
        <div className="w-full max-w-4xl">
          {isFreestyle ? (
            <FreestyleWorkout
              sessionId={workout.activeSessionId}
              onFinish={() => router.push("/workout/overview")}
              onDiscard={() => router.push("/workout/overview")}
            />
          ) : (
            <ActiveWorkout
              sessionId={workout.activeSessionId}
              onFinish={() => router.push("/workout/overview")}
              onDiscard={() => router.push("/workout/schedule")}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <WorkoutShell
        section={section}
        battleButton={
          <BattleNav open={cardOpen} onToggle={() => setCardOpen(v => !v)} />
        }
        battleCard={cardOpen ? (
          <BattleCard current={section} onPick={navTo} />
        ) : undefined}
      >
        {children}
      </WorkoutShell>

      <AnimatePresence>
        {slashing && !cardOpen && <SectionSlash />}
      </AnimatePresence>
    </>
  );
}

export const FULLSCREEN = true;
