## Why

The user wants Rspack adopted as this repo's build tool. A prior spike
(`openspec/changes/rspack-builder-spike/`, PR #11, merged as no-adopt) blamed
this repo's alias convention broadly and stopped there. Direct investigation
for this proposal (three disposable git worktrees, `@nuxt/rspack-builder`
installed and driven to a real `curl` response, not just config review) found
a more precise picture: the alias problem has a known, verified fix, and is
not actually the blocker that matters. The real blocker is that this
template's Vuetify component auto-import and per-component style extraction
(`vite-plugin-vuetify`) is a Vite-only package with no Rspack equivalent
wired in yet — without it, Vuetify's own components (`VApp`,
`VLocaleProvider`, and by extension everything the app renders) fail to
resolve, and SSR returns an empty `<div id="__nuxt"><!----></div>` even
though the HTTP response itself is a 200.

## Investigation findings (verified, not carried over from the prior spike)

Reproduced end-to-end against a disposable worktree of this exact repo,
driving a real `pnpm dev`-equivalent server and inspecting real HTTP
responses at each step:

1. **Alias bare-specifier bug — real, and has a working fix.** Rspack's
   externals resolver (`@nuxt/rspack-builder`'s `serverStandalone`, shared
   with the legacy webpack builder) only treats specifiers starting with a
   short fixed prefix list (`#`, `~`, `@/`, `#app`, …) as definitely-internal
   before falling back to filesystem resolution; a bare `@core` fails that
   fast path and gets treated as an external npm scope. **Fix, verified**:
   rename the alias *keys* this repo's own JS/TS `import` statements use
   from `@name` to `#name` (`#core`, `#layouts`, `#images`, `#styles`,
   `#configured-variables`, `#db`, `#api-utils`) — same convention this repo
   already uses for `#auth`/`#components`. Confirmed: renaming just the
   import-statement side (73 files) while keeping the underlying alias
   *targets* the same made the "Invalid module" error disappear entirely.
2. **`sass-loader` is a required peer dependency that was never installed —
   in this repo, in the archived spike, and in this investigation's first
   pass.** `@nuxt/rspack-builder` does not declare it as a hard dependency
   (matches upstream webpack-builder convention: bring your own loader).
   Without it, every `.scss`/`.sass` file in the SSR bundle (45 in this
   repo's case) fails as `Cannot find module`, which is what made the prior
   spike and this investigation's early passes look like a much larger,
   structural "Sass is broken under Rspack" problem. **Fix, verified**:
   `pnpm add -D sass-loader@16`. Once installed, `.scss`/`.sass` compiles.
3. **`vue-demi` is an optional peer dependency of `nitropack`/`unstorage`,
   never installed, that the externals resolver still tries to reach.**
   **Fix, verified**: add `'vue-demi'` to `build.transpile` in
   `nuxt.config.ts`.
4. **Sass's own `@use`/`@forward` resolution needs the *original* `@name`
   alias kept alongside the renamed `#name` one.** This repo's `.scss` files
   and `<style lang="scss">` blocks contain `@use "@core/scss/base"`-style
   statements (73+ occurrences, left untouched by the JS/TS import rename
   above since they were never broken under Vite). Sass resolves these via
   the bundler's own `resolve.alias` map, not via the JS module resolver the
   externals bug lives in — so once `@core`'s JS-side references become
   `#core`, Sass's `@use "@core/..."` breaks unless `@core` is *also* still
   registered as an alias pointing at the same target. **Fix, verified**:
   register both `#name` and the original `@name` in `nuxt.config.ts`'s
   `alias` block and Vite's `resolve.alias` mirror (kept for the Vite
   fallback dev command), pointing at the same path.
5. **With all four fixes applied together, `/login` returns a real HTTP
   200** — first time this repo has rendered anything under Rspack, in this
   spike or the prior one.
