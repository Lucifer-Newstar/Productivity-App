import assert from "node:assert/strict";
import type { EntertainmentItem, MediaType } from "../lib/entertainmentTypes";
import { blindSpots, creatorMarathons, explorationScore, franchiseGaps, moodPick, recommendations, surprisePick } from "../lib/entertainmentAnalytics";
let passed=0;const test=(name:string,fn:()=>void)=>{fn();passed++;console.log(`  ✓ ${name}`)};
const item=(id:string,patch:Partial<EntertainmentItem>={}):EntertainmentItem=>({id,type:"movie",title:id,genres:[],creators:[],cast:[],studios:[],countries:[],status:"planned",progress:{},repeats:0,priority:"medium",queueOrder:1,tags:[],favorite:false,archived:false,createdAt:Date.now(),updatedAt:Date.now(),...patch});
const items=[
 item("liked",{status:"completed",rating:9,favorite:true,type:"movie",genres:["Sci-Fi","Drama"],tags:["mind-bending"],creators:["A Director"],studios:["Studio X"],releaseYear:1999,countries:["Japan"],franchise:"Saga",franchiseOrder:1}),
 item("best match",{genres:["Sci-Fi"],tags:["mind-bending"],creators:["A Director"],studios:["Studio X"],releaseYear:2010,franchise:"Saga",franchiseOrder:3}),
 item("weak match",{genres:["Drama"],releaseYear:2020}),
 item("cozy book",{type:"book",tags:["cozy"],genres:["Fantasy"],creators:["B Author"],releaseYear:1985,countries:["UK"]}),
];
console.log("\n── Entertainment intelligence algorithms ──");
test("weighted recommendations rank creator/studio match first",()=>{const r=recommendations(items);assert.equal(r[0].item.id,"best match");assert.ok(r[0].score>r[1].score)});
test("recommendations exclude completed source",()=>assert.ok(recommendations(items).every(x=>x.item.status==="planned")));
test("mood picker is deterministic with injected RNG",()=>assert.equal(moodPick(items,"cozy",()=>0)?.id,"cozy book"));
test("unknown mood returns undefined",()=>assert.equal(moodPick(items,"angry",()=>0),undefined));
test("surprise excludes archived entries",()=>{const x=[item("hidden",{archived:true}),item("shown")];assert.equal(surprisePick(x,()=>0)?.id,"shown")});
test("exploration score stays in 0–100",()=>{const s=explorationScore(items);assert.ok(s.score>=0&&s.score<=100);assert.equal(s.types,1)});
test("franchise gap finds missing part two",()=>{const g=franchiseGaps(items);assert.deepEqual(g[0].missing,[2]);assert.equal(g[0].franchise,"Saga")});
test("creator marathon counts completion",()=>{const m=creatorMarathons(items).find(x=>x.name==="A Director")!;assert.equal(m.items.length,2);assert.equal(m.completed,1)});
test("blind spots returns bounded arrays",()=>{const b=blindSpots(items);assert.ok(b.genres.length<=8&&b.decades.length<=8&&b.countries.length<=8)});
console.log(`\n${passed} intelligence tests passed.`);
