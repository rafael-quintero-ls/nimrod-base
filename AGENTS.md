# AGENTS.md

Guidance for AI coding agents working in `vuexy-template`. See `README.md` for repository scope and `nuxt.config.ts` for runtime configuration.

## Methodology: spec-driven changes (OpenSpec)

This repository tracks non-trivial work through [OpenSpec](https://github.com/Fission-AI/OpenSpec), not through free-form chat history. Any change that adds or modifies a **capability** — a page/route, a server API endpoint, a data model, an auth/permission rule, a build or deploy configuration — MUST go through the OpenSpec change lifecycle:

```
openspec/
├── specs/              # Source of truth: standing requirements per capability
│   └── <capability>/spec.md
├── changes/            # In-flight proposals
│   └── <change-name>/
│       ├── proposal.md   # Why / What Changes / Impact
│       ├── design.md      # Context, decisions, risks/trade-offs
│       ├── tasks.md       # Checklist, [x] only when genuinely done
│       └── specs/<capability>/spec.md   # ADDED/MODIFIED/REMOVED delta
└── changes/archive/     # Completed changes, one per merged spec
```

**Workflow for any capability change (two pull requests: plan, then implementation):**

**Phase A — Propose (lands in `main` before any code changes):**

1. `openspec new change <kebab-case-name>` (or `/opsx-propose "<description>"`) — scaffold the change.
2. Write `proposal.md` first: the "why" and the capability being added/modified. Keep one intent per change — a change that needs a lot of "and also" should be split.
3. Write the delta `specs/<capability>/spec.md`: `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements`, each requirement with `SHALL`/`MUST`/`SHOULD` (RFC 2119) and at least one `#### Scenario:` with `WHEN`/`THEN`.
4. Write `design.md`: context (what's already there and why it constrains the approach — e.g. the existing `pages/` + `views/` split, the CASL ability model, the `useApi` fetch wrapper), decisions with rationale and alternatives considered, risks/trade-offs.
5. Write `tasks.md` as a checklist of what will be done. At this point nothing has been implemented — `proposal.md`/`design.md`/`specs/`/`tasks.md` are a plan, not yet an action.
6. **Human-in-the-loop approval gate — mandatory, no exceptions.** Present the plan (`proposal.md` + `design.md` + the spec delta + `tasks.md`) to the operator in the conversation and stop. Do not create a branch, commit, or open a PR until the operator gives explicit approval. If the operator asks for changes, revise the artifacts and re-present the updated plan — repeat until approved. There is no default/implicit approval and no time-based fallback: silence or an unrelated reply is not approval.
7. Once approved, record the approval as the first completed item in `tasks.md` (e.g. "Plan approved by operator in session, `<date>`"), then branch from the tip of `main` (`docs/openspec-<change-name>`), commit only the `openspec/changes/<change-name>/` planning artifacts, and open **PR #1** — a plan-only PR containing no application code, title `docs(openspec): propose <change-name>`.
8. PR #1 goes through the same review as any other PR (see Review below) and merges to `main` before implementation starts. This is what makes the plan the current source of truth in `main`, reviewable on its own, before any code changes ride along with it.

**Phase B — Implement (a separate branch and PR, opened only after PR #1 has merged):**

9. Branch from the tip of `main` (now containing the merged plan): `<type>/<short-description>`, matching the Conventional Commits type of the actual work (e.g. `feat/invoice-export`).
10. Do the work described in `tasks.md`, checking items off as they're genuinely done.
11. Before opening the implementation PR, run an internal review pass over the diff (the `reviewer` agent, or the most relevant review skill for the change) to catch issues while they're still cheap to fix — this is in addition to, not a substitute for, CODEOWNER review.
12. Push and open **PR #2** — the implementation PR, referencing the (now-merged) `openspec/changes/<change-name>/` directory.
13. Wait for CODEOWNER code review on PR #2 per `CONTRIBUTING.md`'s Review section. Address feedback with further commits on the same branch.
14. **Once PR #2 is approved and before merging it**: run `openspec validate <change-name> --strict`, then `openspec archive <change-name> --yes` (merges the delta into `openspec/specs/`, moves the change folder under `openspec/changes/archive/<date>-<change-name>/`), update any affected documentation, commit the archive on the same implementation branch, and push it as the PR's final commit — the merged PR then carries both the working code and its own archived paper trail in one atomic `main` update.
15. Merge PR #2 (human review, not the agent — see Review below).

**What may skip OpenSpec (and the two-PR split above):** typo fixes, dependency bumps with no behavior change, README/comment clarifications, formatting/lint-only changes, and read-only investigation. Everything that changes what the application does or how it's built goes through the full flow above.

Retroactive documentation is acceptable only for **read-only audits of already-existing behavior** (e.g. writing down how an existing page currently works). It does not exempt any change that adds or modifies a capability from the approval gate above, no matter how small it looks — approval happens before implementation, not after. Never invent verification that wasn't performed.

## Git workflow: trunk-based development

This repository is **not** worked on directly against `main`. Every task — a feature, a fix, a doc update, or this file's own updates — follows `CONTRIBUTING.md`'s trunk-based workflow in full, applied per-phase for capability changes as described above: one branch and one PR for the plan (Phase A), a separate branch and PR for the implementation (Phase B). Non-capability changes (doc/tooling-only) still get exactly one branch and one PR, same as always.

1. Branch from the tip of `main` for whichever phase/PR is in flight.
2. Do the work for that phase.
3. Commit following the `write-commits` skill (`.omp/skills/write-commits/SKILL.md`): Conventional Commits format, validated with `uvx --from gitlint-core gitlint --config .gitlint`, message written to a file and committed with `git commit -F` — never an inline `-m` for anything multi-line, never a shell heredoc.
4. Push and open a pull request (`gh pr create --body-file <file>`, same file-first rule as commits) — **never push directly to `main`**, even for a trivial fix. Reference the OpenSpec change in the PR body when one exists.
5. Stop there. Merging requires human review per `CONTRIBUTING.md`'s Review section — an agent does not merge its own PR.

A branch stays short-lived (1-2 days per `CONTRIBUTING.md`); if a task grows past that, split it into smaller OpenSpec changes that each land on their own branch/PR pair rather than letting one branch accumulate unrelated work.

See `CONTRIBUTING.md` for the full rules (branch lifetime, no-direct-push rationale, guardrail checklist, verification-by-change-type table) — this section exists so an agent reading only `AGENTS.md` still lands every change through a branch and a PR, not just through OpenSpec's artifact lifecycle.

## Repository-specific constraints

- **No secrets are ever committed.** `AUTH_SECRET`, `AUTH_ORIGIN`, `MAPBOX_ACCESS_TOKEN`, and any real API base URL live only in a local, gitignored `.env` (see `.env.example` for the required keys). Never hardcode a credential in source, a fixture, or a committed evidence/log file.
- **No deploy or hosting-provider command runs before the human-in-the-loop approval gate** for any change that provisions or reconfigures where/how this app is deployed (hosting target, CI secrets, DNS, environment variables on a live deployment).
- **Match existing template conventions.** New pages go under `pages/<area>/*.vue` (thin route file) with the actual UI under the mirrored `views/<area>/*` path, matching the rest of the codebase — do not introduce a second pattern for organizing routes/views.
- **Auth/ACL changes are high-blast-radius.** `middleware/acl.global.ts`, `server/api/auth/[...].ts`, and the CASL ability setup (`plugins/casl/`) gate every route in the app — changes here always go through the full OpenSpec + approval-gate flow, never a quick edit.
- **English only** for code, comments, and commit messages, per existing repository history.

## Verification expectations

- Changes are verified by driving the real thing — run `pnpm dev` and load the affected route, hit the affected API endpoint, or run `pnpm build` — not by asserting a plan was followed. Capture the concrete evidence (command output, a description of what rendered) in the change's `design.md`/`tasks.md` and the PR description.
- When something doesn't behave as expected, root-cause it rather than working around it silently — document the actual cause in `design.md`, not a guess.
