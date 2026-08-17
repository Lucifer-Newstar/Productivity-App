import type { NextRequest } from "next/server";
import type { ProviderCredentials } from "../../../lib/entertainmentProviders";
const read=(request:NextRequest,name:string)=>{const value=request.headers.get(name)?.trim();return value&&value.length<=512?value:undefined};
/** Session-only BYOK headers. Values are consumed in-memory and never returned or persisted. */
export function requestCredentials(request:NextRequest):ProviderCredentials{return {
 malClientId:read(request,"x-afterglow-mal"),tmdbAccessToken:read(request,"x-afterglow-tmdb"),googleBooksApiKey:read(request,"x-afterglow-google-books"),comicVineApiKey:read(request,"x-afterglow-comic-vine"),nytBooksApiKey:read(request,"x-afterglow-nyt-books"),
}}
