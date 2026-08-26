## 1. Approval Gate

- [x] 1.1 Present proposal.md, design.md, and this tasks.md to the operator and obtain explicit
      approval before any implementation task below starts (per `AGENTS.md` human-in-the-loop
      gate — required here regardless of the change's small size, because it touches
      `server/auth/**`, which `AGENTS.md` flags as high-blast-radius)
- [x] 1.2 Plan approved by operator in session, 2026-08-26 ("si apruebo el plan")

## 2. Branch Setup

- [ ] 2.1 Branch from tip of `main`: `docs/openspec-normalize-identity-adapter-naming` for the
      plan PR (this OpenSpec change only, no application code)

## 3. Plan PR (PR #N)

- [ ] 3.1 Commit only `openspec/changes/normalize-identity-adapter-naming/` and open the plan PR
      titled `docs(openspec): propose normalize-identity-adapter-naming`
- [ ] 3.2 Wait for CODEOWNER merge to `main` before starting implementation

## 4. Implementation Branch

- [ ] 4.1 Branch from the now-updated `main`: `refactor/normalize-identity-adapter-naming`

## 5. Rename the adapter file and its internals

- [ ] 5.1 `git mv server/auth/rumbor-adapter.ts server/auth/identity-backend-adapter.ts`
- [ ] 5.2 Rename `interface RumborAdapterConfig` -> `IdentityBackendAdapterConfig`
- [ ] 5.3 Rename `export const rumborAdapter` -> `export const identityBackendAdapter`
- [ ] 5.4 Rename `async function proxyToRumborCore` -> `proxyToIdentityBackend`, and every call
      site inside the file
- [ ] 5.5 Change `adapterId: 'rumbor-core'` -> `adapterId: 'identity-backend'`
- [ ] 5.6 Change `adapterName: 'Rumbor Core Identity Adapter'` -> `'Identity Backend Adapter'`
- [ ] 5.7 Change the demo-mode ID prefix `` `rumbor_${Date.now()}_${nextId++}` `` ->
      `` `local_${Date.now()}_${nextId++}` ``
- [ ] 5.8 Update every doc comment inside the file naming "rumbor-core" to describe the identity
      backend generically (file header, the real-backend proxy comment, any inline notes)

## 6. Update consumers

- [ ] 6.1 `server/auth.config.ts`: update the import path and symbol
      (`import { identityBackendAdapter } from '@/server/auth/identity-backend-adapter'`) and its
      `database: identityBackendAdapter({...})` call site
- [ ] 6.2 `nuxt.config.ts`: update the comment referencing the old filename/product name

## 7. Confirm no stragglers

- [ ] 7.1 `grep -rn "rumbor" --include='*.ts' --include='*.vue' .` (excluding `node_modules`,
      `openspec/changes/archive/**`, `docs/architecture/**`) — zero matches in active source
- [ ] 7.2 `pnpm lint` exits `0`

## 8. Verify

- [ ] 8.1 `pnpm dev`: login as both `admin@demo.com`/`admin` and `client@demo.com`/`client`,
      confirm session establishes and sidebar renders per each role's abilities (no regression
      from `simplify-sidebar-navigation`'s verified behavior)
- [ ] 8.2 `pnpm build && node .output/server/index.mjs`: repeat 8.1 in production mode
- [ ] 8.3 Real-browser check (`browser` tool): confirm zero console `pageerror` through the login
      flow in both dev and production mode

## 9. Archive and ship

- [ ] 9.1 Push implementation PR referencing this OpenSpec change; wait for CODEOWNER approval
- [ ] 9.2 Before merging: `openspec validate normalize-identity-adapter-naming --strict`, then
      `openspec archive normalize-identity-adapter-naming --yes`, commit the archive as the PR's
      final commit
- [ ] 9.3 Operator merges both PRs (plan + implementation) — not the agent
