/** Regression gate for qa home intelligence contracts. */
import assert from "node:assert/strict";
import { buildHomeIntelligence } from "../lib/homeIntelligence";
const now = new Date(2026, 7, 17, 20, 0),
  today = "2026-08-17";
const base: any = {
  tasks: [
    {
      id: "core",
      title: "Read brief",
      space: "career",
      priority: "high",
      completed: false,
      createdAt: now.getTime(),
      dueDate: today,
    },
  ],
  habits: [{ history: [today] }],
  notifications: {
    items: [
      {
        id: "n",
        sourceKey: "x",
        section: "projects",
        priority: "high",
        title: "Blocked",
        body: "Resolve",
        actionHref: "/projects",
        createdAt: now.getTime(),
      },
    ],
  },
  forge: {
    projects: [
      { id: "p", title: "Project", status: "blocked", archived: false },
    ],
    tasks: [
      {
        id: "ft",
        projectId: "p",
        title: "Deploy API",
        priority: "P1",
        createdAt: "2026-08-01",
        dueDate: "2026-08-16",
        estimateMins: 45,
      },
    ],
  },
  career: {
    roadmaps: [
      {
        status: "active",
        name: "DevOps",
        phases: [
          {
            milestones: [
              { title: "Kubernetes", done: false },
              { title: "Linux", done: true },
            ],
          },
        ],
      },
    ],
    skills: [{ level: 5, desiredLevel: 8 }],
    contacts: [],
    meetings: [],
    days: [{ date: today, focusSessionsMinutes: 60 }],
    timeline: [{ date: today, title: "Skill improved" }],
  },
  workout: {
    routines: [{ name: "Push", dayOfWeek: now.getDay() }],
    sessions: [],
    readiness: [{ date: today, score: 80 }],
    bodyweight: [{ date: today, weightKg: 70 }],
    prs: [],
    exercises: [],
  },
  health: {
    profile: { idealSleepHours: 8, climateMult: 1.1 },
    sleep: [{ date: today, durationHours: 8 }],
    water: [{ date: today, ml: 1800 }],
    mind: [{ date: today, stress: 3 }],
    meals: [
      { date: today, slot: "breakfast" },
      { date: today, slot: "lunch" },
      { date: today, slot: "dinner" },
    ],
  },
  entertainment: {
    items: [
      {
        id: "e",
        title: "Show",
        status: "in-progress",
        archived: false,
        updatedAt: now.getTime(),
      },
    ],
    events: [],
  },
};
let passed = 0;
const test = (name: string, fn: () => void) => {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  },
  r = buildHomeIntelligence(base, now);
console.log("\n── Home command intelligence ──");
test("five explainable pulse dimensions", () => {
  assert.deepEqual(
    r.pulse.map((x) => x.key),
    ["work", "career", "body", "health", "life"],
  );
  assert.ok(r.pulse.every((x) => x.formula.length > 10));
});
test("overall pulse stays bounded", () =>
  assert.ok(r.overall >= 0 && r.overall <= 100));
test("overdue P1 Forge task becomes next action", () => {
  assert.equal(r.next?.title, "Deploy API");
  assert.equal(r.next?.space, "Forge");
  assert.ok(r.next?.reason.includes("overdue"));
});
test("today combines core task and workout", () => {
  assert.ok(r.today.some((x) => x.title === "Read brief"));
  assert.ok(r.today.some((x) => x.title === "Push"));
});
test("high notification becomes attention", () =>
  assert.equal(r.attention[0].title, "Blocked"));
test("career timeline is normalized", () =>
  assert.ok(r.timeline.some((x) => x.title === "Skill improved")));
test("momentum dimensions are emitted", () =>
  assert.ok(r.momentum.some((x) => x.label === "Body")));
test("brief names primary objective", () =>
  assert.ok(r.brief.includes("Deploy API")));
test("trajectory returns twelve weekly points", () =>
  assert.ok(r.trajectory.every((x) => x.values.length === 12)));
test("health pulse rewards complete sleep/meals", () =>
  assert.ok(r.pulse.find((x) => x.key === "health")!.score > 70));
console.log(`\n${passed} home intelligence tests passed.`);
