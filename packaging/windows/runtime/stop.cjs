#!/usr/bin/env node
/** Stops only the process tree recorded by the packaged Kaizen launcher. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
function statePath(env = process.env) { const home = env.LOCALAPPDATA || env.TEMP; if (!home) throw new Error("LOCALAPPDATA or TEMP is required"); return path.join(home, "Kaizen", "runtime.json"); }
function validPid(value) { return Number.isSafeInteger(value) && value > 0 && value !== process.pid; }
function main() {
  const file = statePath(); if (!fs.existsSync(file)) { console.log("Kaizen is not recorded as running."); return; }
  const state = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const pid of [state.frontendPid, state.enginePid, state.launcherPid]) if (validPid(pid)) spawnSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  fs.rmSync(file, { force: true }); console.log("Kaizen stopped.");
}
if (require.main === module) { try { main(); } catch (error) { console.error(`[kaizen] ${error.message}`); process.exitCode = 1; } }
module.exports = { statePath, validPid };
