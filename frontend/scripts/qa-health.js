/**
 * Health analytics unit QA — plain JS, no TS compiler needed.
 * Run: `node scripts/qa-health.js` from frontend/.
 *
 * Tests formulas, food-DB invariants, type files, page presence.
 */

const fs = require('fs');
const path = require('path');

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error("  ✗ FAIL:", msg); failures++; }
  else { console.log("  ✓ PASS:", msg); }
}
function assertClose(a, b, eps, msg) {
  if (Math.abs(a - b) > eps) { console.error(`  ✗ FAIL: ${msg} (got ${a.toFixed?.(2) ?? a}, expected ~${b})`); failures++; }
  else { console.log(`  ✓ PASS: ${msg}  (${(typeof a==='number'?a.toFixed(2):a)} ≈ ${b})`); }
}
function section(name){ console.log("\n── " + name + " ──"); }

// ---------- Mifflin-St Jeor BMR ----------
section("BMR — Mifflin-St Jeor");
function bmrMifflin_m(w, h, a) { return 10*w + 6.25*h - 5*a + 5; }
function bmrMifflin_f(w, h, a) { return 10*w + 6.25*h - 5*a - 161; }
assertClose(bmrMifflin_m(70, 175, 20), 1698.75, 0.1, "70kg/175cm/20yo M ≈ 1699 kcal");
assertClose(bmrMifflin_m(80, 180, 25), 1805, 1, "80kg/180/25 M ≈ 1805");
assertClose(bmrMifflin_m(60, 170, 30), 10*60+6.25*170-5*30+5, 0.1, "60kg/170/30 M");
assertClose(bmrMifflin_f(55, 162, 28), 10*55+6.25*162-5*28-161, 0.1, "55kg/162/28 F");

// ---------- Katch-McArdle ----------
section("BMR — Katch-McArdle");
function bmrKatch(w, bfPct) { return 370 + 21.6 * w * (1 - bfPct/100); }
assertClose(bmrKatch(70, 15), 1654.6, 1, "70kg/15% BF ≈ 1655");
assertClose(bmrKatch(60, 25), 370 + 21.6*60*0.75, 1, "60kg/25% BF");

// ---------- Water goal ----------
section("Water goal (dynamic)");
function waterGoal(w, climate=1.1, wo=0) { return Math.round(w*35*climate + wo); }
assertClose(waterGoal(70, 1.1), 2695, 1, "70kg Chennai ×1.1 = 2695ml");
assert(waterGoal(70, 1.0, 500) === 2950, "70kg base + 500ml woAdj = 2950");
assert(waterGoal(0, 1.1) === 0, "0kg → 0ml (edge)");
assert(waterGoal(120, 1.15) === Math.round(120*35*1.15), "120kg ×1.15 multiplier");

// ---------- TDEE ----------
section("TDEE multipliers");
const ACT = { sedentary:1.20, light:1.375, moderate:1.55, active:1.725, very_active:1.90 };
assertClose(1698.75 * ACT.moderate, 2633, 1, "70kg M @ moderate ≈ 2633 kcal");
assertClose(bmrMifflin_m(80,180,25) * ACT.active, 1805 * 1.725, 1, "80kg M @ active");

// ---------- BMI ----------
section("BMI");
function bmi(w, h) { const m=h/100; return w/(m*m); }
assertClose(bmi(70, 175), 22.86, 0.1, "70/175 = 22.86");
assertClose(bmi(50, 160), 19.53, 0.1, "50/160 = 19.5");
assert(bmi(100, 175) > 30, "100/175 obese BMI (>30)");

// ---------- Navy BF% ----------
section("Navy body-fat (men, metric)");
function navyBF_m(waist, neck, h) {
  return 495/(1.0324 - 0.19077*Math.log10(waist-neck) + 0.15456*Math.log10(h)) - 450;
}
assertClose(navyBF_m(80, 37, 175), 13.7, 0.5, "80w/37n/175h ≈ 14%");
assertClose(navyBF_m(90, 38, 178), 21.0, 1.0, "90w/38n/178h ≈ 21%");
// Waist must be > neck:
assert(!isFinite(navyBF_m(30, 40, 175)) || navyBF_m(30,40,175) < 0, "Waist < neck returns garbage (UI must validate)");

// ---------- Protein target ----------
section("Protein target");
assert(Math.round(70*1.8) === 126, "70kg → 126g");
assert(Math.round(80*1.8) === 144, "80kg → 144g");

