# Contributing to vuexy-template

This repository follows a **single-maintainer, spec-driven** workflow: non-trivial changes are proposed and tracked with [OpenSpec](https://github.com/Fission-AI/OpenSpec) (see `AGENTS.md`), then submitted as pull requests for review before merging to `main`. This document adapts general open-source contribution practices ([contributing.md](https://contributing.md/)) to that reality — there is one maintainer (`@rafael-quintero-rs`, see `.github/CODEOWNERS`) and most changes originate from an AI coding agent acting on the maintainer's behalf.

## Before you start

- Read `README.md` for scope and setup.
- Read `AGENTS.md` for the required OpenSpec workflow if the change adds or modifies a capability (a page, an API route, a data model, an auth/permission rule, a build/deploy config).
- Skim the existing `pages/` + `views/` pairing and `@core`/`@layouts` conventions before adding new UI — this is a themed template; match its structure rather than introducing a parallel one.

## What belongs here

This is a Nuxt 3 + Vuetify admin dashboard template (Vuexy). Application code, pages, views, server (Nitro) API routes, and the auth/ACL layer built on top of it belong here. Anything that isn't specific to this application (shared design systems, unrelated services) belongs in its own repository.

## Branching Strategy: Trunk-Based Development

`main` is the single trunk and the only long-lived branch. This repository follows [trunk-based development](https://trunkbaseddevelopment.com/) using the **short-lived feature branch** style — suited to small teams (2+ committers, human or agent) that gate integration through pull requests rather than committing straight to trunk.

**Rules:**

1. **One branch per change, one committer (or one agent) per branch.** Branches are not shared for active development; they may be reviewed by others, but nobody else pushes commits to your branch while you're using it.
2. **Branches are short-lived: merge or close within 1-2 days.** A branch that outlives that window has drifted from `main` and risks becoming a long-lived feature branch — the opposite of trunk-based development. If a change needs more than 1-2 days, split it into smaller changes that each merge independently (this matches the "right-size the change" principle OpenSpec already applies to `proposal.md` scope).
3. **Branch from the tip of `main`, rebase or merge `main` back in before opening/updating a PR**, so review happens against current trunk state, not a stale snapshot.
4. **`main` is always buildable.** Every merge to `main` must leave the repository in a state where `pnpm build` succeeds and `pnpm lint` passes — never merge a change you know breaks that.
5. **No direct pushes to `main`**, including by the CODEOWNER — every change, including a one-line fix, goes through a branch and a PR (see Workflow below). GitHub branch protection requiring PRs is not available on this repository's current plan (private repo, free tier); this rule is a team agreement, not a server-enforced restriction — treat it as binding regardless. Re-enable server-side enforcement (`gh api repos/rafael-quintero-rs/vuexy-template/branches/main/protection`) the moment the plan supports it.
6. **Delete the branch after merge.** A repository with stale branches loses the signal of what's actually in flight; enable `delete_branch_on_merge` on this repository so GitHub does this automatically.
7. **At most a small number of concurrent open branches/PRs at a time.** [Trunk-based development](https://trunkbaseddevelopment.com/short-lived-feature-branches/) recommends keeping active branches to a handful; if several unrelated changes are queued, merge them in sequence rather than opening many parallel long-running PRs.

**Why short-lived feature branches over committing straight to `main`:** committing straight to trunk (also a valid trunk-based style, see [trunkbaseddevelopment.com/committing-straight-to-the-trunk](https://trunkbaseddevelopment.com/committing-straight-to-the-trunk/)) trades review for throughput — it works best with a fast, exhaustive local build/test everyone runs before pushing. This repository has no automated test suite yet standing between a bad commit and a broken `main` — the PR is the safety net standing in for that fast build. Once this repository gains a CI pipeline that can gate merges automatically, revisit this choice.

## Workflow

1. **Changes that add or modify a capability go through OpenSpec first, with a mandatory human-in-the-loop approval gate before implementation.** `openspec new change <name>`, fill `proposal.md`/`design.md`/`specs/`/`tasks.md`, **present the plan to the operator and wait for explicit approval**, then do the work, `openspec validate --strict`, `openspec archive --yes`. No implementation work starts before that approval, regardless of how small the change looks. See `AGENTS.md` for the full loop.
2. **Doc-only, style-only, or tooling-only changes** (typos, README clarifications, dependency bumps, CI config) may skip OpenSpec — open a pull request directly.
3. **Every change lands via pull request**, even for the sole maintainer — no direct pushes to `main` (see Branching Strategy above).
4. **Branch naming:** `<type>/<short-description>`, matching the commit type below (e.g. `feat/invoice-export`, `docs/contributing-setup`).
5. **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):** `<type>(<scope>): <summary>`, matching existing history and validated by `.gitlint` (`uvx --from gitlint-core gitlint`). Common types here: `feat` (new capability/page/route), `fix`, `docs`, `chore` (tooling/scaffolding), `refactor`. **See the `write-commits` skill (`.omp/skills/write-commits/SKILL.md`) for the full format rules and the safe way to write multi-line commit/PR bodies** — a corrupted PR body from an inline heredoc is exactly the failure this skill exists to prevent.
6. **Pull request description** should reference the OpenSpec change name when one exists (e.g. "Implements `openspec/changes/archive/<date>-<name>/`"), and summarize what was verified (see Verification below) — not just what changed.

## Review

- All changes require review and approval from the CODEOWNER (`.github/CODEOWNERS`) before merging, even when authored by the maintainer's own AI agent — the PR is the checkpoint where a human confirms the change works as claimed.
- Reviewers should check the pull request against the **Guardrails** section below before approving, not just the diff's syntax.
- Keep review discussion in the pull request, not off-channel — this repository has no other public discussion channel today; if that changes, this file will be updated to point to it.

## Guardrails (non-negotiable)

- **No secrets, credentials, or private keys committed.** `AUTH_SECRET`, API tokens, and any `.env` value stay outside the repository — `.gitignore` already excludes `.env*` (keep `.env.example` as the only tracked template).
- **No infrastructure/deploy command runs before the human-in-the-loop approval gate**, for any change that provisions or reconfigures a deployment target (hosting, CI secrets, DNS). A change that ran such a command without the operator having first approved the written plan violates this repository's process, even if the result is otherwise correct.
- **No claimed verification without an actual check.** A pull request that says the app builds, a page renders, or a route works must have actually run that check — see `AGENTS.md`'s verification expectations.
- **English only** for code, comments, and commit messages, matching existing history.

## Verification expected in a pull request

Match the proof to the kind of change:

| Change type | What to show |
|---|---|
| New/changed page or component | `pnpm dev` (or a screenshot) showing the route renders; note any interaction exercised |
| New/changed server API route | The actual request/response (e.g. `curl` output or a screenshot of the calling UI) |
| OpenSpec change | `openspec validate <name> --strict` output, and the archived change's `tasks.md` with genuinely completed items |
| Documentation only | The rendered doc reads correctly; no dangling `TBD` left where an observed value now exists |
| Tooling/build/CI | `pnpm build` and `pnpm lint` output, or the tool/script's actual successful run |

## Reporting a problem

Open a GitHub issue on `rafael-quintero-rs/vuexy-template` describing:

- What you expected vs. what happened.
- Which page, route, or module is affected.
- Whether the issue is a documentation gap, a bug, or a design question.

Do not include secrets or credentials in an issue.

## Governance

This repository has a single maintainer/CODEOWNER (see `.github/CODEOWNERS`) who makes final decisions on scope, architecture, and what gets merged. There is currently no separate contributor tier, mailing list, or chat channel — if the project grows beyond a single maintainer and an AI agent, this section will be updated with the added structure (additional CODEOWNERS, a discussion channel, etc.) rather than left silently stale.
