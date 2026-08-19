/** Provider adapter for route inference behavior. */
import { NextRequest, NextResponse } from "next/server";
import { providerStatus } from "../../../../lib/entertainmentProviders";
import { guardEntertainmentRequest } from "../_guard";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export function GET(request:NextRequest){
  const blocked=guardEntertainmentRequest(request,"providers",60);if(blocked)return blocked;
  return NextResponse.json({providers:providerStatus()},{headers:{"Cache-Control":"no-store"}});
}
