## Why

nimrod's roadmap modules (`agents`, `workflows`, `tools`, `model-providers`, `memory`,
`observability` — see `docs/architecture/sidebar-roadmap.md`) already mirror HADES primitives
(Actor/Agent Runtime, Workflow Engine, Tool/Capability Plane, Model Gateway, CRANE, LENS) by
coincidence of shared agentic-platform vocabulary, not by any documented decision. Nothing in
this repo currently states that relationship, so each future module's contract gets named ad
hoc when it's built, with no shared reference to check consistency against. This creates two
concrete risks documented in existing repo history: (1) `docs/architecture/ecosystem-architecture.md`
already treats open agentic standards as a live-but-unadopted concern for this repo, and (2)
`openspec/changes/archive/2026-08-25-migrate-better-auth/proposal.md` already documents nimrod as
the control-plane UI for a Design Partner Cell (Leadsales) consuming `rumbor-core`, not as
Rumbor's own canonical Mission Control. A vocabulary mapping needs to exist before the first
roadmap module (`agents`, per the existing dependency order — it only requires auth, already
resolved) is implemented, so that module is named and contracted consistently with HADES from
its first commit instead of being retrofitted later.

## What Changes

- Add a new capability, `hades-vocabulary-mapping`, that records the correspondence between each
  nimrod roadmap module (from `docs/architecture/sidebar-roadmap.md`) and its HADES primitive/
  contract counterpart, and states the naming rule that future module implementations must follow
  when their backend is HADES-aligned.
- Update `docs/architecture/sidebar-roadmap.md`'s per-module contract column to reference the
  matching HADES primitive name alongside the existing contract names (additive, no column
  removed).
- Explicitly record, in the new capability spec, that this mapping does **not** declare nimrod to
  be HADES's canonical Mission Control UI — it remains the control-plane UI for the Leadsales
  Design Partner Cell over `rumbor-core`, consistent with the already-documented boundary in
  `openspec/changes/archive/2026-08-25-migrate-better-auth/`.

## Capabilities

### New Capabilities
- `hades-vocabulary-mapping`: defines the nimrod-module ↔ HADES-primitive correspondence table and
  the rule that a module's future contract name SHALL align with its mapped HADES primitive when
  that module is implemented against a HADES-aligned backend.

### Modified Capabilities
- None. `navigation-roadmap` and `auth` requirements are unchanged; this change only adds a
  reference table those capabilities can be checked against later.

## Non-Goals

- No renaming of the repository, package (`vuexy-nuxtjs-admin-template`), or any route/module —
  `navigation-roadmap`'s existing rule (domain-named, provider-agnostic modules) already covers
  this and is not being changed.
- No implementation of `agents` or any other roadmap module — this change is documentation/spec
  only, no `pages/`, `views/`, `server/`, or dependency changes.
- No claim that nimrod is Rumbor's canonical HADES Mission Control — see boundary note above.
