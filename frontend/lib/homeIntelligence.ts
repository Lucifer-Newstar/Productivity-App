import type { NotificationState } from "./notificationTypes";
export type PulseKey = "work" | "career" | "body" | "health" | "life";
export interface PulseDimension {
  key: PulseKey;
  label: string;
  score: number;
  detail: string;
  formula: string;
}
export interface CommandAction {
  title: string;
  space: string;
  href: string;
  reason: string;
  priority: number;
  minutes?: number;
}
export interface TodaySignal {
  time?: string;
  title: string;
  space: string;
  href: string;
  done?: boolean;
  priority: "high" | "normal" | "low";
}
export interface TimelineSignal {
  date: number;
  title: string;
  space: string;
  detail?: string;
  href: string;
}
export interface MomentumSignal {
  label: string;
  value: number;
  direction: "up" | "flat" | "down";
}
export interface HomeIntelligence {
  pulse: PulseDimension[];
  overall: number;
  next?: CommandAction;
  today: TodaySignal[];
  attention: any[];
  timeline: TimelineSignal[];
  momentum: MomentumSignal[];
  brief: string;
  trajectory: { label: string; values: number[] }[];
}
const DAY = 86_400_000,
  clamp = (n: number) =>
    Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0))),
  date = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  ts = (x: any) => {
    if (typeof x === "number") return x;
    const n = new Date(x).getTime();
    return Number.isFinite(n) ? n : 0;
  },
  avg = (a: number[], fallback = 70) =>
    a.length ? a.reduce((x, y) => x + y, 0) / a.length : fallback;
