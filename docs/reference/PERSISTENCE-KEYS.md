# Browser persistence keys

## localStorage

| Key | Contents | Migration |
|---|---|---|
| `kaizen.tasks` | Core tasks | Seed fallback |
| `kaizen.notes` | Core notes | Seed fallback |
| `kaizen.career` | Career state | `migrateCareer` |
| `kaizen.workout` | Workout state | `migrateWorkout` |
| `kaizen.forge` | Forge state | `migrateForge` |
| `kaizen.health` | Health state | `migrateHealth` |
| `kaizen.entertainment` | Entertainment schema v6 | `migrateEntertainment` |
| `kaizen.notifications` | Global inbox/settings schema v1 | `migrateNotifications` |
| `kaizen.habits` | Home habits | Component seed fallback |
| `kaizen.theme` | `dark` or `light` | Preference validation |
| `kaizen.bw.ack` | Workout bodyweight prompt acknowledgement | Date string |
| `afterglow.notice.<item>.<date>` | Local notification de-duplication | Best effort |

Legacy `prod.*` keys are removed by the root store migration effect.

## sessionStorage

| Key | Purpose |
|---|---|
| `kaizen.career.booted` | Career boot-animation acknowledgement |
| `afterglow.key.mal` | Session-only MAL override |
| `afterglow.key.tmdb` | Session-only TMDB override |
| `afterglow.key.google` | Session-only Google Books override |
| `afterglow.key.comicvine` | Session-only Comic Vine override |
| `afterglow.key.nyt` | Session-only NYT override |

Session provider values are never included in root state or exports. They are still readable by same-origin JavaScript and are not a secure vault.

## Storage failure behavior

Root persistence and Habits catch quota exceptions and dispatch `kaizen:storage-error`. `StorageErrorBanner` warns the user to export a backup and remove large raster media.

## Privacy

Browser storage is not encrypted. Treat the browser profile as the security boundary. Do not use Kaizen on an untrusted shared profile for sensitive health, journal or social records.
