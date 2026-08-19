import type { EntertainmentLanguage } from "./entertainmentI18n";
import { safeImageDataUrl, safeProxiedImageUrl } from "./security";

export type MediaType = "book" | "comic" | "manga" | "movie" | "series" | "anime";
export type MediaStatus = "planned" | "in-progress" | "completed" | "paused" | "dropped";
export type MediaPriority = "high" | "medium" | "low";
export type RatingScale = "ten" | "five";
export type EntertainmentView = "dashboard" | "library" | "collections" | "calendar" | "history" | "archive" | "discover" | "stats" | "social" | "studio";

export interface MediaSearchResult {
  provider: Exclude<NonNullable<EntertainmentItem["provider"]>, "manual">;
  providerId: string;
  mediaType: MediaType;
  title: string;
  originalTitle?: string;
  alternateTitles: string[];
  description?: string;
  coverUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  genres: string[];
  creators: string[];
  cast: string[];
  studios: string[];
  countries: string[];
  language?: string;
  runtimeMinutes?: number;
  totalPages?: number;
  totalChapters?: number;
  totalVolumes?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
  sourceMaterial?: string;
  externalUrl?: string;
}

export interface MediaProgress {
  currentPage?: number;
  totalPages?: number;
  currentChapter?: number;
  totalChapters?: number;
  currentVolume?: number;
  totalVolumes?: number;
  currentEpisode?: number;
  totalEpisodes?: number;
  currentSeason?: number;
  totalSeasons?: number;
  watched?: boolean;
}

export interface ReadingLog { id:string;date:string;pages:number;minutes:number }
export interface VolumeState { number:number;owned:boolean;read:boolean }
export interface SeasonState { season:number;totalEpisodes?:number;watchedEpisodes:number[];episodeRatings:Record<string,number> }
export interface EpisodeWatchLog { id:string;date:string;season:number;episode:number }
export interface BookDetails { readingFormat?:string;edition?:string;narrator?:string;narrationRating?:number;readingLogs:ReadingLog[] }
export interface ComicDetails { readingFormat?:string;volumes:VolumeState[] }
export interface SeriesDetails { platform?:string;audioMode?:"subbed"|"dubbed"|"original";seasons:SeasonState[];episodeLogs:EpisodeWatchLog[];notificationsEnabled?:boolean }
export interface MovieDetails { venue?:string;version?:string;cinematographyRating?:number;actingRating?:number }
export interface AnimeDetails { audioMode?:"subbed"|"dubbed";sourceMaterial?:string;voiceActors:string[];openingSong?:string;endingSong?:string;likedOpening?:boolean;likedEnding?:boolean }

export interface EntertainmentItem {
  id: string;
  provider?: "mal" | "anilist" | "tmdb" | "google-books" | "open-library" | "comic-vine" | "nyt" | "trakt" | "simkl" | "kitsu" | "manual";
  providerId?: string;
  type: MediaType;
  title: string;
  originalTitle?: string;
  description?: string;
  coverDataUrl?: string;
  /** Same-origin provider image proxy URL; never an arbitrary remote URL. */
  coverUrl?: string;
  releaseDate?: string;
  releaseYear?: number;
  franchise?: string;
  franchiseOrder?: number;
  genres: string[];
  creators: string[];
  cast: string[];
  studios: string[];
  countries?: string[];
  favoriteCreatorNames?: string[];
  favoriteStudioNames?: string[];
  status: MediaStatus;
  progress: MediaProgress;
  rating?: number;
  review?: string;
  reviewContainsSpoilers?: boolean;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  scheduledFor?: string;
  repeats: number;
  priority: MediaPriority;
  queueOrder: number;
  tags: string[];
  format?: string;
  language?: string;
  favorite: boolean;
  archived: boolean;
  minutesConsumed?: number;
  purchasePrice?: number;
  droppedReason?: string;
  bookDetails?: BookDetails;
  comicDetails?: ComicDetails;
  seriesDetails?: SeriesDetails;
  movieDetails?: MovieDetails;
  animeDetails?: AnimeDetails;
  createdAt: number;
  updatedAt: number;
}

export interface EntertainmentCollection {
  id: string;
  name: string;
  description?: string;
  itemIds: string[];
  color: string;
  createdAt: number;
}

