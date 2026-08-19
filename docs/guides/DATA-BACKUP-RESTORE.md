# Data backup and restore

## Data ownership

Kaizen v1 is browser-authoritative under ADR-012. Clearing browser site data removes product records unless a backup was exported.

## Whole-product backup

Open Notification Center → **Local data recovery** (database icon).

**Export backup** writes one versioned `KAIZEN-LOCAL-BACKUP` JSON containing the eleven authoritative keys:

```text
kaizen.tasks       kaizen.notes          kaizen.career
kaizen.workout     kaizen.forge          kaizen.health
kaizen.entertainment  kaizen.notifications
kaizen.habits      kaizen.focus        kaizen.theme
```

It excludes AI pairing/session tokens, provider session overrides, revision metadata and evaluation data.

**Restore backup** validates classification/version, exact keys, total/per-value size, JSON shape, nesting/entry budgets, unsafe object keys and theme values. Restore is all-or-rollback across the authoritative keys, then reloads the application.

Store real backups in an encrypted user-controlled location. Never commit or paste them into public chat.

## Corruption and quota recovery

If persisted JSON cannot be parsed, Kaizen does not overwrite the affected key with defaults. The global warning identifies the key and opens Local data recovery. Restore a known backup, export unaffected data where possible, or clear only the confirmed corrupt key after recovery.

When storage quota is full:

1. Export a whole-product backup before refreshing.
2. Remove old progress photos, fan art, cosplay photos or mood-board images.
3. Confirm a small edit persists.
4. Do not clear site data until the backup is verified in a separate browser profile.

## Per-space formats

The following remain useful for portability rather than whole-product recovery:

- Workout session CSV import/export
- Forge JSON plus task/project CSV
- Health daily CSV and Health JSON export
- Entertainment schema-v6 JSON restore, CSV export and provider-format imports

## Restore trust model

Treat every backup as untrusted input. Whole-product restore accepts only the exact v1 envelope and raw persisted values that independently pass validation. Per-space imports retain their own record/image/formula limits.

## Release durability gate

`npm run qa:backup` proves complete-key export, session-secret exclusion, strict validation, exact restore and rollback after simulated storage failure. Hosted CI must pass this suite before release.