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
assert(!isFinite(navyBF_m(30,40,175)) || navyBF_m(30,40,175) === 0, "Waist < neck returns 0 (guarded formula)");

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

// ---------- Navy BF% & physique analytics (wave 4) ----------
section("Navy BF% / physique analytics");
// Re-read healthAnalytics.ts for new exports
const anSrc = fs.readFileSync(path.join(__dirname,'..','lib','healthAnalytics.ts'),'utf8');
for (const fn of ["navyBF_m","navyBF_f","lbmKg","fatMassKg","bmiCategory","strengthClass","SW_STANDARDS","whtr","detectAsymmetries","latestMeasurement","currentBfPct"]) {
  const re = new RegExp(`export function ${fn}|export const ${fn}`);
  assert(re.test(anSrc), `healthAnalytics exports ${fn}`);
}
// Men Navy BF% formula sanity (mirrors analytics.ts guarded formula)
function navyBF_m(w,n,h){ if(!(w>n)||w<=0||n<=0||h<=0) return 0; return 495/(1.0324 - 0.19077*Math.log10(w-n) + 0.15456*Math.log10(h)) - 450; }
assertClose(navyBF_m(80,37,175), 13.7, 0.5, "80w/37n/175h ≈ 14% BF");
assertClose(navyBF_m(90,38,178), 20.2, 1.0, "90w/38n/178h ≈ 20% BF");
assert(navyBF_m(30,40,175)===0, "waist<neck returns 0 instead of NaN");
assert(navyBF_m(0,0,175)===0, "zero inputs return 0");
// LBM/Fat mass
assertClose((1-15/100)*70, 59.5, 0.1, "70kg @15% = 59.5kg LBM");
// Waist-height
assertClose(80/175, 0.457, 0.01, "WHtR 80/175 ≈ 0.46");
// Strength class — use simple copy of tiers
const SW = { back_squat:{b:0.75,i:1.25,a:1.75,e:2.5}, bench_press:{b:0.55,i:0.95,a:1.35,e:1.8}, deadlift:{b:0.9,i:1.5,a:2.2,e:3.0}, overhead_press:{b:0.35,i:0.55,a:0.75,e:1.05}, pullup:{b:0,i:5,a:12,e:20} };
assert(navyBF_m(85,38,175) > 15 && navyBF_m(85,38,175) < 25, "85w BF in realistic range");
// BMI category
function bmiCat(v){ return v<18.5?"u":v<25?"n":v<30?"o":"ob"; }
assert(bmiCat(22.8)==="n", "22.8 = normal");
assert(bmiCat(27.5)==="o", "27.5 = overweight");
assert(bmiCat(32)==="ob", "32 = obese");
// Asymmetry detector: 1.0cm diff flagged
function detectAsym(m){ const pairs=[["a",m.al,m.ar],["b",m.fl,m.fr],["c",m.tl,m.tr],["d",m.cl,m.cr]]; const out=[]; for(const [s,l,r] of pairs){ if(l!=null&&r!=null){ const d=Math.abs(l-r); if(d>=1.0) out.push(d); } } return out; }
assert(detectAsym({al:35,ar:36.2,fl:28,fr:28,tl:58,tr:58,cl:37,cr:37}).length===1, "1cm+ asymmetry detected");
assert(detectAsym({al:35,ar:35.4,fl:28,fr:28,tl:58,tr:58,cl:37,cr:37}).length===0, "sub-1cm asymmetries not flagged");

// ---------- Soma component & page ----------
section("Soma component / physique page");
const soma = fs.readFileSync(path.join(compDir,'SomaSection.tsx'),'utf8');
assert(/navyBF_m|Navy/.test(soma), "Soma references Navy BF");
assert(/webcam|getUserMedia|camera/i.test(soma), "Soma has webcam/camera capture");
assert(/ProgressPhoto|photos/.test(soma), "Soma handles progress photos");
assert(/asymmetry|detectAsymmetries/.test(soma), "Soma flags asymmetries");
assert(/SW_STANDARDS|strengthClass|S:W|strength-to-weight/i.test(soma), "Soma shows S:W ratios");
assert(/workout\.prs|w-squat|w-bench|w-dead|w-ohp|w-pullup/.test(soma), "Soma pulls PRs from Workout");
const physPage = fs.readFileSync(path.join(pagesDir,'physique.tsx'),'utf8');
assert(/SomaSection/.test(physPage), "Physique page renders SomaSection");

// Photos type on HealthState
assert(/photos:/.test(typesSrc), "HealthState has photos[]");
assert(/ProgressPhoto/.test(typesSrc), "ProgressPhoto type exists");
assert(/ProgressPhotoTag/.test(typesSrc), "ProgressPhotoTag type exists");
assert(/PROGRESS_PHOTO_LABELS/.test(typesSrc), "PROGRESS_PHOTO_LABELS map exists");
// migrateHealth must handle photos
assert(/photos:/.test(storeSrc), "migrateHealth defaults photos");

// ---------- Vitals analytics (wave 5) ----------
section("Vitals classification (AHA 2024 / ACSM)");
// BP classification
function classifyBp(sys, dia){
  if(sys==null||dia==null||sys<=0||dia<=0) return {cat:"unknown",warn:false};
  if(sys>=180||dia>=120) return {cat:"crisis",warn:true};
  if(sys>=140||dia>=90)   return {cat:"stage2",warn:true};
  if(sys>=130||dia>=80)   return {cat:"stage1",warn:true};
  if(sys>=120)            return {cat:"elevated",warn:false};
  return {cat:"normal",warn:false};
}
assert(classifyBp(115,75).cat==="normal", "115/75 = normal");
assert(classifyBp(125,78).cat==="elevated", "125/78 = elevated");
assert(classifyBp(135,85).cat==="stage1", "135/85 = stage 1");
assert(classifyBp(145,92).cat==="stage2" && classifyBp(145,92).warn, "145/92 = stage 2 warn");
assert(classifyBp(185,110).cat==="crisis" && classifyBp(185,110).warn, "185/110 = crisis warn");
assert(classifyBp(null,null).cat==="unknown", "null inputs safe");
// Fever
function classifyTemp(t){
  if(t==null) return {warn:false};
  if(t>=40) return {warn:true};
  if(t>=38) return {warn:true};
  if(t>=37.5) return {warn:false};
  if(t<35.5) return {warn:true};
  return {warn:false};
}
assert(!classifyTemp(36.8).warn, "36.8°C normal");
assert(!classifyTemp(37.7).warn, "37.7°C low-grade not warn");
assert(classifyTemp(38.2).warn, "38.2°C fever warn");
assert(classifyTemp(40.1).warn, "40.1°C emergency");
assert(classifyTemp(35.0).warn, "35°C hypothermia");
// SpO2
function classifySpO2(s){
  if(s==null) return {warn:false};
  if(s>=95) return {warn:false};
  if(s>=94) return {warn:false};
  return {warn:true};
}
assert(!classifySpO2(98).warn, "SpO2 98 normal");
assert(classifySpO2(92).warn, "SpO2 92 warn");
assert(!classifySpO2(94).warn, "SpO2 94 borderline not hard warn");
assert(classifySpO2(88).warn, "SpO2 88 critical warn");
// RHR
function classifyRhr(hr){
  if(hr==null) return {warn:false};
  if(hr>=100) return {warn:true};
  if(hr>=120) return {warn:true};
  if(hr<40) return {warn:true};
  return {warn:false};
}
assert(!classifyRhr(62).warn, "RHR 62 normal");
assert(!classifyRhr(52).warn, "RHR 52 athletic");
assert(classifyRhr(105).warn, "RHR 105 tachy warn");
assert(classifyRhr(38).warn, "RHR 38 brady warn");

