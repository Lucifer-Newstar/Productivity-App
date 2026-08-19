#!/usr/bin/env node
/** Verifies the reference API refuses a non-loopback bind without a service key. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const child=spawn(process.execPath,["dist/server.js"],{cwd:root,env:{...process.env,HOST:"0.0.0.0",PORT:"4199",KAIZEN_API_KEY:""},stdio:["ignore","pipe","pipe"]});
let output="";child.stdout.on("data",chunk=>output+=chunk);child.stderr.on("data",chunk=>output+=chunk);
const result=await Promise.race([new Promise(resolve=>child.once("exit",code=>resolve(code))),new Promise(resolve=>setTimeout(()=>resolve("timeout"),5000))]);
if(result==="timeout")child.kill("SIGKILL");
assert.notEqual(result,"timeout","server unexpectedly stayed alive without a key");
assert.notEqual(result,0,"server unexpectedly accepted an unauthenticated network bind");
assert.match(output,/KAIZEN_API_KEY is required/);
console.log("✓ non-loopback startup without API key is rejected");
