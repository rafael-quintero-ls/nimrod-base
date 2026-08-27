## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-27

## 2. Documentation

- [ ] 2.1 Add a `HADES primitive` column to the module table in
      `docs/architecture/sidebar-roadmap.md` (additive, existing `Contrato(s) que cubre` column
      kept), mapping: Agents → Actor / Agent Runtime, Workflows → Workflow Engine, Tools →
      Tool/Capability Plane, Model Providers → Model Gateway, Context & Memory → CRANE,
      Observability → LENS. Dashboard/Users/Roles & Permissions get no HADES-primitive mapping
      (they are not HADES-specific concepts).
- [ ] 2.2 Add a short note near the table (or in this capability's spec, cross-referenced) stating
      the boundary: nimrod is the Leadsales Design Partner Cell's control-plane UI over
      `rumbor-core`, not HADES's canonical Mission Control UI.

## 3. Validation

- [ ] 3.1 `openspec validate align-hades-vocabulary --strict`
- [ ] 3.2 Confirm `docs/architecture/sidebar-roadmap.md` renders correctly (table columns align,
      mermaid diagrams unaffected) by reading the rendered file.

## 4. PR

- [ ] 4.1 Commit only `openspec/changes/align-hades-vocabulary/` planning artifacts on
      `docs/openspec-align-hades-vocabulary`, per AGENTS.md Phase A.
- [ ] 4.2 Open PR #1 — plan-only, title `docs(openspec): propose align-hades-vocabulary` —
      referencing this change directory. No application code in this PR (the doc edit to
      `docs/architecture/sidebar-roadmap.md` in tasks 2.1-2.2 ships in the Phase B implementation
      PR, once this plan is approved and merged, per AGENTS.md's two-PR split).
