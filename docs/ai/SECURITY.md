# Intelligence Engine security

## Threat model

Protect against malicious prompts/content, fabricated tool calls, unauthorized state access, stale or replayed actions, unsafe model artifacts, local-service exposure, resource exhaustion, secret leakage and privacy-boundary confusion.

## Content trust boundaries

**LOCKED DECISION**

```ts
type ContentTrust =
  | "system"
  | "kaizen-derived"
  | "user-authored"
  | "externally-imported";
```

Only trusted engine policy and the versioned Constitution define behavior. Kaizen-derived facts are authoritative data, not policy. User-authored and imported content are untrusted instructions.

Retrieved content cannot:

- change the Constitution or system policy,
- grant consent or permissions,
- activate tools,
- increase limits,
- approve actions,
- promote itself into memory,
- choose a provider or remote mode.

## Prompt-injection controls

- Serialize context in clearly delimited typed records with trust labels.
- Keep tool descriptions and policy outside retrieved content.
- Validate tool name, version, arguments, permission and record IDs in trusted code.
- Never expose arbitrary URL fetch, filesystem or shell tools.
- Treat job descriptions, notes, web/provider metadata and uploaded documents as data.
- Include adversarial fixtures in every prompt/model evaluation.

## Local service security

- Bind to loopback by default.
- Authenticate browser↔engine sessions with short-lived credentials.
- Restrict origins and methods.
- Apply request, context, stream and rate limits.
- Disable network exposure by default.
- Never rely on “localhost” as authentication.
- Do not weaken production CSP; production remains free of `unsafe-eval`.

**REQUIRES TECHNICAL SPIKE:** secure first-run pairing and transport choice.

## Model supply chain

Record artifact source, license, hash, model card, quantization, download timestamp and runtime version. Verify hashes before loading. Do not auto-download or execute model-adjacent scripts from untrusted repositories.

## Output and tool safety

- Parse JSON under byte, depth and item limits.
- Validate against versioned schemas.
- Verify all source and entity IDs.
- Escape rendered text; no raw HTML.
- Never evaluate generated code.
- Never execute partially parsed proposed actions.
- Apply timeouts/cancellation and bounded retries.

## Sensitive domains

Health is separately consented. Secrets, session keys, provider credentials, raw media and hidden configuration never enter prompts, tool output, memory or logs. Remote mode changes the trust boundary and requires explicit request-level disclosure.

## Security evaluation

Required suites include prompt injection by every trust class, unauthorized tools, fabricated IDs, traversal/URL attempts, oversized responses, model timeout, stream truncation, session hijack, replayed approval, memory poisoning, consent revocation and model-artifact provenance.