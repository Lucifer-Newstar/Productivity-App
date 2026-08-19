# Kaizen

Kaizen is a local-first personal operating system for productivity, projects, career development, training, health and entertainment. The browser remains authoritative; optional local services add sync/reference APIs and a read-only Intelligence foundation without taking ownership of user state.

## Product spaces

| Space | Route family | Purpose |
|---|---|---|
| Home | `/` | Command Center, tasks, focus, notes, habits and calendar |
| Forge | `/projects/*` | Projects, execution, strategy canvases and retrospectives |
| Career | `/career/*` | Roadmaps, skills, jobs, network, portfolio and daily workflow |
| Workout | `/workout/*` | Training sessions, progression, PRs, planning and analytics |
| VITAL-SIGN | `/health/*` | Sleep, hydration, nutrition, recovery, vitals and reports |
| AFTERGLOW | `/entertainment` | Local media library, discovery, tracking, social and studio tools |

## Architecture

```text
Next.js 16 / React 19 browser application
  ├── React Context domain store
  ├── slice-specific local persistence
  ├── deterministic analytics and notifications
  ├── App Router Home and fixed server routes
  └── Pages Router full-screen product spaces

Optional Express reference API — 127.0.0.1:4000
Optional Intelligence Engine — 127.0.0.1:4317
```

The Intelligence Engine is currently v0.1.1 and read-only. Deterministic Core Today is the authoritative application AI path; model configuration fails closed, and no local model is selected.

## Repository

```text
frontend/   Next.js application and browser-authoritative state
backend/    Optional in-memory Express reference/sync API
ai/         Independent Intelligence Engine and Wave 0 validation harness
docs/       Architecture, reference, security, design, guides and reports
```

Workspace-specific setup:

- [`frontend/README.md`](frontend/README.md)
- [`backend/README.md`](backend/README.md)
- [`ai/README.md`](ai/README.md)
- [`docs/README.md`](docs/README.md)

## Quick start

Requirements: Node.js 20.9+, npm and Git.

```bash
git clone https://github.com/Lucifer-Newstar/Productivity-App.git
cd Productivity-App

cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend works without either optional service.

Optional services:

```bash
# Express reference API
cd backend
npm ci
npm run dev

# Intelligence Engine with deterministic local provider
cd ai
npm ci
npm run dev
```

The Intelligence Engine prints a one-time pairing code to its local console. Enter it only in the Home Intelligence panel.

## Windows installer and updates

The verified Windows x64 setup bundles the standalone frontend, deterministic Intelligence Engine and pinned Node runtime. It installs per user, creates branded shortcuts and registers an uninstaller. Browser records remain in the trusted browser profile at `http://127.0.0.1:3000` and are preserved across setup upgrades and uninstall.

After a newer stable GitHub Release is published, an installed packaged build creates a system notification with a local **Download update** action. The user stops Kaizen and runs the downloaded setup, which upgrades the existing installation through the stable installer identity. Kaizen does not silently execute installers or upload personal data.

Every successful `main` CI run automatically builds and verifies a private candidate installer artifact. Only an intentional annotated semantic-version tag that passes provenance, privacy, exact-main CI, release-note and Windows install/verify/uninstall gates publishes an open-source GitHub Release.

See [`docs/guides/WINDOWS-INSTALLATION.md`](docs/guides/WINDOWS-INSTALLATION.md) and [`docs/guides/CONTINUOUS-DELIVERY.md`](docs/guides/CONTINUOUS-DELIVERY.md).

## Quality gates

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run qa:ai
npm run qa:comments
npm run qa:docs
npm run build
npm audit --omit=dev

cd ../backend
npm run build
npm audit --omit=dev

cd ../ai
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

The complete test matrix is in [`docs/guides/TESTING.md`](docs/guides/TESTING.md).

## Documentation

Start with:

- [`docs/PROJECT-CONTINUITY-BLUEPRINT.md`](docs/PROJECT-CONTINUITY-BLUEPRINT.md) — history, current architecture, remaining path and crash-safe handoff
- [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md)
- [`docs/architecture/DATA-MODEL.md`](docs/architecture/DATA-MODEL.md)
- [`docs/reference/API.md`](docs/reference/API.md)
- [`docs/reference/FEATURES.md`](docs/reference/FEATURES.md)
- [`docs/security/SECURITY.md`](docs/security/SECURITY.md)
- [`docs/ai/MASTER-SPECIFICATION.md`](docs/ai/MASTER-SPECIFICATION.md)
- [`docs/ai/IMPLEMENTATION-LEDGER.md`](docs/ai/IMPLEMENTATION-LEDGER.md)

## Security and privacy

- Browser storage is local and unencrypted; use a trusted browser profile.
- External catalogue access uses fixed server-side adapters and allowlists.
- Optional services bind to loopback by default.
- Never commit secrets, personal exports, model weights or raw benchmark data.
- Raw AI validation artifacts stay in ignored `ai/wave0/results-local/`; only sanitized aggregates may enter Git.

See [`docs/security/SECURITY.md`](docs/security/SECURITY.md) and [`docs/ai/PRIVACY.md`](docs/ai/PRIVACY.md).

## Open-source participation

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Report vulnerabilities privately using [SECURITY.md](SECURITY.md).
- Use synthetic, non-sensitive data in issues, screenshots and tests.

## License

Kaizen is available under the [ISC License](LICENSE). Release binaries remain subject to the licenses and terms of bundled runtimes and optional metadata providers.
