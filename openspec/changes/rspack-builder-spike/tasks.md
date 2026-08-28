## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-28

## 2. Baseline measurement

- [x] 2.1 Record current Vite-based cold `pnpm dev` time-to-first-response on `/login` (clean
      cache: `rm -rf node_modules/.cache node_modules/.vite .nuxt/dev`), for direct comparison.
      Result: 52.2s (post-`optimize-dev-experience` state — no `@nuxtjs/i18n`, devtools off,
      dead deps already removed). Environment note: this session's VM is memory-constrained
      (7.3GB, frequently <1GB free); the first cold-start attempt hung/503'd until orphaned
      Chrome renderer processes from a stopped browser daemon were killed, freeing ~250MB —
      documented for the comparison's fairness (same cleanup applied before the Rspack
      measurement in task 7.1).


## 3. Remove confirmed-dead dependency (unconditional, not gated on spike outcome)

- [x] 3.1 Remove `vite-plugin-vue-meta-layouts` from `package.json` — confirmed not registered in
      `nuxt.config.ts`'s `vite.plugins` array.
- [x] 3.2 Remove the `virtual:meta-layouts` entry from `.eslintrc.cjs`'s import-resolver ignore
      list if it becomes unresolvable/unnecessary after removal (verify first — it may still
      resolve to something else or simply be an inert pattern). Confirmed inert (zero live
      imports of `virtual:meta-layouts` anywhere in the repo) — removed.
- [x] 3.3 `pnpm install`, confirm no broken imports (`vue-tsc --noEmit`, `eslint` both pass).
      `pnpm install` result: -1 package. Both checks pass with zero errors.

## 4. Rspack builder switch (spike branch only) — attempted, reverted

- [x] 4.1 Added `@nuxt/rspack-builder@4.5.2` (exact version match) as a devDependency.
- [x] 4.2 Set `builder: 'rspack'` in `nuxt.config.ts`.
- [x] 4.3 Removed `nuxt.config.ts`'s `vite.plugins` array and Vite-specific `resolve.alias`
      (confirmed duplicate of the builder-agnostic top-level `alias` block already present).
      **Side effect discovered**: `@nuxt/rspack-builder` introduced a second `nuxt` package
      resolution in `node_modules/.pnpm` (peer-dependency mismatch), which broke `pnpm`'s bin
      linking — `node_modules/.bin/nuxt`/`nuxi` were renamed to `nuxt-cli`/`nuxi-ng` by pnpm's
      conflict-avoidance, breaking `pnpm dev`/`pnpm build` entirely (`sh: 1: nuxt: not found`)
      until worked around by invoking `node_modules/@nuxt/cli/bin/nuxi.mjs` directly. `pnpm
      dedupe` reduced but did not eliminate the duplicate resolution.

## 5. Vuetify styles + auto-import replacement — attempted, reverted

