## Context

`docs/architecture/sidebar-roadmap.md` already lists six not-yet-implemented modules
(`agents`, `workflows`, `tools`, `model-providers`, `memory`, `observability`) each tied to a
contract family and a dependency order (`Agents` first — depends only on already-resolved auth).
Separately, external HADES architecture documentation (Rumbor's HADES Architecture doc, not part
of this repo) defines primitives — Actor, Agent Runtime, Workflow Engine, Tool/Capability Plane,
Model Gateway, CRANE (context/memory), LENS (observability/evidence) — that line up 1:1 with
those six modules by shared agentic-platform vocabulary. Nothing in this repo currently records
that correspondence. `openspec/changes/archive/2026-08-25-migrate-better-auth/proposal.md`
already fixes nimrod's product identity as the Leadsales Design Partner Cell's control-plane UI
over `rumbor-core` — this design must not contradict that.

## Goals / Non-Goals

**Goals:**
- Give future module implementers one place to look up the HADES-primitive name their module's
  contract should align to, before they invent a name independently.
- Keep the mapping a passive reference (spec + doc table), not a mechanism that changes runtime
  behavior, gating, or navigation.

**Non-Goals:**
- Not designing the actual contracts (Agent Runtime Contract, Workflow Contract, etc.) — those are
  defined when each module is implemented, per `navigation-roadmap`'s existing entry rule.
- Not changing `navigation-roadmap`'s CASL-gating or placeholder-page requirements.
- Not touching `rumbor-core`, `server/`, or any adapter code.

## Decisions

- **Mapping lives as a new capability spec (`hades-vocabulary-mapping`), not inline edits to
  `navigation-roadmap`**: the correspondence is a distinct, independently-versionable concern from
  navigation/gating behavior; keeping it separate avoids overloading `navigation-roadmap`'s
  existing scope and lets this table evolve (e.g. if HADES's own primitives change) without
  touching navigation requirements.
- **`docs/architecture/sidebar-roadmap.md`'s existing contract table gets an additive column**
  (`HADES primitive`) rather than replacing the current `Contrato(s) que cubre` column: preserves
  the doc's existing structure and avoids implying the current contract names are wrong — they're
  domain-scoped and correct for this repo; the HADES primitive is an additional cross-reference.
- **No rename of `nimrod`, its package, or any route**: rejected per explicit user decision — the
  repo's product identity (Leadsales Design Partner Cell UI over `rumbor-core`) is already fixed
  by a merged, archived OpenSpec change and by Rumbor's own platform-boundary ADR (Design Partner
  Cells consume contracts, they are not the Core). Renaming would misstate that boundary.

## Risks / Trade-offs

- **Staleness risk**: this mapping references an external doc (HADES Architecture) this repo does
  not control; if that architecture's primitive names change, this mapping can drift. Mitigated by
  keeping the mapping small (module-name-to-primitive-name only, no contract field definitions) so
  drift is cheap to fix in one place.
- **Scope creep risk**: because the mapping references HADES vocabulary, a future reader could
  mistake it for a commitment to build against a real HADES backend. Mitigated by the explicit
  "does not assert unimplemented status as done" and "does not declare canonical Mission Control"
  requirements in the spec.
