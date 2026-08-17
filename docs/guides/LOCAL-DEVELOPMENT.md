# Local development

## Requirements

- Node.js 20.9 or newer (required by Next.js 16)
- npm
- Git

## Install

```bash
git clone https://github.com/Lucifer-Newstar/Productivity-App.git
cd Productivity-App

cd frontend && npm ci
cd ../backend && npm ci
```

## Run the frontend

```bash
cd frontend
npm run dev
# http://localhost:3000
```

The frontend is fully usable without Express. State persists in the browser.

## Run the optional Express API

```bash
cd backend
npm run dev
# http://127.0.0.1:4000
```

The API is in-memory and resets when the process restarts. Set `KAIZEN_API_KEY` when testing protected routes:

```bash
KAIZEN_API_KEY=development-only-secret npm run dev
```

## Run the Intelligence Engine v0.1

For a deterministic end-to-end development flow:

```bash
cd ai
npm ci
KAIZEN_AI_PROVIDER=mock npm run dev
```

The local console prints a one-time pairing code. Enter it in the Home dashboard's Kaizen Intelligence panel. For a verified llama.cpp candidate, configure the loopback variables in [`CONFIGURATION.md`](CONFIGURATION.md); Kaizen never downloads a model.

## Production-mode local run

```bash
cd frontend
npm run build
npm run start -- -H 0.0.0.0 -p 3000

cd ../backend
npm run build
KAIZEN_API_KEY=development-only-secret npm start
```

## Git identity

Configure the repository-owner identity locally and verify it before committing. Do not place personal email addresses, tokens or credentials in tracked setup documentation.

## Common problems

### `node_modules` is missing

Generated dependency folders are not persisted in some sandbox snapshots. Run `npm ci` again in the affected workspace.

### Port already in use

Stop the previous preview process or choose another port. Do not launch multiple `next start` processes on port 3000.

### Provider says “not configured”

See [`CONFIGURATION.md`](CONFIGURATION.md). AniList and Open Library public lookups work without credentials; other sources need server environment values or AFTERGLOW session-only overrides.

### Browser changes are not persisting

A global warning appears when localStorage is full. Export a backup and remove large image records; see [`DATA-BACKUP-RESTORE.md`](DATA-BACKUP-RESTORE.md).