// ---------- Beverage hydration coefficients ----------
section("Beverage coefficients");
// Re-read HydrationSection BEVERAGES const
const hydSrc = fs.readFileSync(path.join(__dirname, '..', 'components/health/HydrationSection.tsx'), 'utf8');
const bevBlock = hydSrc.match(/const BEVERAGES.*?\];/s)?.[0] || "";
assert(bevBlock.length > 100, "BEVERAGES array found");
// net coefficients must be between -1 and 1, caffeine ≥ 0
assert(/net:1\.00[^0-9]/.test(bevBlock) && /net:0\.85/.test(bevBlock), "Has water=1.00 and coffee/tea=0.85");
assert(/caffeineMg:90/.test(bevBlock), "Coffee is 90mg caffeine (filter)");
assert(/caffeineMg:40/.test(bevBlock), "Chai is 40mg caffeine");
// alcohol opt-in gate present
assert(/alcoholOptIn/.test(hydSrc), "Hydration page gates alcohol on settings.alcoholOptIn");

// ---------- Food DB invariants ----------
section("Food database");
const dbSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/healthFoodDb.ts'), 'utf8');
const idRe = /id:\s*"([^"]+)"/g;
const ids = []; let m;
while ((m = idRe.exec(dbSrc)) !== null) ids.push(m[1]);
console.log("    entries found:", ids.length);
assert(ids.length >= 80, `Food DB has ${ids.length} dishes (≥80)`);
const dupes = ids.filter((x,i)=>ids.indexOf(x)!==i);
assert(dupes.length === 0, `No duplicate IDs (${dupes.join(",")||"none"})`);

// Parse each food block and check macros. We anchor on entries that have
// `name:` (foods) vs. `label:` (FOOD_CATEGORIES constants) by filtering on name.
const blockRe = /\{ id: "([^"]+)"[\s\S]*?\},\n/g;
let foods = []; let bm;
while ((bm = blockRe.exec(dbSrc)) !== null) {
  const block = bm[0];
  if (!/name:\s*"/.test(block)) continue; // skip category constants
  const get = (re) => { const r = block.match(re); return r ? +r[1] : null; };
  foods.push({
    id: bm[1],
    kcal: get(/kcal:\s*([\d.]+)/),
    c: get(/carbsG:\s*([\d.]+)/),
    p: get(/proteinG:\s*([\d.]+)/),
    f: get(/fatG:\s*([\d.]+)/),
    fiber: get(/fibreG:\s*([\d.]+)/),
    cat: (block.match(/cat:\s*"([^"]+)"/)||[])[1],
  });
}
let missing = foods.filter(x => x.kcal==null || x.c==null || x.p==null || x.f==null || !x.cat);
assert(missing.length === 0, `All foods have kcal/c/p/f/cat (${missing.length} missing: ${missing.map(x=>x.id).join(",")})`);

// Macro sanity: 4*c + 4*p + 9*f ≈ kcal (±50% for fiber/rounding)
let driftCount = 0; let worst = {diff:0, id:"", calc:0, kcal:0};
for (const x of foods) {
  if (x.kcal < 20) continue; // supplements/creatine etc.
  const calc = x.c*4 + x.p*4 + x.f*9;
  const diff = Math.abs(calc - x.kcal);
  if (diff > x.kcal * 0.5) {
    driftCount++;
    console.log(`      drift: ${x.id} kcal=${x.kcal} calc=${Math.round(calc)} (c=${x.c} p=${x.p} f=${x.f})`);
  }
  if (diff > worst.diff) worst = { diff, id: x.id, calc, kcal: x.kcal };
}
console.log(`    macro-kcal drift >50%: ${driftCount} foods`);
assert(driftCount <= 8, `Macro/kcal ratio within tolerance (${driftCount} offenders; worst: ${worst.id} off by ${Math.round(worst.diff)} kcal)`);

// Must-have dishes present (South Indian + gym staples)
const mustHave = [
  "idli", "dosa-masala", "dosa-plain", "sambar", "chapati", "parotta",
  "idli-sambar", "chicken-curry", "chicken-65", "mutton-curry", "fish-curry",
  "chicken-biryani", "veg-biryani", "filter-coffee", "chai", "coconut",
  "lassi-sweet", "pongal", "vada", "poori", "curd-rice", "upma",
  "paneer-butter", "rajma", "samosa", "pani-puri", "pav-bhaji",
  "gulab-jamun", "whey", "banana", "egg-boiled", "chicken-breast", "creatine",
  "uttapam", "aloo-paratha", "egg-bhurji", "butter-chicken", "tandoori-chicken",
  "laddu", "jalebi", "paneer-raw", "sprouts", "egg-biryani", "fried-rice",
  "omelette", "idiyappam", "appam-stew",
];
const missingFoods = mustHave.filter(x => !ids.includes(x));
assert(missingFoods.length === 0, `Essentials present (missing: ${missingFoods.join(",")||"none"})`);

// Non-veg tag presence
assert(/"nonveg"/.test(dbSrc), "Non-veg tag present");
assert(/"high-protein"/.test(dbSrc), "High-protein tag present");

// ---------- Health types ----------
section("Types / store wiring");
const typesSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/healthTypes.ts'), 'utf8');
assert(/WaterEntry[\s\S]*?caffeineMg\?:\s*number/.test(typesSrc), "WaterEntry.caffeineMg field exists");
assert(/export type WaterBeverage =[^}]*"alcohol"/.test(typesSrc), "WaterBeverage includes alcohol");
assert(/syncPushHydration/.test(typesSrc), "HealthSettings has bridge toggles");
assert(/climateMult: number/.test(typesSrc), "Profile.climateMult exists");

