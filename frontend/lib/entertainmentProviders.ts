import "server-only";
import type { MediaSearchResult, MediaType } from "./entertainmentTypes";

const TIMEOUT_MS = 12_000;
const CACHE_TTL = 15 * 60_000;
const cache = new Map<string, { at:number; data:MediaSearchResult[] }>();

export class ProviderError extends Error {
  constructor(message:string, public status=502, public provider?:string) { super(message); }
}

function text(value:unknown, max=5000):string|undefined {
  if(typeof value!=="string") return undefined;
  const clean=value.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
  return clean ? clean.slice(0,max) : undefined;
}
function year(value:unknown):number|undefined {
  const match=String(value??"").match(/^(18|19|20|21)\d{2}/); return match?Number(match[0]):undefined;
}
function imageProxy(url:unknown):string|undefined {
  if(typeof url!=="string"||!url.startsWith("https://"))return undefined;
  return `/api/entertainment/image?url=${encodeURIComponent(url)}`;
}
async function jsonFetch(url:string, init:RequestInit={}, provider="provider") {
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try {
    const response=await fetch(url,{...init,signal:controller.signal,headers:{Accept:"application/json",...(init.headers??{})},cache:"no-store"});
    if(response.status===429) throw new ProviderError(`${provider} is rate-limiting requests. Try again shortly.`,429,provider);
    if(!response.ok) throw new ProviderError(`${provider} returned ${response.status}.`,response.status>=400&&response.status<500?response.status:502,provider);
    return await response.json();
  } catch(error) {
    if(error instanceof ProviderError)throw error;
    if(error instanceof Error&&error.name==="AbortError")throw new ProviderError(`${provider} timed out.`,504,provider);
    throw new ProviderError(`${provider} is unavailable.`,502,provider);
  } finally { clearTimeout(timer); }
}

async function searchMal(q:string):Promise<MediaSearchResult[]> {
  const key=process.env.MAL_CLIENT_ID;
  if(!key)throw new ProviderError("MyAnimeList search is not configured. Add MAL_CLIENT_ID on the server.",503,"mal");
  const fields="id,title,main_picture,alternative_titles,start_date,synopsis,mean,genres,num_episodes,media_type,status,studios,source";
  const data=await jsonFetch(`https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(q)}&limit=12&fields=${encodeURIComponent(fields)}`,{headers:{"X-MAL-CLIENT-ID":key}},"MyAnimeList");
  return (data.data??[]).map((entry:any)=>entry.node).filter(Boolean).map((n:any)=>({
    provider:"mal",providerId:String(n.id),mediaType:"anime",title:text(n.title,300)??"Untitled",
    originalTitle:text(n.alternative_titles?.ja,300),alternateTitles:[n.alternative_titles?.en,...(n.alternative_titles?.synonyms??[])].map((x:any)=>text(x,300)).filter(Boolean),
    description:text(n.synopsis),coverUrl:imageProxy(n.main_picture?.large??n.main_picture?.medium),releaseDate:text(n.start_date,20),releaseYear:year(n.start_date),
    genres:(n.genres??[]).map((g:any)=>text(g.name,80)).filter(Boolean),creators:[],cast:[],studios:(n.studios??[]).map((s:any)=>text(s.name,100)).filter(Boolean),countries:["Japan"],
    totalEpisodes:Number(n.num_episodes)||undefined,sourceMaterial:text(n.source,80),externalUrl:`https://myanimelist.net/anime/${n.id}`,
  }));
}

async function searchAniListManga(q:string):Promise<MediaSearchResult[]> {
  const query=`query($search:String!){Page(page:1,perPage:12){media(search:$search,type:MANGA,isAdult:false,sort:[SEARCH_MATCH,POPULARITY_DESC]){id title{romaji english native} description coverImage{extraLarge large} startDate{year month day} genres countryOfOrigin chapters volumes format staff(perPage:6){nodes{name{full}}} source siteUrl}}}`;
  const data=await jsonFetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query,variables:{search:q}})},"AniList");
  return (data.data?.Page?.media??[]).map((n:any)=>({
    provider:"anilist",providerId:String(n.id),mediaType:"manga",title:text(n.title?.english??n.title?.romaji,300)??"Untitled",originalTitle:text(n.title?.native,300),
    alternateTitles:[n.title?.romaji,n.title?.english,n.title?.native].map((x:any)=>text(x,300)).filter(Boolean),description:text(n.description),coverUrl:imageProxy(n.coverImage?.extraLarge??n.coverImage?.large),
    releaseDate:n.startDate?.year?`${n.startDate.year}-${String(n.startDate.month??1).padStart(2,"0")}-${String(n.startDate.day??1).padStart(2,"0")}`:undefined,releaseYear:n.startDate?.year,
    genres:(n.genres??[]).map((x:any)=>text(x,80)).filter(Boolean),creators:(n.staff?.nodes??[]).map((s:any)=>text(s.name?.full,100)).filter(Boolean),cast:[],studios:[],countries:n.countryOfOrigin?[String(n.countryOfOrigin)]:[],
    totalChapters:Number(n.chapters)||undefined,totalVolumes:Number(n.volumes)||undefined,sourceMaterial:text(n.source,80),externalUrl:text(n.siteUrl,500),
  }));
}

