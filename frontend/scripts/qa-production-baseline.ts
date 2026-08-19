/** Production-baseline checks that separate empty user history from product catalogs. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FRESH_PROFILE_COUNTS } from "../lib/store";
import { migrateEntertainment, SEED_ENTERTAINMENT } from "../lib/entertainmentTypes";

let passed=0;const check=(label:string,condition:boolean)=>{assert.ok(condition,label);passed++;console.log(`✓ ${label}`)};
const personalKeys=["tasks","notes","careerRoadmaps","careerAchievements","forgeProjects","workoutPRs","workoutSkills","workoutBoard","workoutKanbanCards","entertainmentItems"] as const;
check("fresh profile contains no fabricated personal records",personalKeys.every(key=>FRESH_PROFILE_COUNTS[key]===0));
check("exercise catalog remains available",FRESH_PROFILE_COUNTS.exerciseCatalog>0);
check("routine templates remain available",FRESH_PROFILE_COUNTS.routineTemplates>0);
check("calisthenics templates remain available without achievements",FRESH_PROFILE_COUNTS.calisthenicsTemplates>0);
check("Entertainment fresh state is empty",SEED_ENTERTAINMENT.items.length===0);
const existing:any={...SEED_ENTERTAINMENT,items:[{id:"kept",type:"book",title:"Existing",genres:[],creators:[],cast:[],studios:[],status:"planned",progress:{},repeats:0,priority:"low",queueOrder:0,tags:[],favorite:false,archived:false,createdAt:1,updatedAt:1}]};
check("Entertainment migration preserves existing user records",migrateEntertainment(existing).items[0]?.id==="kept");
const root=path.resolve(__dirname,"..");const habits=fs.readFileSync(path.join(root,"components/Habits.tsx"),"utf8"),setup=fs.readFileSync(path.join(root,"components/NotificationCenter.tsx"),"utf8"),store=fs.readFileSync(path.join(root,"lib/store.tsx"),"utf8"),career=fs.readFileSync(path.join(root,"components/career/sections/GlobalSection.tsx"),"utf8"),forge=fs.readFileSync(path.join(root,"components/forge/sections/FoundrySection.tsx"),"utf8"),workout=["OverviewContent.tsx","WorkoutGlobal.tsx","WorkoutGym.tsx","WorkoutPRs.tsx","WorkoutCalisthenics.tsx"].map(file=>fs.readFileSync(path.join(root,"components/workout",file),"utf8")).join("\n");
check("fresh habits are empty",habits.includes("const seed: Habit[] = [];"));
check("setup requires logged workout data rather than template routines",setup.includes('"Workout logged"')&&!setup.includes('"Routine created"'));
check("demo mutators fail closed in production",["seedForgeDemo","seedCareerDemo","seedDemoData"].every(name=>store.includes(`const ${name}`))&&store.match(/if\(!DEMO_TOOLS_ENABLED\)return;/g)?.length===3);
check("Career and Forge demo controls are explicitly gated",career.includes("DEMO_TOOLS_ENABLED&&")&&forge.includes("DEMO_TOOLS_ENABLED &&"));
check("Workout demo controls are explicitly gated",workout.includes("DEMO_TOOLS_ENABLED&&"));
console.log(`\n${passed} production baseline checks passed.`);
