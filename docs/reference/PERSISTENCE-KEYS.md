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

## Intelligence Engine v0.1 metadata

| Storage | Key | Contents |
|---|---|---|
| localStorage | `kaizen.ai.bridge-revisions` | Installation epoch, per-domain counters and non-reversible fingerprints; no domain records |
| localStorage | `kaizen.ai.bridge-writer` | Short single-writer lease owner/expiry |
| sessionStorage | `kaizen.ai.bridge-owner` | Random tab/session bridge owner ID |
| sessionStorage | `kaizen.ai.session` | Expiring local engine bearer token |

These keys are transport/revision metadata, not AI memory. No conversation, prompt, response, model secret, Health record or domain snapshot is persisted. The planned AI memory store remains unimplemented and separate.

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
