# Security policy

## Supported version

The latest published v1.x release receives security fixes. Historical development snapshots and archived AI evaluation harnesses are not supported release runtimes.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting or a private security advisory for this repository. Do not open a public issue for an unpatched vulnerability.

Include the affected version, component, reproduction steps, impact and a minimal synthetic proof. Do not submit credentials, `.env` files, pairing/session tokens, personal Kaizen exports, real Health/Career records, private documents, usernames, home paths, hostnames or raw service logs.

## Security boundaries

- Kaizen is a local single-user application and trusts the Windows account and browser profile.
- Browser records are local and unencrypted; exported backups must be protected by the user.
- Packaged services bind to loopback.
- The installed update checker reads only public release metadata from the fixed official GitHub repository.
- Kaizen does not silently execute downloaded installers.
- No cloud account, remote AI provider, model runtime, AI memory, Health AI or AI write automation is included.

Public fixes should include regression tests and sanitized disclosure only after a corrected release is available.