export type EntertainmentEventType = "added" | "started" | "progress" | "completed" | "paused" | "dropped" | "repeated" | "rated" | "updated" | "archived" | "restored" | "rollover";
export interface EntertainmentEvent {
  id: string;
  itemId: string;
  type: EntertainmentEventType;
  at: number;
  detail?: string;
}

export interface EntertainmentFriend { id:string;name:string;ratings:Record<string,number>;createdAt:number }
export interface FriendRecommendation { id:string;itemId:string;friendId:string;note?:string;createdAt:number }
export interface SharedMediaGroup { id:string;name:string;memberNames:string[];itemIds:string[];createdAt:number }
export interface MediaGift { id:string;itemId:string;person:string;giftedAt:string;liked?:boolean;note?:string }
export interface MediaLoan { id:string;itemId:string;person:string;direction:"lent"|"borrowed";loanedAt:string;dueAt?:string;returnedAt?:string }

export interface ReviewDraft { id:string;itemId:string;title:string;body:string;template:"short"|"long"|"spoiler-free"|"bullets";spoiler:boolean;status:"draft"|"published";updatedAt:number }
export interface FanArtEntry { id:string;itemId:string;title:string;imageDataUrl:string;notes?:string;createdAt:number }
export interface FanFictionEntry { id:string;itemId:string;title:string;wordCount:number;genre?:string;status:"idea"|"drafting"|"complete";notes?:string;updatedAt:number }
export interface CosplayEntry { id:string;itemId:string;character:string;progress:number;photoDataUrls:string[];notes?:string;updatedAt:number }
export interface QuoteEntry { id:string;itemId:string;text:string;speaker?:string;tags:string[];createdAt:number }
export interface MoodBoardTile { id:string;type:"image"|"quote";content:string;createdAt:number }
export interface MoodBoard { id:string;itemId:string;title:string;tiles:MoodBoardTile[];createdAt:number }
export interface DreamCastEntry { id:string;itemId:string;character:string;actor:string;note?:string }
export interface WhatIfEntry { id:string;itemId:string;title:string;kind:"what-if"|"alternate-ending";scenario:string;updatedAt:number }

export interface EntertainmentSettings {
  ratingScale: RatingScale;
  language: EntertainmentLanguage;
  monthlyRollover: boolean;
  defaultView: EntertainmentView;
}

export interface EntertainmentState {
  schemaVersion: 6;
  items: EntertainmentItem[];
  collections: EntertainmentCollection[];
  events: EntertainmentEvent[];
  friends: EntertainmentFriend[];
  recommendations: FriendRecommendation[];
  groups: SharedMediaGroup[];
  gifts: MediaGift[];
  loans: MediaLoan[];
  reviewDrafts: ReviewDraft[];
  fanArt: FanArtEntry[];
  fanFiction: FanFictionEntry[];
  cosplay: CosplayEntry[];
  quotes: QuoteEntry[];
  moodBoards: MoodBoard[];
  dreamCast: DreamCastEntry[];
  whatIfs: WhatIfEntry[];
  settings: EntertainmentSettings;
  lastRolloverMonth?: string;
}

export const SEED_ENTERTAINMENT: EntertainmentState = {
  schemaVersion: 6,
  items: [],
  collections: [],
  events: [],
  friends: [],
  recommendations: [],
  groups: [],
  gifts: [],
  loans: [],
  reviewDrafts: [],
  fanArt: [],
  fanFiction: [],
  cosplay: [],
  quotes: [],
  moodBoards: [],
  dreamCast: [],
  whatIfs: [],
  settings: { ratingScale:"ten", language:"en", monthlyRollover:true, defaultView:"dashboard" },
};

