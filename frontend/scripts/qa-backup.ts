/** Whole-product backup/restore security, completeness, and rollback tests. */
import assert from "node:assert/strict";
import { AUTHORITATIVE_KEYS,createBackup,parseBackup,restoreBackup,type StorageLike } from "../lib/backup";
class MemoryStorage implements StorageLike{data=new Map<string,string>();failOnce="";getItem(key:string){return this.data.get(key)??null}setItem(key:string,value:string){if(this.failOnce===key){this.failOnce="";throw new Error("quota")};this.data.set(key,value)}removeItem(key:string){this.data.delete(key)}}
let passed=0;const check=(label:string,condition:boolean)=>{assert.ok(condition,label);passed++;console.log(`✓ ${label}`)};
const source=new MemoryStorage();source.setItem("kaizen.tasks",JSON.stringify([{id:"t1",title:"Keep me"}]));source.setItem("kaizen.health",JSON.stringify({sleep:[]}));source.setItem("kaizen.theme","light");source.setItem("kaizen.ai.session","must-not-export");
const backup=createBackup(source,new Date("2026-08-19T00:00:00Z")),text=JSON.stringify(backup);
check("backup contains every authoritative key",Object.keys(backup.data).length===AUTHORITATIVE_KEYS.length&&AUTHORITATIVE_KEYS.every(key=>key in backup.data));
check("backup excludes AI session credentials",!text.includes("must-not-export")&&!text.includes("kaizen.ai.session"));
const parsed=parseBackup(text);check("valid backup parses",parsed.data["kaizen.tasks"]===source.getItem("kaizen.tasks"));
const target=new MemoryStorage();target.setItem("kaizen.notes","old");restoreBackup(target,parsed);check("restore replaces and removes authoritative keys",target.getItem("kaizen.tasks")===source.getItem("kaizen.tasks")&&target.getItem("kaizen.notes")===null&&target.getItem("kaizen.theme")==="light");
const unknown=JSON.parse(text);unknown.data["kaizen.unknown"]="{}";assert.throws(()=>parseBackup(JSON.stringify(unknown)),/keys do not match/);passed++;console.log("✓ unknown backup keys rejected");
const unsafe=JSON.parse(text);unsafe.data["kaizen.tasks"]='{"__proto__":{"polluted":true}}';assert.throws(()=>parseBackup(JSON.stringify(unsafe)),/unsafe object key/);passed++;console.log("✓ unsafe nested JSON rejected");
const badTheme=JSON.parse(text);badTheme.data["kaizen.theme"]="blue";assert.throws(()=>parseBackup(JSON.stringify(badTheme)),/theme is invalid/);passed++;console.log("✓ invalid theme rejected");
const rollback=new MemoryStorage();rollback.setItem("kaizen.tasks","original-tasks");rollback.setItem("kaizen.health","original-health");rollback.failOnce="kaizen.health";assert.throws(()=>restoreBackup(rollback,parsed),/quota/);check("failed restore rolls prior writes back",rollback.getItem("kaizen.tasks")==="original-tasks"&&rollback.getItem("kaizen.health")==="original-health");
console.log(`\n${passed} backup and recovery checks passed.`);
