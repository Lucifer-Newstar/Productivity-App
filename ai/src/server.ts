import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { createEngineGateway } from "./gateway.js";

export function startEngine(): ReturnType<typeof createEngineGateway> {
  const config = loadConfig(), gateway = createEngineGateway(config);
  gateway.server.listen(config.port, config.host, () => {
    // Pairing code is intentionally local console output. Never persist or include it in reports.
    console.log(`[kaizen-ai] listening on http://${config.host}:${config.port}`);
    console.log("[kaizen-ai] mode: deterministic Core Today baseline; model providers disabled");
    console.log(`[kaizen-ai] one-time pairing code: ${gateway.pairingCode}`);
  });
  const shutdown = () => gateway.server.close(() => process.exit(0));
  process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
  return gateway;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) startEngine();
