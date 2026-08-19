#!/usr/bin/env node
/** Starts the packaged loopback services, opens Kaizen, and owns their lifecycle. */
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const APP_URL = "http://127.0.0.1:3000";
const ENGINE_URL = "http://127.0.0.1:4317/health";

function packageRoot(scriptDirectory = __dirname) { return path.resolve(scriptDirectory, ".."); }
function runtimeFile(env = process.env) {
  const home = env.LOCALAPPDATA || env.TEMP;
  if (!home) throw new Error("LOCALAPPDATA or TEMP is required");
  return path.join(home, "Kaizen", "runtime.json");
}
function portAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => { const server = net.createServer(); server.once("error", () => resolve(false)); server.listen(port, host, () => server.close(() => resolve(true))); });
}
function waitFor(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, { timeout: 1_000 }, (response) => { response.resume(); response.statusCode && response.statusCode < 500 ? resolve() : retry(); });
      req.once("timeout", () => req.destroy()); req.once("error", retry);
    };
    const retry = () => Date.now() >= deadline ? reject(new Error(`Timed out waiting for ${url}`)) : setTimeout(attempt, 250);
    attempt();
  });
}
function openBrowser(url) { const child = spawn("cmd.exe", ["/d", "/s", "/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }); child.unref(); }

async function main() {
  if (process.platform !== "win32") throw new Error("The packaged launcher supports Windows only");
  if (!(await portAvailable(3000)) || !(await portAvailable(4317))) throw new Error("Kaizen cannot start because port 3000 or 4317 is already in use");
  const root = packageRoot(), node = path.join(root, "runtime", "node", "node.exe");
  const engineDirectory = path.join(root, "intelligence"), frontendDirectory = path.join(root, "frontend");
  const common = { KAIZEN_AI_GATEWAY_URL: "http://127.0.0.1:4317", KAIZEN_AI_PROXY_ORIGIN: APP_URL, KAIZEN_AI_ORIGINS: APP_URL };
  const engine = spawn(node, [path.join(engineDirectory, "dist", "src", "server.js")], { cwd: engineDirectory, env: { ...process.env, ...common, KAIZEN_AI_HOST: "127.0.0.1", KAIZEN_AI_PORT: "4317", KAIZEN_AI_PROVIDER: "mock" }, stdio: "inherit", windowsHide: false });
  const frontend = spawn(node, [path.join(frontendDirectory, "server.js")], { cwd: frontendDirectory, env: { ...process.env, ...common, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3000", KAIZEN_LOCAL_PACKAGE: "1" }, stdio: "inherit", windowsHide: false });
  const statePath = runtimeFile(); fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({ version: 1, launcherPid: process.pid, frontendPid: frontend.pid, enginePid: engine.pid, root, startedAt: new Date().toISOString() }));
  let stopping = false;
  const stop = (code = 0) => { if (stopping) return; stopping = true; for (const child of [frontend, engine]) { try { child.kill(); } catch {} } try { fs.unlinkSync(statePath); } catch {} setTimeout(() => process.exit(code), 750).unref(); };
  process.once("SIGINT", () => stop(0)); process.once("SIGTERM", () => stop(0));
  frontend.once("exit", (code) => { if (!stopping) stop(code || 1); }); engine.once("exit", (code) => { if (!stopping) stop(code || 1); });
  await Promise.all([waitFor(APP_URL), waitFor(ENGINE_URL)]); openBrowser(APP_URL);
  console.log("Kaizen is running locally. Keep this window open; press Ctrl+C to stop.");
}

if (require.main === module) main().catch((error) => { console.error(`[kaizen] ${error.message}`); process.exitCode = 1; });
module.exports = { APP_URL, ENGINE_URL, packageRoot, portAvailable, runtimeFile, waitFor };
