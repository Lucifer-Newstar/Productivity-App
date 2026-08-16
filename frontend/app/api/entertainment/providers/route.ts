import { NextRequest, NextResponse } from "next/server";
import { providerStatus } from "../../../../lib/entertainmentProviders";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){
  const site=request.headers.get("sec-fetch-site");
  if(site&&site!=="same-origin"&&site!=="same-site"&&site!=="none")return NextResponse.json({error:"cross-site request rejected"},{status:403});
  return NextResponse.json({providers:providerStatus()},{headers:{"Cache-Control":"no-store"}});
}
