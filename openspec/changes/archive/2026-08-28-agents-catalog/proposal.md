## Why

`docs/architecture/sidebar-roadmap.md` identifies `agents` as the first roadmap module viable to
implement — it depends only on auth, which is already resolved. Today `pages/agents/index.vue`
renders `ModuleComingSoon`, an honest "in development" placeholder per the `navigation-roadmap`
capability, but no real Agent Contract or Agent Runtime Contract exists yet, and the roadmap doc
(per `openspec/specs/hades-vocabulary-mapping/spec.md`) names Actor / Agent Runtime as this
module's HADES-aligned counterpart. This change defines that contract and replaces the
placeholder with the module's Catalog sub-area (list, detail, status, config) — the smallest real
slice `navigation-roadmap`'s entry rule allows, since a working adapter must exist before the
placeholder can be retired.

## What Changes

- Define an `Agent` domain model (id, name, status, description, config summary) and a provider-
  agnostic adapter contract for resolving it, following the same pattern as
  `server/auth/identity-backend-adapter.ts`: one file owns the concrete backend shape, nothing
  else in the app references a specific backend by name.
- Add `server/api/agents/index.get.ts` (list, with pagination/search matching the existing
  `apps/users` route's query-param shape) and `server/api/agents/[id].get.ts` (detail), backed by
  the new adapter. Until a real HADES-aligned backend URL is configured, the adapter serves a
  small in-memory fixture — explicitly labeled as fixture data in code comments and never
  presented in the UI as live/production data, matching the identity-backend-adapter's own
  documented demo-mode pattern.
- Replace `pages/agents/index.vue`'s `ModuleComingSoon` placeholder with a real list view
  (`views/agents/list/*`) showing name, status, and a link to detail; add
  `pages/agents/[id].vue` + `views/agents/view/*` for the detail/config-summary page.
- **BREAKING**: `pages/agents/index.vue` no longer renders `ModuleComingSoon` — per
  `navigation-roadmap`'s "placeholder is replaced, not layered" requirement, the placeholder is
  fully retired for this route, not left reachable alongside the real feature.

## Capabilities

### New Capabilities
- `agents`: defines the Agent Catalog — listing, viewing, and reading the status/config summary
  of agents through a provider-agnostic Agent Runtime Contract, independent of which backend
  resolves that data. Does not cover triggering or observing agent runs (Executions sub-area) —
  see Non-Goals.

### Modified Capabilities
- None. `navigation-roadmap`'s requirements already describe both the placeholder state this
  change replaces and the replacement behavior; no requirement text changes, only which module
  instance satisfies it.

## Non-Goals

- No Executions sub-area (run triggering, run history, live run status) — no execution runtime
  exists yet to back it; a real Executions capability change follows once one does. `agents`'s
  spec explicitly limits itself to Catalog (list/detail/status/config), never runs.
- No real HADES-aligned backend integration — the adapter's fixture-data mode is this change's
  actual delivered state, same pattern as `identity-backend-adapter.ts` pre-`rumbor-core`. Wiring
  a real backend URL is a follow-up once one exists; this change does not block on it.
- No changes to `workflows`, `tools`, `model-providers`, `memory`, or `observability` — each
  remains its own future OpenSpec change per the roadmap's dependency order.