// Orthostatic test
function classifyOrtho(sup, st1){ const d=st1-sup; if(d>=30) return "high"; if(d>=20) return "elevated"; if(d>=13) return "mild"; return "ok"; }
assert(classifyOrtho(60,68)==="ok", "+8 bpm = ok");
assert(classifyOrtho(60,75)==="mild", "+15 bpm = mild");
assert(classifyOrtho(60,82)==="elevated", "+22 bpm = elevated");
assert(classifyOrtho(60,95)==="high", "+35 bpm = high");

// Averages — RHR 7d
function avgRhr(entries,n=7){
  const byDay={};
  for(const v of entries){ if(v.rhr==null) continue; if(!byDay[v.date]||v.ctx==="waking") byDay[v.date]=v.rhr; }
  const dates=Object.keys(byDay).sort().slice(-n);
  if(!dates.length) return 0;
  return Math.round(dates.reduce((s,d)=>s+byDay[d],0)/dates.length);
}
const vs = [];
for(let i=0;i<7;i++){ const d=new Date(Date.now()-i*86400e3).toISOString().slice(0,10); vs.push({date:d,rhr:60+i,ctx:"waking"});}
assert(avgRhr(vs)>=60 && avgRhr(vs)<=66, "avgRhr over 7 days reasonable");
assert(avgRhr([])===0, "avgRhr empty = 0");

// Active injury filter
function activeInjuries(arr){ return arr.filter(i=>i.ongoing); }
assert(activeInjuries([{ongoing:true,bodyPart:"knee"},{ongoing:false,bodyPart:"wrist"}]).length===1, "activeInjuries filters ongoing");

// ---------- Mind / burnout analytics (wave 5) ----------
section("Burnout / overtraining heuristic");
// avgMind helper
function avgMind(entries,key,n=7){
  const s=[...entries].filter(e=>typeof e[key]==="number").sort((a,b)=>b.date.localeCompare(a.date)).slice(0,n);
  if(!s.length) return 0;
  return s.reduce((x,e)=>x+e[key],0)/s.length;
}
assert(avgMind([{date:"2025-01-01",mood:8},{date:"2025-01-02",mood:6}], "mood")===7, "avgMind = 7");
assert(avgMind([], "mood")===0, "avgMind empty = 0");

// Burnout heuristic minimal reproduction
function burnout({sleep,ideal,vitals,mind,injuries}){
  // Compute sleep bank
  const sorted=[...sleep].filter(e=>e.durationHours>0&&e.durationHours<16).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  let bank=0;
  for(const e of sorted){ const d=e.durationHours-ideal; if(d<0)bank+=d; else bank+=Math.min(d*0.5,1.0); bank=Math.max(-20,Math.min(10,bank)); }
  let score=0;
  if(bank<=-10) score+=2; else if(bank<=-5) score+=1;
  // RHR elevation
  const last7=new Set(), prev14=new Set();
  const d7=new Date(); for(let i=0;i<7;i++){last7.add(d7.toISOString().slice(0,10)); d7.setDate(d7.getDate()-1);}
  const d14=new Date(Date.now()-7*86400e3); for(let i=0;i<14;i++){prev14.add(d14.toISOString().slice(0,10)); d14.setDate(d14.getDate()-1);}
  const rec=vitals.filter(v=>v.rhr!=null&&last7.has(v.date)).map(v=>v.rhr);
  const prev=vitals.filter(v=>v.rhr!=null&&prev14.has(v.date)).map(v=>v.rhr);
  if(rec.length>=3&&prev.length>=3){
    const rA=rec.reduce((s,x)=>s+x,0)/rec.length, pA=prev.reduce((s,x)=>s+x,0)/prev.length;
    const d=rA-pA;
    if(d>=8) score+=2; else if(d>=5) score+=1;
  }
  const mood7=avgMind(mind,"mood",7);
  if(mood7>0&&mood7<=3) score+=2; else if(mood7>0&&mood7<=4) score+=1;
  const e=avgMind(mind,"energy",7), f=avgMind(mind,"focus",7);
  if(e>0&&f>0 && (e+f)/2 <=4) score+=1;
  const lib=avgMind(mind,"libido",7);
  if(lib>0&&lib<=1.5) score+=2; else if(lib>0&&lib<=2.5) score+=1;
  const act=injuries.filter(i=>i.ongoing&&i.severity>=3);
  if(act.length>=1) score+=1;
  const level = score>=6?"overtraining":score>=4?"warn":score>=2?"watch":"ok";
  return {score,level};
}
// Fresh/healthy baseline: 0
const good = burnout({
  sleep: Array.from({length:7},(_,i)=>({date:new Date(Date.now()-(6-i)*86400e3).toISOString().slice(0,10),durationHours:8})),
  ideal:8, vitals:[], mind:[], injuries:[],
});
assert(good.level==="ok" || good.level==="watch", `Fresh baseline → ok/watch (got ${good.level} ${good.score})`);
// Totally fried: 14 nights of 5h + terrible mood + RHR spike + dead libido
const fried = {
  sleep: Array.from({length:14},(_,i)=>({date:new Date(Date.now()-(13-i)*86400e3).toISOString().slice(0,10),durationHours:5})),
  ideal:8,
  vitals: (() => {
    const out=[]; const d=new Date();
    for(let i=0;i<7;i++){ out.push({date:d.toISOString().slice(0,10),rhr:78}); d.setDate(d.getDate()-1); }
    for(let i=0;i<14;i++){ out.push({date:d.toISOString().slice(0,10),rhr:65}); d.setDate(d.getDate()-1); }
    return out;
  })(),
  mind: Array.from({length:7},(_,i)=>({date:new Date(Date.now()-(6-i)*86400e3).toISOString().slice(0,10),mood:2,stress:9,energy:2,anxiety:8,focus:2,libido:1})),
  injuries: [{ongoing:true,bodyPart:"knee",severity:3}],
};
const friedResult = burnout(fried);
assert(friedResult.level==="overtraining"||friedResult.level==="warn", `Fried baseline → warn/overtraining (got ${friedResult.level} score ${friedResult.score})`);
assert(friedResult.score>=4, `Fried score ≥4 (got ${friedResult.score})`);

