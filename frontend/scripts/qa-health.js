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

// ---------- Sleep analytics (wave 3) ----------
section("Sleep duration & bank");
// Re-implement the two core algorithms inline since we can't import TS modules from JS.
function durationHours(bedIso, wakeIso){ const b=new Date(bedIso).getTime(), w=new Date(wakeIso).getTime(); return (w-b)/3.6e6; }
function computeSleepBank(entries, ideal, lastN=14){
  const sorted=[...entries].filter(e=>e.durationHours>0&&e.durationHours<16).sort((a,b)=>a.date.localeCompare(b.date)).slice(-lastN);
  let bank=0;
  for(const e of sorted){ const d=e.durationHours-ideal; if(d<0)bank+=d; else bank+=Math.min(d*0.5,1.0); bank=Math.max(-20,Math.min(10,bank)); }
  return Math.round(bank*10)/10;
}
function sleepScore(e, ideal){ if(!e)return 0; const dur=Math.min(1,e.durationHours/ideal); const q=((e.quality??5))/10; return Math.max(0,Math.min(1,0.6*dur+0.4*q)); }
function hygieneScore(tick){ const KEYS=["noCaffeineAfter14","noScreensBeforeBed","darkRoom","coolRoom","consistentSchedule","noHeavyMealLate","noAlcohol","exercisedToday","sunlightMorning","relaxedBeforeBed"]; if(!tick)return 0; const hits=KEYS.reduce((n,k)=>n+(tick[k]?1:0),0); return Math.round((hits/KEYS.length)*10); }
function avgSleep(entries,n=7){ const s=[...entries].filter(e=>e.durationHours>0).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,n); return s.length?s.reduce((s,e)=>s+e.durationHours,0)/s.length:0; }
function routineAdherence(steps){ if(!steps.length)return 0; return Math.round((steps.filter(s=>s.doneToday).length/steps.length)*100); }

const bed = new Date(Date.now()-29*3600e3).toISOString(); // last night ~23:00
const wake = new Date(Date.now()-21*3600e3).toISOString(); // ~07:00
assertClose(durationHours(bed, wake), 8, 0.01, "23:00 -> 07:00 = 8h");
assertClose(durationHours(new Date(Date.now()-7*3600e3).toISOString(), new Date().toISOString()), 7, 0.01, "7h duration calc");
// Perfect sleep for 7 nights: bank should be slightly positive (capped at +1/night)
let entries = []; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400e3).toISOString().slice(0,10); entries.push({id:"x",date:d,bedTime:"x",wakeTime:"x",durationHours:8,quality:8});}
// Exact ideal gives 0 delta, so bank stays 0. Test with 9h nights to earn +0.5/night.
const over=[]; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400e3).toISOString().slice(0,10); over.push({id:"x",date:d,bedTime:"x",wakeTime:"x",durationHours:9,quality:8});}
assertClose(computeSleepBank(over,8), 3.5, 0.1, "7 nights at 9h = +3.5h credit (0.5h/night)");
assert(computeSleepBank(entries,8) === 0, "7 perfect (exactly 8h) nights → 0 bank (no surplus no deficit)");
// 7 nights of 5h each: -3*7 = -21, capped at -20
const bad=[]; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400e3).toISOString().slice(0,10); bad.push({id:"x",date:d,bedTime:"x",wakeTime:"x",durationHours:5,quality:5});}
assert(computeSleepBank(bad,8) <= -14, "7 nights at 5h = bank ≤ -14h (1:1 debit)");
assert(computeSleepBank(bad,8) >= -20, "Bank capped at -20h");
// Edge: zero entries = 0
assert(computeSleepBank([],8) === 0, "Empty entries → bank = 0");
assertClose(sleepScore({durationHours:8,quality:10},8), 1, 0.01, "Perfect night = 1.0 score");
assertClose(sleepScore({durationHours:4,quality:2},8), 0.6*0.5+0.4*0.2, 0.01, "Bad night ~0.38 score");
assert(hygieneScore({}) === 0, "Empty hygiene → 0");
assert(hygieneScore({darkRoom:true,coolRoom:true}) === 2, "2/10 ticks = 2/10");
const allTicks = {noCaffeineAfter14:true,noScreensBeforeBed:true,darkRoom:true,coolRoom:true,consistentSchedule:true,noHeavyMealLate:true,noAlcohol:true,exercisedToday:true,sunlightMorning:true,relaxedBeforeBed:true};
assert(hygieneScore(allTicks) === 10, "All ticks = 10/10");
assertClose(avgSleep([{date:"2025-01-03",durationHours:6},{date:"2025-01-02",durationHours:8},{date:"2025-01-01",durationHours:10}]), 8, 0.01, "avgSleep = 8 over 3 nights");
assert(routineAdherence([{doneToday:true},{doneToday:false}]) === 50, "1/2 steps = 50%");
assert(routineAdherence([]) === 0, "Empty routine = 0%");

