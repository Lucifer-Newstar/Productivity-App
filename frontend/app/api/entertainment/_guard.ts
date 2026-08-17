import { NextRequest,NextResponse } from "next/server";
const buckets=new Map<string,{start:number;count:number}>();
function clientKey(request:NextRequest){const real=request.headers.get("x-real-ip")?.trim(),forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();return (real||forwarded||"local").slice(0,128)}
/** Best-effort per-process guard. Reverse proxies must overwrite client-IP headers. */
export function guardEntertainmentRequest(request:NextRequest,namespace:string,limit:number,windowMs=60_000){
 const site=request.headers.get("sec-fetch-site");if(site&&site!=="same-origin"&&site!=="same-site"&&site!=="none")return NextResponse.json({error:"cross-site request rejected"},{status:403});
 const now=Date.now();if(buckets.size>5_000){for(const [key,value] of Array.from(buckets.entries()))if(now-value.start>windowMs)buckets.delete(key);if(buckets.size>10_000)buckets.clear()}
 const key=`${namespace}:${clientKey(request)}`,bucket=buckets.get(key);if(!bucket||now-bucket.start>windowMs){buckets.set(key,{start:now,count:1});return null}if(++bucket.count>limit)return NextResponse.json({error:`${namespace} rate limit exceeded`},{status:429,headers:{"Retry-After":String(Math.ceil(windowMs/1000))}});return null
}
