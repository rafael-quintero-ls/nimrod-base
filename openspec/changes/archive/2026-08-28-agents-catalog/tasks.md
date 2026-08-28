## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-27

## 2. Contract & adapter

- [x] 2.1 Define `AgentRuntimeContract` TypeScript interface (id, name, status, description,
      configSummary) in `server/agents/agent-runtime-adapter.ts`.
- [x] 2.2 Implement `agentRuntimeAdapter()` following `identity-backend-adapter.ts`'s pattern:
      in-memory fixture (2-3 sample agents covering active/inactive/error statuses) when no
      backend URL is configured; HTTP proxy branch when it is. Add `NUXT_AGENT_RUNTIME_URL` to
      `.env.example`, unset by default (fixture mode is this change's shipped state).
- [x] 2.3 Comment the fixture clearly as non-production placeholder data, matching
      `identity-backend-adapter.ts`'s header-comment style — never presented as live data.

## 3. Server API

- [x] 3.1 Add `server/api/agents/index.get.ts`: list with `q` (name search) and
      `itemsPerPage`/`page` query params, backed by the adapter.
- [x] 3.2 Add `server/api/agents/[id].get.ts`: single-agent detail by id, 404 semantics for an
      unknown id.
- [x] 3.3 Both routes enforce an active session (`requireUserSession`), matching `auth`'s "Server
      API routes independently enforce authentication" requirement.

## 4. UI

- [x] 4.1 Replace `pages/agents/index.vue`'s `ModuleComingSoon` with a real list page: fetch via
      `useApi('/agents')`, render with `VDataTableServer` (name, status chip, link to detail),
      explicit empty state when zero agents, matching `pages/apps/user/list/index.vue`'s
      structure. Keep `definePageMeta({ action: 'read', subject: 'Agent' })`.
- [x] 4.2 Add `pages/agents/[id].vue`: fetch via `useApi('/agents/:id')`, render name, status,
      description, configSummary (flat key/value list); explicit "not found" state for an unknown
      id, matching `pages/apps/user/view/[id].vue`'s not-found pattern.
- [x] 4.3 Extract list/detail markup into `views/agents/list/*` and `views/agents/view/*` per this
      repo's `pages/<area>` (thin route) vs `views/<area>` (real UI) split.
- [x] 4.4 Status chip/badge uses visually distinct treatment per status (active/inactive/error) —
      no plain unstyled text for status.

## 5. Validation

- [x] 5.1 `openspec validate agents-catalog --strict`
- [x] 5.2 Verified via `curl` against `pnpm dev`'s API layer (server was unstable for full-page
      SSR requests in this environment — see note below): signed in as the seeded admin demo
      user, confirmed `GET /api/agents` returns the 3 fixture agents (active/inactive/error
      statuses), `?q=triage` filters correctly, `GET /api/agents/agent-escalation` returns full
      detail with `configSummary`, `GET /api/agents/does-not-exist` returns 404 "Agent not
      found", and `GET /api/agents` without a session returns 401 "Authentication required".
      **Environment limitation, not verified**: full-page SSR rendering of `/agents` and
      `/agents/[id]` — `nuxt dev`'s vite-node dev server crashed reproducibly with "IPC
      connection closed" on every route hit, including the pre-existing, untouched
      `/apps/user/list` page, traced to this environment's exhausted memory (`free -h`: ~500MiB
      free, swap full) rather than to this change's code. `pnpm build` (which would avoid
      vite-node) needs `--max-old-space-size=5120`, not viable at the available memory. UI code
      (list/detail Vue components, status chip styling) is implemented per spec but not visually
      confirmed in this session; a reviewer with a healthier environment should smoke-test the
      actual pages before merge. **Update**: after the reviewer agent's pass (task 7.3) found a
      real `tsc` compile error (`proxyToAgentRuntime` called with wrong arity — fixed by closing
      over `agentRuntimeUrl` instead of taking it as a parameter, matching
      `identity-backend-adapter.ts`'s pattern), a full project type-check was run as a substitute
      static-verification pass: `npx nuxt prepare` (regenerate types) then
      `npx tsc --noEmit -p .nuxt/tsconfig.server.json` (server tree, 0 errors) and
      `npx vue-tsc --noEmit -p tsconfig.json` (full app tree including new pages/views, 0
      errors) — both clean. This does not replace a real browser smoke test, but it does
      directly cover the class of defect (wrong route names, missing imports, composable
      misuse, type mismatches) that full-page SSR would otherwise have caught.
- [x] 5.3 Confirm `pages/agents/index.vue` no longer imports or renders `ModuleComingSoon`.

## 6. PR

- [x] 6.1 Commit only `openspec/changes/agents-catalog/` planning artifacts on
      `docs/openspec-agents-catalog`, per AGENTS.md Phase A.
- [x] 6.2 Open PR #1 (plan-only), title `docs(openspec): propose agents-catalog`, no application
      code. Wait for CODEOWNER approval and merge before starting Phase B. Merged as PR #4,
      2026-08-27.

## 7. Implementation PR (Phase B — only after PR #1 above is merged)

- [x] 7.1 Branch `feat/agents-catalog` from the tip of `main` (now containing the merged plan).
- [x] 7.2 Implement tasks 2-4, run task 5's verification.
- [x] 7.3 Run an internal review pass over the diff (reviewer agent) before opening the PR.
      Found and fixed one real bug (arity mismatch in `agent-runtime-adapter.ts`, see task 5.2)
      and two minor convention deviations (missing `sortable: false` on headers; hand-rolled
      pagination instead of the shared `TablePagination` component) — both fixed.
- [x] 7.4 Push and open the implementation PR, referencing this OpenSpec change directory.
      Opened as PR #5.
- [x] 7.5 Wait for CODEOWNER approval. Operator reviewed and approved.
- [x] 7.6 **Deviation, again**: per the operator's explicit direction, PR #5 (and #6, a
      related dev-warnings fix merged alongside it) were merged before this archive step ran,
      same ordering slip as `align-hades-vocabulary`. Running
      `openspec validate agents-catalog --strict` and `openspec archive agents-catalog --yes`
      post-merge instead, on branch `chore/archive-agents-catalog`, 2026-08-28.
- [x] 7.7 PR #5 and #6 merged via `gh pr merge --squash`, run by the agent per the operator's
      explicit override of the "agent does not merge its own PR" rule in this session,
      2026-08-28.
