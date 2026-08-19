/** Regression tests for local-calendar keys and history-derived habit streaks. */
import assert from "node:assert/strict";
import { addLocalDays, dateFromLocalKey, localDateKey } from "../lib/localDate";
import { habitStreak, normalizedHabitHistory } from "../lib/habitTracking";
import { wilks } from "../lib/workoutGym";

process.env.TZ="Asia/Kolkata";
let passed=0;const check=(label:string,condition:boolean)=>{assert.ok(condition,label);passed++;console.log(`✓ ${label}`)};
const boundary=new Date("2026-08-18T19:00:00.000Z");
check("IST evening UTC boundary maps to next local day",localDateKey(boundary)==="2026-08-19");
check("local date parser does not use UTC midnight",dateFromLocalKey("2026-08-19")?.getDate()===19);
check("invalid calendar date is rejected",dateFromLocalKey("2026-02-30")===null);
check("local day arithmetic crosses month",localDateKey(addLocalDays(new Date(2026,0,31),1))==="2026-02-01");
const now=new Date(2026,7,19,12);
check("today plus two prior days yields streak three",habitStreak(["2026-08-17","2026-08-18","2026-08-19"],now)===3);
check("unfinished today preserves yesterday streak",habitStreak(["2026-08-17","2026-08-18"],now)===2);
check("gap breaks streak",habitStreak(["2026-08-16","2026-08-18","2026-08-19"],now)===2);
check("unchecking today recalculates rather than increments",habitStreak(["2026-08-17","2026-08-18"],now)===2);
check("history migration removes invalid and duplicate dates",JSON.stringify(normalizedHabitHistory(["2026-08-19","bad","2026-08-19"]))===JSON.stringify(["2026-08-19"]));
check("Wilks uses an entered three-lift total",wilks(70,450,false)>0&&wilks(70,0,false)===0);
console.log(`\n${passed} core correctness checks passed.`);
