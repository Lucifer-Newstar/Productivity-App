/** Executable and structural regression gate for packaged update delivery and in-place setup upgrades. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { compareVersions, parseVersion, releaseDownloadUrl, safeNotificationHref, setupAssetName } from "../lib/update";
const root=path.resolve(__dirname,"../.."),read=(p:string)=>fs.readFileSync(path.join(root,p),"utf8");let passed=0;const test=(name:string,fn:()=>void)=>{fn();passed++;console.log(`  ✓ ${name}`)};
console.log("\n── Packaged update contracts ──");
test("strict semantic versions accepted",()=>{assert.deepEqual(parseVersion("1.2.3"),[1,2,3]);assert.equal(parseVersion("1.2.3-beta"),null)});
test("semantic comparison handles each component",()=>{assert.ok(compareVersions("1.1.0","1.0.9")>0);assert.ok(compareVersions("2.0.0","1.99.99")>0);assert.equal(compareVersions("1.0.0","1.0.0"),0)});
test("setup asset name is deterministic",()=>assert.equal(setupAssetName("1.2.3"),"Kaizen-1.2.3-win-x64-setup.exe"));
test("download URL is fixed to official repository",()=>assert.equal(releaseDownloadUrl("1.2.3"),"https://github.com/Lucifer-Newstar/Productivity-App/releases/download/v1.2.3/Kaizen-1.2.3-win-x64-setup.exe"));
test("notification links permit local route only",()=>{assert.equal(safeNotificationHref("/api/update/download?version=1.2.3"),"/api/update/download?version=1.2.3");assert.equal(safeNotificationHref("https://evil.example/update.exe"),undefined);assert.equal(safeNotificationHref("javascript:alert(1)"),undefined)});
const route=read("frontend/app/api/update/route.ts"),redirect=read("frontend/app/api/update/download/route.ts"),checker=read("frontend/components/UpdateChecker.tsx"),installer=read("packaging/windows/installer.iss"),stage=read("packaging/windows/stage-package.ps1");
test("release check uses fixed GitHub endpoint and exact asset",()=>assert.ok(route.includes("api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest")&&route.includes("verified setup asset unavailable")));
test("redirect accepts strict version and fixed download URL",()=>assert.ok(redirect.includes("releaseDownloadUrl(version)")&&redirect.includes("INVALID_VERSION")));
test("checker creates one version-keyed system notification",()=>assert.ok(checker.includes("sourceKey:`update:${status.latestVersion}`")&&checker.includes("section:\"system\"")&&checker.includes("Browser data is preserved")));
test("update channel is enabled only for packaged build",()=>assert.ok(stage.includes('$env:KAIZEN_UPDATE_CHANNEL=\"github\"')&&stage.includes("does not match frontend package")));
test("same AppId setup stops running installation before upgrade",()=>assert.ok(installer.includes("UsePreviousAppDir=yes")&&installer.includes("PrepareToInstall")&&installer.includes("stop-kaizen.cmd")));
console.log(`\n${passed} update checks passed.`);
