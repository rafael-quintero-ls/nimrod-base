## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-29.

## 2. Baseline measurement

- [ ] 2.1 Record current Vite-based cold `pnpm dev` time-to-first-response on
      `/login` (clean cache: `rm -rf node_modules/.cache node_modules/.vite
      .nuxt/dev`) on this environment, for direct comparison. Reuse the
      52.2s figure from `openspec/changes/optimize-dev-experience/` only if
      re-confirmed close to that number on a fresh run; otherwise record the
      new baseline and note the discrepancy.

## 3. Verified config-level fixes (already reproduced in this proposal's investigation — apply to the real repo)

- [ ] 3.1 Add `@nuxt/rspack-builder@4.5.2` (exact version match) and
      `sass-loader@16` as devDependencies.
- [ ] 3.2 Set `builder: 'rspack'` in `nuxt.config.ts`.
- [ ] 3.3 Rename every bare `@name` alias reference in this repo's own
      JS/TS `import` statements (`@core`, `@layouts`, `@images`, `@styles`,
      `@configured-variables`, `@db`, `@api-utils`) to `#name` — 73 files
      per this proposal's investigation; re-confirm the exact file count
      against the current `main` before starting, since it may have
      drifted.
- [ ] 3.4 In `nuxt.config.ts`'s `alias` block and its Vite `resolve.alias`
      mirror, register both the new `#name` key and the original `@name`
      key for all seven aliases, pointing at the same target. Add a comment
      directly above the block explaining why both forms exist (JS-import
      resolution needs `#name` to avoid the externals-resolver bug;
      `.scss`/`<style lang="scss">`'s `@use`/`@forward` statements still
      reference `@name` and resolve via this same alias map, not the JS
      module resolver).
- [ ] 3.5 Add `'vue-demi'` to `build.transpile` in `nuxt.config.ts`.
- [ ] 3.6 Clean-cache `pnpm dev` (`rm -rf .nuxt node_modules/.cache`);
      confirm `/login` returns `HTTP 200` and inspect the response body for
      `Failed to resolve component` warnings for `VApp`/`VLocaleProvider`
      (expected present at this point — not yet fixed by task 4).

## 4. Vuetify component resolution (the actual remaining blocker)

- [ ] 4.1 Add `@vuetify/unplugin-styles@1.0.0-rc.1` and
      `unplugin-vue-components` as devDependencies.