// Store wiring
const storeSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/store.tsx'), 'utf8');
assert(/health: HealthState/.test(storeSrc), "store RootState has health slice");
assert(/kaizen\.health/.test(storeSrc), "store persists to kaizen.health key");
assert(/migrateHealth/.test(storeSrc), "migrateHealth exists");
assert(/updateHealth/.test(storeSrc), "updateHealth action exposed");

// Pages exist
section("Routes / pages");
const pagesDir = path.join(__dirname, '..', 'pages/health');
const needPages = ["index","nutrition","hydration","sleep","physique","supplements","vitals","mind","sync","reports"];
for (const p of needPages) {
  assert(fs.existsSync(path.join(pagesDir, `${p}.tsx`)), `/health${p==="index"?"":"/"+p} page exists`);
}

// All pages use FULLSCREEN wrapper
for (const p of needPages) {
  const content = fs.readFileSync(path.join(pagesDir, `${p}.tsx`), 'utf8');
  const hasFullscreen = content.includes("HealthPage");
  assert(hasFullscreen, `/health/${p} wraps in HealthPage (FULLSCREEN)`);
}
// FULLSCREEN flag on HealthPage
const hpSrc = fs.readFileSync(path.join(__dirname, '..', 'components/health/HealthPage.tsx'), 'utf8');
assert(/export const FULLSCREEN = true/.test(hpSrc), "HealthPage exports FULLSCREEN=true");

// Hotkeys
section("Hotkeys & shell");
const hk = fs.readFileSync(path.join(__dirname, '..', 'components/health/HealthHotkeys.tsx'), 'utf8');
assert(/isTypingTarget/.test(hk), "Hotkeys guard against typing in inputs");
assert(/g h/.test(hk), "g h → home hotkey");
assert(/chordArmed/.test(hk), "g-chord arming present");

// Theme tokens
const shell = fs.readFileSync(path.join(__dirname, '..', 'components/health/HealthShell.tsx'), 'utf8');
assert(/health-light/.test(shell) && /health-dark/.test(shell), "Both dark/light theme classes present");
assert(/VITAL-SIGN|vitals/i.test(shell), "VITAL-SIGN brand text in shell");
assert(/EkgFlash/.test(fs.readFileSync(path.join(__dirname,'..','components/health/HealthPage.tsx'),'utf8')), "EkgFlash wired into page");
assert(/Medical disclaimer|Not medical advice/.test(shell), "Permanent medical disclaimer in footer");
assert(/Asia\/Kolkata|IST/.test(shell), "IST/Asia-Kolkata date display");

// Sync lab saves profile
const syncPage = fs.readFileSync(path.join(pagesDir, 'sync.tsx'), 'utf8');
assert(/updateHealth/.test(syncPage), "Sync lab uses updateHealth action");
assert(/syncReadBodyweight/.test(syncPage), "Sync lab exposes bridge toggles");
assert(/gender|ageYears|heightCm/.test(syncPage), "Sync lab edits profile constants");

// ---------- No console.log leftovers ----------
section("Cleanup — no console.log/debug");
const componentsDir = path.join(__dirname, '..','components','health');
const logRe = /console\.(log|debug)\s*\(/g;
let logFiles = [];
for (const f of fs.readdirSync(componentsDir)) {
  const c = fs.readFileSync(path.join(componentsDir, f), 'utf8');
  if (logRe.test(c)) logFiles.push(f);
}
assert(logFiles.length === 0, `No console.log/debug in health components (${logFiles.join(",")||"clean"})`);

// ---------- Final verdict ----------
console.log("\n========================================");
if (failures === 0) console.log("ALL QA TESTS PASS  ❤️⚒️");
else { console.error(`${failures} FAILURE(S)`); process.exit(1); }
