## Context

`server/auth/identity-backend-adapter.ts` already establishes this repo's pattern for a
provider-agnostic backend contract: one file owns the concrete backend's request/response shape
(HTTP proxy when `NUXT_IDENTITY_BACKEND_URL` is set, an explicitly-labeled in-memory fixture
otherwise), and nothing outside that file references the backend by name — enforced by the `auth`
capability's "Identity backend is not exposed through the public interface" requirement. This
change reuses that exact pattern for agents instead of inventing a new one.

`server/api/apps/users/index.get.ts` establishes the query-param shape this repo already uses for
server-side pagination/search/sort (`q`, `sortBy`, `orderBy`, `itemsPerPage`, `page`) against
`server/fake-db/apps/users`. `pages/apps/user/list/index.vue` + `VDataTableServer` establish the
list-view pattern; `pages/apps/user/view/[id].vue` establishes the detail-view pattern (route
param → `useApi` fetch → render or "not found").

`docs/architecture/sidebar-roadmap.md` names this module's HADES primitive as Actor / Agent
Runtime (per `openspec/specs/hades-vocabulary-mapping/spec.md`), so the contract introduced here
is named `AgentRuntimeContract` to align with that mapping from its first commit, per that
capability's "Future HADES-aligned module contracts follow the mapped name" requirement.

## Goals / Non-Goals

**Goals:**
- Ship a real, working Agent Catalog (list + detail) — no stub, no "coming soon" — replacing
  `ModuleComingSoon` on `pages/agents/index.vue`, satisfying `navigation-roadmap`'s entry rule.
- Define `AgentRuntimeContract` as a provider-agnostic TypeScript interface + adapter, following
  `identity-backend-adapter.ts`'s isolation pattern exactly: one module owns the concrete shape.
- Reuse existing UI/API conventions (`VDataTableServer`, query-param pagination shape, `useApi`)
  rather than introducing a second pattern for the same concerns.

**Non-Goals:**
- Not implementing Executions (run triggering/history) — no execution runtime exists to back it;
  inventing run data now would be fake data presented as real, which `AGENTS.md` prohibits.
- Not wiring a real HADES-aligned or `rumbor-core` backend — this ships in fixture-data mode,
  identical in spirit to `identity-backend-adapter.ts`'s pre-`rumbor-core` state. A future change
  wires `NUXT_AGENT_RUNTIME_URL` (or equivalent) once a real backend exists.
- Not adding agent creation/edit/delete — the roadmap doc scopes Catalog to list/detail/status/
  config, read-only; mutating actions are a later increment once a real backend supports them.

## Decisions

- **New capability `agents`, not folded into `navigation-roadmap`**: `navigation-roadmap` governs
  the generic placeholder-to-real-feature lifecycle for *any* module; the Agent Catalog's actual
  behavior (list/detail/status semantics) is a distinct, independently-testable contract. Matches
  how `auth` is already split out from `navigation-roadmap`.
- **Adapter lives at `server/agents/agent-runtime-adapter.ts`**, mirroring
  `server/auth/identity-backend-adapter.ts`'s location and structure (config with optional
  backend URL, in-memory fixture keyed by a `Map`, proxy branch when the URL is set). Chosen over
  reusing `server/fake-db/*` because `fake-db` is explicitly documented as "template demo data,
  not a real backend" (`openspec/config.yaml` context) — this fixture is a placeholder for a real
  future adapter, a different intent than template demo content, same distinction
  `identity-backend-adapter.ts` already draws in its own header comment.
- **`AgentRuntimeContract` fields**: `id`, `name`, `status` (`'active' | 'inactive' | 'error'`),
  `description`, `configSummary` (`Record<string, string>`, rendered as a flat key/value list —
  avoids inventing structured config schema before a real backend defines one). Kept minimal:
  anything not required by the spec's requirements is deferred until a real backend needs it.
- **API routes**: `server/api/agents/index.get.ts` (list) and `server/api/agents/[id].get.ts`
  (detail), matching `server/api/apps/users/*`'s route-per-operation convention and the same
  query-param names for pagination/search (`q`, `itemsPerPage`, `page`) — no `sortBy`/`orderBy`
  yet, since the spec only requires name-search + pagination, not multi-column sort; add sorting
  only if a later change's spec requires it.
- **UI routes**: `pages/agents/index.vue` (list, replacing `ModuleComingSoon`) and
  `pages/agents/[id].vue` (detail) + `views/agents/list/*`, `views/agents/view/*`, matching the
  `pages/<area>/*.vue` thin-route / `views/<area>/*` real-UI split already required by
  `openspec/config.yaml`'s repo context and used by every other app module.
- **CASL subject stays `Agent`**: already defined in `navigation/vertical/modules.ts`,
  `navigation/horizontal/modules.ts`, and seeded into both demo users' `abilityRules` in
  `identity-backend-adapter.ts` — no new subject name needed, no changes to those three files.

## Risks / Trade-offs

- **Fixture-to-real-backend migration risk**: like `identity-backend-adapter.ts`, this ships with
  an in-memory fixture that will need to be replaced by a real adapter once a backend exists. The
  isolation pattern (one file owns the shape) makes that swap contained, but the fixture's exact
  field shapes are a guess absent a real contract — mitigated by keeping the contract minimal
  (Decision 3) so there's less to be wrong about.
- **Naming coupling to `hades-vocabulary-mapping`**: `AgentRuntimeContract`'s name depends on that
  capability's mapping staying stable. If Rumbor's own HADES architecture renames that primitive,
  this contract's name would need a follow-up rename — accepted per that capability's own
  documented staleness risk.