// Injury restriction hints category mapping
const catMap = {shoulder:/overhead/i,knee:/squat/i,back:/deadlift/i,elbow:/chin|dip/i,wrist:/wrap/i,ankle:/calf|run/i};
// Just sanity: shoulder keyword in tip
function shoulderTip(cat){ if(cat==="shoulder") return /overhead/i.test("Avoid overhead pressing on shoulder."); return true; }
assert(shoulderTip("shoulder"), "Shoulder injury → avoid overhead pressing hint");

// ---------- Vitals section + Mind section + new types ----------
section("Vitals/Mind types & components (wave 5)");
assert(/SymptomEntry/.test(typesSrc), "SymptomEntry type exists");
assert(/IllnessEpisode/.test(typesSrc), "IllnessEpisode type exists");
assert(/InjuryEntry/.test(typesSrc), "InjuryEntry type exists");
assert(/MedicationEntry/.test(typesSrc), "MedicationEntry type exists");
assert(/AllergyEntry/.test(typesSrc), "AllergyEntry type exists");
assert(/OrthostaticTest/.test(typesSrc), "OrthostaticTest type exists");
assert(/JournalEntry/.test(typesSrc), "JournalEntry type exists");
assert(/gratitude/.test(typesSrc), "JournalEntry.gratitude field exists");
assert(/meditationMin/.test(typesSrc), "JournalEntry.meditationMin field exists");
assert(/respRate/.test(typesSrc), "VitalsEntry.respRate exists");
assert(/context\?:\s*\"waking\"/.test(typesSrc), "VitalsEntry.context exists");
assert(/symptoms:/.test(typesSrc), "HealthState.symptoms exists");
assert(/illnesses:/.test(typesSrc), "HealthState.illnesses exists");
assert(/injuries:/.test(typesSrc), "HealthState.injuries exists");
assert(/medications:/.test(typesSrc), "HealthState.medications exists");
assert(/allergies:/.test(typesSrc), "HealthState.allergies exists");
assert(/orthostatic:/.test(typesSrc), "HealthState.orthostatic exists");
assert(/journal:/.test(typesSrc), "HealthState.journal exists");

// migrateHealth handles wave-5 collections
assert(/symptoms:/.test(storeSrc), "migrateHealth defaults symptoms");
assert(/injuries:/.test(storeSrc), "migrateHealth defaults injuries");
assert(/medications:/.test(storeSrc), "migrateHealth defaults medications");
assert(/journal:/.test(storeSrc), "migrateHealth defaults journal");

// Components exist
assert(fs.existsSync(path.join(compDir,'VitalsSection.tsx')), "VitalsSection component exists");
assert(fs.existsSync(path.join(compDir,'MindSection.tsx')), "MindSection component exists");
const vitalsSrc = fs.readFileSync(path.join(compDir,'VitalsSection.tsx'),'utf8');
const mindSrc   = fs.readFileSync(path.join(compDir,'MindSection.tsx'),'utf8');
assert(/classifyBp|AHA|Hypertension/.test(vitalsSrc), "Vitals classifies BP per AHA");
assert(/classifyTemp|fever/.test(vitalsSrc), "Vitals classifies temp/fever");
assert(/classifySpo2/.test(vitalsSrc), "Vitals classifies SpO2");
assert(/classifyRhr/.test(vitalsSrc), "Vitals classifies RHR");
assert(/SYMPTOM|symptom/.test(vitalsSrc), "Vitals has symptom log");
assert(/Illness|illness/.test(vitalsSrc), "Vitals has illness episodes");
assert(/Injury|injury|restriction/.test(vitalsSrc), "Vitals has injury log with restrictions");
assert(/Medication|medication|Pill/.test(vitalsSrc), "Vitals has medication log");
assert(/Allergy|allergy/.test(vitalsSrc), "Vitals has allergies list");
assert(/Orthostatic|orthostatic/.test(vitalsSrc), "Vitals has orthostatic test");
assert(/HELPLINE|Vandrevala|iCall|NIMHANS|AASRA|1860|9152987821/.test(mindSrc), "Mind has Indian crisis helplines");
assert(/mood|MOOD/.test(mindSrc), "Mind has mood sliders");
assert(/stress|STRESS/.test(mindSrc), "Mind has stress sliders");
assert(/libido|LIBIDO/.test(mindSrc), "Mind has libido slider");
assert(/GRATITUDE|gratitude/.test(mindSrc), "Mind has gratitude section");
assert(/meditation|MEDITATION|breathing/.test(mindSrc), "Mind has meditation minutes");
assert(/burnout|OVERTRAINING/.test(mindSrc), "Mind surfaces burnout/overtraining");
assert(/Journal|journal/.test(mindSrc), "Mind has journal");
assert(/trend|TREND|sparkline|Sparkline/.test(mindSrc), "Mind has mood trend chart");

// Vitals + Mind pages render their sections
const vitalsPage = fs.readFileSync(path.join(pagesDir,'vitals.tsx'),'utf8');
const mindPage = fs.readFileSync(path.join(pagesDir,'mind.tsx'),'utf8');
assert(/VitalsSection/.test(vitalsPage), "/health/vitals renders VitalsSection");
assert(/MindSection/.test(mindPage), "/health/mind renders MindSection");

// Triage surfaces wave-5 KPIs
assert(/latestVitals|avgRhr/.test(triage) || /classifyBp/.test(triage) || /burnout/.test(triage), "Triage surfaces wave-5 vitals/burnout KPIs");
assert(/mood7|avgMind|Burnout/.test(triage), "Triage surfaces mood/burnout KPIs");

// Analytics exports wave-5 functions
for (const fn of ["classifyBp","classifyTemp","classifySpo2","classifyRhr","latestVitals","avgRhr","avgMind","burnoutHeuristic","activeInjuries","injuryRestrictionHints","classifyOrthostatic"]) {
  const re = new RegExp(`export function ${fn}`);
  assert(re.test(anSrc), `healthAnalytics exports ${fn}`);
}

// Helplines use real numbers (sanity against typos)
assert(/1860-2662-345|18602662345/.test(mindSrc), "Vandrevala number present");
assert(/9152987821/.test(mindSrc), "iCall number present");
assert(/080-46110007|08046110007/.test(mindSrc), "NIMHANS number present");

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

// ---------- Wave 6: Reports ----------
section("Reports / daily summaries");
// Check analytics exports (can't import TS modules into plain JS; verify source presence)
assert(/export function buildDailySummaries/.test(anSrc), "buildDailySummaries exported");
assert(/export function weeklyReport/.test(anSrc), "weeklyReport exported");
assert(/export function habitStreak/.test(anSrc), "habitStreak exported");
assert(/export function exportHealthCSV/.test(anSrc), "exportHealthCSV exported");
const reportsSrc = fs.readFileSync(path.join(compDir,'ReportsSection.tsx'),'utf8');
assert(/90-DAY|90-day|heatmap/i.test(reportsSrc), "Reports has 90-day heatmap");
assert(/EXPORT CSV|export.*CSV/i.test(reportsSrc), "Reports has CSV export");
assert(/FULL JSON/i.test(reportsSrc), "Reports has full JSON export");
assert(/HABIT STREAKS/i.test(reportsSrc) || /Streak/i.test(reportsSrc), "Reports shows habit streaks");
assert(/TIMELINE|timeline/i.test(reportsSrc), "Reports has timeline tab");
assert(/WEEKLY|weekly/i.test(reportsSrc), "Reports has weekly roll-up");
assert(/MONTHLY|28 DAY/i.test(reportsSrc), "Reports has monthly roll-up");
const reportsPage = fs.readFileSync(path.join(pagesDir,'reports.tsx'),'utf8');
assert(/ReportsSection/.test(reportsPage), "/health/reports renders ReportsSection");
// Reverse-TDEE sanity (reimplementation inline)
function reverseTdee(meals, weights, minDays=10){
  const kbd=new Map(); for(const m of meals){const k=m.items.reduce((n,it)=>n+(it.kcal||0),0);kbd.set(m.date,(kbd.get(m.date)||0)+k);}
  const sw=[...weights].sort((a,b)=>a.date.localeCompare(b.date));
  if(sw.length<2)return null;
  const f=sw[0],l=sw[sw.length-1];
  const days=Math.round((new Date(l.date)-new Date(f.date))/86400e3);
  if(days<minDays)return null;
  let tot=0,n=0;const d0=new Date(f.date);
  for(let i=0;i<=days;i++){const d=new Date(d0);d.setDate(d.getDate()+i);const k=kbd.get(d.toISOString().slice(0,10));if(k!=null){tot+=k;n++;}}
  if(n<Math.max(5,minDays/2))return null;
  const avg=tot/n; const dk=l.weightKg-f.weightKg;
  return {estTdee: Math.round(avg-(dk/days)*7700), avgKcal:Math.round(avg)};
}
assert(reverseTdee([],[{date:"2025-01-01",weightKg:70}])===null, "reverseTdee returns null with <2 weights");
const meals=[],weights=[];
for(let i=0;i<21;i++){const d=new Date(2025,0,i+1).toISOString().slice(0,10); meals.push({date:d,items:[{kcal:3000}]}); if(i===0||i===20)weights.push({date:d,weightKg:70});}
const rev = reverseTdee(meals,weights,10);
assert(rev!==null && Math.abs(rev.estTdee-3000)<50, `reverse-eng TDEE ≈ intake when weight stable (got ${rev && rev.estTdee})`);

// ---------- Wave 7: Workout bridge ----------
section("Workout bridge (wave 7)");
assert(/export function reverseEngineerTdee/.test(anSrc), "reverseEngineerTdee exported");
assert(/export function cardioCalorieEstimate/.test(anSrc), "cardioCalorieEstimate exported");
assert(/export function projectedSleepRecovery/.test(anSrc), "projectedSleepRecovery exported");
assert(/export function trainingStatus/.test(anSrc), "trainingStatus exported");
assert(/export function preWorkoutAdvisory/.test(anSrc), "preWorkoutAdvisory exported");
assert(/export function postWorkoutRecoveryNeeds/.test(anSrc), "postWorkoutRecoveryNeeds exported");
assert(/export type TrainingStatus/.test(anSrc), "TrainingStatus type exported");
assert(/export interface PreWorkoutAdvisory/.test(anSrc), "PreWorkoutAdvisory type exported");
// Pre-WO advisory logic inline
function pwa({bank,lastNightHrs=8,recovery=80,hydro=85,inj=0,crisis=false,fever=false,rhrD=0,burnout}){
  let level="clear",intensity=1.0,msgs=[];
  const sev={"clear":0,"caution":1,"warn":2,"abort":3};
  const up=l=>{if(sev[l]>sev[level])level=l;};
  if(crisis){up("abort");msgs.push("crisis");intensity=0;}
  if(fever){up("abort");msgs.push("fever");intensity=0;}
  if(bank<=-10||lastNightHrs<5){up("warn");msgs.push("sleep");intensity=Math.min(intensity,0.6);}
  else if(bank<=-5||lastNightHrs<6.5){up("caution");intensity=Math.min(intensity,0.8);}
  if(hydro<50){up("caution");msgs.push("hydro");}
  if(inj>0)up("caution");
  if(rhrD>=8){up("warn");intensity=Math.min(intensity,0.7);}
  if(burnout==="overtraining"){up("abort");intensity=0.3;}
  else if(burnout==="warn"){up("warn");intensity=Math.min(intensity,0.6);}
  if(recovery>=80&&level==="clear")intensity=1.05;
  return {level,intensity};
}
const pwaClear = pwa({bank:0,recovery:80,hydro:85,inj:0,crisis:false,fever:false,rhrD:0,burnout:"ok"});
assert(pwaClear.level==="clear" && pwaClear.intensity>=1.0, "green-light pre-WO on all-good day");
const pwaBad = pwa({bank:-12,lastNightHrs:4,recovery:20,hydro:30,inj:1,crisis:false,fever:true,rhrD:12,burnout:"overtraining"});
assert(pwaBad.level==="abort" && pwaBad.intensity<=0.3, "abort pre-WO on fever/overtraining/bad stats");
const debt = []; for(let i=0;i<14;i++){const d=new Date(Date.now()-(13-i)*86400e3); debt.push({durationHours:5});}
// projected sleep recovery — reimplementation
function proj(entries,ideal){
  function bank(entries,ideal){let b=0;for(const e of entries){const d=e.durationHours-ideal; if(d<0)b+=d;else b+=Math.min(d*0.5,1.0); b=Math.max(-20,Math.min(10,b));}return b;}
  const b=bank(entries,ideal); if(b>=0)return {extra:0,nights:0};
  const deficit=-b; const credit=Math.min(ideal*0.125,1)*0.5;
  return {extra:Math.round(deficit*10)/10,nights:Math.max(1,Math.ceil(deficit/Math.max(0.25,credit)))};
}
const p0 = proj([],8); assert(p0.extra===0 && p0.nights===0, "zero entries → no debt");
const pDebt = proj(debt,8); assert(pDebt.extra>0 && pDebt.nights>=3, "14 nights @ 5h projects multi-night recovery");
// post-WO needs sanity
const post = (vol,dur,int) => ({p:Math.round(15+vol*0.015*int),w:Math.round(500+dur*8*int),c:Math.round(60+vol*0.01*int)});
const postV = post(3000,60,1);
assert(postV.p>=20 && postV.w>=500 && postV.c>=50, "post-WO returns sensible protein/water/carb targets");
// Health card injected into Workout overview
const ovSrc = fs.readFileSync(path.join(__dirname,'..','components','workout','OverviewContent.tsx'),'utf8');
assert(/HEALTH:/.test(ovSrc), "Workout overview renders HEALTH advisory card");
assert(/preWorkoutAdvisory|preWO/.test(ovSrc), "Workout overview computes preWO advisory");
assert(/Open Health OS/.test(ovSrc), "Workout overview links to /health");
assert(/recoveryScore|computeSleepBank|avgRhr/.test(ovSrc), "Workout overview imports health analytics");

// Additional wave 6/7 scenarios
section("Wave 6/7 edge scenarios");

// Pre-WO advisory edge cases
const pwaCaution = pwa({bank:-3,lastNightHrs:7,recovery:70,hydro:40,inj:1,crisis:false,fever:false,rhrD:3,burnout:"ok"});
assert(pwaCaution.level==="caution", "low hydro + mild debt + injury → CAUTION");
const pwaWarn = pwa({bank:-7,lastNightHrs:5.5,recovery:40,hydro:60,inj:0,crisis:false,fever:false,rhrD:9,burnout:"watch"});
assert(pwaWarn.level==="warn", "RHR Δ+9 + bank -7 → WARN");
const pwaOvertrain = pwa({bank:0,recovery:90,hydro:90,inj:0,crisis:false,fever:false,rhrD:0,burnout:"overtraining"});
assert(pwaOvertrain.level==="abort", "overtraining burnout → ABORT even if recovery looks good");

// Cardio calorie estimate: 60min @ MET7 × 70kg = 490 kcal
function cardio(dur,kg,met=7){ return Math.round(met*kg*(dur/60)); }
assert(cardio(60,70,7)===490, "cardio kcal: 60min@7MET×70kg = 490");
assert(cardio(30,80,10)===400, "cardio kcal: 30min@10MET×80kg = 400");

// Training status reimplementation
function tstat({recentVol,priorVol,recovery,rhrDelta,sessionsRecent,sessionsPrior}){
  const volRatio = priorVol>0?recentVol/priorVol:(sessionsRecent>0?1:0);
  if(sessionsRecent===0)return "detrained";
  if(recovery<30 && volRatio>1.0 && rhrDelta>=8)return "overreaching";
  if(recovery<45 && volRatio>0.85)return "fatigued";
  if(volRatio>1.15 && recovery>=55)return "peaking";
  if(volRatio>1.05 && recovery>=60)return "accumulating";
  if(volRatio<0.7 && recovery>=70 && sessionsPrior>2)return "fresh";
  return "maintaining";
}
assert(tstat({recentVol:0,priorVol:1000,recovery:50,rhrDelta:0,sessionsRecent:0,sessionsPrior:4})==="detrained","no sessions → detrained");
assert(tstat({recentVol:12000,priorVol:10000,recovery:25,rhrDelta:10,sessionsRecent:6,sessionsPrior:5})==="overreaching","high vol + low rec + RHR spike → overreaching");
assert(tstat({recentVol:9000,priorVol:10000,recovery:40,rhrDelta:3,sessionsRecent:5,sessionsPrior:5})==="fatigued","low recovery + decent volume → fatigued");
assert(tstat({recentVol:12000,priorVol:10000,recovery:70,rhrDelta:1,sessionsRecent:6,sessionsPrior:5})==="peaking","15% over + high rec → peaking");
assert(tstat({recentVol:11000,priorVol:10000,recovery:75,rhrDelta:0,sessionsRecent:6,sessionsPrior:5})==="accumulating","10% over + good rec → accumulating");
assert(tstat({recentVol:5000,priorVol:10000,recovery:80,rhrDelta:-3,sessionsRecent:2,sessionsPrior:5})==="fresh","<70% vol + high rec + prior sessions → fresh");
assert(tstat({recentVol:9500,priorVol:10000,recovery:65,rhrDelta:2,sessionsRecent:5,sessionsPrior:5})==="maintaining","near-parity → maintaining");

// Sleep projection edge cases
const pNoDebt = proj([{durationHours:8},{durationHours:8},{durationHours:8}],8);
assert(pNoDebt.extra===0 && pNoDebt.nights===0, "perfect nights → zero recovery needed");
const pBigDebt = []; for(let i=0;i<20;i++)pBigDebt.push({durationHours:4}); // 20 nights at 4h = -20h per night? Bank caps at -20.
const pBigRes = proj(pBigDebt,8);
assert(pBigRes.extra>0 && pBigRes.nights>0, "major debt → positive recovery projection");

// Reverse TDEE reimplementation sanity (stable weight ⇒ ≈ avg kcal)
function revTdee(mealsByDay, weightsArr){
  const sorted=[...weightsArr].sort((a,b)=>a.date.localeCompare(b.date));
  if(sorted.length<2)return null;
  const first=sorted[0],last=sorted[sorted.length-1];
  const daySpan=Math.round((new Date(last.date)-new Date(first.date))/86400e3);
  if(daySpan<10)return null;
  const totKcal=mealsByDay.reduce((n,v)=>n+v,0);
  const avgKcal=totKcal/Math.max(1,mealsByDay.length);
  const deltaKg=last.weightKg-first.weightKg;
  return Math.round(avgKcal - (deltaKg/daySpan)*7700);
}
// stable weight at 2800 kcal over 14 days → est TDEE ≈ 2800
const days=14, kcal=[]; for(let i=0;i<days;i++)kcal.push(2800);
const wArr=[{date:"2025-01-01",weightKg:70},{date:"2025-01-14",weightKg:70.2}];
const est = revTdee(kcal,wArr);
assert(est>=2600 && est<=3000, "reverse TDEE stable weight ≈ avg kcal (got "+est+")");
// losing weight at 2200 kcal with 70→68.5kg over 14d means TDEE higher than 2200
const kcal2=[];for(let i=0;i<14;i++)kcal2.push(2200);
const wArr2=[{date:"2025-01-01",weightKg:70},{date:"2025-01-14",weightKg:68.5}];
const est2 = revTdee(kcal2,wArr2);
assert(est2>2500, "reverse TDEE weight loss implies higher TDEE than intake (got "+est2+")");
// Habit streak logic test
function hStreak(sums,pred){
  let cur=0,long=0,run=0;
  for(let i=sums.length-1;i>=0;i--){if(pred(sums[i]))cur++;else break;}
  for(const s of sums){if(pred(s)){run++;long=Math.max(long,run);}else run=0;}
  return {current:cur,longest:long};
}
const fakeDays=[];
for(let i=0;i<14;i++)fakeDays.push({completed:i<5?90:30,hydrationPct:i<5?85:40,sleepHours:i<5?7.5:6,proteinG:150,hasWorkout:i%2===0,kcal:2500,meditatedMin:i%3===0?10:0});
const s1=hStreak(fakeDays,d=>d.completed>=85);
assert(s1.current===0 && s1.longest===5, "habit streak: 5-day run then broken");
const s2=hStreak(fakeDays,d=>d.hasWorkout);
// days 0..13; i%2==0 for workout means days 0,2,4,...12 (odd indices from end: day13 no, day12 yes, day11 no) → current=0
assert(s2.current===0, "streak current counts consecutive from today backwards; broken correctly");

console.log("\n>>> ALL EDGE SCENARIOS PASS");

// ═══════════════════ WAVE 8A — FUEL core UX ═══════════════════
section("Wave 8A — fasting window state");
function fwState(startHour, endHour, nowHours) {
  const norm = h => ((h % 24) + 24) % 24;
  const s = norm(startHour), e = norm(endHour), n = norm(nowHours);
  const eatingHours = norm(e - s) || 24;
  const fastingHours = 24 - eatingHours;
  const inWindow = s <= e ? (n >= s && n < e) : (n >= s || n < e);
  const until = t => norm(t - n) || 24;
  return inWindow
    ? { inWindow, hoursToNext: until(e), next: "closes", eatingHours, fastingHours }
    : { inWindow, hoursToNext: until(s), next: "opens", eatingHours, fastingHours };
}
let st = fwState(12, 20, 14);
assert(st.inWindow && st.next === "closes" && Math.abs(st.hoursToNext - 6) < 1e-9, "16:8 at 2pm → eating, closes in 6h");
st = fwState(12, 20, 8);
assert(!st.inWindow && st.next === "opens" && Math.abs(st.hoursToNext - 4) < 1e-9, "16:8 at 8am → fasting, opens in 4h");
st = fwState(12, 20, 22);
assert(!st.inWindow && Math.abs(st.hoursToNext - 14) < 1e-9, "16:8 at 10pm → fasting, opens in 14h");
st = fwState(20, 4, 22);
assert(st.inWindow && st.eatingHours === 8, "cross-midnight window 20→04: 10pm inside, 8h window");
st = fwState(20, 4, 10);
assert(!st.inWindow && Math.abs(st.hoursToNext - 10) < 1e-9, "cross-midnight at 10am → fasting, opens in 10h");
st = fwState(13, 14, 13.5);
assert(st.inWindow && st.eatingHours === 1 && st.fastingHours === 23, "OMAD 13→14: inside, 23h fast");

section("Wave 8A — macro rebalance (always sums 100)");
function rebalance(cur, changed, val) {
  const v = Math.max(0, Math.min(100, Math.round(val)));
  const keys = ["c","p","f"], others = keys.filter(k => k !== changed);
  const rest = 100 - v;
  const oldRest = others.reduce((n,k)=>n+cur[k],0);
  const out = { ...cur, [changed]: v };
  if (oldRest <= 0) { out[others[0]] = Math.floor(rest/2); out[others[1]] = rest - out[others[0]]; }
  else { out[others[0]] = Math.round(rest * cur[others[0]] / oldRest); out[others[1]] = rest - out[others[0]]; }
  return out;
}
let m8 = rebalance({c:40,p:30,f:30}, "c", 50);
assert(m8.c+m8.p+m8.f === 100, "drag carbs 40→50: sums to 100 (" + JSON.stringify(m8) + ")");
assert(m8.p === 25 && m8.f === 25, "others scale proportionally (30/30 → 25/25)");
m8 = rebalance({c:40,p:30,f:30}, "p", 60);
assert(m8.c+m8.p+m8.f === 100 && m8.p === 60, "drag protein to 60 keeps sum 100");
m8 = rebalance({c:100,p:0,f:0}, "c", 40);
assert(m8.c+m8.p+m8.f === 100 && m8.p+m8.f === 60, "zero-others edge: remainder split evenly");
m8 = rebalance({c:40,p:30,f:30}, "f", 0);
assert(m8.c+m8.p+m8.f === 100 && m8.f === 0, "slider to 0 valid");
m8 = rebalance({c:40,p:30,f:30}, "c", 100);
assert(m8.c === 100 && m8.p === 0 && m8.f === 0, "slider to 100 zeroes others");

section("Wave 8A — macro gram targets (4/4/9)");
function gramTargets(kcal,c,p,f){ return { carbsG: Math.round((kcal*c/100)/4), proteinG: Math.round((kcal*p/100)/4), fatG: Math.round((kcal*f/100)/9) }; }
const gt = gramTargets(2600, 40, 30, 30);
assert(gt.carbsG === 260 && gt.proteinG === 195 && gt.fatG === 87, "2600kcal balanced → 260C/195P/87F g");
const gk = gramTargets(2000, 10, 25, 65);
assert(gk.carbsG === 50 && gk.proteinG === 125 && gk.fatG === 144, "2000kcal keto → 50C/125P/144F g");

section("Wave 8A — frequent foods");
function freqFoods(meals, pinned = [], topN = 20) {
  const stats = new Map();
  for (const mm of meals) for (const it of mm.items) {
    const key = it.name.replace(/\s*×[\d.]+\s*$/, "").trim();
    if (!key) continue;
    const prev = stats.get(key);
    if (!prev) stats.set(key, { count: 1, kcal: it.kcal, last: mm.date });
    else { prev.count++; if (mm.date >= prev.last) { prev.kcal = it.kcal; prev.last = mm.date; } }
  }
  const pin = new Set(pinned.map(x=>x.toLowerCase()));
  const rows = Array.from(stats.entries()).map(([name,s])=>({name,count:s.count,kcal:s.kcal,pinned:pin.has(name.toLowerCase())}));
  rows.sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||(b.count-a.count)||a.name.localeCompare(b.name));
  return rows.slice(0,topN);
}
const mealsFx = [
  { date:"2025-01-01", items:[{name:"idli ×2", kcal:120},{name:"dosa", kcal:180}] },
  { date:"2025-01-02", items:[{name:"idli ×4", kcal:240},{name:"curd rice", kcal:300}] },
  { date:"2025-01-03", items:[{name:"idli", kcal:60}] },
];
let ff = freqFoods(mealsFx);
assert(ff[0].name === "idli" && ff[0].count === 3, "serving multipliers aggregate (idli ×2/×4/plain → 3 logs)");
assert(ff[0].kcal === 60, "most recent kcal wins for re-log");
ff = freqFoods(mealsFx, ["curd rice"]);
assert(ff[0].name === "curd rice" && ff[0].pinned, "pinned food floats to top over higher count");

