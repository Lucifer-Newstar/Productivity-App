# Browser persistence keys

## localStorage

| Key | Contents | Migration |
|---|---|---|
| `kaizen.tasks` | Core tasks | Empty fresh profile |
| `kaizen.notes` | Core notes | Empty fresh profile |
| `kaizen.career` | Career state | `migrateCareer` |
| `kaizen.workout` | Workout state | `migrateWorkout` |
| `kaizen.forge` | Forge state | `migrateForge` |
| `kaizen.health` | Health state | `migrateHealth` |
| `kaizen.entertainment` | Entertainment schema v6 | `migrateEntertainment` |
| `kaizen.notifications` | Global inbox/settings schema v2 | `migrateNotifications` |
| `kaizen.habits` | Home habits | Empty + history normalization |
| `kaizen.focus` | Completed focus cycles/minutes | Bounded component validation |
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

Root persistence, Habits and Focus catch quota exceptions and dispatch `kaizen:storage-error`. Corrupt root JSON blocks writes for that slice instead of overwriting data and opens whole-product recovery. The versioned backup covers the eleven authoritative keys.

## Privacy

Desktop storage is not encrypted. Treat the Windows account and Kaizen Electron profile as the security boundary. Do not use Kaizen from an untrusted shared account for sensitive health, journal or social records.
