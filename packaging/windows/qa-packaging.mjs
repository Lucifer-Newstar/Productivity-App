#!/usr/bin/env node
/** Static and executable contract checks for the Windows local-v1 package. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"../.."),read=(p)=>fs.readFileSync(path.join(root,p),"utf8"),require=createRequire(import.meta.url);
let passed=0;const test=(name,fn)=>{fn();passed++;console.log(`  ✓ ${name}`)};
const build=read("packaging/windows/build-portable.ps1"),installer=read("packaging/windows/installer.iss"),launcherSource=read("packaging/windows/runtime/launcher.cjs"),stopSource=read("packaging/windows/runtime/stop.cjs"),nextConfig=read("frontend/next.config.js");
const launcher=require("./runtime/launcher.cjs"),stop=require("./runtime/stop.cjs");
console.log("\n── Windows packaging contracts ──");
test("frontend emits standalone server",()=>assert.ok(nextConfig.includes('output: "standalone"')));
test("local package keeps HTTP loopback usable",()=>assert.ok(nextConfig.includes("KAIZEN_LOCAL_PACKAGE")&&!nextConfig.includes("isDev ? [] : [\"upgrade-insecure-requests\"]")));
test("portable build pins Node download and SHA-256",()=>assert.ok(build.includes("node-v$nodeVersion-win-x64.zip")&&build.includes("be72284c7bc62de07d5a9fd0ae196879842c085f11f7f2b60bf8864c0c9d6a4f")&&build.includes("Get-FileHash")));
test("portable build uses lockfiles and production dependencies",()=>assert.ok(build.includes('@("ci")')&&build.includes('"--omit=dev"')&&build.includes('"--ignore-scripts"')));
test("package excludes reference API",()=>assert.ok(!build.includes('Join-Path $root "backend')&&!installer.includes("backend")));
test("launcher fixes both services to loopback",()=>assert.ok(launcherSource.includes('KAIZEN_AI_HOST: "127.0.0.1"')&&launcherSource.includes('HOSTNAME: "127.0.0.1"')));
test("launcher fixes expected ports and deterministic provider",()=>assert.ok(launcherSource.includes('PORT: "3000"')&&launcherSource.includes('KAIZEN_AI_PORT: "4317"')&&launcherSource.includes('KAIZEN_AI_PROVIDER: "mock"')));
test("launcher rejects occupied ports",()=>assert.ok(launcherSource.includes("port 3000 or 4317 is already in use")));
test("launcher uses stable browser origin",()=>assert.equal(launcher.APP_URL,"http://127.0.0.1:3000"));
test("runtime state stays in per-user local data",()=>assert.equal(path.basename(launcher.runtimeFile({LOCALAPPDATA:"C:/Local"})),"runtime.json"));
test("stop rejects unsafe process identifiers",()=>{assert.equal(stop.validPid(-1),false);assert.equal(stop.validPid("12"),false);assert.equal(stop.validPid(42),true)});
test("installer is per-user and x64",()=>assert.ok(installer.includes("PrivilegesRequired=lowest")&&installer.includes("ArchitecturesAllowed=x64compatible")));
test("uninstaller stops services without deleting browser data",()=>assert.ok(installer.includes("[UninstallRun]")&&!installer.includes("UserData")&&!installer.includes("LOCALAPPDATA\\Kaizen")));
test("portable and installer emit checksums",()=>assert.ok(build.includes('"$zip.sha256"')&&read("packaging/windows/build-installer.ps1").includes('"$setup.sha256"')));
test("no model or cloud runtime is packaged",()=>assert.ok(!build.includes("gguf")&&!build.includes("llama")&&!build.includes("docker")));
console.log(`\n${passed} packaging checks passed.`);
