/** Fixed server route for route requests. */
import { NextRequest, NextResponse } from "next/server";
import { ProviderError, searchEntertainment } from "../../../../lib/entertainmentProviders";
import type { MediaType } from "../../../../lib/entertainmentTypes";
import { requestCredentials } from "../_credentials";
import { guardEntertainmentRequest } from "../_guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const TYPES = new Set<MediaType>(["book","comic","manga","movie","series","anime"]);

export async function GET(request:NextRequest) {
  const blocked=guardEntertainmentRequest(request,"search",30);if(blocked)return blocked;

  const q=(request.nextUrl.searchParams.get("q")??"").trim();
  const type=request.nextUrl.searchParams.get("type") as MediaType;
  const lang=["en","ta","hi"].includes(request.nextUrl.searchParams.get("lang")??"")?request.nextUrl.searchParams.get("lang")!:"en";
  if(q.length<2||q.length>120)return NextResponse.json({error:"query must be 2–120 characters"},{status:400});
  if(!TYPES.has(type))return NextResponse.json({error:"invalid media type"},{status:400});
  try {
    const results=await searchEntertainment(q,type,requestCredentials(request),lang);
    return NextResponse.json({results},{headers:{"Cache-Control":"private, max-age=60"}});
  } catch(error) {
    const status=error instanceof ProviderError?error.status:500;
    return NextResponse.json({error:error instanceof Error?error.message:"search failed",provider:error instanceof ProviderError?error.provider:undefined},{status});
  }
}
