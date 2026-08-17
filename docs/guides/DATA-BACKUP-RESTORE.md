# Data backup and restore

## Data ownership

Kaizen is local-first. Clearing browser site data removes frontend records unless they were exported.

## Built-in exports

### Workout

Workout tools export/import session CSV. Imports are bounded and normalized into local sessions.

### Forge

Vault supports:

- Full Forge JSON backup/replace restore
- Task CSV import/export
- Project CSV import/export

### Health

Reports exports:

- Daily-summary CSV
- Full Health JSON export

Health JSON is currently an export artifact; there is no full replacement-import UI.

### Entertainment

Archive/Data Vault supports:

- Full schema-v6 JSON backup
- Safe replacement restore with migration
- Formula-safe CSV export
- MAL XML/XML.GZ import
- AniList/Kitsu JSON import
- Trakt/Simkl CSV import

Entertainment restores reject unsafe object keys, oversized structures and invalid raster/proxy image sources.

## Recommended backup routine

1. Export Forge, Health, Workout and Entertainment after meaningful updates.
2. Store backups in an encrypted user-controlled location.
3. Do not commit real exports to Git; they can contain health, journal, social and provider-derived data.
4. Test restoration using a separate browser profile and synthetic data.

## Storage quota recovery

When the global “Local storage is full” warning appears:

1. Export all available backups before refreshing.
2. Remove old progress photos, fan art, cosplay photos or mood-board images.
3. Confirm the warning no longer appears after a small test edit.
4. Do not clear site data until backups are verified.

## Restore trust model

Treat backup files as untrusted input. Kaizen applies size, nesting, key, record, image and formula protections, but users should still import only expected formats from trusted sources.
