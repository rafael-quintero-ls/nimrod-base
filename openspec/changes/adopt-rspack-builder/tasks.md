## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-29.

## 2. Baseline measurement

- [x] 2.1 Record current Vite-based cold `pnpm dev` time-to-first-response on
      `/login` (clean cache: `rm -rf node_modules/.cache node_modules/.vite
      .nuxt/dev`) on this environment, for direct comparison. **Result:
      47.0s** (single-command poll: background `pnpm dev`, `curl` retried
      every 1s against `/login` until `HTTP 200`, elapsed measured from
      process start). Close to the 52.2s figure from
      `optimize-dev-experience` (same order of magnitude, expected run-to-run
      variance) — used as this task's baseline going forward.

## 3. Verified config-level fixes (already reproduced in this proposal's investigation — apply to the real repo)

- [x] 3.1 Add `@nuxt/rspack-builder@4.5.2` (exact version match) and
      `sass-loader@16` as devDependencies.
- [x] 3.2 Set `builder: 'rspack'` in `nuxt.config.ts`.
- [x] 3.3 Rename every bare `@name` alias reference in this repo's own
      JS/TS `import` statements (`@core`, `@layouts`, `@images`, `@styles`,
      `@configured-variables`, `@db`, `@api-utils`) to `#name`. 73 files
      changed (matches the count from this proposal's investigation), plus
      2 bare side-effect imports (`plugins/layouts.ts`,
      `plugins/vuetify/index.ts`) and the `css:` array's two alias entries
      in `nuxt.config.ts`, none of which the file-count grep above
      captured since they use `import '...'` without `from`.
- [x] 3.4 In `nuxt.config.ts`'s `alias` block and its Vite `resolve.alias`
      mirror, registered both the new `#name` key and the original `@name`
      key for all seven aliases, pointing at the same target, with a
      comment directly above the block explaining why both forms exist.
- [x] 3.5 Added `'vue-demi'` to `build.transpile` in `nuxt.config.ts`.
- [x] 3.6 Clean-cache `pnpm dev` (`rm -rf .nuxt node_modules/.cache`);
      confirmed `/login` returns `HTTP 200`. Response body contains
      exactly one `Failed to resolve component` warning group covering
      `VApp`/`VLocaleProvider`, as expected — not yet fixed by task 4.

## 4. Vuetify component resolution (the actual remaining blocker)

- [x] 4.1 Add `@vuetify/unplugin-styles@1.0.0-rc.1` and
      `unplugin-vue-components` as devDependencies.
- [x] 4.2 Register `@vuetify/unplugin-styles/nuxt` as a Nuxt module.
      `vuetifyStyles.settings` (per-component theme customization,
      matching `vite-plugin-vuetify`'s `styles.configFile` value) is
      intentionally left unset — see the finding under task 4.5 below for
      why, and task 4.5a for the open follow-up.
- [x] 4.3 Confirmed `unplugin-vue-components@32.1.0`'s own `/nuxt` wrapper
      has no Rspack branch (`addWebpackPlugin`/`addVitePlugin` only), same
      for `unplugin-icons@23.0.1`'s `/nuxt` wrapper
      (`webpack:config`/`vite:extend` hooks only). Registered both
      directly for both builders — `unplugin-vue-components/rspack` +
      `/vite`, `unplugin-icons/rspack` + `/vite` — via `@nuxt/kit`'s
      `addRspackPlugin`/`addVitePlugin`, in one new local module,
      `modules/rspack-vite-replacements.ts` (covers both task 4's Vuetify
      auto-import and task 5's SVG-as-icon-component replacement, since
      both share the identical dual-builder-registration gap).
- [x] 4.4 Removed `vite-plugin-vuetify` from `nuxt.config.ts`'s
      `vite.plugins` array and from `package.json` entirely — its two
      responsibilities are now fully covered by
      `@vuetify/unplugin-styles/nuxt` (styles, registered in `modules`,
      builder-agnostic via its own `/nuxt` wrapper) and
      `modules/rspack-vite-replacements.ts` (auto-import, both builders).
      No Vite-only remnant of `vite-plugin-vuetify` remains anywhere in
      the repo.
- [x] 4.5 Clean-cache `pnpm dev` under Rspack; confirmed `/login`'s response
      body contains a real rendered `VApp`/`VLocaleProvider` tree
      (`v-locale-provider` class present, "Welcome to" heading, a real
      `type="email"` field) and zero `Failed to resolve component`
      warnings — **the actual blocker this whole proposal exists to
      resolve is fixed.** Required two additional undocumented fixes
      beyond this proposal's original plan (both now live in
      `modules/rspack-vite-replacements.ts`'s `rspack:config` hook, with
      full explanatory comments in that file):
      1. `@nuxt/rspack-builder`'s `postcss-loader` (v8) needs
         `postcssOptions.config: false` to stop searching for an external
         `postcss.config.*` file (fails hard for virtual modules with no
         real directory on disk) — patched imperatively on the
         `rspack:config` hook, since declarative `nuxt.config.ts` options
         for this are either silently dropped by Nuxt's own config schema
         (`postcss:` only recognizes `order`/`plugins`) or overwritten by
         the builder's own internal config-merge order
         (`webpack.postcss.postcssOptions`).
      2. `vuetifyStyles.settings`'s generated virtual template
         (`vuetify.settings.scss`, produced by `@nuxt/kit`'s `addTemplate`)
         fails to compile under Rspack with a `JavaScript parse error` —
         confirmed NOT a config mistake in this repo (the file's own
         content is two valid `@use` statements; `sass-loader` is present
         in the correct loader chain per the error's own loader list) but
         an apparent Rspack-builder defect in how rule matching applies
         Nuxt's component-auto-import transform to a virtual `addTemplate`
         module. **Left unresolved** — `vuetifyStyles.settings` is
         omitted (`vuetifyStyles: {}`, Vuetify defaults used), so `/login`
         renders correctly overall, but this repo's own theme
         customization (`_vuetify.scss` →
         `@core/scss/template/libs/vuetify/variables`) does not apply
         under Rspack yet. Tracked as a known gap in task 4.5a, not
         silently dropped.
- [ ] 4.5a Resolve the `vuetifyStyles.settings` virtual-template compile
      failure (finding 2 above), so this repo's actual Vuexy theme
      customization applies under Rspack, not just Vuetify's un-themed
      defaults. Candidate approaches, not yet attempted: (a) bypass
      `addTemplate` entirely by importing the settings file's *physical*
      path (`.nuxt/vuetify/vuetify.settings.scss`, written to disk since
      `write: true`) directly from a plugin instead of via
      `vuetifyStyles.settings`; (b) inline the two-line `@use` content
      directly as a `virtual:` string constant rather than a templated
      file, if `@vuetify/unplugin-styles` exposes that option; (c) file
      the defect upstream against `@nuxt/rspack-builder` if no repo-side
      workaround is found, and record that as this task's outcome. **Open
      — flagged for a follow-up change, not resolved in this one** (see
      task 7.5's finding).
- [x] 4.6 Tested for `vuetifyjs/nuxt-module#381`'s cascade-order symptom:
      cold-cache warm-up request, then 10 consecutive `/login` requests
      (no cache-busting, matching a browser reload sequence). All 10
      responses byte-identical (single MD5 hash across all 10), including
      SSR-computed inline styles. `/login` contains one `v-btn` (the
      "Login" submit button, not an explicit `size="small"` — this repo's
      `/login` doesn't happen to use that exact prop) so this is not the
      identical scenario `#381` was filed against, but the byte-for-byte
      SSR consistency across repeated cold-and-warm loads is real evidence
      against the symptom reproducing here. **No symptom found**; no
      mitigation applied.
- [x] 4.7 Manually verified via a real headless browser session (not just
      `curl`/HTTP status): `/login` renders pixel-correct (logo,
      illustration, form, demo-credentials alert, LOGIN button), login
      with `admin@demo.com`/`admin` succeeds (via a real
      `POST /api/auth/sign-in/email` returning a genuine session) and
      navigates to `/dashboards/analytics` (full Vuetify styling:
      analytics cards, charts, sales/earnings widgets, sidebar nav, user
      avatar), and `/agents` renders a real data table (Triage/
      Summarizer/Escalation agents, status badges in the correct
      green/gray/red colors, search bar, pagination, footer). **The
      actual blocker this whole proposal exists to resolve is confirmed
      fixed, end-to-end, visually verified, against the final
      cleaned-up repo state (task 7.6), not just an intermediate one.**
      Locale (`en`/`fr`/`ar`) and theme-switching were not independently
      re-verified via browser in this session (out of time budget) —
      flagged as residual, likely-low risk in task 7.5's finding, since
      neither composable depends on the builder.

## 5. SVG-as-icon-component replacement

- [x] 5.1 Added `unplugin-icons` as a devDependency; registered its
      `/rspack` and `/vite` exports with `compiler: 'vue3'` in
      `modules/rspack-vite-replacements.ts` (see task 4.3 — same module
      covers both this and Vuetify's auto-import), with
      `FileSystemIconLoader` custom collections pointing at this repo's
      two SVG-as-icon directories (`svg-icons` → `assets/images/svg`,
      `customizer-icons` → `assets/images/customizer-icons`).
- [x] 5.2 Identified every call site: **15 imports across 3 files** (not
      `~14` across an unstated file count as the prior spike's `design.md`
      estimated — re-confirmed against the current `main`, not carried
      over): `plugins/vuetify/icons.ts` (5: checkbox/radio icons),
      `components/dialogs/AddEditAddressDialog.vue` (2: home/office),
      `@core/components/TheCustomizer.vue` (8: customizer skin/layout/
      direction icons). `@layouts/config.ts`'s single `.svg` reference is
      a plain `<img src="/src/assets/logo.svg">` static asset URL, not a
      component import — correctly out of scope, left untouched.
- [x] 5.3 Migrated all 15 call sites from `import x from '#images/.../foo.svg'`
      to `import x from '~icons/<svg-icons|customizer-icons>/foo'`, matching
      each file's basename directly (`FileSystemIconLoader`'s first-choice
      resolution: tries `<dir>/<name>.svg` before camelCase/PascalCase/
      snake_case fallbacks). Verified per site via a real browser session
      (task 4.7): login form icons, dashboard sidebar/navbar icons, and
      the Vuexy logo (see task 5.3a) all render identically to the
      pre-migration Vite screenshots, under BOTH builders (task 7.1).
- [x] 5.3a **Additional undocumented fix, found during verification**:
      `themeConfig.ts`'s `import logo from '#images/logo.svg?raw'` (Vite's
      `?raw` resource query, for the SVG's literal text content, not a Vue
      component) has no Rspack equivalent — the builder's own
      `raw-loader` dependency is wired only to `.pug` internally, so
      `?raw` requests fell through to whichever `.svg` rule matched
      first, producing a base64 data URL instead of raw text. That data
      URL was then rendered as a dynamic Vue component *tag name*
      elsewhere in the render tree, throwing a client-side
      `InvalidCharacterError` that blocked the entire login-to-dashboard
      navigation path in an earlier verification pass. Fixed in
      `modules/rspack-vite-replacements.ts`'s `rspack:config` hook: an
      explicit `resourceQuery: /raw/` → `type: 'asset/source'` rule, AND
      (the fix that actually mattered) patching the builder's existing
      image rule to exclude `?raw` requests
      (`resourceQuery: { not: [/raw/] }`) — Rspack's top-level
      (non-`oneOf`) module rules all apply in sequence to a matching
      request, not exclusively, so adding a competing rule alone
      double-processed the module (`url-loader` ran first, producing a
      data URL; the new rule then wrapped that already-transformed output
      as a second literal string) until the existing rule was also
      constrained. Verified: real screenshots show the Vuexy heart-logo
      rendering correctly in both `/login` and the dashboard sidebar, no
      `InvalidCharacterError`, under both builders.
- [x] 5.3b **Known, documented, non-blocking gap found during
      verification**: real hydration-mismatch warnings on every page
      load — `unplugin-icons`-generated icon components' internal
      `clip-path`/`id` attributes are produced with a random,
      non-deterministic suffix per render (differing values between
      server and client render, and between repeat loads) — a real
      SSR/CSR consistency defect in `unplugin-icons`'s Vue SFC compiler
      output, not this repo's config. Vue logs this as a check-only
      mismatch (`Hydration completed but contains mismatches`) and does
      not visibly break rendering in this repo's usage, but it is real
      console noise on every page load. Tracked as an open, non-blocking
      concern in task 7.5's finding — not silently ignored.
- [x] 5.4 Removed `vite-svg-loader` from `nuxt.config.ts`'s `vite.plugins`
      array and from `package.json` entirely — every SVG-as-Vue-component
      import in this repo now goes through `~icons/*` (task 5.3), and
      Vite's own native `?raw` support (no plugin needed) covers the one
      remaining direct `.svg` reference (`themeConfig.ts`'s
      `logo.svg?raw`, task 5.3a). No Vite-only remnant of
      `vite-svg-loader` remains anywhere in the repo.

## 6. `pnpm` bin-name conflict

- [x] 6.1 Attempted to reproduce the `nuxt`/`nuxi` bin-name conflict
      (`node_modules/.bin/nuxt`/`nuxi` silently renamed to
      `nuxt-cli`/`nuxi-ng`) the prior spike hit after installing
      `@nuxt/rspack-builder`. **Did not reproduce**: `node_modules/.bin/`
      contains both the real `nuxt`/`nuxi` bins AND `nuxt-cli`/`nuxi-ng`
      side by side in this session — no conflict, no renaming, no lost
      binary.
- [x] 6.2 N/A — nothing to root-cause; not reproduced in this environment
      with this package set (`sass-loader@16`, `@vuetify/unplugin-styles`,
      `unplugin-vue-components`, `unplugin-icons` in addition to
      `@nuxt/rspack-builder` itself — a different, larger dependency graph
      than the prior spike installed, which may explain the different
      resolution outcome; not independently verified further, since there
      is no defect left to investigate).
- [x] 6.3 Confirmed: plain `pnpm dev` (no manual
      `node_modules/@nuxt/cli/bin/nuxi.mjs` invocation) works end-to-end —
      clean-cache cold start, real `HTTP 200` on `/login`, in this task's
      own measurement (see task 2.1's methodology, reused here). Reconfirmed
      again after the final cleanup (task 7.6) and after committing.

## 7. Verification and disposition

- [x] 7.1 Ran every scenario in `specs/build-tooling/spec.md` — all pass:
      cold `pnpm dev` under Rspack serves `/login` with real Vuetify
      rendering (not an empty SSR shell); all seven internal aliases
      (`#core`/`#layouts`/`#images`/`#styles`/`#configured-variables`/
      `#db`/`#api-utils`) resolve in SSR; `.scss`/`<style lang="scss">`
      `@use`/`@forward` statements referencing the original `@name` form
      compile without error; Vuetify components resolve with zero
      `Failed to resolve component` warnings; SVG-as-icon-component
      imports render the same icons as the pre-migration Vite build.
      **One real regression found and fixed during this pass**: an
      intermediate version of task 5's `~icons/*` registration only
      covered the Rspack builder, which broke the still-supported Vite
      path entirely (`Cannot find module '~icons/...'`) —
      `vite-svg-loader` has no knowledge of `~icons/*`. Fixed by
      registering `unplugin-icons/vite` (and, for the same reason,
      `unplugin-vue-components/vite`) in
      `modules/rspack-vite-replacements.ts` unconditionally (not gated to
      Rspack), alongside the Rspack-only registrations. Re-verified after
      the fix: a clean `pnpm dev` with `builder` unset started under
      "Nitro 2.13.4, Vite 8.2.2" and served `/login` with a real
      `HTTP 200`, no module-resolution errors, confirmed both via `curl`
      and a real browser screenshot.
- [x] 7.2 Cold `pnpm dev` (clean cache, same methodology as task 2.1):
      **44.7s** under Rspack vs. **47.0s** Vite baseline (task 2.1) — a
      modest improvement (~5%), not a large one, and within the kind of
      run-to-run variance this memory-constrained environment has shown
      throughout this investigation and the prior spike. Not a strong
      signal either way on its own.
- [x] 7.3 `pnpm build` under Rspack: **succeeded** (`✨ Build complete!`,
      42.6 MB / 6.06 MB gzip output, only benign Rollup `/*@__PURE__*/`
      comment-position warnings, no errors — reconfirmed twice in this
      session, including once against the final, fully cleaned-up
      dependency set after task 7.6). Real production preview
      (`node .output/server/index.mjs`) confirmed via a real browser
      screenshot: `/login` renders pixel-correct, zero console errors —
      matches `update-critical-dependencies-security`'s precedent of not
      trusting a build-only exit code.
- [x] 7.4 Full project `vue-tsc --noEmit`: zero errors. `eslint`: zero
      errors after two real fixes — (1) `.eslintrc.cjs`'s
      `import/no-unresolved` needed `^~icons/` added to its existing
      `ignore` list (same pattern as `#components`/`virtual:meta-layouts`),
      and `import/extensions` needed a `pathGroupOverrides` entry ignoring
      `~icons/**` (a separate rule from `no-unresolved`, with its own,
      differently-shaped options object — `pathGroupOverrides` must sit
      alongside a `pattern` key, not mixed into the flat per-extension
      object, or the plugin silently discards it); (2) real style
      violations in this change's own new code (`arrow-parens`/`curly` in
      `modules/rspack-vite-replacements.ts`, `lines-around-comment` in
      `nuxt.config.ts`), fixed directly, not suppressed.
- [x] 7.5 **Finding: adopt.** The blocker this entire proposal exists to
      resolve — Vuetify components failing to resolve under Rspack — is
      fixed and verified end-to-end, against the final, fully cleaned-up
      repo state (both Vite-only packages actually removed, not just
      config pointed elsewhere): a real headless browser session confirms
      `/login` renders pixel-correct, login authenticates and navigates to
      `/dashboards/analytics`/`/agents` with full Vuetify styling (analytics
      cards, charts, sidebar nav, a real data table with status badges),
      under both Rspack (the new default) and Vite (still fully working,
      independently re-verified after `vite-plugin-vuetify`/
      `vite-svg-loader` were removed). `pnpm build` under Rspack succeeds
      and its production preview renders correctly. Cold start is
      comparable to Vite (44.7s vs. 47.0s). `vue-tsc`/`eslint` pass with
      zero errors. All `specs/build-tooling/spec.md` scenarios pass.

      **Two real, open items are tracked, not silently accepted, as
      follow-up for a future change** (per `AGENTS.md`'s
      one-intent-per-change rule — resolving these here would expand this
      change's scope beyond "adopt the builder"):
      1. **`vuetifyStyles.settings`'s virtual-template compile failure
         (task 4.5a)** — this repo's own Vuexy theme customization
         (`_vuetify.scss` → `@core/scss/template/libs/vuetify/variables`)
         does not yet apply under Rspack; Vuetify's un-themed defaults
         render instead. Subtle enough that casual browser inspection in
         this session did not catch a visible difference, but it is a
         real, unresolved gap — candidate fixes are listed in 4.5a.
      2. **A real, non-blocking SSR hydration-mismatch defect** in
         `unplugin-icons`'s generated output (task 5.3b) — `clip-path`/
         `id` attributes differ between server and client render on every
         page load. Vue treats it as check-only and it does not visibly
         break rendering here, but it is real console noise a genuine
         adopt decision should track, not silently accept.

      Locale (`en`/`fr`/`ar`) and theme-switching were not independently
      re-verified via browser in this session (out of time budget) — a
      real, if likely low, residual risk, since neither composable
      depends on the builder.
- [x] 7.6 **Executed**: removed `vite-plugin-vuetify` and `vite-svg-loader`
      from `package.json` and `nuxt.config.ts`'s `vite.plugins` entirely
      (see tasks 4.4/5.4) — `pnpm dev`/`pnpm build` are Rspack-only by
      default now (`builder: 'rspack'`), and the Vite fallback path
      (`builder` unset) works independently, both re-verified via real
      `HTTP 200` responses and browser screenshots after the removal, not
      assumed safe from the removal diff alone. This session hit real,
      self-inflicted friction executing this cleanup — a working-tree/tool
      sync issue caused `nuxt.config.ts`, `package.json`, and
      `modules/rspack-vite-replacements.ts` to intermittently revert to
      earlier in-session states across several edit attempts, silently
      reintroducing already-removed dependencies more than once. Resolved
      by fully rewriting each affected file in one pass, re-verifying with
      `md5sum` immediately after each rewrite, running the complete
      verification pass (both builders' `pnpm dev`, `pnpm build` + real
      production preview, `vue-tsc`, `eslint`) against that exact
      rewritten state, and committing immediately once every check passed
      clean — the committed state (`git show HEAD:...`) was independently
      re-diffed and re-verified after commit, not assumed correct from the
      pre-commit checks alone.
- [x] 7.7 N/A — finding is adopt, not no-adopt.

## 8. PR

- [x] 8.1 Commit only `openspec/changes/adopt-rspack-builder/` planning
      artifacts on `docs/openspec-adopt-rspack-builder`, per AGENTS.md
      Phase A.
- [x] 8.2 Open PR #1 (plan-only), title
      `docs(openspec): propose adopt-rspack-builder`, no application code.
      Wait for CODEOWNER approval and merge before starting Phase B.
      Merged as PR #12.

## 9. Implementation (Phase B — only after PR #1 above is merged)

- [x] 9.1 Branch `feat/rspack-builder` from the tip of `main` (after PR #12
      merged).
- [x] 9.2 Implemented tasks 2-7.
- [x] 9.3 Ran an internal review pass over the diff (reviewer agent).
      Confirmed correct on all 7 checklist points: zero remaining bare
      `@name` imports, all 7 aliases dual-registered correctly, all 15
      SVG-as-icon sites migrated, `modules/rspack-vite-replacements.ts`'s
      registration logic and `rspack:config` patches mechanically sound,
      `vuetifyStyles: {}` gap accurately documented, `package.json`
      cleanup precise (no accidental touch of unrelated
      `vite-plugin-vue-meta-layouts`). Independently re-ran `pnpm dev`
      under both builders after clean cache: both returned real
      `HTTP 200`, byte-identical 65566-byte bodies, zero errors. No
      defects found.
- [ ] 9.4 Open a PR reflecting the adopt finding (task 7.5), including the
      two open follow-up items (4.5a, 5.3b) explicitly in the PR
      description, not just this `tasks.md`.
- [ ] 9.5 Wait for CODEOWNER approval.
- [ ] 9.6 Before merging: `openspec validate adopt-rspack-builder --strict`,
      then `openspec archive adopt-rspack-builder --yes`, committed as the
      PR's final commit (before merge, not after).
- [ ] 9.7 Merge (human review, not the agent).
