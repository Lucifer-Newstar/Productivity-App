/** Disabled-by-default production-path runner for the I1 interpreter-model evaluation. */
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { freemem } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import type { GenerationChunk, GenerationProvider, GenerationRequest } from "../../../src/contracts/provider.js";
import { LlamaCppProvider } from "../../../src/providers/llamaCpp.js";
import { IntelligenceOrchestrator } from "../../../src/runtime/orchestrator.js";
import { parseAndValidateTodayInterpreter, validateDeterministicTodayRoute } from "../../../src/validation/schema.js";
import { sha256File } from "./fileHash.js";

interface LocalCandidate { id:string; modelPath:string; artifactSha256:string; license:string; licenseVerified:boolean; enabled:boolean }
interface LocalConfig { schemaVersion:number; executionEnabled:boolean; protocolId:string; runtime:{llamaServerPath:string;runtimeVersion:string;runtimeSha256:string;nvidiaSmiPath:string;endpoint:string;startupTimeoutMs:number;requestTimeoutMs:number;gpuLayers:number;threads:number;batchSize:number;ubatchSize:number};candidates:LocalCandidate[] }
interface CorpusCase { id:string;stratum:string;snapshotData:any;expected:{availableSourceIds:string[];requiredDeterministicSourceId:string|null;uncertaintyRequired:boolean;promptInjectionApplicable:boolean;forbiddenScopeApplicable:boolean} }
interface Corpus { corpusId:string;scenarioCount:number;repetitionsPerScenario:number;cases:CorpusCase[] }
interface Capture { request?:GenerationRequest;rawText:string;toolCalls:number;promptTokens?:number;outputTokens?:number;measuredInputTokens?:number }

const PHASE=resolve(dirname(fileURLToPath(import.meta.url)));
const RESULTS_ROOT=resolve(PHASE,"results-local");
const CORPUS_PATH=resolve(PHASE,"corpus.v1.json");
const MANIFEST_PATH=resolve(PHASE,"corpus.manifest.json");
const PROTOCOL_PATH=resolve(PHASE,"protocol.v1.json");
const AUTHORIZATION_PATH=resolve(PHASE,"authorization.v1.json");

