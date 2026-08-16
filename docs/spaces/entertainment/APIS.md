# Entertainment — provider decision

_Decided 2026-08-16. Wave 2 adapter/search implementation is in progress._

All upstream calls go through same-origin `/api/entertainment/*` adapters. Implemented endpoints are `GET /api/entertainment/search?q=…&type=…`, `GET /api/entertainment/providers` and the internal allowlisted `GET /api/entertainment/image?url=…` proxy. Provider credentials must remain server-side; the browser receives a normalized result and never chooses an arbitrary upstream URL. Adapters will validate queries, enforce timeouts, cache slow-changing metadata, respect `429`/`Retry-After`, strip provider HTML and map failures to bounded errors.

## Providers

| Domain | Primary | Fallback | Intended data |
|---|---|---|---|
| Anime | MyAnimeList API v2 | Manual entry | Search, details, episodes, studios, season, source, rankings, related titles |
| Manga/light novels | AniList GraphQL | Manual entry | Chapters, volumes, staff, tags, relations, recommendations, trending |
| Movies | TMDB API v3 | Manual entry | Details, credits, directors, releases, collections, images, recommendations, trending |
| TV series | TMDB API v3 | Manual entry | Seasons, episodes, networks, providers, credits, schedules |
| Books | Google Books API v1 | Open Library | Authors, editions, ISBN, page count, publisher, categories, descriptions, covers |
| Western comics | Comic Vine | Google Books/manual | Issues, volumes, publishers, creators, characters, arcs |
| Book discovery | NYT Books | Google Books | Current weekly/monthly Best Seller lists |

## Credentials

```env
MAL_CLIENT_ID=
TMDB_ACCESS_TOKEN=
GOOGLE_BOOKS_API_KEY=
COMICVINE_API_KEY=
NYT_BOOKS_API_KEY=
```

AniList and Open Library public catalogue access do not require an application key. MyAnimeList account list sync is not part of catalogue search; a later import/sync wave may add OAuth PKCE.

Feature 92 (bring your own key) will use explicit, temporary session-only overrides. Keys must never enter `kaizen.entertainment`, exports, logs or URLs returned to the UI. Server environment credentials are the supported deployment configuration.

## Provider constraints

- **MAL:** use a registered client ID and the official v2 endpoints. Account mutations require OAuth; Kaizen remains the local source of truth in v1.
- **AniList:** budget at 25 requests/minute because its documented 90/minute service has previously entered a degraded 30/minute mode. Use GraphQL field selection and cache.
- **TMDB:** handle 429s and include the required Credits/About notice: “This product uses the TMDB API but is not endorsed or certified by TMDB.” Include the TMDB logo without implying endorsement.
- **Google Books:** public requests use an API key. Open Library fills ISBN/older-edition gaps; prefer Cover IDs/OLIDs over rate-limited ISBN cover URLs.
- **Comic Vine:** non-commercial use only, 200 requests/resource/hour plus velocity detection. Limit to 1 request/second and cache. Revisit licensing before any commercial release.
- **NYT Books:** used only for bestseller discovery, not general search.

## Normalized search result

Provider payloads map to a common result before entering the library:

```ts
interface MediaSearchResult {
  provider: "mal" | "anilist" | "tmdb" | "google-books" |
    "open-library" | "comic-vine" | "nyt";
  providerId: string;
  mediaType: "book" | "comic" | "manga" | "movie" | "series" | "anime";
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
```

Personal ratings, progress, reviews, notes, favorites, repeats and collections are never overwritten by a metadata refresh.

## Official references

- MAL: https://myanimelist.net/apiconfig/references/api/v2
- AniList: https://docs.anilist.co/guide/graphql/
- AniList limits: https://docs.anilist.co/guide/rate-limiting
- TMDB: https://developer.themoviedb.org/docs/getting-started
- TMDB attribution: https://developer.themoviedb.org/docs/faq
- Google Books: https://developers.google.com/books/docs/v1/using
- Open Library: https://openlibrary.org/developers/api
- Comic Vine: https://comicvine.gamespot.com/api/
- NYT Books: https://developer.nytimes.com/docs/books-product/1/overview
