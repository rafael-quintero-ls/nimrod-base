## Context

`optimize-dev-experience` (merged as PR #9) already removed `@nuxtjs/i18n` and dead weight
from the dev-boot path, leaving Vite's own dependency pre-bundling/module transformation as the
remaining, larger, structural cost. That work also established this repo's measurement
methodology (clean-cache restart, `curl` timing on `/login`, before/after numbers) and its
verification discipline (empirical `curl`-diffing of rendered output, not just reading code —
which is exactly what caught the real `@nuxtjs/i18n` lazy-loading bug in that change). This spike
reuses both.

Current Vite-plugin surface in `nuxt.config.ts`'s `vite.plugins` array (verified by direct read,
not assumed): `svgLoader()` (from `vite-svg-loader`) and `vuetify(...)` (from
`vite-plugin-vuetify`). `vite-plugin-vue-meta-layouts` is in `package.json`/lockfile but not in
that array — confirmed dead regardless of this spike's outcome.

Package-level verification performed for this proposal (downloaded and read actual npm tarballs,
not just READMEs):
- `@vuetify/unplugin-styles@1.0.0-rc.1`: `dist/nuxt.mjs` contains
  `case "@nuxt/rspack-builder": { const { default: RspackPlugin } = await import("./rspack.mjs");
  addRspackPlugin(RspackPlugin(pluginOptions)); break; }` — a real, compiled branch, not a stub.
- `unplugin-vue-components@32.1.0`: `dist/rspack.mjs` is `const rspack =
  unplugin_default.rspack; export { rspack as default }` — a real `unplugin`-generated Rspack
  plugin. Its `dist/nuxt.mjs` wrapper only calls `addWebpackPlugin`/`addVitePlugin` (no Rspack
  branch), so the Nuxt-module wrapper is not usable as-is for this; the `/rspack` export must be
  registered directly.
- `vuetify-nuxt-module@1.0.0-rc.5` (the "official" Vuetify Nuxt module, not used by this repo
  today): its compiled `dist/module.mjs` registers its component-configuration virtual module via
  `viteInlineConfig.plugins.push(vuetifyConfigurationPlugin(ctx), ...)` — hardcoded against Vite's
  inline config shape, zero mentions of `rspack`/`builder` anywhere in the bundle. This confirms
  (by code, not just its own compatibility doc) that `vuetify-nuxt-module` itself has no Rspack
  path — irrelevant to this spike since this repo doesn't use that module, but it explains why
  this repo's own hand-assembled `plugins/vuetify/index.ts` + direct `vite-plugin-vuetify` usage
  needs its own hand-assembled Rspack replacement rather than a drop-in module swap.
- `unplugin-icons`: ships a real `examples/rspack-vue3` project in its own monorepo (not just a
  doc snippet) combining Rspack + Vue 3 + its `compiler: 'vue3'` option.

## Goals / Non-Goals

