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
console.log(`\n${passed} profile checks passed.`);
