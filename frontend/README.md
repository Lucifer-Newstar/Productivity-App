# Kaizen Frontend

The browser-authoritative Kaizen application, built with Next.js 16, React 19, TypeScript, Tailwind CSS 3, Framer Motion and Lucide icons.

## Responsibilities

- Home Command Center and core productivity tools
- Full-screen Forge, Career, Workout, Health and AFTERGLOW spaces
- React Context domain state with defensive local migrations
- Deterministic cross-space analytics and notifications
- Fixed same-origin provider and Intelligence Engine proxy routes
- Local-first operation without required backend services

## Run locally

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`.

Optional services are documented in the root [`README.md`](../README.md). The frontend remains usable when they are offline.

## Router layout

```text
app/
  page.tsx                    Home / App Router
  api/entertainment/*         fixed catalogue provider routes
  api/ai/[...path]            fixed loopback Intelligence proxy

pages/
  projects/*                  Forge
  career/*                    Career
  workout/*                   Workout
  health/*                    VITAL-SIGN
  entertainment/*             AFTERGLOW
```

Pages declaring `fullScreen = true` render their own space-specific navigation and visual system.

## State and persistence

`lib/store.tsx` owns the browser-authoritative Core, Forge, Career, Workout, Health, Entertainment and Notification slices. Functional mutators prevent stale-closure data loss. Home Habits and global theme use dedicated keys.

Persistence ownership and migration details:

- [`../docs/architecture/DATA-MODEL.md`](../docs/architecture/DATA-MODEL.md)
- [`../docs/reference/PERSISTENCE-KEYS.md`](../docs/reference/PERSISTENCE-KEYS.md)

## Visual systems

Each major space has a distinct dark/light identity while sharing accessible controls, semantic Lucide icons, self-hosted font packages and reduced-motion handling.

- [`../docs/design/THEME-SYSTEMS.md`](../docs/design/THEME-SYSTEMS.md)
- [`../docs/design/ICONOGRAPHY.md`](../docs/design/ICONOGRAPHY.md)
- [`../docs/design/MOTION.md`](../docs/design/MOTION.md)

## Quality gates

```bash
npx tsc --noEmit
npm run lint
npm run qa:ai
npm run qa:comments
npm run qa:csp
npm run qa:home
npm run qa:notifications
npm run qa:security
npm run qa:docs
node scripts/qa-health.js
npm run build
npm audit --omit=dev
```

Additional Entertainment suites are listed in [`../docs/guides/TESTING.md`](../docs/guides/TESTING.md).

## Security boundaries

- Do not place secrets in `NEXT_PUBLIC_*` variables.
- Do not render raw user HTML.
- Keep external URLs behind fixed server adapters.
- Keep restored images and imports bounded and revalidated.
- The AI proxy accepts no arbitrary upstream target.

See [`../docs/security/SECURITY.md`](../docs/security/SECURITY.md).
