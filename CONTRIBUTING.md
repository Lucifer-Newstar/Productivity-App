# Contributing to Kaizen

Thank you for helping improve Kaizen.

## Before contributing

- Read [`README.md`](README.md), [`docs/architecture/DECISIONS.md`](docs/architecture/DECISIONS.md), and [`docs/guides/CONTRIBUTING.md`](docs/guides/CONTRIBUTING.md).
- Never include credentials, `.env` files, personal Kaizen records, private documents, machine identifiers, home paths, pairing codes, raw AI artifacts, model weights or generated release artifacts.
- Keep AI read-only and deterministic. Health AI, AI writes, memory, retrieval, remote providers, cloud deployment and model execution are outside the current release scope.
- Discuss architecture changes before implementation and add an ADR when a locked boundary changes.

## Development

External contributors should work in a fork and submit a focused pull request to `main`. Repository maintainers may apply final release fixes directly to `main` while the project is in release closeout.

Use conventional commits and synchronize implementation, tests and documentation. Run the relevant commands in [`docs/guides/TESTING.md`](docs/guides/TESTING.md), including privacy, documentation and diff checks.

## Pull requests

A pull request should explain:

1. the problem and scope;
2. architecture/security effects;
3. tests executed and results;
4. documentation changed;
5. screenshots for visible UI changes;
6. any deferred verification.

Do not weaken a gate to make a change pass. Releases are produced only by the gated continuous-delivery workflow described in [`docs/guides/CONTINUOUS-DELIVERY.md`](docs/guides/CONTINUOUS-DELIVERY.md).
