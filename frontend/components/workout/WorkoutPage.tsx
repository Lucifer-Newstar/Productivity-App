"use client";

/**
 * WorkoutPage — shared wrapper for all /workout/* sub-routes.
 *
 * - Mounts WorkoutShell (top strip + content only — no left rail / bottom tabs).
 * - BattleNav (the floating ⚔ BATTLE ⚔ button and its summoned card with every
 *   sub-page link + sword-slash/dragon-fire reveal) is injected into the top
 *   strip via shell's battleButton prop. Picking a section navigates with
 *   router.push.
 * - SectionSlash overlay plays between sub-page navigations.
 * - Active-session takeover (ActiveWorkout / FreestyleWorkout) renders full-screen
 *   without the shell.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import WorkoutShell, { WORKOUT_NAV, type WorkoutSectionId } from "./WorkoutShell";
import ActiveWorkout from "./ActiveWorkout";
import FreestyleWorkout from "./FreestyleWorkout";
import BattleNav from "./BattleNav";
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

  const [slashing, setSlashing] = useState(false);
  const prevSection = useRef<WorkoutSectionId | null>(null);

  // Section-slash on section change
  useEffect(() => {
    if (prevSection.current && prevSection.current !== section) {
      setSlashing(true);
      const t = window.setTimeout(() => setSlashing(false), 450);
      return () => window.clearTimeout(t);
    }
    prevSection.current = section;
  }, [section]);

  const onSectionChange = useCallback((s: WorkoutSectionId) => {
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
    router.push(route, undefined, { scroll: false });
  }, [router]);

  const todaysRoutine = workout.routines.find((r) => r.dayOfWeek === new Date().getDay());
  const todayIso = new Date().toISOString().slice(0,10);
  const todayReadiness = workout.readiness.find((r) => r.date === todayIso);

  const handleStartTodays = useCallback(() => {
    if (!todaysRoutine) { router.push("/workout/schedule"); return; }
    startSession(todaysRoutine.name, todaysRoutine.id, todayReadiness?.score);
  }, [todaysRoutine, todayReadiness, startSession, router]);
  const handleQuickStart = useCallback(() => {
    startSession("Quick Session", undefined, todayReadiness?.score);
  }, [todayReadiness, startSession]);

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

  const battleButton = <BattleNav current={section} onPick={onSectionChange} />;

  return (
    <>
      <WorkoutShell
        section={section}
        battleButton={battleButton}
      >
        {children}
      </WorkoutShell>

      <AnimatePresence>
        {slashing && <SectionSlash />}
      </AnimatePresence>
    </>
  );
}

export const FULLSCREEN = true;
