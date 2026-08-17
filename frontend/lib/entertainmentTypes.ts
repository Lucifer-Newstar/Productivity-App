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

export interface EntertainmentSettings {
  ratingScale: RatingScale;
  language: string;
  monthlyRollover: boolean;
  defaultView: EntertainmentView;
}

export interface EntertainmentState {
  schemaVersion: 5;
  items: EntertainmentItem[];
  collections: EntertainmentCollection[];
  events: EntertainmentEvent[];
  friends: EntertainmentFriend[];
  recommendations: FriendRecommendation[];
  groups: SharedMediaGroup[];
  gifts: MediaGift[];
  loans: MediaLoan[];
  settings: EntertainmentSettings;
  lastRolloverMonth?: string;
}

const now = Date.now();
const day = 86_400_000;
export const SEED_ENTERTAINMENT: EntertainmentState = {
  schemaVersion: 5,
  items: [
    { id:"ent-dune",provider:"manual",type:"book",title:"Dune",description:"Politics, ecology and prophecy on Arrakis.",releaseYear:1965,genres:["Science Fiction"],creators:["Frank Herbert"],cast:[],studios:[],status:"in-progress",progress:{currentPage:286,totalPages:688},rating:9,startedAt:new Date(now-12*day).toISOString().slice(0,10),repeats:0,priority:"high",queueOrder:1,tags:["epic","desert","thoughtful"],format:"Paperback",language:"English",favorite:true,archived:false,minutesConsumed:420,createdAt:now-18*day,updatedAt:now-day},
    { id:"ent-shogun",provider:"manual",type:"series",title:"Shōgun",description:"Power and survival in feudal Japan.",releaseYear:2024,genres:["Drama","History"],creators:["Rachel Kondo","Justin Marks"],cast:[],studios:["FX"],status:"in-progress",progress:{currentEpisode:6,totalEpisodes:10,currentSeason:1,totalSeasons:1},rating:9,startedAt:new Date(now-8*day).toISOString().slice(0,10),repeats:0,priority:"medium",queueOrder:2,tags:["samurai","political","weekend"],format:"Streaming",language:"Japanese / English",favorite:false,archived:false,minutesConsumed:360,createdAt:now-10*day,updatedAt:now-2*day},
    { id:"ent-vinland",provider:"manual",type:"anime",title:"Vinland Saga",description:"A warrior searches for purpose beyond revenge.",releaseYear:2019,genres:["Action","Drama"],creators:["Makoto Yukimura"],cast:[],studios:["WIT Studio","MAPPA"],status:"completed",progress:{currentEpisode:48,totalEpisodes:48,currentSeason:2,totalSeasons:2},rating:10,completedAt:new Date(now-20*day).toISOString().slice(0,10),repeats:1,priority:"medium",queueOrder:3,tags:["historical","seinen","growth"],format:"Subbed",language:"Japanese",favorite:true,archived:false,minutesConsumed:1152,createdAt:now-80*day,updatedAt:now-20*day},
    { id:"ent-batman",provider:"manual",type:"comic",title:"Batman: The Long Halloween",description:"A year-long mystery reshapes Gotham.",releaseYear:1996,genres:["Crime","Mystery"],creators:["Jeph Loeb","Tim Sale"],cast:[],studios:["DC Comics"],status:"planned",progress:{currentChapter:0,totalChapters:13},repeats:0,priority:"high",queueOrder:4,tags:["noir","gotham"],format:"Deluxe Hardcover",language:"English",favorite:false,archived:false,createdAt:now-5*day,updatedAt:now-5*day},
    { id:"ent-vagabond",provider:"manual",type:"manga",title:"Vagabond",description:"A swordsman's brutal road toward understanding strength.",releaseYear:1998,genres:["Historical","Drama"],creators:["Takehiko Inoue"],cast:[],studios:["Kodansha"],status:"paused",progress:{currentChapter:120,totalChapters:327,currentVolume:14,totalVolumes:37},rating:9,repeats:0,priority:"low",queueOrder:5,tags:["samurai","art","seinen"],format:"Digital",language:"English",favorite:false,archived:false,minutesConsumed:600,createdAt:now-45*day,updatedAt:now-14*day},
    { id:"ent-perfect-blue",provider:"manual",type:"movie",title:"Perfect Blue",description:"Identity fractures under fame and obsession.",releaseYear:1997,genres:["Thriller","Animation"],creators:["Satoshi Kon"],cast:[],studios:["Madhouse"],status:"planned",progress:{watched:false},repeats:0,priority:"medium",queueOrder:5,tags:["psychological","night"],format:"Streaming",language:"Japanese",favorite:false,archived:false,createdAt:now-3*day,updatedAt:now-3*day},
  ],
  collections: [],
  events: [],
  friends: [],
  recommendations: [],
  groups: [],
  gifts: [],
  loans: [],
  settings: { ratingScale:"ten", language:"en", monthlyRollover:true, defaultView:"dashboard" },
};

export function migrateEntertainment(raw: Partial<EntertainmentState> | null | undefined): EntertainmentState {
  if (!raw || typeof raw !== "object") return SEED_ENTERTAINMENT;
  return {
    schemaVersion: 5,
    items: Array.isArray(raw.items) ? raw.items.map((item) => ({
      ...item,
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
    settings: { ...SEED_ENTERTAINMENT.settings, ...(raw.settings ?? {}) },
    lastRolloverMonth: raw.lastRolloverMonth,
  };
}

export const MEDIA_TYPE_LABELS: Record<MediaType,string> = { book:"Books",comic:"Comics",manga:"Manga",movie:"Movies",series:"Series",anime:"Anime" };
export const MEDIA_TYPE_ICONS: Record<MediaType,string> = { book:"B",comic:"C",manga:"M",movie:"◆",series:"S",anime:"A" };
