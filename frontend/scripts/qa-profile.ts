/** Profile migration, GitHub username, and backup-key contracts. */
import assert from "node:assert/strict";
import { EMPTY_PROFILE, migrateProfile } from "../lib/profileTypes";
import { assertGithubUsername } from "../lib/githubRepos";
import { AUTHORITATIVE_KEYS } from "../lib/backup";
let passed=0;const test=(name:string,fn:()=>void)=>{fn();passed++;console.log(`  ✓ ${name}`)};
test("empty profile is the migration default",()=>assert.equal(migrateProfile(null).displayName,EMPTY_PROFILE.displayName));
test("unsafe avatar and javascript URLs are dropped",()=>{
  const next=migrateProfile({displayName:"Navin",website:"javascript:alert(1)",avatarDataUrl:"data:text/html,hi",githubUsername:"bad user"});
  assert.equal(next.website,"");
  assert.equal(next.avatarDataUrl,undefined);
  assert.equal(next.githubUsername,"");
  assert.equal(next.displayName,"Navin");
});
test("github username allowlist",()=>{
  assert.equal(assertGithubUsername("Lucifer-Newstar"),"Lucifer-Newstar");
  assert.throws(()=>assertGithubUsername("../etc"),/invalid/);
});
test("profile is an authoritative backup key",()=>assert.ok(AUTHORITATIVE_KEYS.includes("kaizen.profile")));
test("avatar control routes to the full profile page",()=>{
  const dock=require("node:fs").readFileSync(require("node:path").join(__dirname,"../components/ProfileDock.tsx"),"utf8");
  const page=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app/profile/page.tsx"),"utf8");
  assert.match(dock,/href=\"\/profile\"/);
  assert.match(page,/Kaizen profile/);
});
test("Glow tab hosts session catalogue keys with official help URLs",()=>{
  const keys=require("node:fs").readFileSync(require("node:path").join(__dirname,"../lib/entertainmentKeys.ts"),"utf8");
  const page=require("node:fs").readFileSync(require("node:path").join(__dirname,"../components/ProfilePage.tsx"),"utf8");
  for (const token of ["afterglow.key.mal","afterglow.key.tmdb","afterglow.key.google","afterglow.key.comicvine","afterglow.key.nyt"]) {
    assert.ok(keys.includes(token), token);
  }
  assert.match(page,/AFTERGLOW_KEY_FIELDS/);
  assert.match(page,/profile-help-bang/);
  assert.match(page,/profile-hero/);
  assert.match(page,/CycleLogCard/);
  assert.match(keys,/myanimelist\.net\/apiconfig\/references\/api\/v2/);
  assert.match(keys,/developer\.themoviedb\.org\/docs\/getting-started/);
  assert.match(keys,/developers\.google\.com\/books\/docs\/v1\/using/);
  assert.match(keys,/comicvine\.gamespot\.com\/api/);
  assert.match(keys,/developer\.nytimes\.com\/docs\/books-product\/1\/overview/);
  assert.match(page,/sessionStorage|writeAfterglowSessionKeys/);
  assert.doesNotMatch(page,/kaizen\.profile.*afterglow\.key/);
});
test("native select option menus have explicit dark and light ink",()=>{
  const css=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app/globals.css"),"utf8");
  assert.match(css,/home-root option/);
  assert.match(css,/background-color: #0d131f/);
  assert.match(css,/html\.dark option/);
});
test("standing weight is set on Profile and reused, not logged daily",()=>{
  const { latestStandingWeightKg, bmi, tdee } = require("../lib/healthAnalytics");
  assert.equal(latestStandingWeightKg([]),0);
  assert.equal(latestStandingWeightKg([{date:"2026-08-01",weightKg:68},{date:"2026-08-20",weightKg:71.4}]),71.4);
  const page=require("node:fs").readFileSync(require("node:path").join(__dirname,"../components/ProfilePage.tsx"),"utf8");
  assert.match(page,/Standing weight/);
  assert.match(page,/logBodyweight/);
  assert.match(page,/profile-intel/);
  assert.match(page,/not a daily log/);
  assert.ok(bmi(71.4,175)>20);
  assert.ok(tdee(71.4,{heightCm:175,ageYears:20,gender:"female",activityLevel:"moderate"})>1400);
});
test("Profile and Health gender chrome is obviously different",()=>{
  const css=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app/globals.css"),"utf8");
  const page=require("node:fs").readFileSync(require("node:path").join(__dirname,"../components/ProfilePage.tsx"),"utf8");
  const shell=require("node:fs").readFileSync(require("node:path").join(__dirname,"../components/health/HealthShell.tsx"),"utf8");
  assert.match(page,/Atelier profile/);
  assert.match(page,/Instrument profile/);
  assert.match(css,/profile-page\[data-gender="male"\]/);
  assert.match(css,/profile-page\[data-gender="female"\]/);
  assert.match(css,/font-editorial/);
  assert.match(shell,/CLINIC/);
  assert.match(shell,/VITALS/);
  assert.match(shell,/border-radius: 18px/);
});
test("Japanese geometry is unique per space and has no letters",()=>{
  const css=require("node:fs").readFileSync(require("node:path").join(__dirname,"../app/globals.css"),"utf8");
  assert.match(css,/Japanese geometry only/);
  assert.match(css,/repeating-radial-gradient/);
  assert.match(css,/repeating-conic-gradient/);
  assert.match(css,/career-root::before/);
  assert.match(css,/forge-root::before/);
  assert.match(css,/ent-root::before/);
  assert.doesNotMatch(css,/Japanese geometry[\s\S]{0,800}[\u3040-\u30ff\u4e00-\u9fff]/);
});
console.log(`\n${passed} profile checks passed.`);
