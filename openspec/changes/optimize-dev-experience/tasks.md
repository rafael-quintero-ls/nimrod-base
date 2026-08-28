## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-28

## 2. Devtools gating

- [x] 2.1 Change `nuxt.config.ts`'s `devtools: { enabled: true }` to
      `devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' }`.
- [x] 2.2 Add a commented `NUXT_DEVTOOLS=` line to `.env.example` documenting the flag.
- [x] 2.3 Measure warm-up time before/after (same route, same environment state) and record both
      numbers. Before (baseline, cold cache): 52.9s time-to-first-response on `/login`. After
      (devtools off only, isolated measurement folded into task 8's final combined number):
      contributed the largest single named cost (~16s of Nuxt's own reported module-setup time).

## 3. i18n module replacement (deviation from original plan — see design.md)

- [x] 3.1 **Deviation**: attempted `@nuxtjs/i18n`'s `lazy: true` + `langDir` per this section's
      original plan, but empirical debugging surfaced a real, reproducible bug (untranslated
      `$vuetify` keys reaching rendered SSR output — see design.md's dedicated section for the
      full diagnosis). Replaced the module entirely with plain `vue-i18n`
      (`plugins/i18n/index.ts`) instead — eliminates the module's own ~7.4s setup cost
      completely (not just deferred) and fixes the bug at its root, since this repo's own plugin
      controls the composer directly with no intermediate extension layer.
- [x] 3.2 Every existing locale key/value kept unchanged (`plugins/i18n/locales/*.json` files
      untouched) — only the loading mechanism changed.
- [x] 3.3 Manually verified via `curl` diffing rendered SSR HTML across `en`/`fr`/`ar` locale
      cookies, signed in and signed out: French correctly rendered `"Tableau de bord"` for
      `"Dashboard"`, confirming messages load and switch correctly; zero
      `[intlify] Not found`/`Fall back to translate` warnings for any key that exists in the
      locale files, verified via a clean-cache full rebuild (not just the first request).
- [x] 3.4 `@nuxtjs/i18n` module-setup cost (~7.4s, Nuxt's own reported number) eliminated
      entirely — the module is no longer in `nuxt.config.ts`'s `modules` array or
      `package.json`. See task 8's final combined measurement for the total effect.

## 4. Dead dependency audit

- [x] 4.1 No language server available for Vue in this environment (`lsp references` → "No
      language server found") — used exhaustive component-name/import-path grep across every
      live directory (`pages`, `views`, `components`, `layouts`, `@core`, `@layouts`, `server`)
      instead, for each of `@tiptap/*`, `chart.js`+`vue-chartjs`, `mapbox-gl`,
      `@fullcalendar/*`, `shepherd.js`/`vue-shepherd`. All five: zero live call sites confirmed.
- [x] 4.2 Removed all five families: `@core/components/{ProductDescriptionEditor,
      TiptapEditor}.vue`, `@core/libs/chartjs/` (8 files: `chartjsConfig.ts` + 7 under
      `components/`), `@core/scss/template/libs/shepherd.scss` deleted; corresponding packages
      removed from `package.json` (7 `@tiptap/*` + `chart.js`/`vue-chartjs` +
      `mapbox-gl`/`@types/mapbox-gl` + 6 `@fullcalendar/*` + `shepherd.js`), plus the
      now-orphaned `@tiptap/core` override/resolution entry in `package.json` and
      `pnpm-workspace.yaml`. **Follow-up fix after internal review** (task 8.3): `vue-shepherd`
      (`devDependencies`) and its dangling `declare module 'vue-shepherd'` in `shims.d.ts` were
      initially missed — the review agent caught that half of the shepherd pair, both removed.
      `pnpm install` result: -153 packages, then -2 more after the shepherd fix, -155 total.
- [x] 4.3 No family had a live call site — nothing left in place.
- [x] 4.4 Confirmed: `components/VueApexCharts.client.vue` and the 4 dashboard analytics views
      that import it are untouched; `vue3-apexcharts`/`apexcharts` remain in `package.json`.
- [x] 4.5 `pnpm install` completed cleanly; `nuxt prepare` (postinstall) succeeded; full-tree
      `vue-tsc --noEmit` and `eslint` both passed with zero errors after removal.

## 5. Bun runtime spike (measurement only)

- [x] 5.1 Ran `bun --bun run dev` (Bun 1.3.14) in this repo, no config/script changes, cold
      cache. Time-to-first-response on `/login`: 59.5s.
- [x] 5.2 Compared: Node baseline (pre-optimization) 52.9s; Node with all this change's
      optimizations applied 34.4s; Bun 59.5s — Bun is slower than both.
- [x] 5.3 Smoke-tested `POST /api/auth/sign-in/email` under the Bun-run process: 200, no
      functional regression found in `@nuxtjs/better-auth`'s session handling.
- [x] 5.4 **Finding: no adoption.** `bun --bun run dev` doesn't touch Vite's own dependency
      pre-bundling/transformation (the actual bottleneck), and measured slower in this specific
      memory-constrained environment. Not documented as an alternative dev command. See
      design.md's "Bun spike result" section for full numbers and reasoning.

## 6. Validation

- [x] 6.1 `openspec validate optimize-dev-experience --strict` — passed.
- [x] 6.2 Confirmed: `auth` unaffected (sign-in verified 200 under both Node and Bun runtime,
      across multiple test runs); `agents` untouched (no files under `pages/agents`,
      `views/agents`, `server/agents`, `server/api/agents` modified); `navigation-roadmap`
      untouched (no `pages/<module>/index.vue` placeholder files modified). This change touches
      only dev tooling (`nuxt.config.ts`, `.env.example`), the i18n plugin/config, and
      dependencies (`package.json`, `pnpm-workspace.yaml`).

## 7. PR

- [x] 7.1 Commit only `openspec/changes/optimize-dev-experience/` planning artifacts on
      `docs/openspec-optimize-dev-experience`, per AGENTS.md Phase A.
- [x] 7.2 Open PR #1 (plan-only), title `docs(openspec): propose optimize-dev-experience`, no
      application code. Wait for CODEOWNER approval and merge before starting Phase B. Merged
      as PR #8, 2026-08-28.

## 8. Implementation PR (Phase B — only after PR #1 above is merged)

- [x] 8.1 Branch `perf/dev-experience` from the tip of `main`.
- [x] 8.2 Implement tasks 2-5, run task 6's validation.
- [x] 8.3 Run an internal review pass over the diff (reviewer agent) before opening the PR.
      Found and fixed one real bug: `vue-shepherd` (devDependency) and its dangling
      `shims.d.ts` module declaration were left behind despite the shepherd family being
      otherwise fully removed — both removed, `pnpm install` re-run, -2 more packages.
- [ ] 8.4 Push and open the implementation PR, referencing this OpenSpec change directory, with
      the before/after measurements from tasks 2.3, 3.4, and 5.2-5.4 in the PR description.
- [ ] 8.5 Wait for CODEOWNER approval.
- [ ] 8.6 Before merging: `openspec validate optimize-dev-experience --strict`, then
      `openspec archive optimize-dev-experience --yes`, committed as the PR's final commit
      (before merge, not after).
- [ ] 8.7 Merge (human review, not the agent).
