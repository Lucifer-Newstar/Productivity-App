#!/usr/bin/env node
/** Owns the native Kaizen window, dynamic loopback services and shutdown lifecycle. The frontend is bound only to a dynamic 127.0.0.1 origin; startup failures must keep the window open with a visible error instead of quitting. */
const {app,BrowserWindow,shell,dialog}=require("electron");
const {spawn,spawnSync}=require("node:child_process");
const fs=require("node:fs"),http=require("node:http"),net=require("node:net"),path=require("node:path");
const ROOT=path.resolve(__dirname,".."),children=[];let stopping=false,ready=false,failing=false;
app.setName("Kaizen");app.setPath("userData",path.join(app.getPath("appData"),"Kaizen"));
// Some Windows GPU/driver combinations abort Chromium while creating the first
// native window (before JavaScript can surface an error). Kaizen's local UI
// does not require hardware compositing, so prefer reliable software rendering.
app.disableHardwareAcceleration();
function kaizenDir(env=process.env){const home=env.LOCALAPPDATA||env.TEMP;if(!home)throw new Error("LOCALAPPDATA or TEMP is required");return path.join(home,"Kaizen")}
function stateFile(env=process.env){return path.join(kaizenDir(env),"runtime.json")}
function errorLogFile(env=process.env){return path.join(kaizenDir(env),"desktop-error.log")}
function redact(value){return String(value).replace(/[A-Z]:\\Users\\[^\\\s]+/gi,"%USERPROFILE%").replace(/one-time pairing code: \S+/g,"one-time pairing code: [REDACTED]").slice(0,800)}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function writeErrorLog(message){
  const line=`${new Date().toISOString()} ${redact(message)}\n`;
  const file=errorLogFile();
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.appendFileSync(file,line);
}
function fail(error){
  if(failing)return;failing=true;
  const message=redact(error&&error.message||error);
  try{writeErrorLog(message)}catch{}
  console.error(`[kaizen-desktop] ${message}`);
  stopChildren();
  const window=BrowserWindow.getAllWindows().find(item=>!item.isDestroyed());
  if(window){
    window.show();
    if(window.isMinimized())window.restore();
    const html=`<!doctype html><html><body style="margin:0;background:#0a1022;color:#e8eefc;font-family:Segoe UI,sans-serif;padding:48px"><h1 style="font-size:28px">Kaizen failed to start</h1><p style="max-width:720px;line-height:1.5">${escapeHtml(message)}</p><p style="opacity:.8">A redacted log is in %LOCALAPPDATA%\\Kaizen\\desktop-error.log. Close this window after you have read the message.</p></body></html>`;
    window.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(html)).catch(()=>{});
    return;
  }
  try{if(!process.argv.includes("--smoke-test"))dialog.showErrorBox("Kaizen failed to start",message)}catch{}
}
function reservePort(){return new Promise((resolve,reject)=>{const server=net.createServer();server.once("error",reject);server.listen(0,"127.0.0.1",()=>{const address=server.address(),port=typeof address==="object"&&address?address.port:0;server.close(error=>error?reject(error):resolve(port))})})}
function waitFor(url,timeout=30_000){const end=Date.now()+timeout;return new Promise((resolve,reject)=>{const attempt=()=>{const request=http.get(url,{timeout:1_000},response=>{response.resume();response.statusCode&&response.statusCode<500?resolve():retry()});request.once("timeout",()=>request.destroy());request.once("error",retry)};const retry=()=>Date.now()>=end?reject(new Error(`Timed out waiting for ${url}`)):setTimeout(attempt,200);attempt()})}
function startNode(script,cwd,env){
  const executable=path.join(ROOT,"runtime","node","node.exe");
  if(!fs.existsSync(executable))throw new Error("Bundled Node runtime is missing");
  if(!fs.existsSync(script))throw new Error(`Required service is missing: ${path.basename(script)}`);
  const child=spawn(executable,[script],{cwd,env:{...process.env,...env},stdio:["ignore","pipe","pipe"],windowsHide:true});
  let log="";const collect=chunk=>{log=(log+chunk.toString()).slice(-20_000)};
  child.stdout.on("data",collect);child.stderr.on("data",collect);children.push(child);
  child.on("error",error=>{if(!stopping)fail(error)});
  child.once("exit",code=>{if(stopping||failing)return;fail(new Error(`${path.basename(script)} stopped (${code??"unknown"}). Close this window and launch Kaizen again.`))});
  return{child,getLog:()=>log};
}
function stopChildren(){if(stopping)return;stopping=true;for(const child of [...children].reverse()){if(!child.pid)continue;try{if(process.platform==="win32")spawnSync("taskkill.exe",["/PID",String(child.pid),"/T","/F"],{stdio:"ignore",windowsHide:true});else child.kill("SIGTERM")}catch{}}try{fs.rmSync(stateFile(),{force:true})}catch{}}
function allowedExternal(url){try{const parsed=new URL(url);return parsed.protocol==="https:"&&parsed.hostname==="github.com"&&parsed.pathname.startsWith("/Lucifer-Newstar/Productivity-App/")}catch{return false}}
async function startRuntime(){
  const frontendPort=await reservePort(),enginePort=await reservePort(),internalOrigin=`http://127.0.0.1:${frontendPort}`,engineUrl=`http://127.0.0.1:${enginePort}`;
  const common={KAIZEN_AI_GATEWAY_URL:engineUrl,KAIZEN_AI_PROXY_ORIGIN:internalOrigin,KAIZEN_AI_ORIGINS:internalOrigin};
  const engine=startNode(path.join(ROOT,"intelligence","dist","src","server.js"),path.join(ROOT,"intelligence"),{...common,KAIZEN_AI_HOST:"127.0.0.1",KAIZEN_AI_PORT:String(enginePort),KAIZEN_AI_PROVIDER:"mock"});
  const frontend=startNode(path.join(ROOT,"frontend","server.js"),path.join(ROOT,"frontend"),{...common,NODE_ENV:"production",HOSTNAME:"127.0.0.1",PORT:String(frontendPort),KAIZEN_LOCAL_PACKAGE:"1"});
  await Promise.all([waitFor(`${internalOrigin}/`),waitFor(`${engineUrl}/health`)]);
  const pairingDeadline=Date.now()+10_000;let pairingCode;while(Date.now()<pairingDeadline&&!pairingCode){pairingCode=engine.getLog().match(/one-time pairing code: (\S+)/)?.[1];if(!pairingCode)await new Promise(resolve=>setTimeout(resolve,50))}if(!pairingCode)throw new Error("Engine pairing code was unavailable");
  const runtimePath=stateFile();fs.mkdirSync(path.dirname(runtimePath),{recursive:true});fs.writeFileSync(runtimePath,JSON.stringify({version:2,desktopPid:process.pid,frontendPid:frontend.child.pid,enginePid:engine.child.pid,frontendPort,enginePort,startedAt:new Date().toISOString()}));
  return{frontendPort,enginePort,internalOrigin,logs:()=>`${engine.getLog()}\n${frontend.getLog()}`.replace(/one-time pairing code: \S+/g,"one-time pairing code: [REDACTED]")};
}
async function createWindow(){
  let appUrl="";
  const window=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,show:true,backgroundColor:"#0a1022",icon:path.join(ROOT,"assets","kaizen.ico"),autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,partition:"persist:kaizen"}});
  window.webContents.setWindowOpenHandler(({url})=>{if(allowedExternal(url))shell.openExternal(url);return{action:"deny"}});
  window.webContents.on("will-navigate",(event,url)=>{if(url.startsWith("data:text/html"))return;if(!appUrl||!url.startsWith(appUrl)){event.preventDefault();if(allowedExternal(url))shell.openExternal(url)}});
  window.webContents.on("did-fail-load",(_event,code,desc,url)=>{if(ready||failing||code===-3||String(url||"").startsWith("data:"))return;fail(new Error(`Window failed to load (${code}): ${desc}`))});
  window.show();
  const runtime=await startRuntime();
  if(failing)return window;
  appUrl=runtime.internalOrigin;
  let loadTimer;
  try{
    await Promise.race([
      window.loadURL(appUrl),
      new Promise((_,reject)=>{loadTimer=setTimeout(()=>reject(new Error("Timed out loading the local Kaizen app. See %LOCALAPPDATA%\\Kaizen\\desktop-error.log")),20_000)})
    ]);
  }finally{clearTimeout(loadTimer)}
  if(failing)return window;
  ready=true;
  try{const state=JSON.parse(fs.readFileSync(stateFile(),"utf8"));fs.writeFileSync(stateFile(),JSON.stringify({...state,desktopReady:true}))}catch{}
  if(process.argv.includes("--smoke-test")){console.log(`KAIZEN_DESKTOP_READY ${runtime.frontendPort} ${runtime.enginePort}`);setTimeout(()=>window.close(),1_500)}
  return window;
}
if(!app.requestSingleInstanceLock()){app.quit()}else{app.on("second-instance",()=>{const window=BrowserWindow.getAllWindows()[0];if(window){if(window.isMinimized())window.restore();window.focus()}});app.whenReady().then(createWindow).catch(fail);app.on("window-all-closed",()=>app.quit());app.on("before-quit",stopChildren)}
module.exports={allowedExternal,reservePort,stateFile,errorLogFile,redact};
