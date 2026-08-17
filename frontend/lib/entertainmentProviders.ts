import "server-only";
import type { MediaSearchResult, MediaType } from "./entertainmentTypes";
import { providerLocale } from "./entertainmentI18n";

const TIMEOUT_MS = 12_000;
const CACHE_TTL = 15 * 60_000;
const cache = new Map<string, { at:number; data:MediaSearchResult[] }>();
export interface ProviderCredentials { malClientId?:string;tmdbAccessToken?:string;googleBooksApiKey?:string;comicVineApiKey?:string;nytBooksApiKey?:string }
const configured=(override:string|undefined,env:string|undefined)=>override?.trim()||env;

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

async function searchMal(q:string,credentials:ProviderCredentials={}):Promise<MediaSearchResult[]> {
  const key=configured(credentials.malClientId,process.env.MAL_CLIENT_ID);
  if(!key)throw new ProviderError("MyAnimeList search is not configured. Add MAL_CLIENT_ID on the server.",503,"mal");
  const fields="id,title,main_picture,alternative_titles,start_date,synopsis,mean,genres,num_episodes,media_type,status,studios,source";
  const data=await jsonFetch(`https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(q)}&limit=12&fields=${encodeURIComponent(fields)}`,{headers:{"X-MAL-CLIENT-ID":key}},"MyAnimeList");
  return (data.data??[]).map((entry:any)=>entry.node).filter((x:any):x is string=>typeof x==="string"&&x.length>0).map((n:any)=>({
    provider:"mal",providerId:String(n.id),mediaType:"anime",title:text(n.title,300)??"Untitled",
    originalTitle:text(n.alternative_titles?.ja,300),alternateTitles:[n.alternative_titles?.en,...(n.alternative_titles?.synonyms??[])].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),
    description:text(n.synopsis),coverUrl:imageProxy(n.main_picture?.large??n.main_picture?.medium),releaseDate:text(n.start_date,20),releaseYear:year(n.start_date),
    genres:(n.genres??[]).map((g:any)=>text(g.name,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:[],cast:[],studios:(n.studios??[]).map((s:any)=>text(s.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),countries:["Japan"],
    totalEpisodes:Number(n.num_episodes)||undefined,sourceMaterial:text(n.source,80),externalUrl:`https://myanimelist.net/anime/${n.id}`,
  }));
}

async function searchAniListManga(q:string):Promise<MediaSearchResult[]> {
  const query=`query($search:String!){Page(page:1,perPage:12){media(search:$search,type:MANGA,isAdult:false,sort:[SEARCH_MATCH,POPULARITY_DESC]){id title{romaji english native} description coverImage{extraLarge large} startDate{year month day} genres countryOfOrigin chapters volumes format staff(perPage:6){nodes{name{full}}} source siteUrl}}}`;
  const data=await jsonFetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query,variables:{search:q}})},"AniList");
  return (data.data?.Page?.media??[]).map((n:any)=>({
    provider:"anilist",providerId:String(n.id),mediaType:"manga",title:text(n.title?.english??n.title?.romaji,300)??"Untitled",originalTitle:text(n.title?.native,300),
    alternateTitles:[n.title?.romaji,n.title?.english,n.title?.native].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),description:text(n.description),coverUrl:imageProxy(n.coverImage?.extraLarge??n.coverImage?.large),
    releaseDate:n.startDate?.year?`${n.startDate.year}-${String(n.startDate.month??1).padStart(2,"0")}-${String(n.startDate.day??1).padStart(2,"0")}`:undefined,releaseYear:n.startDate?.year,
    genres:(n.genres??[]).map((x:any)=>text(x,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:(n.staff?.nodes??[]).map((s:any)=>text(s.name?.full,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:[],countries:n.countryOfOrigin?[String(n.countryOfOrigin)]:[],
    totalChapters:Number(n.chapters)||undefined,totalVolumes:Number(n.volumes)||undefined,sourceMaterial:text(n.source,80),externalUrl:text(n.siteUrl,500),
  }));
}

async function searchTmdb(q:string,type:"movie"|"series",credentials:ProviderCredentials={},locale="en-US"):Promise<MediaSearchResult[]> {
  const token=configured(credentials.tmdbAccessToken,process.env.TMDB_ACCESS_TOKEN);
  if(!token)throw new ProviderError("TMDB search is not configured. Add TMDB_ACCESS_TOKEN on the server.",503,"tmdb");
  const kind=type==="series"?"tv":"movie";
  const data=await jsonFetch(`https://api.themoviedb.org/3/search/${kind}?query=${encodeURIComponent(q)}&include_adult=false&language=${encodeURIComponent(locale)}&page=1`,{headers:{Authorization:`Bearer ${token}`}},"TMDB");
  return (data.results??[]).slice(0,12).map((n:any)=>({
    provider:"tmdb",providerId:`${kind}:${n.id}`,mediaType:type,title:text(n.title??n.name,300)??"Untitled",originalTitle:text(n.original_title??n.original_name,300),alternateTitles:[],description:text(n.overview),
    coverUrl:n.poster_path?imageProxy(`https://image.tmdb.org/t/p/w500${n.poster_path}`):undefined,backdropUrl:n.backdrop_path?imageProxy(`https://image.tmdb.org/t/p/w780${n.backdrop_path}`):undefined,
    releaseDate:text(n.release_date??n.first_air_date,20),releaseYear:year(n.release_date??n.first_air_date),genres:[],creators:[],cast:[],studios:[],countries:(n.origin_country??[]).map(String),
    language:text(n.original_language,20),externalUrl:`https://www.themoviedb.org/${kind}/${n.id}`,
  }));
}

async function searchGoogleBooks(q:string, mediaType:MediaType="book",credentials:ProviderCredentials={},language="en"):Promise<MediaSearchResult[]> {
  const key=configured(credentials.googleBooksApiKey,process.env.GOOGLE_BOOKS_API_KEY);
  if(!key)return searchOpenLibrary(q,mediaType);
  const data=await jsonFetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&projection=full&langRestrict=${encodeURIComponent(language)}&key=${encodeURIComponent(key)}`,{},"Google Books");
  return (data.items??[]).map((n:any)=>{const v=n.volumeInfo??{};return {
    provider:"google-books",providerId:String(n.id),mediaType,title:text(v.title,300)??"Untitled",originalTitle:undefined,alternateTitles:v.subtitle?[text(v.subtitle,300)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],description:text(v.description),
    coverUrl:imageProxy(String(v.imageLinks?.thumbnail??v.imageLinks?.smallThumbnail??"").replace(/^http:/,"https:")),releaseDate:text(v.publishedDate,20),releaseYear:year(v.publishedDate),
    genres:(v.categories??[]).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:(v.authors??[]).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:v.publisher?[text(v.publisher,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],countries:[],language:text(v.language,20),
    totalPages:Number(v.pageCount)||undefined,externalUrl:text(v.infoLink,500),
  }});
}

async function searchOpenLibrary(q:string,mediaType:MediaType="book"):Promise<MediaSearchResult[]> {
  const fields="key,title,author_name,first_publish_year,cover_i,subject,language,number_of_pages_median";
  const data=await jsonFetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=${fields}`,{},"Open Library");
  return (data.docs??[]).map((n:any)=>({
    provider:"open-library",providerId:String(n.key??"").replace("/works/",""),mediaType,title:text(n.title,300)??"Untitled",alternateTitles:[],description:undefined,
    coverUrl:n.cover_i?imageProxy(`https://covers.openlibrary.org/b/id/${n.cover_i}-L.jpg`):undefined,releaseYear:Number(n.first_publish_year)||undefined,genres:(n.subject??[]).slice(0,8).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),
    creators:(n.author_name??[]).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:[],countries:[],language:text(n.language?.[0],20),totalPages:Number(n.number_of_pages_median)||undefined,
    externalUrl:n.key?`https://openlibrary.org${n.key}`:undefined,
  }));
}