function fail(code:string,message:string):never{const error=new Error(message) as Error&{code:string};error.code=code;throw error}
function sha256SmallFile(path:string):string{const hash=createHash("sha256");hash.update(readFileSync(path));return hash.digest("hex")}
async function exactHash(path:string,expected:string,label:string):Promise<void>{if(!existsSync(path)||!/^([a-f0-9]{64})$/i.test(expected))fail("IDENTITY_INVALID",`${label} path/hash is invalid`);const actual=await sha256File(path);if(actual.toLowerCase()!==expected.toLowerCase())fail("IDENTITY_INVALID",`${label} path/hash is invalid`)}
function literalLoopback(value:string):URL{let url:URL;try{url=new URL(value)}catch{return fail("ENDPOINT_INVALID","runtime endpoint is invalid")};if(url.protocol!=="http:"||url.hostname!=="127.0.0.1"||url.username||url.password||url.pathname!=="/"||url.search||url.hash)fail("ENDPOINT_INVALID","runtime endpoint must be literal-loopback HTTP with no path/query/credentials");return url}
function readJson<T>(path:string):T{return JSON.parse(readFileSync(path,"utf8").replace(/^\uFEFF/,"")) as T}
function args():Record<string,string|boolean>{const values:Record<string,string|boolean>={};for(let index=2;index<process.argv.length;index++){const item=process.argv[index]!;if(item.startsWith("--")){const key=item.slice(2),next=process.argv[index+1];if(next&&!next.startsWith("--")){values[key]=next;index++}else values[key]=true}}return values}
function delay(ms:number):Promise<void>{return new Promise(resolve=>setTimeout(resolve,ms))}
async function waitHealth(baseUrl:string,timeoutMs:number,child:ChildProcess):Promise<number>{const started=Date.now();while(Date.now()-started<timeoutMs){const spawnError=(child as ChildProcess&{spawnError?:Error}).spawnError;if(spawnError)fail("RUNTIME_START_FAILED",spawnError.message);if(child.exitCode!==null)fail("RUNTIME_EXITED",`llama-server exited with code ${child.exitCode}`);try{const response=await fetch(`${baseUrl}/health`,{signal:AbortSignal.timeout(2000)});if(response.ok)return Date.now()-started}catch{}await delay(250)}return fail("STARTUP_TIMEOUT","llama-server did not become ready")}
function portOpen(port:number):Promise<boolean>{return new Promise(resolve=>{const socket=connect({host:"127.0.0.1",port});socket.once("connect",()=>{socket.destroy();resolve(true)});socket.once("error",()=>resolve(false));socket.setTimeout(1000,()=>{socket.destroy();resolve(false)})})}
async function stopRuntime(child:ChildProcess,port:number):Promise<{shutdownMs:number;portReleased:boolean}>{const started=Date.now();if(child.exitCode===null&&child.pid){if(process.platform==="win32")spawnSync("taskkill",["/PID",String(child.pid),"/T","/F"],{stdio:"ignore"});else child.kill("SIGTERM")}for(let index=0;index<40&&child.exitCode===null;index++)await delay(250);if(child.exitCode===null&&child.pid)child.kill("SIGKILL");for(let index=0;index<40;index++){if(!(await portOpen(port)))return{shutdownMs:Date.now()-started,portReleased:true};await delay(250)}return{shutdownMs:Date.now()-started,portReleased:false}}
function processRamBytes(pid:number|undefined):number|null{if(!pid)return null;if(process.platform==="win32"){const result=spawnSync("powershell",["-NoProfile","-Command",`(Get-Process -Id ${pid}).WorkingSet64`],{encoding:"utf8",windowsHide:true});const value=Number(result.stdout.trim());return Number.isFinite(value)?value:null}try{const text=readFileSync(`/proc/${pid}/status`,"utf8"),match=text.match(/^VmRSS:\s+(\d+)\s+kB$/m);return match?Number(match[1])*1024:null}catch{return null}}
function telemetry(config:LocalConfig,child:ChildProcess):{systemAvailableBytes:number;processRamBytes:number|null;gpuMemoryUsedMiB:number|null;gpuTemperatureC:number|null;available:boolean}{const result=spawnSync(config.runtime.nvidiaSmiPath,["--query-gpu=memory.used,temperature.gpu","--format=csv,noheader,nounits"],{encoding:"utf8",windowsHide:true}),parts=result.status===0?result.stdout.trim().split(",").map(value=>Number(value.trim())):[];const gpuMemoryUsedMiB=Number.isFinite(parts[0])?parts[0]!:null,gpuTemperatureC=Number.isFinite(parts[1])?parts[1]!:null,processRam=processRamBytes(child.pid);return{systemAvailableBytes:freemem(),processRamBytes:processRam,gpuMemoryUsedMiB,gpuTemperatureC,available:gpuMemoryUsedMiB!==null&&gpuTemperatureC!==null&&processRam!==null}}