**Goals:**
- Get a real, measured answer (this repo's actual code, not a synthetic benchmark) to whether
  `@nuxt/rspack-builder` reduces `pnpm dev` cold warm-up time in this specific, memory-constrained
  environment.
- Confirm or refute, empirically, that `@vuetify/unplugin-styles` + `unplugin-vue-components`'s
  Vuetify resolver + `unplugin-icons` together restore this repo's actual rendered behavior
  (component auto-import, per-component treeshaken styles, SVG-as-icon-component) under Rspack.
- Explicitly test for `vuetifyjs/nuxt-module#381`'s cascade-order symptom in this repo's own
  component usage, since that's an active, unresolved upstream risk directly relevant to the
  styles-half replacement being adopted here.
- Clean up the confirmed-dead `vite-plugin-vue-meta-layouts` dependency regardless of the spike's
  builder-choice outcome.

**Non-Goals:**
- Not committing to Rspack as this repo's builder — that's a separate decision after this spike's
  findings are in.
- Not achieving full production-build parity in the spike — dev-server behavior and warm-up time
  are the object of measurement; production build correctness is a secondary check, not gated on
  for the spike's own completion.
- Not vendoring or patching any upstream package — if a package's Rspack path is broken for this
  repo's usage, that's a "no-adopt" finding, not a fork-and-fix project.

## Decisions

- **Spike lives on its own branch, never merged as-is.** Consistent with the Bun spike's pattern
  in `optimize-dev-experience`: this branch is disposable. If the finding supports adoption, a
  fresh, separately-scoped OpenSpec change proposes the actual migration as a real, reviewed PR —
  this spike's branch is not fast-forwarded or reused directly.
- **Replace `vite-plugin-vuetify` with two packages, not one, because it has two responsibilities
  no single Rspack-compatible package covers together**: `@vuetify/unplugin-styles/nuxt` for
  per-component Sass/CSS resolution (matches `vite-plugin-vuetify`'s `styles` option, which this
  repo already uses via `configFile`), and `unplugin-vue-components` + `Vuetify3Resolver` for
  auto-import (matches `vite-plugin-vuetify`'s implicit `<VBtn>`-style auto-import that this
  repo's every page/view relies on without an explicit `import { VBtn } from 'vuetify/components'`
  anywhere).
- **Register `unplugin-vue-components/rspack` directly via `@nuxt/kit`'s `addRspackPlugin` in a
  Nuxt module hook, not via the package's own `/nuxt` wrapper** — verified that wrapper has no
  Rspack branch (see Context). This is extra wiring code this spike must write and verify works,
  not a drop-in.
- **Replace `vite-svg-loader` with `unplugin-icons`'s `FileSystemIconLoader`, changing import
  syntax at every call site** (`import x from '@images/foo.svg'` → `import x from
  '~icons/<collection>/foo'`), rather than searching for a `vite-svg-loader`-compatible Rspack
  loader (grep-confirmed none exists) or a React-only tool like `@rsbuild/plugin-svgr` (confirmed
  React-specific, not usable for Vue). This is a real behavior-preserving migration (same rendered
  icon components) at a real cost (every call site's import statement changes), not a
  config-only swap.
- **`vite-plugin-vue-meta-layouts` removal is unconditional**, not gated on the spike's builder
  outcome — it's dead weight today regardless of which builder wins.

## Risks / Trade-offs

- **Genuinely untested combination.** No production Nuxt 4.5 + Vuetify 3.13 + Rspack deployment
  using this exact package set was found anywhere during research. This spike may surface
  integration bugs no one else has hit yet — that's the point of spiking on a disposable branch
  rather than proposing a direct migration.
- **`vuetifyjs/nuxt-module#381`'s cascade-order bug may reproduce here.** It's caused by
  `@vuetify/unplugin-styles`'s runtime style-injection mechanism itself (not by
  `vuetify-nuxt-module`, which this repo doesn't use) — so it is a real, direct risk for this
  spike's own styles-package choice, independent of the builder. Mitigation: explicitly test for
  the symptom (repeated cold loads of a page with a `VBtn size="small"` or similar, checking
  computed style consistency) as part of this spike's verification, and record the documented
  workaround (an inline `<style>` `@layer` order declaration in `nuxt.config.ts`'s `app.head.style`)
  as a candidate mitigation if the symptom appears, rather than treating it as an automatic
  "no-adopt."
- **Icon-import migration touches ~14 call sites** across `@core/components/TheCustomizer.vue`,
  `components/dialogs/AddEditAddressDialog.vue`, `plugins/vuetify/icons.ts`, and any others found
  during implementation — each needs to render the identical icon after the syntax change; a
  missed or mistranslated import is a visible regression, not a silent one, but still needs
  per-site verification, not a bulk find-and-replace assumed correct.
- **Spike branch discipline**: because this is explicitly disposable, there's a temptation to cut
  corners on measurement rigor "since it's just a spike." Mitigated by reusing
  `optimize-dev-experience`'s exact measurement methodology (clean-cache restart, `curl` timing,
  before/after numbers) rather than an informal "it feels faster" judgment.