- [ ] 4.2 Register `@vuetify/unplugin-styles/nuxt` as a Nuxt module with
      `vuetifyStyles.settings` pointed at this repo's existing
      `assets/styles/variables/_template.scss` (matching
      `vite-plugin-vuetify`'s current `styles.configFile` value).
- [ ] 4.3 Re-verify (version may have changed since the prior spike)
      whether `unplugin-vue-components`'s own `/nuxt` wrapper has a working
      Rspack branch. If not: register `unplugin-vue-components/rspack`
      directly via `@nuxt/kit`'s `addRspackPlugin` in a local Nuxt module,
      with `Vuetify3Resolver` from `unplugin-vue-components/resolvers`.
- [ ] 4.4 Remove `vite-plugin-vuetify` from `nuxt.config.ts`'s `vite.plugins`
      array and `plugins/vuetify/index.ts` (keep the package installed and
      the Vite path working — see task 8 — until task 7 confirms Rspack
      adoption).
- [ ] 4.5 Clean-cache `pnpm dev` under Rspack; confirm `/login`'s response
      body contains a real rendered `VApp`/`VLocaleProvider` tree (form
      fields visible in the HTML, not just `HTTP 200`) and zero
      `Failed to resolve component` warnings for any Vuetify component.
- [ ] 4.6 Explicitly test for `vuetifyjs/nuxt-module#381`'s cascade-order
      symptom: reload a page containing a `VBtn size="small"` (or
      equivalent small-sized component) 8-10 times with cold/no cache,
      checking computed style consistency each time. Record whether the
      symptom reproduces; if it does, apply the documented mitigation (an
      inline `<style>` `@layer` order declaration in `nuxt.config.ts`'s
      `app.head.style`) and re-verify.
- [ ] 4.7 Manually verify, via browser (not just `curl`/HTTP status):
      login page renders and authenticates
      (`admin@demo.com`/`admin`), dashboard renders with Vuetify components
      styled correctly, agents catalog list/detail renders, locale
      switching (`en`/`fr`/`ar`) still works, theme/color-scheme switching
      still works.

## 5. SVG-as-icon-component replacement

- [ ] 5.1 Add `unplugin-icons` as a devDependency; register its `/rspack`
      export with `compiler: 'vue3'` in the same local module as task 4.3.
- [ ] 5.2 Identify every call site importing an SVG as an icon component via
      `vite-svg-loader` (`~14` per the prior spike's `design.md` —
      re-confirm the current count).
- [ ] 5.3 Migrate each call site from `import x from '@images/foo.svg'` to
      `unplugin-icons`'s `~icons/<collection>/foo` form; verify per site
      (not a bulk find-and-replace assumed correct) that the same icon
      renders visually.
- [ ] 5.4 Remove `vite-svg-loader` from `nuxt.config.ts`'s `vite.plugins`
      array (keep the package installed until task 7 — see task 8).

## 6. `pnpm` bin-name conflict

- [ ] 6.1 Reproduce the `nuxt`/`nuxi` bin-name conflict
      (`node_modules/.bin/nuxt`/`nuxi` silently renamed to
      `nuxt-cli`/`nuxi-ng`) the prior spike hit after installing
      `@nuxt/rspack-builder`.
- [ ] 6.2 Root-cause it (likely a peer-dependency-driven duplicate `nuxt`
      resolution in `pnpm`'s dependency tree, per the prior spike's
      `tasks.md`) and resolve it via `pnpm.overrides`/`pnpm dedupe`, or
      document a working non-manual mitigation if it cannot be eliminated.
- [ ] 6.3 Confirm plain `pnpm dev`/`pnpm build` (no manual
      `node_modules/@nuxt/cli/bin/nuxi.mjs` invocation) work end-to-end.

## 7. Verification and disposition

- [ ] 7.1 Run every scenario in
      `openspec/changes/adopt-rspack-builder/specs/build-tooling/spec.md`
      against the real repo state; record pass/fail for each.
- [ ] 7.2 Cold `pnpm dev` (clean cache, same methodology as task 2.1) —
      record time-to-first-response on `/login`, compare against the Vite
      baseline from task 2.1.
- [ ] 7.3 Run `pnpm build` under the Rspack builder; if it succeeds, run a
      real production preview (`node .output/server/index.mjs`) and hit
      `/login` — a `pnpm build` exit code alone is not sufficient (matches
      `update-critical-dependencies-security`'s precedent, where a
      build-only check missed a runtime-only defect).
- [ ] 7.4 Full project `vue-tsc --noEmit` and `eslint` — both must pass
      with zero errors.
- [ ] 7.5 Record the finding — adopt / no-adopt — with concrete numbers and
      scenario results, in this change's PR description.
- [ ] 7.6 If **adopt**: remove `vite-plugin-vuetify`, `vite-svg-loader`,
      and any now-dead Vite-only config from `package.json`/
      `nuxt.config.ts`; `pnpm dev`/`pnpm build` become Rspack-only.
- [ ] 7.7 If **no-adopt**: revert every change back to `main` (this change
      concludes as a no-op on `main`, same disposition pattern as
      `rspack-builder-spike`) and record the specific blocking finding in
      this change's `tasks.md` for future reference.

## 8. PR

- [ ] 8.1 Commit only `openspec/changes/adopt-rspack-builder/` planning
      artifacts on `docs/openspec-adopt-rspack-builder`, per AGENTS.md
      Phase A.
- [ ] 8.2 Open PR #1 (plan-only), title
      `docs(openspec): propose adopt-rspack-builder`, no application code.
      Wait for CODEOWNER approval and merge before starting Phase B.

## 9. Implementation (Phase B — only after PR #1 above is merged)

- [ ] 9.1 Branch `feat/rspack-builder` (adopt) — decided at implementation
      time based on task 7.5's finding; if no-adopt, no implementation
      branch/PR is needed beyond what task 7.7 already reverted, and this
      change closes without a Phase B PR.
- [ ] 9.2 Implement tasks 2-7.
- [ ] 9.3 Run an internal review pass over the diff (reviewer agent) before
      opening any PR.
- [ ] 9.4 Open a PR reflecting the actual finding — either the full Rspack
      adoption (if task 7.5 found adopt) or a no-op/revert PR stating the
      finding (if no-adopt).
- [ ] 9.5 Wait for CODEOWNER approval.
- [ ] 9.6 Before merging: `openspec validate adopt-rspack-builder --strict`,
      then `openspec archive adopt-rspack-builder --yes`, committed as the
      PR's final commit (before merge, not after).
- [ ] 9.7 Merge (human review, not the agent).