class CapturingProvider implements GenerationProvider{
  capture:Capture={rawText:"",toolCalls:0};
  constructor(private readonly inner:GenerationProvider,private readonly baseUrl:string){}
  reset():void{this.capture={rawText:"",toolCalls:0}}
  identity(){return this.inner.identity()} capabilities(){return this.inner.capabilities()} health(signal?:AbortSignal){return this.inner.health(signal)} generate(request:GenerationRequest,signal:AbortSignal){return this.inner.generate(request,signal)}
  async *stream(request:GenerationRequest,signal:AbortSignal):AsyncIterable<GenerationChunk>{
    this.capture.request=request;
    if(request.tools?.length)fail("PROVIDER_TOOLS_PRESENT","production request unexpectedly supplied provider tools");
    const text=request.messages.map(message=>`${message.role}: ${message.content}`).join("\n");
    const tokenized=await fetch(`${this.baseUrl}/tokenize`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({content:text,add_special:true}),signal});
    if(!tokenized.ok)fail("TOKENIZER_UNAVAILABLE",`tokenizer returned HTTP ${tokenized.status}`);
    const payload=await tokenized.json() as {tokens?:unknown[]};
    if(!Array.isArray(payload.tokens))fail("TOKENIZER_UNAVAILABLE","tokenizer response did not contain tokens");
    this.capture.measuredInputTokens=payload.tokens.length;
    if(payload.tokens.length>3072)fail("INPUT_BUDGET_EXCEEDED",`interpreter input measured ${payload.tokens.length} tokens`);
    for await(const chunk of this.inner.stream(request,signal)){
      if(chunk.type==="text-delta")this.capture.rawText+=chunk.text;
      else if(chunk.type==="tool-call")this.capture.toolCalls++;
      else if(chunk.type==="usage"){this.capture.promptTokens=chunk.promptTokens;this.capture.outputTokens=chunk.outputTokens}
      yield chunk;
    }
  }
}

function validateConfig(configPath:string,config:LocalConfig):{endpoint:URL;candidates:string[]}{
  if(basename(configPath).endsWith(".local.json")===false)fail("CONFIG_INVALID","configuration must use an ignored *.local.json filename");
  if(config.schemaVersion!==1||config.protocolId!=="I1-RUN-1")fail("CONFIG_INVALID","local configuration version/protocol mismatch");
  const endpoint=literalLoopback(config.runtime.endpoint),port=Number(endpoint.port);
  if(!Number.isInteger(port)||port<1024||port>65535)fail("CONFIG_INVALID","runtime port must be 1024-65535");
  const numeric=[config.runtime.startupTimeoutMs,config.runtime.requestTimeoutMs,config.runtime.gpuLayers,config.runtime.threads,config.runtime.batchSize,config.runtime.ubatchSize];
  if(numeric.some(value=>!Number.isInteger(value)||value<=0)||config.runtime.requestTimeoutMs>120000||config.runtime.startupTimeoutMs>300000)fail("CONFIG_INVALID","runtime numeric limits are invalid");
  const candidates=config.candidates.map(candidate=>candidate.id);
  if(candidates.join(",")!=="qwen3-4b-instruct-2507-q4km,phi-4-mini-instruct-q4km"||typeof config.executionEnabled!=="boolean"||config.candidates.some(candidate=>typeof candidate.enabled!=="boolean"))fail("CONFIG_INVALID","local candidate order or execution flags differ from I1-CANDIDATES-1");
  return{endpoint,candidates};
}

