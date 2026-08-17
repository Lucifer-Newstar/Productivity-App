# Home QA

_Current baseline: 2026-08-16._

- [x] `/` production response HTTP 200
- [x] App Router production prerender succeeds
- [x] Theme and Store providers mount
- [x] StorageErrorBanner mounts in App Router layout
- [x] SideNav exposes Dashboard, Tasks, Pomodoro, Notes, Habits and Calendar
- [x] Space cards link to all five dedicated product spaces
- [x] Core task and note persistence use separate keys
- [x] Habits persistence catches storage quota failures
- [x] CSP and global security headers apply to `/`
- [x] Space navigation uses semantic Lucide icons, not emoji metadata
- [x] Control System dark and Daily Edition light themes are structurally distinct
- [x] Direction-aware transitions and reduced-motion fallback are present
- [x] Self-hosted font families load without a runtime CDN

Home is covered by the global TypeScript, ESLint, build, dependency audit and route-smoke gates in [`../../guides/TESTING.md`](../../guides/TESTING.md).