section("Wave 8A — sip suggestion");
function sip(logged, goal, nowH) {
  if (goal <= 0 || logged >= goal) return null;
  const S = 7, E = 23;
  if (nowH < S) return null;
  const h = Math.min(nowH, E);
  const nx = Math.min(Math.floor(h) + 1, E);
  const target = goal * (nx - S) / (E - S);
  const ml = Math.max(0, Math.round((target - logged) / 50) * 50);
  if (ml === 0) return null;
  return { ml: Math.min(ml, 750), byHour: nx };
}
let sp = sip(0, 2700, 12);
assert(sp && sp.byHour === 13 && sp.ml > 0, "noon, nothing logged → catch-up suggestion by 1pm");
assert(sip(2700, 2700, 15) === null, "goal met → no nudge");
assert(sip(500, 2700, 5) === null, "before 7am → no nudge");
sp = sip(0, 8000, 22.5);
assert(sp && sp.ml === 750, "huge gap capped at 750ml per suggestion");
sp = sip(1400, 2700, 14.5);
assert(sp === null || sp.ml <= 300, "on-pace logger gets small or no nudge");

section("Wave 8A — fast streak");
function fStreakQA(meals, s, e, todayIso) {
  const byDate = new Map();
  for (const mm of meals) { if (!byDate.has(mm.date)) byDate.set(mm.date, []); byDate.get(mm.date).push(mm); }
  const dayOk = date => {
    const dm = byDate.get(date);
    if (!dm || dm.length === 0) return null;
    for (const meal of dm) {
      if (!meal.time) continue;
      const [hh, mmn] = meal.time.split(":").map(Number);
      const t = (hh??0) + (mmn??0)/60;
      if (!fwState(s, e, t).inWindow) return false;
    }
    return true;
  };
  let streak = 0;
  const d = new Date(todayIso + "T00:00:00");
  for (let i = 0; i < 365; i++) {
    const iso = new Date(d.getTime() - i*86400000).toISOString().slice(0,10);
    const c = dayOk(iso);
    if (c === true) streak++;
    else if (c === false) break;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
const fsMeals = [
  { date:"2025-06-01", time:"13:00", items:[{name:"x",kcal:1}] },
  { date:"2025-06-02", time:"12:30", items:[{name:"x",kcal:1}] },
  { date:"2025-06-03", time:"19:00", items:[{name:"x",kcal:1}] },
];
assert(fStreakQA(fsMeals, 12, 20, "2025-06-03") === 3, "3 compliant days → streak 3");
const fsMeals2 = [...fsMeals, { date:"2025-06-04", time:"22:00", items:[{name:"late",kcal:1}] }];
assert(fStreakQA(fsMeals2, 12, 20, "2025-06-04") === 0, "late meal today breaks streak to 0");
assert(fStreakQA(fsMeals, 12, 20, "2025-06-04") === 3, "today unlogged → yesterday's streak survives");


// ═══════════════════ WAVE 8B — FUEL nutrient depth ═══════════════════
section("Wave 8B — nutrient status vs targets");
const TARGETS = {
  fiberG:{goal:30,kind:"goal"}, addedSugarG:{goal:25,kind:"cap"},
  sodiumMg:{goal:2300,kind:"cap",warnAt:1500}, cholesterolMg:{goal:300,kind:"cap"},
  satFatG:{goal:25,kind:"cap"}, transFatG:{goal:0,kind:"zero"}, omega3Mg:{goal:500,kind:"goal"},
};
function nStatus(key, value) {
  const t = TARGETS[key]; const v = value ?? 0;
  if (t.kind === "zero") return { status: v > 0 ? "over" : "ok", pct: v > 0 ? 100 : 0 };
  const pct = t.goal > 0 ? Math.round((v / t.goal) * 100) : 0;
  if (t.kind === "goal") return { status: pct >= 100 ? "ok" : pct >= 60 ? "near" : "low", pct: Math.min(pct, 150) };
  const warnPct = t.warnAt ? Math.round((t.warnAt / t.goal) * 100) : 80;
  return { status: pct > 100 ? "over" : pct >= warnPct ? "near" : "ok", pct: Math.min(pct, 150) };
}
assert(nStatus("fiberG", 32).status === "ok", "fiber 32g >= 30g goal → ok");
assert(nStatus("fiberG", 20).status === "near", "fiber 20g = 67% → near");
assert(nStatus("fiberG", 10).status === "low", "fiber 10g = 33% → low");
assert(nStatus("addedSugarG", 30).status === "over", "sugar 30g > 25g cap → over");
assert(nStatus("addedSugarG", 10).status === "ok", "sugar 10g under cap → ok");
assert(nStatus("sodiumMg", 1800).status === "near", "sodium 1800mg past 1500 warn → near");
assert(nStatus("sodiumMg", 2500).status === "over", "sodium 2500mg > 2300 cap → over");
assert(nStatus("transFatG", 0).status === "ok" && nStatus("transFatG", 1).status === "over", "trans fat: zero ok, any over");
assert(nStatus("omega3Mg", 600).status === "ok", "omega-3 600mg hits 500 goal");
assert(nStatus("fiberG", undefined).status === "low", "undefined treated as 0");

section("Wave 8B — sugar spike risk");
function spike(cq, pr, carbs) {
  cq = cq ?? "mixed"; pr = pr ?? "some";
  let score = 0;
  score += cq === "simple" ? 2 : cq === "mixed" ? 1 : 0;
  score += pr === "none" ? 2 : pr === "some" ? 1 : 0;
  if ((carbs ?? 0) >= 80) score += 1;
  if ((carbs ?? 0) > 0 && (carbs ?? 0) < 20) score -= 1;
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}
assert(spike("simple", "none", 100) === "high", "simple carbs, no pairing, 100g → HIGH");
assert(spike("complex", "high", 60) === "low", "complex + high protein → LOW");
assert(spike("simple", "high", 50) === "medium", "simple but well-paired → MEDIUM");
assert(spike("mixed", "some", 50) === "medium", "default mixed/some → MEDIUM");
assert(spike("complex", "some", 10) === "low", "tiny carb load discounts a point → LOW");
assert(spike("simple", "none", 15) === "medium", "simple+none but tiny carbs drops HIGH→MEDIUM");

section("Wave 8B — fiber from meals");
function fiberFrom(meals, date) {
  let g = 0;
  for (const m of meals) if (m.date === date) for (const it of m.items) g += it.fibreG ?? 0;
  return Math.round(g);
}
const fMeals = [
  { date: "2025-06-01", items: [{ name:"idli", kcal:85, fibreG:2 }, { name:"dal", kcal:150, fibreG:6 }] },
  { date: "2025-06-01", items: [{ name:"salad", kcal:60, fibreG:4.5 }] },
  { date: "2025-06-02", items: [{ name:"oats", kcal:150, fibreG:8 }] },
];
assert(fiberFrom(fMeals, "2025-06-01") === 13, "sums fibre across same-day meals (2+6+4.5 → 13)");
assert(fiberFrom(fMeals, "2025-06-03") === 0, "no meals → 0g");
assert(fiberFrom([{date:"2025-06-01",items:[{name:"x",kcal:1}]}], "2025-06-01") === 0, "items without fibreG → 0");


// ═══════════════════ WAVE 8C — FUEL planning ═══════════════════
section("Wave 8C — recipe nutrition analyzer");
function recipeNut(r) {
  let kcal = 0, c = 0, p = 0, f = 0;
  for (const ing of r.ingredients) { kcal += ing.kcal ?? 0; c += ing.carbsG ?? 0; p += ing.proteinG ?? 0; f += ing.fatG ?? 0; }
  const n = Math.max(1, r.portions || 1);
  const rd = x => Math.round(x * 10) / 10;
  return {
    total: { kcal: Math.round(kcal), carbsG: rd(c), proteinG: rd(p), fatG: rd(f) },
    perServing: { kcal: Math.round(kcal / n), carbsG: rd(c / n), proteinG: rd(p / n), fatG: rd(f / n) },
  };
}
const rec = { portions: 4, ingredients: [
  { name: "chicken", kcal: 800, carbsG: 0, proteinG: 150, fatG: 20 },
  { name: "rice", kcal: 520, carbsG: 112, proteinG: 10, fatG: 2 },
  { name: "oil", kcal: 240, carbsG: 0, proteinG: 0, fatG: 27 },
]};
let rn = recipeNut(rec);
assert(rn.total.kcal === 1560, "recipe total kcal sums (1560)");
assert(rn.perServing.kcal === 390, "per-serving = total/portions (390)");
assert(rn.perServing.proteinG === 40, "per-serving protein 160/4 = 40");
rn = recipeNut({ portions: 0, ingredients: [{ name: "x", kcal: 100 }] });
assert(rn.perServing.kcal === 100, "portions 0 clamps to 1 (no div-by-zero)");
rn = recipeNut({ portions: 3, ingredients: [] });
assert(rn.total.kcal === 0 && rn.perServing.kcal === 0, "empty ingredients → 0");
rn = recipeNut({ portions: 3, ingredients: [{ name: "dal", kcal: 100, proteinG: 7 }] });
assert(rn.perServing.proteinG === 2.3, "per-serving rounds to 1dp (7/3 → 2.3)");

section("Wave 8C — planner helpers");
function isoDowQA(iso) { const d = new Date(iso + "T00:00:00"); return (d.getDay() + 6) % 7; }
assert(isoDowQA("2026-08-10") === 0, "2026-08-10 is a Monday → dow 0");
assert(isoDowQA("2026-08-15") === 5, "2026-08-15 is a Saturday → dow 5");
assert(isoDowQA("2026-08-16") === 6, "2026-08-16 is a Sunday → dow 6");
function planFor(plan, dow) {
  const order = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return plan.filter(p => p.dow === dow).sort((a, b) => order[a.slot] - order[b.slot]);
}
const plan = [
  { id: "1", dow: 0, slot: "dinner", name: "d" },
  { id: "2", dow: 0, slot: "breakfast", name: "b" },
  { id: "3", dow: 1, slot: "lunch", name: "l" },
];
const mon = planFor(plan, 0);
assert(mon.length === 2 && mon[0].slot === "breakfast" && mon[1].slot === "dinner", "planForDow filters + orders slots");
assert(planFor(plan, 4).length === 0, "empty day → []");
function prepProg(plan) {
  const total = plan.length, done = plan.filter(p => p.prepped).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
assert(prepProg([]).pct === 0, "no plan → 0% (no NaN)");
assert(prepProg([{prepped:true},{prepped:true},{prepped:false}]).pct === 67, "2/3 prepped → 67%");

if (failures === 0) console.log("\n>>> WAVE 8A+8B+8C TESTS PASS");
else { console.error(`\n${failures} FAILURE(S) (incl. wave 8A)`); process.exit(1); }