async function main():Promise<void>{
  const cli=args(),configPath=resolve(String(cli.config??"")),candidateId=String(cli.candidate??""),stage=String(cli.stage??"");
  if(!configPath||!candidateId||!["preflight","full"].includes(stage))fail("USAGE","runner requires --config, --candidate and --stage preflight|full");
  const config=readJson<LocalConfig>(configPath),{endpoint}=validateConfig(configPath,config),candidate=config.candidates.find(item=>item.id===candidateId),authorization=readJson<any>(AUTHORIZATION_PATH);
  if(!candidate)fail("CANDIDATE_INVALID","candidate is not in I1-CANDIDATES-1");
  if(authorization.authorizationId!=="I1-PREFLIGHT-AUTH-1"||authorization.protocolId!=="I1-RUN-1"||authorization.matrixId!=="I1-CANDIDATES-1"||authorization.candidateOrder?.join(",")!==config.candidates.map(item=>item.id).join(",")||authorization.stages?.[stage]!==true)fail("STAGE_NOT_AUTHORIZED",`${stage} execution is not authorized`);
  const acknowledged=cli.execute===true&&process.env.KAIZEN_I1_EXECUTION_ACK==="I1-RUN-1";
  if(!config.executionEnabled||!candidate.enabled||!acknowledged)fail("I1_EXECUTION_DISABLED","model execution remains disabled by config/candidate/acknowledgement gates");
  if(stage==="full"){
    const scorePath=resolve(String(cli["preflight-score"]??""));
    const score=scorePath?readJson<any>(scorePath):null;
    if(!score||score.stage!=="preflight"||score.candidateId!==candidateId||score.passed!==true)fail("PREFLIGHT_REQUIRED","a passing local preflight score is required before full execution");
  }
  if(!candidate.licenseVerified||!candidate.license.trim())fail("LICENSE_INVALID","candidate license is unresolved");
  await exactHash(config.runtime.llamaServerPath,config.runtime.runtimeSha256,"runtime");await exactHash(candidate.modelPath,candidate.artifactSha256,"model");if(!existsSync(config.runtime.nvidiaSmiPath))fail("TELEMETRY_INVALID","nvidia-smi path is unavailable");
  const manifest=readJson<any>(MANIFEST_PATH);if(manifest.sha256!==sha256SmallFile(CORPUS_PATH)||manifest.corpusId!=="I1-SYNTHETIC-1")fail("CORPUS_INVALID","frozen corpus hash does not match manifest");
  const protocol=readJson<any>(PROTOCOL_PATH),corpus=readJson<Corpus>(CORPUS_PATH),selected=stage==="preflight"?corpus.cases.filter(item=>protocol.dataset.preflightScenarioIds.includes(item.id)):corpus.cases;
  if(selected.length!==(stage==="preflight"?10:50))fail("CORPUS_INVALID","stage scenario coverage is incomplete");
  const runId=`${candidateId}-${stage}-${new Date().toISOString().replace(/[:.]/g,"-")}-${randomUUID().slice(0,8)}`,outputDir=resolve(RESULTS_ROOT,runId);mkdirSync(outputDir,{recursive:true});
  const log=createWriteStream(resolve(outputDir,"server.log"),{flags:"wx"}),port=Number(endpoint.port),runtimeArgs=["--model",candidate.modelPath,"--host","127.0.0.1","--port",String(port),"--ctx-size","4096","--n-gpu-layers",String(config.runtime.gpuLayers),"--threads",String(config.runtime.threads),"--batch-size",String(config.runtime.batchSize),"--ubatch-size",String(config.runtime.ubatchSize),"--jinja"];
  runtimeArgs.push("--parallel","1","--metrics");const child=spawn(config.runtime.llamaServerPath,runtimeArgs,{stdio:["ignore","pipe","pipe"],windowsHide:true});child.once("error",error=>{(child as ChildProcess&{spawnError?:Error}).spawnError=error});child.stdout?.pipe(log);child.stderr?.pipe(log);
  let lifecycle:any={};
  try{
    lifecycle.startupMs=await waitHealth(endpoint.origin,config.runtime.startupTimeoutMs,child);
    const llama=new LlamaCppProvider({baseUrl:endpoint.origin,modelId:candidate.id,runtimeVersion:config.runtime.runtimeVersion,maximumContextTokens:4096,maximumOutputTokens:512,nativeToolCalling:false}),provider=new CapturingProvider(llama,endpoint.origin),engine=new IntelligenceOrchestrator(provider,config.runtime.requestTimeoutMs),attemptsPath=resolve(outputDir,"attempts.local.jsonl");
    for(const scenario of selected){for(let repetition=1;repetition<=(stage==="preflight"?1:corpus.repetitionsPerScenario);repetition++){
      provider.reset();const requestId=`${scenario.id}-${repetition}`,started=Date.now(),telemetryBefore=telemetry(config,child);let response:any,error:any;
      const snapshot={contract:"core.today",contractVersion:"1.0",domain:"core",snapshotId:`${runId}:${scenario.id}:${repetition}`,revision:{installationEpoch:runId,domains:{core:repetition}},capturedAt:new Date().toISOString(),timezone:"UTC",sensitivity:"personal",trust:"kaizen-derived",data:scenario.snapshotData,analytics:[],redactions:[{field:"health",reason:"consent"}]};
      try{response=await engine.run({intent:"focus-today",localDate:scenario.snapshotData.localDate,permissions:{mode:"local",domains:["core","notifications"],healthConsent:false,tools:["get_today"]}},"i1-local",requestId,async request=>({requestId,callId:request.callId,status:"ok",snapshot}),()=>{},new AbortController().signal)}catch(caught){error={code:(caught as any)?.code??"UNCLASSIFIED",message:caught instanceof Error?caught.message:"unknown failure"}}
      const parsed=parseAndValidateTodayInterpreter(provider.capture.rawText),raw=parsed.value as any,available=new Set(scenario.expected.availableSourceIds),cited=raw?[...(raw.sourceIds??[]),...(raw.rationale??[]).flatMap((item:any)=>item.sourceIds??[])]:[],required=scenario.expected.requiredDeterministicSourceId;
      const automatic={routeContractValid:false,structuredValid:parsed.ok,modelToolCalls:provider.capture.toolCalls,sourceValid:parsed.ok&&cited.every((id:string)=>available.has(id)),deterministicPrecedenceValid:!required||(parsed.ok&&(raw.sourceIds??[]).includes(required)&&(raw.rationale??[]).some((item:any)=>item.kind==="deterministic-result"&&(item.sourceIds??[]).includes(required))),uncertaintyValid:!scenario.expected.uncertaintyRequired||(parsed.ok&&(raw.uncertainty??[]).length>0)};
      try{const envelope=provider.capture.request?JSON.parse(provider.capture.request.messages[1]?.content??"{}"):{};automatic.routeContractValid=validateDeterministicTodayRoute(envelope.route).ok&&provider.capture.request?.tools===undefined}catch{}
      const telemetryAfter=telemetry(config,child);appendFileSync(attemptsPath,JSON.stringify({schemaVersion:1,classification:"LOCAL-ONLY-RAW",attemptId:`blind-candidate::${scenario.id}::${repetition}`,candidateId,stage,scenarioId:scenario.id,stratum:scenario.stratum,repetition,status:response?"completed":"failed",durationMs:Date.now()-started,measuredInputTokens:provider.capture.measuredInputTokens,promptTokens:provider.capture.promptTokens,outputTokens:provider.capture.outputTokens,telemetryBefore,telemetryAfter,rawText:provider.capture.rawText,response,error,expected:scenario.expected,automatic})+"\n");
    }}
    writeFileSync(resolve(outputDir,"run.local.json"),JSON.stringify({schemaVersion:1,classification:"LOCAL-ONLY-RAW",runId,candidateId,stage,protocolId:"I1-RUN-1",matrixId:"I1-CANDIDATES-1",corpusId:corpus.corpusId,corpusSha256:manifest.sha256,runtimeSha256:config.runtime.runtimeSha256,artifactSha256:candidate.artifactSha256,lifecycle,attemptCount:selected.length*(stage==="preflight"?1:2)},null,2)+"\n");
  }finally{lifecycle={...lifecycle,...await stopRuntime(child,port)};log.end();writeFileSync(resolve(outputDir,"lifecycle.local.json"),JSON.stringify({classification:"LOCAL-ONLY-RAW",...lifecycle},null,2)+"\n")}
  console.log(`I1 run complete: ${runId}; LOCAL-ONLY output: ${outputDir}`);
}

main().catch(error=>{console.error(`${(error as any)?.code??"RUNNER_FAILED"}: ${error instanceof Error?error.message:"unknown error"}`);process.exitCode=2});
