# Tool system and permissions

## Tool boundary

**LOCKED DECISION:** the agent accesses Kaizen only through registered, versioned, typed tools. Initial tools are read-only and execute through the client Domain Bridge.

```ts
interface ToolDefinition<I, O> {
  name: string;
  version: string;
  description: string;
  permission: "read" | "analyze" | "suggest" | "act";
  domains: DomainId[];
  sensitivity: "normal" | "personal" | "health" | "restricted";
  inputSchema: object;
  outputContract: string;
  outputContractVersion: string;
  limits: { maxRecords: number; timeoutMs: number };
}
```

The implementation registry, not the model, assigns permissions and contracts.

## Read-only catalog

### Global

`get_today`, `get_tasks`, `get_notifications`, `get_timeline`, `get_habits`, `get_life_state`, `get_momentum`, `get_current_priorities`, `get_cross_domain_conflicts`

### Forge

`get_project`, `get_project_tasks`, `get_milestones`, `get_dependencies`, `get_risks`, `get_velocity`, `forecast_deadline`

### Career

`get_career_state`, `get_skills`, `get_roadmap`, `get_certifications`, `get_jobs`, `get_portfolio`, `analyze_job_description`, `get_skill_gaps`

### Workout

`get_sessions`, `get_exercise_history`, `get_prs`, `get_readiness`, `get_progression`, `calculate_volume`

### Health

`get_sleep`, `get_hydration`, `get_stress`, `get_vitals`, `get_health_trends`

### Afterglow

`get_queue`, `get_history`, `get_ratings`, `get_releases`, `search_media`

This is a capability catalog, not a commitment to implement all tools in one wave.

## `get_today@1.0`

First vertical-slice input:

```ts
interface GetTodayInput {
  localDate?: string;             // defaults to trusted client date
  includeCompleted?: boolean;     // default false
  maximumItems?: number;          // bounded by registry
}
```

Output: `DomainSnapshot<TodayContextV1>` from [DOMAIN-BRIDGE.md](DOMAIN-BRIDGE.md#initial-coretoday10-contract).

The tool cannot request arbitrary domains, raw localStorage, secrets or complete notes.

## v0.1.1 deterministic route

**LOCKED DECISION:** for `core.today.interpret`, trusted Kaizen code selects `get_today@1.0` before generation. The provider receives validated `core.today@1.0` evidence and no tool definitions. Any provider tool call is rejected rather than executed. This does not authorize another tool, domain, arbitrary query, memory, Health, write or automation path. See [AI-ADR-019](adrs/AI-ADR-019-DETERMINISTIC-CORE-TODAY-ROUTING.md) and the [v0.1.1 contract](V0.1.1-DETERMINISTIC-ROUTING-CONTRACT.md).

## Permission evaluation

```text
Tool registered?
 → version supported?
 → permission allowed in release?
 → session/domain consent present?
 → sensitivity allowed?
 → arguments schema-valid and bounded?
 → requested IDs exist/are accessible?
 → execute adapter
 → validate output contract
```

Denials are typed and reveal no inaccessible data.

## Tool result safety

- Return bounded records and selected fields.
- Preserve source IDs and timestamps.
- Include redaction notices.
- Label content trust.
- Never return provider keys, raw unsafe URLs, hidden settings or full storage blobs.
- Treat externally imported and user-authored text as data.
- Deterministic tool calculations include algorithm/version provenance.

## Future write tools

**DEFERRED DECISION until v0.4 implementation:** `create_task`, `update_task`, `create_milestone`, `create_focus_block`, `create_note`, `create_career_milestone`, `log_reflection`.

These will produce proposals first. There will be no write-capable tool exposed directly to the model's execution loop; execution uses a separate approval-bound command path described in [ACTION-CENTER.md](ACTION-CENTER.md).

## Tool QA

Each tool requires fixture tests for valid result, missing record, unauthorized domain, invalid arguments, result size cap, stale snapshot, redaction, trust labeling and deterministic provenance.