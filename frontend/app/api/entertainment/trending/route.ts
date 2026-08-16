import { NextRequest, NextResponse } from "next/server";
import { ProviderError, trendingEntertainment } from "../../../../lib/entertainmentProviders";
import type { MediaType } from "../../../../lib/entertainmentTypes";
import { requestCredentials } from "../_credentials";
export const runtime="nodejs";export const dynamic="force-dynamic";
const TYPES=new Set<MediaType>(["book","comic","manga","movie","series","anime"]);
const buckets=new Map<string,{start:number;count:number}>();
export async function GET(request:NextRequest){
 const site=request.headers.get("sec-fetch-site");if(site&&site!=="same-origin"&&site!=="same-site"&&site!=="none")return NextResponse.json({error:"cross-site request rejected"},{status:403});
 const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local",now=Date.now(),bucket=buckets.get(ip);if(!bucket||now-bucket.start>60_000)buckets.set(ip,{start:now,count:1});else if(++bucket.count>20)return NextResponse.json({error:"discovery rate limit exceeded"},{status:429,headers:{"Retry-After":"60"}});
 const type=request.nextUrl.searchParams.get("type") as MediaType;if(!TYPES.has(type))return NextResponse.json({error:"invalid media type"},{status:400});
 try{return NextResponse.json({results:await trendingEntertainment(type,requestCredentials(request))},{headers:{"Cache-Control":"private, max-age=300"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"discovery failed",provider:error instanceof ProviderError?error.provider:undefined},{status:error instanceof ProviderError?error.status:500})}
}
