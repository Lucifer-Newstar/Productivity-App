/** Regression gate for qa entertainment migration contracts. */
import assert from "node:assert/strict";
import { migrateEntertainment } from "../lib/entertainmentTypes";
let passed=0;const test=(name:string,fn:()=>void)=>{fn();passed++;console.log(`  ✓ ${name}`)};
const legacy:any={schemaVersion:1,items:[{id:"old",type:"anime",title:"Legacy",genres:null,creators:null,cast:null,studios:null,status:"in-progress",progress:null,rating:9,notes:"keep me",repeats:null,priority:null,queueOrder:null,tags:null,favorite:null,archived:null,createdAt:1}],settings:{language:"invalid"}};
const m=migrateEntertainment(legacy);
console.log("\n── Entertainment migrations ──");
test("upgrades to schema v6",()=>assert.equal(m.schemaVersion,6));
test("preserves personal data",()=>{assert.equal(m.items[0].rating,9);assert.equal(m.items[0].notes,"keep me")});
test("normalizes core arrays and progress",()=>{const i=m.items[0];assert.deepEqual(i.genres,[]);assert.deepEqual(i.tags,[]);assert.deepEqual(i.progress,{})});
test("backfills anime and series deep state",()=>{assert.deepEqual(m.items[0].seriesDetails?.episodeLogs,[]);assert.deepEqual(m.items[0].animeDetails?.voiceActors,[])});
test("backfills social collections",()=>{assert.deepEqual(m.friends,[]);assert.deepEqual(m.groups,[]);assert.deepEqual(m.loans,[])});
test("backfills creation collections",()=>{assert.deepEqual(m.reviewDrafts,[]);assert.deepEqual(m.moodBoards,[]);assert.deepEqual(m.whatIfs,[])});
test("invalid language falls back to English",()=>assert.equal(m.settings.language,"en"));
test("supported Tamil language survives",()=>assert.equal(migrateEntertainment({...legacy,settings:{language:"ta"}}).settings.language,"ta"));
test("null state safely returns seed",()=>{const seed=migrateEntertainment(null);assert.equal(seed.schemaVersion,6);assert.ok(seed.items.length>0)});
console.log(`\n${passed} migration tests passed.`);
