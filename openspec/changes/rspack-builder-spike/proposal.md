## Why

`optimize-dev-experience` cut this repo's cold `pnpm dev` time-to-first-response from 52.9s to
34.4s but did not touch the remaining bottleneck: Vite's own dependency pre-bundling and module
transformation. A follow-up investigation into Bun found no viable path (no Nuxt Bun builder, no
Bun-native `.vue`/`.scss` loader). A second investigation into Rspack initially concluded "not
viable" on the assumption that Vuetify had no Rspack path at all — that assumption was wrong.
Verified today (source code read, not just docs) against this repo's actual pinned versions:

- **`@nuxt/rspack-builder`** is Nuxt's official third builder, Rsbuild-powered, shipped as a
  normal (non-experimental-only) feature in Nuxt 4.5 — the version this repo is on.
- **`@vuetify/unplugin-styles/nuxt`** (v1.0.0-rc.1) replaces `vite-plugin-vuetify`'s styles half.
  Its compiled `dist/nuxt.mjs` contains a real `case "@nuxt/rspack-builder":
  addRspackPlugin(RspackPlugin(...))` branch — read directly from the downloaded npm tarball, not
  inferred from a README. `@rspack/core: "^1"` is a declared (optional) peerDependency.
- **`unplugin-vue-components/rspack`** + its built-in `Vuetify3Resolver` replaces
  `vite-plugin-vuetify`'s auto-import half. Its `dist/rspack.mjs` is a real `unplugin`-generated
  Rspack plugin factory (also read from the downloaded tarball). The package's own `./nuxt` export
  does not yet branch on Rspack, so this plugin must be registered directly via `@nuxt/kit`'s
  `addRspackPlugin`, not through that wrapper.
- **`unplugin-icons/rspack`** + `compiler: 'vue3'` + `FileSystemIconLoader` replaces
  `vite-svg-loader` for this repo's actual usage pattern (SVG files imported as Vue icon
  components, confirmed via grep across `@core/components/TheCustomizer.vue`,
  `components/dialogs/AddEditAddressDialog.vue`, `plugins/vuetify/icons.ts` — none of this repo's
  SVG imports use `vite-svg-loader`'s URL/raw modes, only the default component mode). The
  package ships a working Rspack+Vue3 example in its own monorepo (`examples/rspack-vue3`).
- **`vite-plugin-vue-meta-layouts`** turns out to need no replacement at all: grepping
  `nuxt.config.ts`'s actual `vite.plugins` array shows only `svgLoader()` and `vuetify()`
  registered — this dependency is installed (`package.json`, `pnpm-lock.yaml`) but never wired
  into the Vite config. It is dead weight independent of any builder choice.

No production Nuxt 4.5 + Vuetify 3 + Rspack deployment using exactly this combination of packages
was found anywhere — this is genuinely new ground for this specific stack, not a well-trodden
path. A known, active, upstream defect exists in `@vuetify/unplugin-styles`
(`vuetifyjs/nuxt-module#381`: non-deterministic CSS `@layer` ordering in dev under that package's
runtime style injection, reproduced in production, open since June 2026) that would need to be
verified as absent (or present-but-tolerable) in this repo's own Sass/Vuetify setup before this
goes anywhere near adoption.

Given that novelty and the one confirmed upstream risk, this change is a **time-boxed,
measurement-first spike on an isolated branch**, not a committed migration. It exists to get a
real answer — with this repo's actual dependency graph, not an extrapolated benchmark — to
"does Rspack actually make `pnpm dev` faster here, and does the app still work correctly."

## What Changes

- Add `@nuxt/rspack-builder` and switch `builder: 'rspack'` **on a throwaway spike branch only**;
  no change lands on `main` from this proposal by itself.
- Replace `vite-plugin-vuetify` with `@vuetify/unplugin-styles/nuxt` (styles) +
  `unplugin-vue-components`'s `Vuetify3Resolver` registered via `addRspackPlugin` (component
  auto-import) — both switched in tandem, since both replace the one package being removed.
- Replace `vite-svg-loader` with `unplugin-icons` (`compiler: 'vue3'`,
  `FileSystemIconLoader` pointed at this repo's existing `@images/svg` and
  `@images/customizer-icons` directories), updating the ~14 call sites that currently
  `import x from '...svg'` to the `~icons/<collection>/<name>` convention.
- Remove `vite-plugin-vue-meta-layouts` from `package.json` (confirmed dead — not registered in
  `nuxt.config.ts`'s `vite.plugins`) regardless of the spike's outcome — this is a safe, isolated
  cleanup independent of the builder question.
- Measure: cold `pnpm dev` time-to-first-response (same methodology as `optimize-dev-experience`:
  clean-cache restart, `curl` timing on `/login`), and manually verify the app still renders,
  authenticates, and switches locale/theme correctly under the Rspack builder.
- Explicitly check for `vuetifyjs/nuxt-module#381`'s symptom (non-deterministic component style
  cascade order, e.g. a `VBtn size="small"` intermittently rendering at the wrong font size across
  repeated cold loads) in this repo's own Vuetify usage.
- Record the finding (adopt / adopt-with-follow-up / no-adopt) with numbers and evidence. If the
  finding is "no-adopt," the spike branch is discarded and no further code change results — this
  is an explicitly acceptable, complete outcome, matching how the Bun spike concluded in
  `optimize-dev-experience`.

## Capabilities

### New Capabilities
- None. `skip_specs: true` — no capability/contract behavior changes, dev tooling and build
  configuration only.

### Modified Capabilities
- None.

## Non-Goals

- **Not a committed migration.** This proposal authorizes a spike only. Adopting Rspack as this
  repo's default builder is a separate decision, made after this spike's findings are reviewed,
  and would need its own follow-up OpenSpec change if the finding supports it.
- **Not touching production build behavior** beyond what's needed to keep `pnpm build` working
  under the new builder during the spike — no deploy-pipeline changes.
- **Not resolving `vuetifyjs/nuxt-module#381` upstream.** If this repo's own setup reproduces
  that symptom, the spike's finding becomes "no-adopt until upstream fixes it" or "adopt with
  the documented workaround" (an inline `<style>` `@layer` order declaration in `app.head.style`)
  — not a decision to patch the third-party package.
- **Not migrating `@nuxtjs/better-auth` or any other non-Vite-plugin dependency** — those don't
  depend on the bundler choice.
