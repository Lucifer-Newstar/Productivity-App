/** Redirects a validated update request only to the exact official GitHub setup asset. */
import { NextRequest, NextResponse } from "next/server";
import { parseVersion, releaseDownloadUrl, UPDATE_CHANNEL } from "../../../../lib/update";
export function GET(request:NextRequest){if(UPDATE_CHANNEL!=="github")return NextResponse.json({error:"UPDATE_CHANNEL_DISABLED"},{status:404});const version=request.nextUrl.searchParams.get("version")??"";if(!parseVersion(version)||version.startsWith("v"))return NextResponse.json({error:"INVALID_VERSION"},{status:400});return NextResponse.redirect(releaseDownloadUrl(version),{status:307,headers:{"cache-control":"no-store","referrer-policy":"no-referrer"}})}
