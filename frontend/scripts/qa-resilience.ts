/** Structural regression gate for navigation history, route recovery, and corrupt-storage handling. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(__dirname,".."),read=(file:string)=>fs.readFileSync(path.join(root,file),"utf8");let passed=0;const check=(label:string,value:boolean)=>{assert.ok(value,label);passed++;console.log(`✓ ${label}`)};
const shell=read("app/AppShell.tsx"),store=read("lib/store.tsx"),banner=read("components/StorageErrorBanner.tsx"),recovery=read("components/DataRecoveryPanel.tsx");
check("Home navigation writes query history",shell.includes("router.push")&&shell.includes("?view=${next}"));
check("Home responds to back/forward search params",shell.includes("setView(current=>")&&shell.includes("[params]"));
check("App Router error boundary exists",read("app/error.tsx").includes("reset")&&read("app/error.tsx").includes("Data recovery"));
check("App Router loading shell exists",read("app/loading.tsx").includes('role="status"'));
check("Pages Router error fallback exists",read("pages/_error.tsx").includes("getInitialProps")&&read("pages/_error.tsx").includes("Retry"));
check("root persistence blocks corrupt-key writes",store.includes('reason:"corrupt"')&&store.includes("blocked.current"));
check("storage warning opens recovery",banner.includes("kaizen:data-recovery-open")&&recovery.includes("restoreBackup"));
check("whole-product recovery reloads only after valid restore",recovery.includes("parseBackup")&&recovery.includes("window.location.reload"));
console.log(`\n${passed} resilience checks passed.`);
