## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-28

## 2. Devtools gating

- [ ] 2.1 Change `nuxt.config.ts`'s `devtools: { enabled: true }` to
      `devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' }`.
- [ ] 2.2 Add a commented `NUXT_DEVTOOLS=` line to `.env.example` documenting the flag.
- [ ] 2.3 Measure warm-up time before/after (same route, same environment state) and record both
      numbers.

## 3. i18n lazy-loading

- [ ] 3.1 Restructure `i18n.config.ts`'s eager `import.meta.glob(..., { eager: true })` messages
      block into per-locale files under a `langDir`, per `@nuxtjs/i18n`'s documented lazy-loading
      shape (`lazy: true` + `langDir` in the `i18n` module config in `nuxt.config.ts`).
- [ ] 3.2 Keep every existing locale key/value unchanged — this is a loading-mechanism change,
      not a content change.
- [ ] 3.3 Manually verify at least one page renders correctly in each configured locale (`en`,
      `fr`, `ar`) after the change.
- [ ] 3.4 Measure `@nuxtjs/i18n` module-setup time before/after and record both numbers.

## 4. Dead dependency audit

- [ ] 4.1 For each of `@tiptap/*`, `chart.js`+`vue-chartjs`, `mapbox-gl`, `@fullcalendar/*`,
      `shepherd.js`/`vue-shepherd`: run `lsp references` (not just text grep) on every symbol
      exported from its sole identified `@core/` consumer to confirm zero live call sites from any
      currently-kept `pages/`/`views/` file.
- [ ] 4.2 For each family confirmed dead: remove the package(s) from `package.json` and delete its
      sole orphaned `@core/components`/`@core/libs` consumer file(s).
- [ ] 4.3 For each family found to have a live call site after all: leave it in place, note the
      finding, do not remove.
- [ ] 4.4 Explicitly confirm `vue3-apexcharts`/`apexcharts` remain untouched (confirmed live via 4
      dashboard analytics views).
- [ ] 4.5 Run `pnpm install` after removal, confirm no leftover broken imports (build or dev boot
      succeeds).

## 5. Bun runtime spike (measurement only)

- [ ] 5.1 Run `bun --bun run dev` in this repo (no config/script changes), capture the same
      warm-up log lines already captured for the Node-based baseline in this session
      (`Vite client/server warmed up`, `Nuxt Nitro server built`, total time-to-first-response on
      `/login` or another representative route).
- [ ] 5.2 Compare against the Node-baseline numbers from tasks 2.3/3.4's "before" measurements.
- [ ] 5.3 Smoke-test `@nuxtjs/better-auth` sign-in under the Bun-run process specifically (no
      stated official Bun-runtime support for that module) — confirm session/cookie behavior is
      unaffected, or record the discrepancy if any.
- [ ] 5.4 Record the finding (adopt as documented alternative dev command / no adoption) in this
      change's PR description. If "no adoption," no further code changes result from this task —
      that is an acceptable, complete outcome.

## 6. Validation

- [ ] 6.1 `openspec validate optimize-dev-experience --strict`
- [ ] 6.2 Confirm no application behavior changed for any existing capability (`auth`, `agents`,
      `navigation-roadmap`) — this change touches only dev tooling, config, and dependencies.

## 7. PR

- [ ] 7.1 Commit only `openspec/changes/optimize-dev-experience/` planning artifacts on
      `docs/openspec-optimize-dev-experience`, per AGENTS.md Phase A.
- [ ] 7.2 Open PR #1 (plan-only), title `docs(openspec): propose optimize-dev-experience`, no
      application code. Wait for CODEOWNER approval and merge before starting Phase B.

## 8. Implementation PR (Phase B — only after PR #1 above is merged)

- [ ] 8.1 Branch `perf/dev-experience` from the tip of `main`.
- [ ] 8.2 Implement tasks 2-5, run task 6's validation.
- [ ] 8.3 Run an internal review pass over the diff (reviewer agent) before opening the PR.
- [ ] 8.4 Push and open the implementation PR, referencing this OpenSpec change directory, with
      the before/after measurements from tasks 2.3, 3.4, and 5.2-5.4 in the PR description.
- [ ] 8.5 Wait for CODEOWNER approval.
- [ ] 8.6 Before merging: `openspec validate optimize-dev-experience --strict`, then
      `openspec archive optimize-dev-experience --yes`, committed as the PR's final commit
      (before merge, not after).
- [ ] 8.7 Merge (human review, not the agent).