// Supplement streak/adherence logic
function suppStreaks(logs){ const streaks={}; const bySupp={}; for(const l of logs){ if(!l.taken)continue; (bySupp[l.suppId]||=[]).push(l.date);} for(const [id,dates] of Object.entries(bySupp)){ const set=new Set(dates); let streak=0; const d=new Date(); for(let i=0;i<365;i++){ const k=d.toISOString().slice(0,10); if(set.has(k)){streak++;d.setDate(d.getDate()-1);} else break;} streaks[id]=streak;} return streaks;}
function suppAdherence(logs,suppId,lastN=30){ const d=new Date(); const days=[]; for(let i=0;i<lastN;i++){days.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()-1);} const ds=new Set(days); const taken=new Set(); for(const l of logs){ if(!l.taken)continue; if(suppId&&l.suppId!==suppId)continue; if(ds.has(l.date))taken.add(l.date);} return Math.round((taken.size/lastN)*100); }
const todayStr = new Date().toISOString().slice(0,10);
const yStr = new Date(Date.now()-86400e3).toISOString().slice(0,10);
const two = suppStreaks([{id:"1",date:todayStr,suppId:"creatine",taken:true},{id:"2",date:yStr,suppId:"creatine",taken:true}]);
assert(two.creatine >= 2, `2-day streak for creatine detected (got ${two.creatine})`);
assert(suppAdherence([{date:todayStr,suppId:"creatine",taken:true}],"creatine",7) >= 14, "1/7 days = ~14% adherence");

// Wave-3 types must exist
section("Types / store wiring");
const typesSrc = fs.readFileSync(path.join(__dirname, '..', 'lib/healthTypes.ts'), 'utf8');
assert(/WaterEntry[\s\S]*?caffeineMg\?:\s*number/.test(typesSrc), "WaterEntry.caffeineMg field exists");
assert(/export type WaterBeverage =[^}]*"alcohol"/.test(typesSrc), "WaterBeverage includes alcohol");
assert(/syncPushHydration/.test(typesSrc), "HealthSettings has bridge toggles");
assert(/climateMult: number/.test(typesSrc), "Profile.climateMult exists");
assert(/SleepHygieneTick/.test(typesSrc), "SleepHygieneTick type exists");
assert(/CircadianEntry/.test(typesSrc), "CircadianEntry type exists");
assert(/BedtimeRoutine/.test(typesSrc), "BedtimeRoutine type exists");
assert(/SunlightEntry/.test(typesSrc), "SunlightEntry type exists");
assert(/MicronutrientId/.test(typesSrc), "MicronutrientId type exists");
assert(/DeficiencyBadge/.test(typesSrc), "DeficiencyBadge type exists");
assert(/SEED_SUPPLEMENT_DEFS/.test(typesSrc), "SEED_SUPPLEMENT_DEFS seed exists");
assert(/DEFAULT_BEDTIME_ROUTINE/.test(typesSrc), "DEFAULT_BEDTIME_ROUTINE exists");
assert(/DEFAULT_WAKE_ROUTINE/.test(typesSrc), "DEFAULT_WAKE_ROUTINE exists");
assert(/INDIAN_DEFICIENCY_CONTEXT/.test(typesSrc), "INDIAN_DEFICIENCY_CONTEXT exists");
// Must-seed supps
for (const s of ["whey","creatine","vitd3","b12","omega3","magnesium","zinc","ashwa","multivit"]) {
  const re = new RegExp(`id:\\s*"${s}"`);
  assert(re.test(typesSrc), `Seed supp def includes ${s}`);
}
assert(/circadian:/.test(typesSrc), "HealthState.circadian exists");
assert(/sunlight:/.test(typesSrc), "HealthState.sunlight exists");
assert(/bedtimeRoutine:/.test(typesSrc), "HealthState.bedtimeRoutine exists");
assert(/wakeRoutine:/.test(typesSrc), "HealthState.wakeRoutine exists");

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

