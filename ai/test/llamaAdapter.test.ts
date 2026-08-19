/** Regression coverage for the llama Adapter.test Intelligence Engine boundary. */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { LlamaCppProvider } from "../src/providers/llamaCpp.js";

function sse(response:any,event:unknown){response.write(`data: ${JSON.stringify(event)}\n\n`)}
test("llama.cpp adapter uses canonical schema and parses streamed tool/text output",async()=>{
 let calls=0;const bodies:any[]=[];const server=createServer(async(req,res)=>{
  if(req.url==="/health"){res.writeHead(200,{"content-type":"application/json"});res.end('{"status":"ok"}');return}
  if(req.url!=="/v1/chat/completions"){res.writeHead(404).end();return}
  const chunks=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));bodies.push(JSON.parse(Buffer.concat(chunks).toString()));calls++;res.writeHead(200,{"content-type":"text/event-stream"});
  if(calls===1){sse(res,{choices:[{delta:{tool_calls:[{index:0,id:"c1",function:{name:"get_",arguments:"{\"maximum"}}]}}]});sse(res,{choices:[{delta:{tool_calls:[{index:0,function:{name:"today",arguments:"Items\":25}"}}]},finish_reason:"tool_calls"}]})}
  else{sse(res,{choices:[{delta:{content:"{\"type\":\"answer\""}}]});sse(res,{choices:[{delta:{content:",\"title\":\"Focus\"}"},finish_reason:"stop"}],usage:{prompt_tokens:10,completion_tokens:5}})}res.write("data: [DONE]\n\n");res.end()
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));const port=(server.address() as AddressInfo).port,provider=new LlamaCppProvider({baseUrl:`http://127.0.0.1:${port}`,modelId:"candidate",runtimeVersion:"test",maximumContextTokens:4096,maximumOutputTokens:512,nativeToolCalling:true}),signal=new AbortController().signal,base={requestId:"r",messages:[{role:"user" as const,content:"test"}],temperature:0,maxOutputTokens:100,metadata:{constitutionVersion:"KAC-1",promptVersion:"1",toolSchemaVersion:"1"}};
 try{assert.equal((await provider.health()).status,"ready");const first=await provider.generate({...base,tools:[{type:"function",function:{name:"get_today",description:"today",parameters:{type:"object"}}}]},signal);assert.equal(first.toolCalls[0]?.name,"get_today");assert.deepEqual(JSON.parse(first.toolCalls[0]!.argumentsJson),{maximumItems:25});const schema={type:"object",properties:{type:{type:"string"}}};const second=await provider.generate({...base,responseSchema:schema},signal);assert.equal(second.text,'{"type":"answer","title":"Focus"}');assert.equal(second.promptTokens,10);assert.equal(second.outputTokens,5);assert.deepEqual(bodies[1].response_format,{type:"json_schema",json_schema:{name:"kaizen_intelligence_response",strict:true,schema}})}finally{await new Promise<void>(resolve=>server.close(()=>resolve()))}
});
