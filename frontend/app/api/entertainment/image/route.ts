import { NextRequest, NextResponse } from "next/server";
import { guardEntertainmentRequest } from "../_guard";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const EXACT=new Set(["api-cdn.myanimelist.net","cdn.myanimelist.net","image.tmdb.org","books.google.com","books.googleusercontent.com","covers.openlibrary.org","archive.org","comicvine.gamespot.com","static.comicvine.com","static01.nyt.com","storage.googleapis.com"]);
function allowed(url:URL){return url.protocol==="https:"&&(EXACT.has(url.hostname)||/^s[1-4]\.anilist\.co$/.test(url.hostname)||/^ia\d+\.us\.archive\.org$/.test(url.hostname));}

export async function GET(request:NextRequest){
 const blocked=guardEntertainmentRequest(request,"image",120);if(blocked)return blocked;
 const raw=request.nextUrl.searchParams.get("url"); if(!raw)return NextResponse.json({error:"url required"},{status:400});
 let url:URL; try{url=new URL(raw)}catch{return NextResponse.json({error:"invalid url"},{status:400})}
 if(!allowed(url)||url.username||url.password)return NextResponse.json({error:"image host not allowed"},{status:403});
 try{
  let response:Response|undefined;
  for(let redirects=0;redirects<3;redirects++){
   response=await fetch(url,{redirect:"manual",signal:AbortSignal.timeout(8_000),headers:{Accept:"image/avif,image/webp,image/png,image/jpeg,image/gif"}});
   if(response.status<300||response.status>=400)break;
   const location=response.headers.get("location"); if(!location)break;
   url=new URL(location,url); if(!allowed(url))return NextResponse.json({error:"redirect host not allowed"},{status:403});
  }
  if(!response||!response.ok)return NextResponse.json({error:"image unavailable"},{status:response?.status===404?404:502});
  const kind=(response.headers.get("content-type")??"").split(";")[0];
  if(!["image/jpeg","image/png","image/webp","image/avif","image/gif"].includes(kind))return NextResponse.json({error:"unsupported image type"},{status:415});
  const declared=Number(response.headers.get("content-length")??0); if(declared>5*1024*1024)return NextResponse.json({error:"image too large"},{status:413});
  const reader=response.body?.getReader();if(!reader)return NextResponse.json({error:"empty image response"},{status:502});const chunks:Uint8Array[]=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;if(value){total+=value.byteLength;if(total>5*1024*1024){await reader.cancel();return NextResponse.json({error:"image too large"},{status:413})}chunks.push(value)}}const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  return new NextResponse(bytes,{headers:{"Content-Type":kind,"Cache-Control":"public, max-age=86400, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"image proxy failed"},{status:502})}
}