- [x] 5.1 Added `@vuetify/unplugin-styles@1.0.0-rc.1`, registered `@vuetify/unplugin-styles/nuxt`
      as a Nuxt module with `vuetifyStyles.settings` pointed at this repo's existing
      `assets/styles/variables/_vuetify.scss`. **Finding**: that file uses this template's own
      `@forward` chain (not a direct `@use 'vuetify/settings' with (...)`), which the plugin
      doesn't recognize — logged a real warning (`Settings file ... does not import
      'vuetify/settings'. Vuetify defaults will be used`) and silently fell back to defaults,
      meaning custom Vuetify variable overrides would be lost without further adaptation.
- [x] 5.2 Added `unplugin-vue-components@32.1.0`, hand-registered its `/rspack` export with
      `Vuetify3Resolver` via a new local Nuxt module (`modules/rspack-spike.ts`) using
      `@nuxt/kit`'s `addRspackPlugin`, confirming the package's own `/nuxt` wrapper has no
      Rspack branch (verified in its compiled `dist/nuxt.mjs`: only
      `addWebpackPlugin`/`addVitePlugin`).
- [ ] 5.3 Not reached — blocked by task 7's finding before component-render verification.
- [x] 5.4 Reverted along with the rest of this section (see task 8).

## 6. SVG-as-icon-component replacement — attempted, reverted

- [x] 6.1 Added `unplugin-icons`, registered its `/rspack` export with `compiler: 'vue3'` in the
      same local module.
- [x] 6.2 Configured `FileSystemIconLoader` custom collections pointing at this repo's actual
      `assets/images/svg` and `assets/images/customizer-icons` directories (confirmed real paths
      by direct listing before wiring — the proposal's placeholder `@images/svg` alias name was
      not the literal directory name).
- [ ] 6.3-6.5 Not reached — blocked by task 7's finding before any call site was migrated.

## 7. Verification

- [x] 7.1 Cold `pnpm dev` under Rspack (clean cache, same methodology as task 2.1): **59.5s**
      first attempt (crashed silently, no exit code — likely OOM in this memory-constrained
      environment, confirmed by memory jumping from <400MB free to 4.8GB free the instant the
      process died). Second attempt: **77.1s**, ended in a real 500 error (see 7.2) rather than a
      hang — slower than the 52.2s Vite baseline (task 2.1) both times, not faster.
- [x] 7.2 Attempted to verify login/dashboard rendering. **Blocking defect found**: every request
      returned `500 Invalid module "@core" is not a valid package name imported from
      .nuxt/dist/server/server.dev.mjs`. Root cause confirmed by reading the generated SSR
      bundle directly: `import * as __rspack_external__core_146eae07 from "@core"` — Rspack
      resolved this repo's `@core` alias (and, confirmed the same way, `@layouts`) as an
      *external npm scoped package* rather than an internal path alias, because the bare name
      `@core` is syntactically indistinguishable from an npm scope to Rspack's resolver. This
      repo's alias convention (`@core`, `@layouts`, `@images`, `@styles`,
      `@configured-variables`, `@db`, `@api-utils` — all bare `@name`, no slash) is used
      pervasively across the entire codebase, not an isolated config value. No SSR page could be
      manually verified as a result — the app does not run under Rspack in this repo's current
      form.
- [ ] 7.3 Not reached — blocked by 7.2's finding.
- [ ] 7.4 Not reached — blocked by 7.2's finding.
- [x] 7.5 N/A for the Rspack portion (reverted, not present in the final diff); the retained
      task-3 cleanup passes both checks (see task 3.3).

## 8. Finding and disposition

- [x] 8.1 **Finding: no-adopt.** Slower cold start (59.5s/77.1s vs 52.2s Vite baseline, plus one
      silent OOM-likely crash), and a blocking structural defect: Rspack resolves this repo's
      bare `@name` alias convention (`@core`, `@layouts`, etc. — used pervasively, not an
      isolated value) as external npm scoped packages, breaking SSR entirely. Fixing this would
      require renaming every alias across the whole codebase to a slash-qualified form (e.g.
      `@core/` or a non-`@`-prefixed convention) — a large, invasive, blast-radius-heavy rename
      unto itself, with no guarantee no further blockers exist behind it. Also hit a real,
      reproducible `pnpm` bin-linking regression (task 4.3) that broke `pnpm dev`/`pnpm build`
      until worked around manually. None of this is a quick config fix.
- [x] 8.2 **No-adopt confirmed.** Discarded the Rspack-switch portion (tasks 4-6): reverted
      `nuxt.config.ts` to its pre-spike state, deleted `modules/rspack-spike.ts`, removed
      `@nuxt/rspack-builder`/`@vuetify/unplugin-styles`/`unplugin-vue-components`/`unplugin-icons`
      (none had actually been written to `package.json` by `pnpm add` in this session — confirmed
      by diffing `package.json` before reverting, so no manual edit was needed there), and ran a
      full clean `node_modules` reinstall to confirm `pnpm dev`/`pnpm build`/`vue-tsc`/`eslint`
      all work exactly as they did before this spike started. Kept and landing only task 3's
      unconditional `vite-plugin-vue-meta-layouts` cleanup.
- [x] 8.3 N/A — finding is no-adopt, not adopt/adopt-with-follow-up.

## 9. PR

- [x] 9.1 Commit only `openspec/changes/rspack-builder-spike/` planning artifacts on
      `docs/openspec-rspack-builder-spike`, per AGENTS.md Phase A.
- [x] 9.2 Open PR #1 (plan-only), title `docs(openspec): propose rspack-builder-spike`, no
      application code. Wait for CODEOWNER approval and merge before starting Phase B. Merged
      as PR #10, 2026-08-28.

## 10. Implementation (Phase B — only after PR #1 above is merged)

- [x] 10.1 Branch `spike/rspack-builder` from the tip of `main`.
- [x] 10.2 Implement tasks 2-8.
- [x] 10.3 Run an internal review pass over the diff (reviewer agent) before opening any PR.
      Confirmed correct: cleanup-only diff (5 files), `nuxt.config.ts` zero-diff, no leftover
      Rspack artifacts anywhere, `pnpm dev`/`pnpm build`/`vue-tsc`/`eslint` independently
      re-verified working. No defects found.
- [x] 10.4 Open a PR containing **only** task 3's unconditional cleanup if the finding is
      no-adopt (per task 8.2), or state the adopt finding and point to a fresh follow-up change
      if adopt/adopt-with-follow-up (per task 8.3) — never merge the Rspack-switch portion itself
      through this PR. Opened as PR #11.
- [ ] 10.5 Wait for CODEOWNER approval.
- [ ] 10.6 Before merging: `openspec validate rspack-builder-spike --strict`, then
      `openspec archive rspack-builder-spike --yes`, committed as the PR's final commit (before
      merge, not after).
- [ ] 10.7 Merge (human review, not the agent).
