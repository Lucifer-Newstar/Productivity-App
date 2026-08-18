/** Regression gate for qa security contracts. */
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { csvCell,safeExternalUrl,safeImageDataUrl,safeProxiedImageUrl } from "../lib/security";
import { migrateEntertainment } from "../lib/entertainmentTypes";
import { guardEntertainmentRequest } from "../app/api/entertainment/_guard";
let passed=0;const test=async(name:string,fn:()=>void|Promise<void>)=>{await fn();passed++;console.log(`  ✓ ${name}`)};
async function main(){
console.log("\n── Frontend security regression ──");
await test("URL schemes restricted to HTTP(S)",()=>{assert.equal(safeExternalUrl("javascript:alert(1)"),null);assert.equal(safeExternalUrl("data:text/html,x"),null);assert.ok(safeExternalUrl("https://example.com"))});
await test("CSV formula injection neutralized",()=>{assert.ok(csvCell("=CMD() ").includes("'=CMD"));assert.ok(csvCell("  @SUM(A1)").includes("'  @"))});
await test("persisted image validator rejects SVG and HTML",()=>{assert.equal(safeImageDataUrl("data:image/svg+xml;base64,PHN2Zz4="),undefined);assert.equal(safeImageDataUrl("data:text/html;base64,PGgxPg=="),undefined)});
await test("persisted image validator accepts bounded raster",()=>assert.equal(safeImageDataUrl("data:image/png;base64,AAAA"),"data:image/png;base64,AAAA"));
await test("remote cover must use fixed same-origin proxy shape",()=>{assert.equal(safeProxiedImageUrl("https://evil.example/x.jpg"),undefined);assert.ok(safeProxiedImageUrl("/api/entertainment/image?url=https%3A%2F%2Fimage.tmdb.org%2Fx.jpg"))});
await test("backup migration strips malicious image sources",()=>{const state=migrateEntertainment({items:[{id:"x",type:"movie",title:"x",genres:[],creators:[],cast:[],studios:[],countries:[],status:"planned",progress:{},repeats:0,priority:"medium",queueOrder:1,tags:[],favorite:false,archived:false,coverDataUrl:"data:image/svg+xml;base64,PHN2Zz4=",coverUrl:"https://evil.example/x",createdAt:1,updatedAt:1}],fanArt:[{id:"a",itemId:"x",title:"bad",imageDataUrl:"data:text/html;base64,WA==",createdAt:1}]} as any);assert.equal(state.items[0].coverDataUrl,undefined);assert.equal(state.items[0].coverUrl,undefined);assert.equal(state.fanArt.length,0)});
await test("cross-site catalogue requests rejected",async()=>{const result=guardEntertainmentRequest(new NextRequest("http://localhost/api",{headers:{"sec-fetch-site":"cross-site"}}),"qa-cross",1);assert.equal(result?.status,403)});
await test("catalogue limiter returns 429 and bounded retry",async()=>{const request=new NextRequest("http://localhost/api",{headers:{"x-real-ip":"192.0.2.10"}});assert.equal(guardEntertainmentRequest(request,"qa-limit",1),null);const result=guardEntertainmentRequest(request,"qa-limit",1);assert.equal(result?.status,429);assert.equal(result?.headers.get("retry-after"),"60")});
console.log(`\n${passed} frontend security tests passed.`);
}
main().catch(error=>{console.error(error);process.exit(1)});