async function searchTmdb(q:string,type:"movie"|"series"):Promise<MediaSearchResult[]> {
  const token=process.env.TMDB_ACCESS_TOKEN;
  if(!token)throw new ProviderError("TMDB search is not configured. Add TMDB_ACCESS_TOKEN on the server.",503,"tmdb");
  const kind=type==="series"?"tv":"movie";
  const data=await jsonFetch(`https://api.themoviedb.org/3/search/${kind}?query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`,{headers:{Authorization:`Bearer ${token}`}},"TMDB");
  return (data.results??[]).slice(0,12).map((n:any)=>({
    provider:"tmdb",providerId:`${kind}:${n.id}`,mediaType:type,title:text(n.title??n.name,300)??"Untitled",originalTitle:text(n.original_title??n.original_name,300),alternateTitles:[],description:text(n.overview),
    coverUrl:n.poster_path?imageProxy(`https://image.tmdb.org/t/p/w500${n.poster_path}`):undefined,backdropUrl:n.backdrop_path?imageProxy(`https://image.tmdb.org/t/p/w780${n.backdrop_path}`):undefined,
    releaseDate:text(n.release_date??n.first_air_date,20),releaseYear:year(n.release_date??n.first_air_date),genres:[],creators:[],cast:[],studios:[],countries:(n.origin_country??[]).map(String),
    language:text(n.original_language,20),externalUrl:`https://www.themoviedb.org/${kind}/${n.id}`,
  }));
}

async function searchGoogleBooks(q:string, mediaType:MediaType="book"):Promise<MediaSearchResult[]> {
  const key=process.env.GOOGLE_BOOKS_API_KEY;
  if(!key)return searchOpenLibrary(q,mediaType);
  const data=await jsonFetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&projection=full&key=${encodeURIComponent(key)}`,{},"Google Books");
  return (data.items??[]).map((n:any)=>{const v=n.volumeInfo??{};return {
    provider:"google-books",providerId:String(n.id),mediaType,title:text(v.title,300)??"Untitled",originalTitle:undefined,alternateTitles:v.subtitle?[text(v.subtitle,300)].filter(Boolean):[],description:text(v.description),
    coverUrl:imageProxy(String(v.imageLinks?.thumbnail??v.imageLinks?.smallThumbnail??"").replace(/^http:/,"https:")),releaseDate:text(v.publishedDate,20),releaseYear:year(v.publishedDate),
    genres:(v.categories??[]).map((x:any)=>text(x,100)).filter(Boolean),creators:(v.authors??[]).map((x:any)=>text(x,100)).filter(Boolean),cast:[],studios:v.publisher?[text(v.publisher,100)].filter(Boolean):[],countries:[],language:text(v.language,20),
    totalPages:Number(v.pageCount)||undefined,externalUrl:text(v.infoLink,500),
  }});
}

async function searchOpenLibrary(q:string,mediaType:MediaType="book"):Promise<MediaSearchResult[]> {
  const fields="key,title,author_name,first_publish_year,cover_i,subject,language,number_of_pages_median";
  const data=await jsonFetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=${fields}`,{},"Open Library");
  return (data.docs??[]).map((n:any)=>({
    provider:"open-library",providerId:String(n.key??"").replace("/works/",""),mediaType,title:text(n.title,300)??"Untitled",alternateTitles:[],description:undefined,
    coverUrl:n.cover_i?imageProxy(`https://covers.openlibrary.org/b/id/${n.cover_i}-L.jpg`):undefined,releaseYear:Number(n.first_publish_year)||undefined,genres:(n.subject??[]).slice(0,8).map((x:any)=>text(x,100)).filter(Boolean),
    creators:(n.author_name??[]).map((x:any)=>text(x,100)).filter(Boolean),cast:[],studios:[],countries:[],language:text(n.language?.[0],20),totalPages:Number(n.number_of_pages_median)||undefined,
    externalUrl:n.key?`https://openlibrary.org${n.key}`:undefined,
  }));
}

async function searchComicVine(q:string):Promise<MediaSearchResult[]> {
  const key=process.env.COMICVINE_API_KEY;
  if(!key)return searchGoogleBooks(q,"comic");
  const fields="id,name,deck,description,image,date_added,cover_date,publisher,site_detail_url,resource_type";
  const data=await jsonFetch(`https://comicvine.gamespot.com/api/search/?api_key=${encodeURIComponent(key)}&format=json&query=${encodeURIComponent(q)}&resources=volume,issue&limit=12&field_list=${fields}`,{headers:{"User-Agent":"Kaizen-AFTERGLOW/1.0"}},"Comic Vine");
  return (data.results??[]).map((n:any)=>({
    provider:"comic-vine",providerId:String(n.id),mediaType:"comic",title:text(n.name,300)??"Untitled",alternateTitles:[],description:text(n.deck??n.description),coverUrl:imageProxy(n.image?.original_url??n.image?.super_url),releaseDate:text(n.cover_date,20),releaseYear:year(n.cover_date),genres:[],creators:[],cast:[],studios:n.publisher?.name?[text(n.publisher.name,100)].filter(Boolean):[],countries:[],externalUrl:text(n.site_detail_url,500),
  }));
}

export function providerStatus() {
  return { mal:!!process.env.MAL_CLIENT_ID, anilist:true, tmdb:!!process.env.TMDB_ACCESS_TOKEN, googleBooks:!!process.env.GOOGLE_BOOKS_API_KEY, openLibrary:true, comicVine:!!process.env.COMICVINE_API_KEY, nytBooks:!!process.env.NYT_BOOKS_API_KEY };
}

export async function searchEntertainment(q:string,type:MediaType):Promise<MediaSearchResult[]> {
  const key=`${type}:${q.toLowerCase()}`; const hit=cache.get(key); if(hit&&Date.now()-hit.at<CACHE_TTL)return hit.data;
  let data:MediaSearchResult[];
  if(type==="anime")data=await searchMal(q);
  else if(type==="manga")data=await searchAniListManga(q);
  else if(type==="movie"||type==="series")data=await searchTmdb(q,type);
  else if(type==="comic")data=await searchComicVine(q);
  else data=await searchGoogleBooks(q,"book");
  const clean=data.slice(0,12); cache.set(key,{at:Date.now(),data:clean}); return clean;
}
