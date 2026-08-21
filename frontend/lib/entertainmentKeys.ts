/**
 * AFTERGLOW catalogue credentials — sessionStorage only.
 *
 * Same contract as Providers & Credits: keys never enter kaizen.entertainment,
 * kaizen.profile, backups, logs or returned URLs. The Profile Glow tab and the
 * Entertainment modal both read/write these keys.
 */
export const AFTERGLOW_SESSION_KEYS = {
  mal: "afterglow.key.mal",
  tmdb: "afterglow.key.tmdb",
  googleBooks: "afterglow.key.google",
  comicVine: "afterglow.key.comicvine",
  nytBooks: "afterglow.key.nyt",
} as const;

export type AfterglowKeyId = keyof typeof AFTERGLOW_SESSION_KEYS;

export const AFTERGLOW_KEY_HEADERS: Record<AfterglowKeyId, string> = {
  mal: "x-afterglow-mal",
  tmdb: "x-afterglow-tmdb",
  googleBooks: "x-afterglow-google-books",
  comicVine: "x-afterglow-comic-vine",
  nytBooks: "x-afterglow-nyt-books",
};

export interface AfterglowKeyField {
  id: AfterglowKeyId;
  label: string;
  env: string;
  helpUrl: string;
  help: string;
}

export const AFTERGLOW_KEY_FIELDS: AfterglowKeyField[] = [
  {
    id: "mal",
    label: "MyAnimeList client ID",
    env: "MAL_CLIENT_ID",
    helpUrl: "https://myanimelist.net/apiconfig/references/api/v2",
    help: "Register an API client at myanimelist.net/apiconfig and paste the Client ID. MAL account list sync is not part of catalogue search.",
  },
  {
    id: "tmdb",
    label: "TMDB read access token",
    env: "TMDB_ACCESS_TOKEN",
    helpUrl: "https://developer.themoviedb.org/docs/getting-started",
    help: "Create a TMDB developer account, then copy the API Read Access Token (Bearer). Kaizen uses TMDB but is not endorsed or certified by TMDB.",
  },
  {
    id: "googleBooks",
    label: "Google Books API key",
    env: "GOOGLE_BOOKS_API_KEY",
    helpUrl: "https://developers.google.com/books/docs/v1/using",
    help: "Enable the Books API in Google Cloud and create a restricted API key. Open Library covers titles when this key is empty.",
  },
  {
    id: "comicVine",
    label: "Comic Vine API key",
    env: "COMICVINE_API_KEY",
    helpUrl: "https://comicvine.gamespot.com/api/",
    help: "Request a Comic Vine key from Gamespot. Non-commercial use only, with a 1 request/second budget.",
  },
  {
    id: "nytBooks",
    label: "NYT Books API key",
    env: "NYT_BOOKS_API_KEY",
    helpUrl: "https://developer.nytimes.com/docs/books-product/1/overview",
    help: "Create a New York Times Developer account and enable the Books API. Used only for bestseller discovery, not general search.",
  },
];

export function emptyAfterglowKeyDraft(): Record<AfterglowKeyId, string> {
  return { mal: "", tmdb: "", googleBooks: "", comicVine: "", nytBooks: "" };
}

export function readAfterglowSessionKeys(): Record<AfterglowKeyId, string> {
  const next = emptyAfterglowKeyDraft();
  if (typeof window === "undefined") return next;
  for (const id of Object.keys(AFTERGLOW_SESSION_KEYS) as AfterglowKeyId[]) {
    next[id] = sessionStorage.getItem(AFTERGLOW_SESSION_KEYS[id]) ?? "";
  }
  return next;
}

export function writeAfterglowSessionKeys(keys: Record<string, string>): void {
  if (typeof window === "undefined") return;
  for (const id of Object.keys(AFTERGLOW_SESSION_KEYS) as AfterglowKeyId[]) {
    const value = (keys[id] ?? "").trim();
    if (value) sessionStorage.setItem(AFTERGLOW_SESSION_KEYS[id], value);
    else sessionStorage.removeItem(AFTERGLOW_SESSION_KEYS[id]);
  }
}

export function clearAfterglowSessionKeys(): void {
  if (typeof window === "undefined") return;
  for (const storage of Object.values(AFTERGLOW_SESSION_KEYS)) sessionStorage.removeItem(storage);
}

export function afterglowProviderHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const out: Record<string, string> = {};
  for (const id of Object.keys(AFTERGLOW_KEY_HEADERS) as AfterglowKeyId[]) {
    const value = sessionStorage.getItem(AFTERGLOW_SESSION_KEYS[id]);
    if (value) out[AFTERGLOW_KEY_HEADERS[id]] = value;
  }
  return out;
}
