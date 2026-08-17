import { NextRequest, NextResponse } from "next/server";
import { ProviderError, trendingEntertainment } from "../../../../lib/entertainmentProviders";
import type { MediaType } from "../../../../lib/entertainmentTypes";
import { requestCredentials } from "../_credentials";
import { guardEntertainmentRequest } from "../_guard";
export const runtime="nodejs";export const dynamic="force-dynamic";
const TYPES=new Set<MediaType>(["book","comic","manga","movie","series","anime"]);
export async function GET(request:NextRequest){
 const blocked=guardEntertainmentRequest(request,"discovery",20);if(blocked)return blocked;
 const type=request.nextUrl.searchParams.get("type") as MediaType,lang=["en","ta","hi"].includes(request.nextUrl.searchParams.get("lang")??"")?request.nextUrl.searchParams.get("lang")!:"en";if(!TYPES.has(type))return NextResponse.json({error:"invalid media type"},{status:400});
 try{return NextResponse.json({results:await trendingEntertainment(type,requestCredentials(request),lang)},{headers:{"Cache-Control":"private, max-age=300"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"discovery failed",provider:error instanceof ProviderError?error.provider:undefined},{status:error instanceof ProviderError?error.status:500})}
}
