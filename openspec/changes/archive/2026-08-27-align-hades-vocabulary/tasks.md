## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-27

## 2. Documentation

- [x] 2.1 Add a `HADES primitive` column to the module table in
      `docs/architecture/sidebar-roadmap.md` (additive, existing `Contrato(s) que cubre` column
      kept), mapping: Agents → Actor / Agent Runtime, Workflows → Workflow Engine, Tools →
      Tool/Capability Plane, Model Providers → Model Gateway, Context & Memory → CRANE,
      Observability → LENS. Dashboard/Users/Roles & Permissions get no HADES-primitive mapping
      (they are not HADES-specific concepts).
- [x] 2.2 Add a short note near the table (or in this capability's spec, cross-referenced) stating
      the boundary: nimrod is the Leadsales Design Partner Cell's control-plane UI over
      `rumbor-core`, not HADES's canonical Mission Control UI.

## 3. Validation

- [x] 3.1 `openspec validate align-hades-vocabulary --strict`
- [x] 3.2 Confirm `docs/architecture/sidebar-roadmap.md` renders correctly (table columns align,
      mermaid diagrams unaffected) by reading the rendered file.

## 4. PR

- [x] 4.1 Commit only `openspec/changes/align-hades-vocabulary/` planning artifacts on
      `docs/openspec-align-hades-vocabulary`, per AGENTS.md Phase A.
- [x] 4.2 Open PR #1 — plan-only, title `docs(openspec): propose align-hades-vocabulary` —
      referencing this change directory. No application code in this PR (the doc edit to
      `docs/architecture/sidebar-roadmap.md` in tasks 2.1-2.2 ships in the Phase B implementation
      PR, once this plan is approved and merged, per AGENTS.md's two-PR split). Merged as PR #1,
      2026-08-27.

## 5. Implementation PR (Phase B)

- [x] 5.1 Run an internal review pass over the doc diff (reviewer agent), per AGENTS.md step 11,
      before opening the implementation PR.
- [x] 5.2 Pushed branch `docs/hades-vocabulary-mapping`, opened PR #2 (implementation PR),
      referencing this OpenSpec change directory.
- [x] 5.3 CODEOWNER approved and merged PR #2, 2026-08-27.
- [x] 5.4 **Deviation from AGENTS.md step 14**: PR #2 was merged before the archive step ran
      (archive is normally the PR's final commit, landing pre-merge). Ran
      `openspec validate align-hades-vocabulary --strict` and
      `openspec archive align-hades-vocabulary --yes` post-merge instead, on branch
      `docs/archive-align-hades-vocabulary`, 2026-08-27, so the archived spec still lands in
      `openspec/specs/` on `main`.
- [x] 5.5 PR #2 merged (human review/merge, not the agent), 2026-08-27.