// Wave 3 pages render actual sections
const sleepPage = fs.readFileSync(path.join(pagesDir, 'sleep.tsx'), 'utf8');
assert(/SomniumSection/.test(sleepPage), "Sleep page renders SomniumSection");
const suppPage = fs.readFileSync(path.join(pagesDir, 'supplements.tsx'), 'utf8');
assert(/ApothecarySection/.test(suppPage), "Supplements page renders ApothecarySection");
const compDir = path.join(__dirname,'..','components','health');
assert(fs.existsSync(path.join(compDir,'SomniumSection.tsx')), "SomniumSection component exists");
assert(fs.existsSync(path.join(compDir,'ApothecarySection.tsx')), "ApothecarySection component exists");
const somSrc = fs.readFileSync(path.join(compDir,'SomniumSection.tsx'),'utf8');
const apoSrc = fs.readFileSync(path.join(compDir,'ApothecarySection.tsx'),'utf8');
assert(/sleep bank|SLEEP BANK/i.test(somSrc), "Sleep bank visual present");
assert(/HYGIENE_ITEMS|hygiene/.test(somSrc), "Hygiene checklist present");
assert(/circadian|CIRCADIAN/i.test(somSrc), "Circadian anchors present");
assert(/routineAdherence|adherence/.test(somSrc), "Routine adherence % present");
assert(/DELIMITED|debt|SLEEP_DEBT/.test(somSrc), "Debt warnings present");
assert(/deficiency|DEFICIENCY|badges/i.test(apoSrc), "Deficiency badges present in apothecary");
assert(/sunlight|SUNLIGHT/i.test(apoSrc), "Sunlight log present");
assert(/streak/.test(apoSrc), "Supplement streaks shown");
assert(/adherence/.test(apoSrc), "Supplement adherence % shown");
assert(/india|ICMR|prevalence/i.test(apoSrc) || /INDIAN_DEFICIENCY_CONTEXT/.test(typesSrc), "India-specific prevalence context cited");

// Analytics exports wave-3 functions
const analyticsSrc = fs.readFileSync(path.join(__dirname,'..','lib','healthAnalytics.ts'),'utf8');
for (const fn of ["computeSleepBank","sleepScore","hygieneScore","routineAdherence","avgSleepHours","supplementStreaks","supplementAdherence","computeDeficiencyBadges","recoveryScore","shouldDeload","durationHours"]) {
  const re = new RegExp(`export function ${fn}`);
  assert(re.test(analyticsSrc), `healthAnalytics exports ${fn}`);
}
assert(/SLEEP_DEBT_WARN/.test(analyticsSrc), "SLEEP_DEBT_WARN constant exists");
assert(/SLEEP_DEBT_STRONG/.test(analyticsSrc), "SLEEP_DEBT_STRONG constant exists");
assert(/MICRO_DAILY_TARGETS/.test(analyticsSrc), "MICRO_DAILY_TARGETS table exists");
assert(/FOOD_MICRO_HINTS/.test(analyticsSrc), "FOOD_MICRO_HINTS table exists");

// Triage page surfaces wave-3 KPIs
const triage = fs.readFileSync(path.join(pagesDir,'index.tsx'),'utf8');
assert(/sleepBank|computeSleepBank/.test(triage), "Triage shows sleep bank KPI");
assert(/recovery|recoveryScore/.test(triage), "Triage shows recovery score KPI");
assert(/deficiency|deficiencyCount/.test(triage), "Triage shows deficiency risk KPI");
assert(/suppAdh|supplementAdherence/.test(triage), "Triage shows supplement adherence KPI");

// migrateHealth updated for new collections
assert(/circadian/.test(storeSrc) && /sunlight/.test(storeSrc), "migrateHealth handles new wave-3 collections");
assert(/bedtimeRoutine/.test(storeSrc) && /wakeRoutine/.test(storeSrc), "migrateHealth seeds routines");

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
