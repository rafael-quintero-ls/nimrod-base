## 1. Approval Gate

- [x] 1.1 Present proposal.md, design.md, and this tasks.md to the operator and obtain explicit
      approval before any implementation task below starts (per `AGENTS.md` human-in-the-loop
      gate — required here regardless of the change's small size, because it touches
      `server/auth/**`, which `AGENTS.md` flags as high-blast-radius)
- [x] 1.2 Plan approved by operator in session, 2026-08-26 ("si apruebo el plan")

## 2. Branch Setup

- [x] 2.1 Branch from tip of `main`: `docs/openspec-normalize-identity-adapter-naming` for the
      plan PR (this OpenSpec change only, no application code)

## 3. Plan PR (PR #N)

- [x] 3.1 Commit only `openspec/changes/normalize-identity-adapter-naming/` and open the plan PR
      titled `docs(openspec): propose normalize-identity-adapter-naming`
- [x] 3.2 Wait for CODEOWNER merge to `main` before starting implementation — merged as PR #10,
      2026-08-26

## 4. Implementation Branch

- [x] 4.1 Branch from the now-updated `main`: `refactor/normalize-identity-adapter-naming`

## 5. Rename the adapter file and its internals

- [x] 5.1 `git mv server/auth/rumbor-adapter.ts server/auth/identity-backend-adapter.ts`
- [x] 5.2 Renamed `interface RumborAdapterConfig` -> `IdentityBackendAdapterConfig`
- [x] 5.3 Renamed `export const rumborAdapter` -> `export const identityBackendAdapter`
- [x] 5.4 Renamed `async function proxyToRumborCore` -> `proxyToIdentityBackend`, and every call
      site inside the file (10 call sites in the real-backend branch)
- [x] 5.5 Changed `adapterId: 'rumbor-core'` -> `adapterId: 'identity-backend'`
- [x] 5.6 Changed `adapterName: 'Rumbor Core Identity Adapter'` -> `'Identity Backend Adapter'`
- [x] 5.7 Changed the demo-mode ID prefix `` `rumbor_${Date.now()}_${nextId++}` `` ->
      `` `local_${Date.now()}_${nextId++}` ``
- [x] 5.8 Updated every doc comment inside the file naming "rumbor-core" to describe the identity
      backend generically (file header, the real-backend proxy comment) — also fixed the header's
      dead link (`openspec/changes/migrate-better-auth/design.md` -> the now-archived
      `openspec/changes/archive/2026-08-25-migrate-better-auth/design.md`, since that change was
      archived in this same repo since the comment was written)

## 6. Update consumers

- [x] 6.1 `server/auth.config.ts`: updated the import path and symbol
      (`import { identityBackendAdapter } from '@/server/auth/identity-backend-adapter'`) and its
      `database: identityBackendAdapter({...})` call site
- [x] 6.2 `nuxt.config.ts`: updated the comment referencing the old filename/product name

## 7. Confirm no stragglers

- [x] 7.1 `grep` (case-insensitive) for "rumbor" across `app`, `components`, `layouts`,
      `middleware`, `navigation`, `pages`, `plugins`, `server`, `views`, `@core`, `@layouts`,
      `nuxt.config.ts` — zero matches
- [x] 7.2 `pnpm lint` exits `0`

## 8. Verify

- [x] 8.1 `pnpm dev`: `admin@demo.com`/`admin` sign-in returns full `abilityRules` including all
      6 module subjects, redirects to `/dashboards/analytics`, sidebar shows Dashboard/Users/
      Roles & Permissions + Roadmap; `client@demo.com`/`client` sign-in redirects to the same
      dashboard, sidebar shows Dashboard/Users/Roles & Permissions only, no Roadmap — identical
      to `simplify-sidebar-navigation`'s verified behavior, confirming the rename is behaviorally
      inert.
- [x] 8.2 `pnpm build` completed successfully (confirmed via `.output/server/index.mjs`'s fresh
      timestamp after the build job's wrapper reported a timeout — the build itself finished, the
      job runner's own timeout fired after); `node .output/server/index.mjs` started cleanly
      (would fail immediately on any broken import from the rename) and repeated 8.1's checks in
      production mode with identical results for both roles.
- [x] 8.3 Real-browser check (`browser` tool): zero console `pageerror` through the full sign-in
      -> dashboard flow, both roles, both dev and production mode.

## 9. Archive and ship

- [x] 9.1 Pushed implementation PR #11 (https://github.com/rafael-quintero-ls/nimrod/pull/11),
      referencing this OpenSpec change; `CLEAN`/`MERGEABLE` — awaiting CODEOWNER approval
- [x] 9.2 `openspec validate normalize-identity-adapter-naming --strict` (passed), then
      `openspec archive normalize-identity-adapter-naming --yes` (done, archived as this same
      branch's commit before push, matching the two prior changes' precedent)
- [ ] 9.3 Operator merges both PRs (plan + implementation) — not the agent
