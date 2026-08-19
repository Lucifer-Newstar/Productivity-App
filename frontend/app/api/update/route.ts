/** Fixed-repository release check for the packaged Windows update notification. */
import { NextResponse } from "next/server";
import { compareVersions, CURRENT_APP_VERSION, parseVersion, releaseUrl, setupAssetName, UPDATE_CHANNEL, UPDATE_REPOSITORY, type UpdateStatus } from "../../../lib/update";
export const dynamic="force-dynamic";
const MAX_RESPONSE_BYTES=1_000_000;
interface GithubAsset{name?:unknown;browser_download_url?:unknown}
interface GithubRelease{tag_name?:unknown;draft?:unknown;prerelease?:unknown;published_at?:unknown;html_url?:unknown;assets?:unknown}
export async function GET(){
  if(UPDATE_CHANNEL!=="github")return NextResponse.json({error:"UPDATE_CHANNEL_DISABLED"},{status:404,headers:{"cache-control":"no-store"}});
  try{
    const response=await fetch(`https://api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest`,{headers:{accept:"application/vnd.github+json","user-agent":"Kaizen-Update-Checker"},signal:AbortSignal.timeout(5_000),next:{revalidate:21_600}});
    const declared=Number(response.headers.get("content-length")??0);if(!response.ok||declared>MAX_RESPONSE_BYTES)throw new Error("release lookup rejected");
    const text=await response.text();if(text.length>MAX_RESPONSE_BYTES)throw new Error("release response too large");
    const release=JSON.parse(text) as GithubRelease,tag=typeof release.tag_name==="string"?release.tag_name:"";
    if(release.draft||release.prerelease||!parseVersion(tag))throw new Error("invalid release metadata");
    const latestVersion=tag.replace(/^v/,""),expectedAsset=setupAssetName(latestVersion),assets=Array.isArray(release.assets)?release.assets as GithubAsset[]:[];
    const asset=assets.find(item=>item?.name===expectedAsset),expectedRelease=releaseUrl(latestVersion);
    if(!asset||asset.browser_download_url!==`https://github.com/${UPDATE_REPOSITORY}/releases/download/v${latestVersion}/${expectedAsset}`||release.html_url!==expectedRelease)throw new Error("verified setup asset unavailable");
    const updateAvailable=compareVersions(latestVersion,CURRENT_APP_VERSION)>0;
    const result:UpdateStatus={currentVersion:CURRENT_APP_VERSION,latestVersion,updateAvailable,...(updateAvailable?{downloadPath:`/api/update/download?version=${encodeURIComponent(latestVersion)}`,releaseUrl:expectedRelease,publishedAt:typeof release.published_at==="string"?release.published_at:undefined}:{})};
    return NextResponse.json(result,{headers:{"cache-control":"private, max-age=3600","x-content-type-options":"nosniff"}});
  }catch{return NextResponse.json({error:"UPDATE_CHECK_UNAVAILABLE"},{status:503,headers:{"cache-control":"no-store"}})}
}
