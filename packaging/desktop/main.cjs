#!/usr/bin/env node
/** Owns the native Kaizen window, dynamic loopback services, stable app origin, and shutdown lifecycle. The kaizen:// handler must bind to partition persist:kaizen, not the default session. Startup failures must show a window or error dialog instead of quitting silently. */
const {app,BrowserWindow,protocol,net:electronNet,shell,session,dialog}=require("electron");
const {spawn,spawnSync}=require("node:child_process");
const fs=require("node:fs"),http=require("node:http"),net=require("node:net"),path=require("node:path");
protocol.registerSchemesAsPrivileged([{scheme:"kaizen",privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const ROOT=path.resolve(__dirname,".."),APP_URL="kaizen://app/",children=[];let stopping=false,ready=false,failing=false;
app.setName("Kaizen");app.setPath("userData",path.join(app.getPath("appData"),"Kaizen"));
function stateFile(env=process.env){const home=env.LOCALAPPDATA||env.TEMP;if(!home)throw new Error("LOCALAPPDATA or TEMP is required");return path.join(home,"Kaizen","runtime.json")}
function redact(value){return String(value).replace(/[A-Z]:\\Users\\[^\\\s]+/gi,"%USERPROFILE%").replace(/one-time pairing code: \S+/g,"one-time pairing code: [REDACTED]").slice(0,800)}
function fail(error){
  if(failing)return;failing=true;
  const message=redact(error&&error.message||error);
  try{const dir=path.dirname(stateFile());fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"desktop-error.log"),`${new Date().toISOString()} ${message}\n`)}catch{}
  try{if(!process.argv.includes("--smoke-test"))dialog.showErrorBox("Kaizen failed to start",message)}catch{}
  console.error(`[kaizen-desktop] ${message}`);
  stopChildren();app.quit();
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
  child.once("exit",code=>{if(stopping)return;if(!ready)fail(new Error(`${path.basename(script)} exited before the window opened (${code??"unknown"})`));else app.quit()});
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
  session.fromPartition("persist:kaizen").protocol.handle("kaizen",async request=>{
    try{
      const incoming=new URL(request.url);
      if(incoming.hostname!=="app")return new Response("Not found",{status:404});
      if(request.method==="GET"&&incoming.pathname==="/api/desktop/pairing")return new Response(JSON.stringify({pairingCode}),{status:200,headers:{"content-type":"application/json","cache-control":"no-store"}});
      const target=`${internalOrigin}${incoming.pathname}${incoming.search}`,headers=new Headers(request.headers);
      for(const name of ["origin","host","referer","sec-fetch-site","sec-fetch-mode","sec-fetch-dest"])headers.delete(name);
      return await electronNet.fetch(target,{method:request.method,headers,body:["GET","HEAD"].includes(request.method)?undefined:request.body,redirect:"follow"});
    }catch(error){return new Response(redact(error&&error.message||error),{status:502})}
  });
  return{frontendPort,enginePort,logs:()=>`${engine.getLog()}\n${frontend.getLog()}`.replace(/one-time pairing code: \S+/g,"one-time pairing code: [REDACTED]")};
}
async function createWindow(){
  const window=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:680,show:true,backgroundColor:"#0a1022",icon:path.join(ROOT,"assets","kaizen.ico"),autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,partition:"persist:kaizen"}});
  window.webContents.setWindowOpenHandler(({url})=>{if(allowedExternal(url))shell.openExternal(url);return{action:"deny"}});
  window.webContents.on("will-navigate",(event,url)=>{if(!url.startsWith("kaizen://app/")){event.preventDefault();if(allowedExternal(url))shell.openExternal(url)}});
  window.webContents.on("did-fail-load",(_event,code,desc)=>{if(!ready&&!failing)fail(new Error(`Window failed to load (${code}): ${desc}`))});
  window.show();
  const runtime=await startRuntime();
  await window.loadURL(APP_URL);
  ready=true;
  try{const state=JSON.parse(fs.readFileSync(stateFile(),"utf8"));fs.writeFileSync(stateFile(),JSON.stringify({...state,desktopReady:true}))}catch{}
  if(process.argv.includes("--smoke-test")){console.log(`KAIZEN_DESKTOP_READY ${runtime.frontendPort} ${runtime.enginePort}`);setTimeout(()=>window.close(),1_500)}
  return window;
}
if(!app.requestSingleInstanceLock()){app.quit()}else{app.on("second-instance",()=>{const window=BrowserWindow.getAllWindows()[0];if(window){if(window.isMinimized())window.restore();window.focus()}});app.whenReady().then(createWindow).catch(fail);app.on("window-all-closed",()=>app.quit());app.on("before-quit",stopChildren)}
module.exports={APP_URL,allowedExternal,reservePort,stateFile,redact};
