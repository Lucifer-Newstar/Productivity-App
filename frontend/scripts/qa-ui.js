#!/usr/bin/env node
const fs = require("fs"),
  path = require("path"),
  root = path.resolve(__dirname, ".."),
  read = (p) => fs.readFileSync(path.join(root, p), "utf8");
let pass = 0,
  fail = 0;
const test = (n, v) => {
  if (v) {
    pass++;
    console.log(`  ✓ ${n}`);
  } else {
    fail++;
    console.error(`  ✗ ${n}`);
  }
};
const types = read("lib/types.ts"),
  icons = read("components/SpaceIcon.tsx"),
  css = read("app/globals.css"),
  shell = read("app/AppShell.tsx"),
  dash = read("components/Dashboard.tsx"),
  ent = read("components/entertainment/EntertainmentPage.tsx"),
  health = read("components/health/VitalsSection.tsx"),
  cardio = read("components/workout/WorkoutCardio.tsx"),
  notificationButton = read("components/NotificationButton.tsx"),
  homeIntelligence = read("lib/homeIntelligence.ts"),
  homeSectionHeader = read("components/HomeSectionHeader.tsx"),
  coreSections = ["Tasks", "Pomodoro", "Notes", "Habits", "Calendar"].map((name) => read(`components/${name}.tsx`)),
  pkg = JSON.parse(read("package.json"));
const navShells = [
  "components/TopNav.tsx",
  "components/workout/WorkoutShell.tsx",
  "components/career/CareerShell.tsx",
  "components/forge/ForgeShell.tsx",
  "components/health/HealthShell.tsx",
  "components/entertainment/EntertainmentPage.tsx",
].map(read);
console.log("\n── UI foundation ──");
test("space metadata contains no emoji field", !types.includes('emoji: "'));
test(
  "space icons use one Lucide mapping",
  icons.includes("Anvil") &&
    icons.includes("Dumbbell") &&
    icons.includes("BriefcaseBusiness") &&
    icons.includes("Clapperboard") &&
    icons.includes("HeartPulse"),
);
test(
  "dashboard uses semantic SpaceIcon",
  dash.includes("<SpaceIcon") && !dash.includes(".emoji"),
);
test(
  "health symptoms use Lucide icons",
  health.includes("icon: LucideIcon") && !health.includes("emoji:"),
);
test(
  "cardio modes use Lucide icons",
  cardio.includes("icon: LucideIcon") && !cardio.includes("emoji:"),
);
test(
  "notification trigger lives in every navigation shell",
  notificationButton.includes("kaizen:notifications-toggle") &&
    navShells.every((source) => source.includes("<NotificationButton")),
);
test(
  "self-hosted font packages installed",
  [
    "@fontsource-variable/manrope",
    "@fontsource-variable/space-grotesk",
    "@fontsource-variable/sora",
    "@fontsource-variable/source-serif-4",
    "@fontsource/cinzel",
  ].every((x) => pkg.dependencies[x]),
);
test(
  "home dark Control System theme exists",
  css.includes(".home-root") && css.includes("--home-bg:#050810"),
);
test(
  "home light Daily Edition differs structurally",
  css.includes('.home-root[data-theme="light"]') &&
    css.includes("Source Serif 4 Variable") &&
    css.includes("border-radius:2px"),
);
test(
  "home has direction-aware section transition",
  shell.includes("custom={direction}") && shell.includes("blur(8px)"),
);
test(
  "dashboard has staggered interactive motion",
  dash.includes("staggerChildren") && dash.includes("whileHover={{ y: -6"),
);
test(
  "home command center answers the seven operating questions",
  ["NEXT ACTION","Your day","Life pulse","What is happening now","Needs attention","Recent growth","Seven-day momentum","12-week activity arc"].every((x)=>dash.includes(x)),
);
test(
  "life pulse formulas are explicit",
  homeIntelligence.includes("45% project health") && homeIntelligence.includes("35% sleep") && homeIntelligence.includes("55% roadmap"),
);
test(
  "next action ranks cross-space candidates",
  homeIntelligence.includes("actions: CommandAction[]") && homeIntelligence.includes("Follow up with") && homeIntelligence.includes("Scheduled for today"),
);
test(
  "attention uses high-priority notification data",
  homeIntelligence.includes('["high", "critical"].includes'),
);
test(
  "Entertainment modules have keyed transitions",
  ent.includes("key={view}") && ent.includes('filter:"blur(8px)"'),
);
test(
  "space font voices are wired",
  css.includes(".career-root") &&
    css.includes(".forge-root") &&
    css.includes(".health-root") &&
    css.includes(".ent-root") &&
    css.includes(".workout-root"),
);
test("runtime font CDN is absent", !css.includes("fonts.googleapis.com"));
test(
  "main dashboard copy removed childish realm metaphors",
  !dash.includes("Conquests") &&
    !dash.includes("Sieges") &&
    !dash.includes("Your realm awaits"),
);
test(
  "reduced-motion guard covers home UI",
  css.includes("@media(prefers-reduced-motion:reduce)"),
);
test(
  "all core sections use the mature shared header",
  homeSectionHeader.includes("core-section-header") && coreSections.every((source) => source.includes("<HomeSectionHeader")),
);
test(
  "core sections expose useful summary metrics",
  coreSections.filter((source) => source.includes("core-metric-rail")).length >= 4,
);
test(
  "focus section uses an operational console instead of tutorial filler",
  coreSections[1].includes("Focus Chamber") && coreSections[1].includes("focus-console") && !coreSections[1].includes("How it works"),
);
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