6. **The response body is empty, though — this is the actual, still-open
   blocker.** `<div id="__nuxt"><!----></div>`, with Vue SSR warnings
   `Failed to resolve component: VLocaleProvider` and
   `Failed to resolve component: VApp`. Root cause: this repo's Vuetify
   integration (`plugins/vuetify/index.ts` + `vite-plugin-vuetify`'s
   `styles`/component-registration behavior, configured in `nuxt.config.ts`'s
   `vite.plugins`) is Vite-only — it never runs under Rspack, so Vuetify's
   own components (not just this app's custom ones) are never registered.
   **Not fixed by this investigation** — this is exactly the
   `@vuetify/unplugin-styles` + `unplugin-vue-components` +
   `Vuetify3Resolver` replacement the prior spike's `design.md` already
   designed (see that document's "Decisions" section) but never got far
   enough to verify, because the alias bug blocked it first. This proposal's
   `tasks.md` re-attempts that replacement now that the path to it is clear.

## What Changes

- Add `@nuxt/rspack-builder` and `sass-loader@16` as devDependencies; set
  `builder: 'rspack'` in `nuxt.config.ts`.
- Rename every bare `@name` alias this repo's own JS/TS `import` statements
  reference (`@core`, `@layouts`, `@images`, `@styles`,
  `@configured-variables`, `@db`, `@api-utils`) to `#name`, matching this
  repo's existing `#auth`/`#components` convention — **verified fix** for
  the externals-resolver bug (finding 1 above). **BREAKING** for any
  external tooling or contributor muscle memory assuming the current `@name`
  convention (internal-only change; no external consumers of this repo's
  source as a library).
- Keep the original `@name` alias registered in `nuxt.config.ts`'s `alias`
  block and Vite's `resolve.alias` mirror, alongside the new `#name` one,
  pointing at the same target — **verified fix** for Sass's own
  `@use`/`@forward` resolution (finding 4 above), which is unaffected by the
  JS-side rename and still needs the old key to resolve.
- Add `'vue-demi'` to `build.transpile` in `nuxt.config.ts` — **verified
  fix** for finding 3 above.
- Replace `vite-plugin-vuetify` with `@vuetify/unplugin-styles` (styles) +
  `unplugin-vue-components` + `Vuetify3Resolver` (auto-import), registered
  directly via `@nuxt/kit`'s `addRspackPlugin` since neither package's own
  `/nuxt` wrapper has a working Rspack branch (verified previously in the
  prior spike's `design.md`, not re-verified here) — **not yet
  attempted in this investigation**, this is the actual remaining blocker
  (finding 6 above). Explicitly test for `vuetifyjs/nuxt-module#381`'s
  cascade-order symptom as part of this work, since it's caused by
  `@vuetify/unplugin-styles`'s own runtime mechanism.
- Replace `vite-svg-loader` with `unplugin-icons`'s `FileSystemIconLoader`,
  changing import syntax at every call site (`~14` per the prior spike's
  `design.md`) — `vite-svg-loader` has no Rspack-compatible path.
- Resolve the `pnpm` bin-name conflict (`nuxt`/`nuxi` silently renamed to
  `nuxt-cli`/`nuxi-ng`) the prior spike hit when `@nuxt/rspack-builder` was
  installed, or document a working, non-manual mitigation.

## Capabilities

### New Capabilities

- `build-tooling`: the Nuxt builder (bundler) this application uses for
  `pnpm dev`/`pnpm build`, and the internal path-alias convention its
  module resolution depends on.

## Impact

- **Affected code**: `nuxt.config.ts`, `package.json`/`pnpm-lock.yaml`,
  every source file importing via `@core`/`@layouts`/`@images`/`@styles`/
  `@configured-variables`/`@db`/`@api-utils` (73 files, repo-wide — the
  single largest-blast-radius surface this repo's aliasing convention
  touches), `.eslintrc.cjs` (import-resolver alias/ignore configuration),
  `plugins/vuetify/index.ts` (styles/auto-import replacement),
  SVG-as-icon-component call sites (`~14`).
- **Not affected**: `AGENTS.md`'s `pages/<area>/*.vue` + `views/<area>/*`
  routing convention, the CASL ability model, `useApi` fetch wrapper, auth
  flow — none of these depend on the bundler or the alias naming scheme
  itself, only on the aliases resolving to the same underlying paths.
- **Risk class**: repo-wide rename plus a build-tool swap is high blast
  radius by definition (touches nearly every source file) but the alias
  rename itself is now de-risked (mechanical, verified working end-to-end
  through a real HTTP 200 SSR response in this investigation). The
  remaining risk is concentrated entirely in the Vuetify
  styles/auto-import replacement (finding 6) — genuinely untested in this
  exact package combination, no production deployment of it found anywhere
  during research — see `design.md` for the staged rollback/verification
  plan.