export function buildHomeIntelligence(
  s: any,
  nowDate = new Date(),
): HomeIntelligence {
  const now = nowDate.getTime(),
    today = date(nowDate),
    week = now - 7 * DAY,
    prev = now - 14 * DAY;
  // Explainable pulse dimensions.
  const activeProjects = (s.forge.projects ?? []).filter(
      (p: any) => !p.archived && !["done", "dead"].includes(p.status),
    ),
    projectHealth = avg(
      activeProjects.map((p: any) =>
        p.status === "on-track"
          ? 100
          : p.status === "paused"
            ? 65
            : p.status === "off-track"
              ? 45
              : p.status === "blocked"
                ? 25
                : 70,
      ),
    ),
    openForge = (s.forge.tasks ?? []).filter(
      (t: any) => !t.completedAt && !t.doneAt,
    ),
    overdue = openForge.filter(
      (t: any) => t.dueDate && ts(t.dueDate) < ts(today),
    ).length,
    taskHealth = openForge.length
      ? 100 - (overdue / openForge.length) * 75
      : 85,
    todayDay = (s.career.days ?? []).find((d: any) => d.date === today),
    focusScore = clamp(((todayDay?.focusSessionsMinutes ?? 0) / 120) * 100),
    work = clamp(projectHealth * 0.45 + taskHealth * 0.35 + focusScore * 0.2);
  const roadmaps = (s.career.roadmaps ?? []).filter(
      (r: any) => r.status === "active",
    ),
    milestones = roadmaps.flatMap(
      (r: any) => r.phases?.flatMap((p: any) => p.milestones ?? []) ?? [],
    ),
    roadmapScore = milestones.length
      ? (milestones.filter((m: any) => m.done).length / milestones.length) * 100
      : 55,
    skills = s.career.skills ?? [],
    skillScore = skills.length
      ? avg(
          skills.map((x: any) =>
            Math.min(100, ((x.level ?? 0) / (x.desiredLevel || 10)) * 100),
          ),
          55,
        )
      : 45,
    followups = (s.career.contacts ?? []).filter(
      (c: any) => c.nextFollowUpAt && c.nextFollowUpAt <= now,
    ).length,
    career = clamp(
      roadmapScore * 0.55 +
        skillScore * 0.3 +
        Math.max(20, 100 - followups * 20) * 0.15,
    );
  const sessions = (s.workout.sessions ?? []).filter((x: any) => x.endedAt),
    weekSessions = sessions.filter((x: any) => ts(x.date) >= week).length,
    latestReady =
      [...(s.workout.readiness ?? [])].sort((a: any, b: any) =>
        String(b.date).localeCompare(String(a.date)),
      )[0]?.score ?? 65,
    lastWorkout = Math.max(0, ...sessions.map((x: any) => ts(x.date))),
    recency = lastWorkout
      ? Math.max(0, 100 - ((now - lastWorkout) / DAY) * 22)
      : 30,
    body = clamp(
      clamp(latestReady) * 0.4 +
        Math.min(100, (weekSessions / 4) * 100) * 0.35 +
        recency * 0.25,
    );
  const sleep = [...(s.health.sleep ?? [])].sort((a: any, b: any) =>
      String(b.date).localeCompare(String(a.date)),
    )[0],
    ideal = s.health.profile?.idealSleepHours ?? 8,
    sleepScore = clamp(((sleep?.durationHours ?? 0) / ideal) * 100),
    water = (s.health.water ?? [])
      .filter((x: any) => x.date === today)
      .reduce((n: number, x: any) => n + (x.ml ?? 0), 0),
    weight =
      [...(s.workout.bodyweight ?? [])].sort((a: any, b: any) =>
        String(b.date).localeCompare(String(a.date)),
      )[0]?.weightKg ?? 70,
    waterGoal = weight * 35 * (s.health.profile?.climateMult ?? 1),
    hydration = clamp((water / waterGoal) * 100),
    mind = [...(s.health.mind ?? [])].sort((a: any, b: any) =>
      String(b.date).localeCompare(String(a.date)),
    )[0],
    stress = clamp(100 - (((mind?.stress ?? 5) - 1) / 9) * 100),
    mealScore = clamp(
      ((s.health.meals ?? []).filter(
        (x: any) => x.date === today && x.slot !== "snack",
      ).length /
        3) *
        100,
    ),
    health = clamp(
      sleepScore * 0.35 + hydration * 0.3 + stress * 0.2 + mealScore * 0.15,
    );
  const personal = (s.tasks ?? []).filter(
      (t: any) => t.space === "entertainment" || t.space === "health",
    ),
    personalDone = personal.length
      ? (personal.filter((t: any) => t.completed).length / personal.length) *
        100
      : 70,
    habits = s.habits ?? [],
    habitScore = habits.length
      ? avg(
          habits.map((h: any) =>
            Math.min(
              100,
              ((h.history ?? []).filter((d: string) => ts(d) >= week).length /
                7) *
                100,
            ),
          ),
          60,
        )
      : 60,
    entActive = (s.entertainment.items ?? []).filter(
      (i: any) => i.status === "in-progress" && !i.archived,
    ).length,
    life = clamp(
      personalDone * 0.45 + habitScore * 0.4 + (entActive ? 80 : 60) * 0.15,
    );
  const pulse: PulseDimension[] = [
      {
        key: "work",
        label: "Work",
        score: work,
        detail: `${activeProjects.length} active · ${overdue} overdue`,
        formula:
          "45% project health + 35% task deadline health + 20% focus target",
      },
      {
        key: "career",
        label: "Career",
        score: career,
        detail: `${Math.round(roadmapScore)}% roadmap · ${followups} follow-ups`,
        formula: "55% roadmap + 30% skill gaps + 15% follow-up freshness",
      },
      {
        key: "body",
        label: "Body",
        score: body,
        detail: `${weekSessions} sessions · readiness ${Math.round(latestReady)}`,
        formula: "40% readiness + 35% weekly training + 25% recency",
      },
      {
        key: "health",
        label: "Health",
        score: health,
        detail: `${sleep?.durationHours ?? 0}h sleep · ${water}ml water`,
        formula: "35% sleep + 30% hydration + 20% stress + 15% meals",
      },
      {
        key: "life",
        label: "Life",
        score: life,
        detail: `${habits.length} habits · ${entActive} continuing`,
        formula: "45% personal tasks + 40% habits + 15% leisure continuity",
      },
    ],
    overall = clamp(avg(pulse.map((x) => x.score)));
  const actions: CommandAction[] = [];
  for (const t of openForge) {
    const d = t.dueDate ? Math.ceil((ts(t.dueDate) - now) / DAY) : 99,
      blocked =
        t.stuck ||
        (t.dependsOn ?? []).some((id: string) =>
          openForge.some((x: any) => x.id === id),
        );
    actions.push({
      title: t.title,
      space: "Forge",
      href: "/projects/quarry",
      reason: blocked
        ? "Blocks project flow"
        : d < 0
          ? `${Math.abs(d)} days overdue`
          : d <= 2
            ? `Due in ${d} days`
            : t.priority === "P1"
              ? "P1 priority"
              : "Active project work",
      priority:
        (blocked ? 130 : 0) +
        (d < 0 ? 120 : Math.max(0, 80 - d * 15)) +
        (t.priority === "P1" ? 35 : 0),
      minutes: t.estimateMins,
    });
  }
  for (const t of (s.tasks ?? []).filter((x: any) => !x.completed))
    actions.push({
      title: t.title,
      space: t.space,
      href: "/?view=tasks",
      reason: t.priority === "high" ? "High-priority commitment" : "Open task",
      priority: t.priority === "high" ? 90 : t.priority === "medium" ? 55 : 25,
    });
  for (const c of (s.career.contacts ?? []).filter(
    (x: any) => x.nextFollowUpAt && x.nextFollowUpAt <= now,
  ))
    actions.push({
      title: `Follow up with ${c.name}`,
      space: "Career",
      href: "/career/network",
      reason: "Follow-up is due",
      priority: 105,
    });
  const nextMilestone = milestones.find((m: any) => !m.done);
  if (nextMilestone)
    actions.push({
      title: nextMilestone.title,
      space: "Career",
      href: "/career/roadmaps",
      reason: "Next roadmap milestone",
      priority: 62,
    });
  const routine = (s.workout.routines ?? []).find(
    (r: any) => r.dayOfWeek === nowDate.getDay(),
  );
  if (routine && !sessions.some((x: any) => x.date === today && x.endedAt))
    actions.push({
      title: routine.name,
      space: "Workout",
      href: "/workout/schedule",
      reason: "Scheduled for today",
      priority: 78,
      minutes: 60,
    });
  const next = actions.sort((a, b) => b.priority - a.priority)[0];
  const todaySignals: TodaySignal[] = [];
  for (const t of (s.tasks ?? []).filter((x: any) => x.dueDate === today))
    todaySignals.push({
      title: t.title,
      space: t.space,
      href: "/?view=tasks",
      done: t.completed,
      priority: t.priority === "high" ? "high" : "normal",
    });
  for (const t of openForge.filter((x: any) => x.dueDate === today))
    todaySignals.push({
      title: t.title,
      space: "Forge",
      href: "/projects/quarry",
      priority: "high",
    });
  for (const m of s.career.meetings ?? []) {
    if (m.date === today)
      todaySignals.push({
        time: m.time,
        title: m.title ?? "Meeting",
        space: "Career",
        href: "/career/daily",
        priority: "normal",
      });
  }
  if (routine)
    todaySignals.push({
      time: "18:00",
      title: routine.name,
      space: "Workout",
      href: "/workout/schedule",
      priority: "normal",
    });
  for (const i of (s.entertainment.items ?? []).filter(
    (x: any) => x.scheduledFor === today,
  ))
    todaySignals.push({
      time: "21:00",
      title: i.title,
      space: "Entertainment",
      href: "/entertainment",
      priority: "low",
    });
  const attention = (s.notifications?.items ?? [])
    .filter(
      (n: any) =>
        !n.dismissedAt &&
        ["high", "critical"].includes(n.priority) &&
        !n.sourceKey.startsWith("setup:"),
    )
    .sort(
      (a: any, b: any) =>
        (a.priority === "critical" ? -1 : 0) -
        (b.priority === "critical" ? -1 : 0),
    )
    .slice(0, 5);
  const timeline: TimelineSignal[] = [];
  for (const e of s.career.timeline ?? [])
    timeline.push({
      date: ts(e.date),
      title: e.title ?? e.label ?? e.type,
      space: "Career",
      detail: e.description,
      href: "/career/command",
    });
  for (const p of s.forge.projects ?? [])
    if (p.completedAt)
      timeline.push({
        date: ts(p.completedAt),
        title: `${p.title} shipped`,
        space: "Forge",
        href: `/projects/p/${p.id}`,
      });
  for (const p of s.workout.prs ?? [])
    timeline.push({
      date: ts(p.date),
      title: `Personal record · ${(s.workout.exercises ?? []).find((x: any) => x.id === p.exerciseId)?.name ?? "Workout"}`,
      space: "Workout",
      detail: String(p.value),
      href: "/workout/prs",
    });
  for (const e of s.entertainment.events ?? [])
    if (["completed", "rated", "added"].includes(e.type))
      timeline.push({
        date: e.at,
        title: `${(s.entertainment.items ?? []).find((x: any) => x.id === e.itemId)?.title ?? "Media"} · ${e.type}`,
        space: "Entertainment",
        href: "/entertainment",
      });
  timeline.sort((a, b) => b.date - a.date);
  const countWindow = (
      list: any[],
      get: (x: any) => number,
      start: number,
      end: number,
    ) =>
      list.filter((x) => {
        const n = get(x);
        return n >= start && n < end;
      }).length,
    delta = (current: number, previous: number) =>
      previous
        ? Math.round(((current - previous) / previous) * 100)
        : current
          ? 100
          : 0,
    momentum: MomentumSignal[] = [
      [
        "Work",
        countWindow(
          s.forge.tasks ?? [],
          (x) => ts(x.completedAt || x.doneAt),
          week,
          now,
        ),
        countWindow(
          s.forge.tasks ?? [],
          (x) => ts(x.completedAt || x.doneAt),
          prev,
          week,
        ),
      ],
      [
        "Career",
        countWindow(s.career.timeline ?? [], (x) => ts(x.date), week, now),
        countWindow(s.career.timeline ?? [], (x) => ts(x.date), prev, week),
      ],
      [
        "Body",
        countWindow(sessions, (x) => ts(x.date), week, now),
        countWindow(sessions, (x) => ts(x.date), prev, week),
      ],
      [
        "Focus",
        countWindow(s.career.days ?? [], (x) => ts(x.date), week, now),
        countWindow(s.career.days ?? [], (x) => ts(x.date), prev, week),
      ],
    ].map(([label, a, b]: any) => {
      const value = delta(a, b);
      return {
        label,
        value,
        direction: value > 3 ? "up" : value < -3 ? "down" : "flat",
      } as MomentumSignal;
    });
  const trajectory = [
    {
      label: "Work",
      events: [...(s.forge.tasks ?? [])].map((x: any) =>
        ts(x.completedAt || x.doneAt),
      ),
    },
    {
      label: "Career",
      events: [...(s.career.timeline ?? [])].map((x: any) => ts(x.date)),
    },
    { label: "Body", events: sessions.map((x: any) => ts(x.date)) },
    {
      label: "Life",
      events: [...(s.entertainment.events ?? [])].map((x: any) => x.at),
    },
  ].map((row) => ({
    label: row.label,
    values: Array.from(
      { length: 12 },
      (_, i) =>
        row.events.filter(
          (n: number) =>
            n >= now - (12 - i) * 7 * DAY && n < now - (11 - i) * 7 * DAY,
        ).length,
    ),
  }));
  const strongest = [...momentum].sort((a, b) => b.value - a.value)[0],
    weak = pulse
      .filter((x) => x.score < 55)
      .sort((a, b) => a.score - b.score)[0],
    brief = `${next ? `Primary objective: ${next.title}. ` : "Your immediate queue is clear. "}${attention.length ? `${attention.length} high-priority signal${attention.length === 1 ? "" : "s"} need attention. ` : ""}${weak ? `${weak.label} is the weakest pulse at ${weak.score}. ` : `All pulse dimensions are stable. `}${strongest && strongest.value > 0 ? `${strongest.label} has the strongest seven-day momentum.` : ""}`;
  return {
    pulse,
    overall,
    next,
    today: todaySignals.slice(0, 8),
    attention,
    timeline: timeline.slice(0, 8),
    momentum,
    brief,
    trajectory,
  };
}