async function searchComicVine(q:string,credentials:ProviderCredentials={},language="en"):Promise<MediaSearchResult[]> {
  const key=configured(credentials.comicVineApiKey,process.env.COMICVINE_API_KEY);
  if(!key)return searchGoogleBooks(q,"comic",credentials,language);
  const fields="id,name,deck,description,image,date_added,cover_date,publisher,site_detail_url,resource_type";
  const data=await jsonFetch(`https://comicvine.gamespot.com/api/search/?api_key=${encodeURIComponent(key)}&format=json&query=${encodeURIComponent(q)}&resources=volume,issue&limit=12&field_list=${fields}`,{headers:{"User-Agent":"Kaizen-AFTERGLOW/1.0"}},"Comic Vine");
  return (data.results??[]).map((n:any)=>({
    provider:"comic-vine",providerId:String(n.id),mediaType:"comic",title:text(n.name,300)??"Untitled",alternateTitles:[],description:text(n.deck??n.description),coverUrl:imageProxy(n.image?.original_url??n.image?.super_url),releaseDate:text(n.cover_date,20),releaseYear:year(n.cover_date),genres:[],creators:[],cast:[],studios:n.publisher?.name?[text(n.publisher.name,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],countries:[],externalUrl:text(n.site_detail_url,500),
  }));
}

async function trendingMal(credentials:ProviderCredentials={}):Promise<MediaSearchResult[]> {
  const key=configured(credentials.malClientId,process.env.MAL_CLIENT_ID);
  if(!key)throw new ProviderError("MyAnimeList trending is not configured. Add MAL_CLIENT_ID on the server.",503,"mal");
  const fields="id,title,main_picture,alternative_titles,start_date,synopsis,genres,num_episodes,studios,source";
  const data=await jsonFetch(`https://api.myanimelist.net/v2/anime/ranking?ranking_type=airing&limit=12&fields=${encodeURIComponent(fields)}`,{headers:{"X-MAL-CLIENT-ID":key}},"MyAnimeList");
  return (data.data??[]).map((e:any)=>e.node).filter((x:any):x is string=>typeof x==="string"&&x.length>0).map((n:any)=>({provider:"mal",providerId:String(n.id),mediaType:"anime",title:text(n.title,300)??"Untitled",originalTitle:text(n.alternative_titles?.ja,300),alternateTitles:[n.alternative_titles?.en,...(n.alternative_titles?.synonyms??[])].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),description:text(n.synopsis),coverUrl:imageProxy(n.main_picture?.large??n.main_picture?.medium),releaseDate:text(n.start_date,20),releaseYear:year(n.start_date),genres:(n.genres??[]).map((g:any)=>text(g.name,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:[],cast:[],studios:(n.studios??[]).map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),countries:["Japan"],totalEpisodes:Number(n.num_episodes)||undefined,sourceMaterial:text(n.source,80),externalUrl:`https://myanimelist.net/anime/${n.id}`}));
}
async function trendingAniListManga():Promise<MediaSearchResult[]> {
  const query=`query{Page(page:1,perPage:12){media(type:MANGA,isAdult:false,sort:[TRENDING_DESC,POPULARITY_DESC]){id title{romaji english native} description coverImage{extraLarge large} startDate{year month day} genres countryOfOrigin chapters volumes staff(perPage:6){nodes{name{full}}} source siteUrl}}}`;
  const data=await jsonFetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query})},"AniList");
  return (data.data?.Page?.media??[]).map((n:any)=>({provider:"anilist",providerId:String(n.id),mediaType:"manga",title:text(n.title?.english??n.title?.romaji,300)??"Untitled",originalTitle:text(n.title?.native,300),alternateTitles:[n.title?.romaji,n.title?.english,n.title?.native].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),description:text(n.description),coverUrl:imageProxy(n.coverImage?.extraLarge??n.coverImage?.large),releaseYear:n.startDate?.year,genres:(n.genres??[]).map((x:any)=>text(x,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:(n.staff?.nodes??[]).map((s:any)=>text(s.name?.full,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:[],countries:n.countryOfOrigin?[String(n.countryOfOrigin)]:[],totalChapters:Number(n.chapters)||undefined,totalVolumes:Number(n.volumes)||undefined,sourceMaterial:text(n.source,80),externalUrl:text(n.siteUrl,500)}));
}
async function trendingTmdb(type:"movie"|"series",credentials:ProviderCredentials={},locale="en-US"):Promise<MediaSearchResult[]> {
  const token=configured(credentials.tmdbAccessToken,process.env.TMDB_ACCESS_TOKEN);if(!token)throw new ProviderError("TMDB trending is not configured. Add TMDB_ACCESS_TOKEN on the server.",503,"tmdb");
  const kind=type==="series"?"tv":"movie",data=await jsonFetch(`https://api.themoviedb.org/3/trending/${kind}/week?language=${encodeURIComponent(locale)}`,{headers:{Authorization:`Bearer ${token}`}},"TMDB");
  return (data.results??[]).slice(0,12).map((n:any)=>({provider:"tmdb",providerId:`${kind}:${n.id}`,mediaType:type,title:text(n.title??n.name,300)??"Untitled",originalTitle:text(n.original_title??n.original_name,300),alternateTitles:[],description:text(n.overview),coverUrl:n.poster_path?imageProxy(`https://image.tmdb.org/t/p/w500${n.poster_path}`):undefined,releaseDate:text(n.release_date??n.first_air_date,20),releaseYear:year(n.release_date??n.first_air_date),genres:[],creators:[],cast:[],studios:[],countries:(n.origin_country??[]).map(String),language:text(n.original_language,20),externalUrl:`https://www.themoviedb.org/${kind}/${n.id}`}));
}
async function trendingBooks(credentials:ProviderCredentials={}):Promise<MediaSearchResult[]> {
  const key=configured(credentials.nytBooksApiKey,process.env.NYT_BOOKS_API_KEY);if(!key)throw new ProviderError("Book trending is not configured. Add NYT_BOOKS_API_KEY on the server.",503,"nyt");
  const data=await jsonFetch(`https://api.nytimes.com/svc/books/v3/lists/overview.json?api-key=${encodeURIComponent(key)}`,{},"NYT Books");
  const books=(data.results?.lists??[]).flatMap((l:any)=>(l.books??[]).map((b:any)=>({...b,_list:l.list_name}))).slice(0,12);
  return books.map((n:any)=>({provider:"nyt",providerId:String(n.primary_isbn13??n.primary_isbn10??n.title),mediaType:"book",title:text(n.title,300)??"Untitled",alternateTitles:[],description:text(n.description),coverUrl:imageProxy(n.book_image),releaseYear:undefined,genres:n._list?[text(n._list,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],creators:n.author?[text(n.author,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],cast:[],studios:n.publisher?[text(n.publisher,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],countries:[],externalUrl:text(n.amazon_product_url,500)}));
}
async function trendingComics(credentials:ProviderCredentials={}):Promise<MediaSearchResult[]> {
  const key=configured(credentials.comicVineApiKey,process.env.COMICVINE_API_KEY);if(!key)throw new ProviderError("Comic discovery is not configured. Add COMICVINE_API_KEY on the server.",503,"comic-vine");
  const fields="id,name,deck,description,image,date_added,cover_date,site_detail_url";
  const data=await jsonFetch(`https://comicvine.gamespot.com/api/issues/?api_key=${encodeURIComponent(key)}&format=json&sort=date_added:desc&limit=12&field_list=${fields}`,{headers:{"User-Agent":"Kaizen-AFTERGLOW/1.0"}},"Comic Vine");
  return (data.results??[]).map((n:any)=>({provider:"comic-vine",providerId:String(n.id),mediaType:"comic",title:text(n.name,300)??"Untitled",alternateTitles:[],description:text(n.deck??n.description),coverUrl:imageProxy(n.image?.original_url??n.image?.super_url),releaseDate:text(n.cover_date,20),releaseYear:year(n.cover_date),genres:[],creators:[],cast:[],studios:[],countries:[],externalUrl:text(n.site_detail_url,500)}));
}

export async function trendingEntertainment(type:MediaType,credentials:ProviderCredentials={},language="en"):Promise<MediaSearchResult[]> {
  const key=`trending:${language}:${type}`,hit=cache.get(key);if(hit&&Date.now()-hit.at<CACHE_TTL)return hit.data;
  let data:MediaSearchResult[];
  if(type==="anime")data=await trendingMal(credentials);else if(type==="manga")data=await trendingAniListManga();else if(type==="movie"||type==="series")data=await trendingTmdb(type,credentials,providerLocale(language));else if(type==="comic")data=await trendingComics(credentials);else data=await trendingBooks(credentials);
  data=data.slice(0,12);cache.set(key,{at:Date.now(),data});return data;
}

export async function getEntertainmentDetails(provider:string,providerId:string,type:MediaType,credentials:ProviderCredentials={},language="en"):Promise<MediaSearchResult>{
 if(provider==="mal"){
  const key=configured(credentials.malClientId,process.env.MAL_CLIENT_ID);if(!key)throw new ProviderError("MyAnimeList is not configured.",503,"mal");
  const fields="id,title,main_picture,alternative_titles,start_date,end_date,synopsis,genres,num_episodes,media_type,status,studios,source";
  const n=await jsonFetch(`https://api.myanimelist.net/v2/anime/${encodeURIComponent(providerId)}?fields=${encodeURIComponent(fields)}`,{headers:{"X-MAL-CLIENT-ID":key}},"MyAnimeList");
  return {provider:"mal",providerId:String(n.id),mediaType:"anime",title:text(n.title,300)??"Untitled",originalTitle:text(n.alternative_titles?.ja,300),alternateTitles:[n.alternative_titles?.en,...(n.alternative_titles?.synonyms??[])].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),description:text(n.synopsis),coverUrl:imageProxy(n.main_picture?.large??n.main_picture?.medium),releaseDate:text(n.start_date,20),releaseYear:year(n.start_date),genres:(n.genres??[]).map((g:any)=>text(g.name,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:[],cast:[],studios:(n.studios??[]).map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),countries:["Japan"],totalEpisodes:Number(n.num_episodes)||undefined,sourceMaterial:text(n.source,80),externalUrl:`https://myanimelist.net/anime/${n.id}`};
 }
 if(provider==="anilist"){
  const query=`query($id:Int!){Media(id:$id,type:MANGA){id title{romaji english native} description coverImage{extraLarge large} startDate{year month day} genres countryOfOrigin chapters volumes staff(perPage:8){nodes{name{full}}} source siteUrl}}`,data=await jsonFetch("https://graphql.anilist.co",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query,variables:{id:Number(providerId)}})},"AniList"),n=data.data?.Media;if(!n)throw new ProviderError("AniList title not found.",404,"anilist");
  return {provider:"anilist",providerId:String(n.id),mediaType:"manga",title:text(n.title?.english??n.title?.romaji,300)??"Untitled",originalTitle:text(n.title?.native,300),alternateTitles:[n.title?.romaji,n.title?.english,n.title?.native].map((x:any)=>text(x,300)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),description:text(n.description),coverUrl:imageProxy(n.coverImage?.extraLarge??n.coverImage?.large),releaseYear:n.startDate?.year,genres:(n.genres??[]).map((x:any)=>text(x,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:(n.staff?.nodes??[]).map((s:any)=>text(s.name?.full,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:[],countries:n.countryOfOrigin?[String(n.countryOfOrigin)]:[],totalChapters:Number(n.chapters)||undefined,totalVolumes:Number(n.volumes)||undefined,sourceMaterial:text(n.source,80),externalUrl:text(n.siteUrl,500)};
 }
 if(provider==="tmdb"){
  const token=configured(credentials.tmdbAccessToken,process.env.TMDB_ACCESS_TOKEN);if(!token)throw new ProviderError("TMDB is not configured.",503,"tmdb");const [rawKind,rawId]=providerId.split(":"),kind=rawKind==="tv"||type==="series"?"tv":"movie",id=rawId??rawKind;
  const n=await jsonFetch(`https://api.themoviedb.org/3/${kind}/${encodeURIComponent(id)}?append_to_response=credits&language=${encodeURIComponent(providerLocale(language))}`,{headers:{Authorization:`Bearer ${token}`}},"TMDB");const crew=n.credits?.crew??[],directors=crew.filter((x:any)=>x.job==="Director"||x.job==="Creator").map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0);
  return {provider:"tmdb",providerId:`${kind}:${n.id}`,mediaType:kind==="tv"?"series":"movie",title:text(n.title??n.name,300)??"Untitled",originalTitle:text(n.original_title??n.original_name,300),alternateTitles:[],description:text(n.overview),coverUrl:n.poster_path?imageProxy(`https://image.tmdb.org/t/p/w500${n.poster_path}`):undefined,backdropUrl:n.backdrop_path?imageProxy(`https://image.tmdb.org/t/p/w780${n.backdrop_path}`):undefined,releaseDate:text(n.release_date??n.first_air_date,20),releaseYear:year(n.release_date??n.first_air_date),genres:(n.genres??[]).map((x:any)=>text(x.name,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:[...(n.created_by??[]).map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),...directors],cast:(n.credits?.cast??[]).slice(0,12).map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),studios:(n.production_companies??[]).map((x:any)=>text(x.name,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),countries:(n.production_countries??[]).map((x:any)=>text(x.name,80)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),language:text(n.original_language,20),runtimeMinutes:Number(n.runtime??n.episode_run_time?.[0])||undefined,totalEpisodes:Number(n.number_of_episodes)||undefined,totalSeasons:Number(n.number_of_seasons)||undefined,externalUrl:`https://www.themoviedb.org/${kind}/${n.id}`};
 }
 if(provider==="google-books"){
  const key=configured(credentials.googleBooksApiKey,process.env.GOOGLE_BOOKS_API_KEY),n=await jsonFetch(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(providerId)}${key?`?key=${encodeURIComponent(key)}`:""}`,{},"Google Books"),v=n.volumeInfo??{};
  return {provider:"google-books",providerId:String(n.id),mediaType:type,title:text(v.title,300)??"Untitled",alternateTitles:v.subtitle?[text(v.subtitle,300)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],description:text(v.description),coverUrl:imageProxy(String(v.imageLinks?.thumbnail??v.imageLinks?.smallThumbnail??"").replace(/^http:/,"https:")),releaseDate:text(v.publishedDate,20),releaseYear:year(v.publishedDate),genres:(v.categories??[]).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:(v.authors??[]).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),cast:[],studios:v.publisher?[text(v.publisher,100)].filter((x:any):x is string=>typeof x==="string"&&x.length>0):[],countries:[],language:text(v.language,20),totalPages:Number(v.pageCount)||undefined,externalUrl:text(v.infoLink,500)};
 }
 if(provider==="open-library"){
  const n=await jsonFetch(`https://openlibrary.org/works/${encodeURIComponent(providerId)}.json`,{},"Open Library"),cover=n.covers?.[0];
  return {provider:"open-library",providerId,mediaType:type,title:text(n.title,300)??"Untitled",alternateTitles:[],description:text(typeof n.description==="object"?n.description?.value:n.description),coverUrl:cover?imageProxy(`https://covers.openlibrary.org/b/id/${cover}-L.jpg`):undefined,releaseDate:text(n.first_publish_date,20),releaseYear:year(n.first_publish_date),genres:(n.subjects??[]).slice(0,12).map((x:any)=>text(x,100)).filter((x:any):x is string=>typeof x==="string"&&x.length>0),creators:[],cast:[],studios:[],countries:[],externalUrl:`https://openlibrary.org/works/${providerId}`};
 }
 throw new ProviderError("Metadata refresh is not available for this provider yet.",400,provider);
}

export function providerStatus() {
  return { mal:!!process.env.MAL_CLIENT_ID, anilist:true, tmdb:!!process.env.TMDB_ACCESS_TOKEN, googleBooks:!!process.env.GOOGLE_BOOKS_API_KEY, openLibrary:true, comicVine:!!process.env.COMICVINE_API_KEY, nytBooks:!!process.env.NYT_BOOKS_API_KEY };
}

export async function searchEntertainment(q:string,type:MediaType,credentials:ProviderCredentials={},language="en"):Promise<MediaSearchResult[]> {
  const key=`${language}:${type}:${q.toLowerCase()}`; const hit=cache.get(key); if(hit&&Date.now()-hit.at<CACHE_TTL)return hit.data;
  let data:MediaSearchResult[];
  if(type==="anime")data=await searchMal(q,credentials);
  else if(type==="manga")data=await searchAniListManga(q);
  else if(type==="movie"||type==="series")data=await searchTmdb(q,type,credentials,providerLocale(language));
  else if(type==="comic")data=await searchComicVine(q,credentials,language);
  else data=await searchGoogleBooks(q,"book",credentials,language);
  const clean=data.slice(0,12); cache.set(key,{at:Date.now(),data:clean}); return clean;
}
