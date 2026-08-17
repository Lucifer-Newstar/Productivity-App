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
  pkg = JSON.parse(read("package.json"));
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
  dash.includes("staggerChildren") && dash.includes("whileHover={{ y: -7"),
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
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