export function migrateEntertainment(raw: Partial<EntertainmentState> | null | undefined): EntertainmentState {
  if (!raw || typeof raw !== "object") return SEED_ENTERTAINMENT;
  return {
    schemaVersion: 6,
    items: Array.isArray(raw.items) ? raw.items.map((item) => ({
      ...item,
      coverDataUrl: safeImageDataUrl(item.coverDataUrl),
      coverUrl: safeProxiedImageUrl(item.coverUrl),
      genres: Array.isArray(item.genres) ? item.genres : [],
      creators: Array.isArray(item.creators) ? item.creators : [],
      cast: Array.isArray(item.cast) ? item.cast : [],
      studios: Array.isArray(item.studios) ? item.studios : [],
      countries: Array.isArray(item.countries) ? item.countries : [],
      favoriteCreatorNames: Array.isArray(item.favoriteCreatorNames) ? item.favoriteCreatorNames : [],
      favoriteStudioNames: Array.isArray(item.favoriteStudioNames) ? item.favoriteStudioNames : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      progress: item.progress ?? {},
      repeats: item.repeats ?? 0,
      priority: item.priority ?? "medium",
      queueOrder: item.queueOrder ?? 0,
      favorite: item.favorite ?? false,
      archived: item.archived ?? false,
      bookDetails: item.type === "book" ? { readingLogs: [], ...(item.bookDetails ?? {}) } : item.bookDetails,
      comicDetails: item.type === "comic" || item.type === "manga" ? { volumes: [], ...(item.comicDetails ?? {}) } : item.comicDetails,
      seriesDetails: item.type === "series" || item.type === "anime" ? { seasons: [], episodeLogs: [], ...(item.seriesDetails ?? {}) } : item.seriesDetails,
      movieDetails: item.type === "movie" ? { ...(item.movieDetails ?? {}) } : item.movieDetails,
      animeDetails: item.type === "anime" ? { voiceActors: [], ...(item.animeDetails ?? {}) } : item.animeDetails,
      updatedAt: item.updatedAt ?? item.createdAt ?? Date.now(),
    })) as EntertainmentItem[] : SEED_ENTERTAINMENT.items,
    collections: Array.isArray(raw.collections) ? raw.collections : [],
    events: Array.isArray(raw.events) ? raw.events.slice(0, 5000) : [],
    friends: Array.isArray(raw.friends) ? raw.friends : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
    groups: Array.isArray(raw.groups) ? raw.groups : [],
    gifts: Array.isArray(raw.gifts) ? raw.gifts : [],
    loans: Array.isArray(raw.loans) ? raw.loans : [],
    reviewDrafts: Array.isArray(raw.reviewDrafts) ? raw.reviewDrafts : [],
    fanArt: Array.isArray(raw.fanArt) ? raw.fanArt.map(x=>({...x,imageDataUrl:safeImageDataUrl(x.imageDataUrl)})).filter((x):x is FanArtEntry=>!!x.imageDataUrl).slice(0,500) : [],
    fanFiction: Array.isArray(raw.fanFiction) ? raw.fanFiction.slice(0,2000) : [],
    cosplay: Array.isArray(raw.cosplay) ? raw.cosplay.map(x=>({...x,photoDataUrls:(Array.isArray(x.photoDataUrls)?x.photoDataUrls.map(safeImageDataUrl).filter((v):v is string=>!!v).slice(0,6):[])})).slice(0,500) : [],
    quotes: Array.isArray(raw.quotes) ? raw.quotes.slice(0,5000) : [],
    moodBoards: Array.isArray(raw.moodBoards) ? raw.moodBoards.map(b=>({...b,tiles:(Array.isArray(b.tiles)?b.tiles.filter(t=>t.type==="quote"||!!safeImageDataUrl(t.content)).map(t=>t.type==="image"?{...t,content:safeImageDataUrl(t.content)!}:t).slice(0,500):[])})).slice(0,500) : [],
    dreamCast: Array.isArray(raw.dreamCast) ? raw.dreamCast : [],
    whatIfs: Array.isArray(raw.whatIfs) ? raw.whatIfs : [],
    settings: { ...SEED_ENTERTAINMENT.settings, ...(raw.settings ?? {}), language: (["en","ta","hi"].includes(String(raw.settings?.language)) ? raw.settings!.language : "en") as EntertainmentLanguage },
    lastRolloverMonth: raw.lastRolloverMonth,
  };
}

export const MEDIA_TYPE_LABELS: Record<MediaType,string> = { book:"Books",comic:"Comics",manga:"Manga",movie:"Movies",series:"Series",anime:"Anime" };
export const MEDIA_TYPE_ICONS: Record<MediaType,string> = { book:"B",comic:"C",manga:"M",movie:"◆",series:"S",anime:"A" };
