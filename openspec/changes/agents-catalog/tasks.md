## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-27

## 2. Contract & adapter

- [ ] 2.1 Define `AgentRuntimeContract` TypeScript interface (id, name, status, description,
      configSummary) in `server/agents/agent-runtime-adapter.ts`.
- [ ] 2.2 Implement `agentRuntimeAdapter()` following `identity-backend-adapter.ts`'s pattern:
      in-memory fixture (2-3 sample agents covering active/inactive/error statuses) when no
      backend URL is configured; HTTP proxy branch when it is. Add `NUXT_AGENT_RUNTIME_URL` to
      `.env.example`, unset by default (fixture mode is this change's shipped state).
- [ ] 2.3 Comment the fixture clearly as non-production placeholder data, matching
      `identity-backend-adapter.ts`'s header-comment style — never presented as live data.

## 3. Server API

- [ ] 3.1 Add `server/api/agents/index.get.ts`: list with `q` (name search) and
      `itemsPerPage`/`page` query params, backed by the adapter.
- [ ] 3.2 Add `server/api/agents/[id].get.ts`: single-agent detail by id, 404 semantics for an
      unknown id.
- [ ] 3.3 Both routes enforce an active session (`requireUserSession`), matching `auth`'s "Server
      API routes independently enforce authentication" requirement.

## 4. UI

- [ ] 4.1 Replace `pages/agents/index.vue`'s `ModuleComingSoon` with a real list page: fetch via
      `useApi('/agents')`, render with `VDataTableServer` (name, status chip, link to detail),
      explicit empty state when zero agents, matching `pages/apps/user/list/index.vue`'s
      structure. Keep `definePageMeta({ action: 'read', subject: 'Agent' })`.
- [ ] 4.2 Add `pages/agents/[id].vue`: fetch via `useApi('/agents/:id')`, render name, status,
      description, configSummary (flat key/value list); explicit "not found" state for an unknown
      id, matching `pages/apps/user/view/[id].vue`'s not-found pattern.
- [ ] 4.3 Extract list/detail markup into `views/agents/list/*` and `views/agents/view/*` per this
      repo's `pages/<area>` (thin route) vs `views/<area>` (real UI) split.
- [ ] 4.4 Status chip/badge uses visually distinct treatment per status (active/inactive/error) —
      no plain unstyled text for status.

## 5. Validation

- [ ] 5.1 `openspec validate agents-catalog --strict`
- [ ] 5.2 Run `pnpm dev`, sign in as the seeded admin/client demo users, and manually verify: list
      renders fixture agents with correct statuses, search filters by name, detail page renders
      for a known id and shows a "not found" state for an unknown id, and a session lacking the
      `Agent` read ability is redirected to "not authorized". Capture what was observed.
- [ ] 5.3 Confirm `pages/agents/index.vue` no longer imports or renders `ModuleComingSoon`.

## 6. PR

- [ ] 6.1 Commit only `openspec/changes/agents-catalog/` planning artifacts on
      `docs/openspec-agents-catalog`, per AGENTS.md Phase A.
- [ ] 6.2 Open PR #1 (plan-only), title `docs(openspec): propose agents-catalog`, no application
      code. Wait for CODEOWNER approval and merge before starting Phase B.

## 7. Implementation PR (Phase B — only after PR #1 above is merged)

- [ ] 7.1 Branch `feat/agents-catalog` from the tip of `main` (now containing the merged plan).
- [ ] 7.2 Implement tasks 2-4, run task 5's verification.
- [ ] 7.3 Run an internal review pass over the diff (reviewer agent) before opening the PR.
- [ ] 7.4 Push and open the implementation PR, referencing this OpenSpec change directory.
- [ ] 7.5 Wait for CODEOWNER approval.
- [ ] 7.6 Before merging: `openspec validate agents-catalog --strict`, then
      `openspec archive agents-catalog --yes`, committed as the PR's final commit (before merge —
      not after, correcting the ordering slip from `align-hades-vocabulary`).
- [ ] 7.7 Merge (human review, not the agent).
