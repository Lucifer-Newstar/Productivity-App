import { NextRequest,NextResponse } from "next/server";
import { getEntertainmentDetails,ProviderError } from "../../../../lib/entertainmentProviders";
import type { MediaType } from "../../../../lib/entertainmentTypes";
import { requestCredentials } from "../_credentials";
export const runtime="nodejs";export const dynamic="force-dynamic";
const PROVIDERS=new Set(["mal","anilist","tmdb","google-books","open-library"]),TYPES=new Set<MediaType>(["book","comic","manga","movie","series","anime"]);
export async function GET(request:NextRequest){
 const site=request.headers.get("sec-fetch-site");if(site&&site!=="same-origin"&&site!=="same-site"&&site!=="none")return NextResponse.json({error:"cross-site request rejected"},{status:403});
 const provider=request.nextUrl.searchParams.get("provider")??"",id=request.nextUrl.searchParams.get("id")??"",type=request.nextUrl.searchParams.get("type") as MediaType,lang=["en","ta","hi"].includes(request.nextUrl.searchParams.get("lang")??"")?request.nextUrl.searchParams.get("lang")!:"en";
 if(!PROVIDERS.has(provider)||!TYPES.has(type)||!/^[\w:.-]{1,128}$/.test(id))return NextResponse.json({error:"invalid detail request"},{status:400});
 try{return NextResponse.json({result:await getEntertainmentDetails(provider,id,type,requestCredentials(request),lang)},{headers:{"Cache-Control":"private, max-age=300"}})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"metadata refresh failed"},{status:error instanceof ProviderError?error.status:500})}
}
