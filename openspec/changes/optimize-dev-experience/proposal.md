## Why

`pnpm dev` warm-up has been observed taking 20-45+ seconds in this session, with two Nuxt-logged
slow-module warnings pinpointing concrete, addressable causes: `@nuxt/devtools` (~16s setup) and
`@nuxtjs/i18n` (~7.4s setup). Separately, this session's memory-constrained VM (7.3GB/4 cores,
swap frequently full) caused `nuxt dev`'s vite-node process to crash reproducibly with "IPC
connection closed" during `agents-catalog`'s manual verification (documented in
`openspec/changes/archive/2026-08-28-agents-catalog/tasks.md`), on a route unrelated to that
change's own code — confirming warm-up/stability cost is a live, recurring friction point, not a
one-off. A prior investigation into whether migrating to Bun would help (package manager, Nitro
runtime preset, or full Vite replacement) found that none of the three levels touch the actual
bottleneck (Vite's own dependency pre-bundling and module transformation) except a full Vite
replacement, which does not exist as a viable option for this stack today (no Nuxt Bun builder,
no Bun-native `.vue`/`.scss` loader, no `vite-plugin-vuetify`/`@intlify/unplugin-vue-i18n`
equivalent) — see Non-Goals.

## What Changes

- Disable `@nuxt/devtools` by default in local dev, re-enabled via an explicit env var
  (`NUXT_DEVTOOLS=true`) for anyone who wants the inspector — removes ~16s from every `pnpm dev`
  boot with no functional change to the served application.
- Configure `@nuxtjs/i18n` for lazy-loaded locale files (`lazy: true` + `langDir`) instead of the
  current eager `import.meta.glob(..., { eager: true })` in `i18n.config.ts` — reduces `@nuxtjs/i18n`
  module setup cost, no change to available locales, translations, or `$vuetify` locale behavior.
- Audit five dependency families with zero live import sites outside orphaned `@core/` shared
  components (`@tiptap/*`, `chart.js`+`vue-chartjs`, `mapbox-gl`, `@fullcalendar/*`,
  `shepherd.js`/`vue-shepherd`) and remove any confirmed dead ones, along with their sole
  `@core/components`/`@core/libs` call sites — reduces `pnpm install` resolution surface and Vite's
  dependency-scan surface at cold start. `vue3-apexcharts`/`apexcharts` are confirmed live (used by
  4 kept dashboard analytics views) and are explicitly excluded from this audit.
- Run a bounded, time-boxed spike measuring `bun --bun run dev` (Nuxt CLI process executed under
  the Bun runtime; Vite itself is unaffected and still does the actual bundling) against this
  repo's actual warm-up time in this environment, to get a real number instead of relying on
  Bun's own minimal-starter-app benchmark. This does not touch `nitro.preset`, production build
  output, or any server-runtime behavior — dev-only, and adopted only if the spike shows a
  measurable, repeatable improvement.

## Capabilities

### New Capabilities
- None. This change does not add or modify a page/route, API endpoint, data model, or auth/
  permission rule. Per `AGENTS.md`'s scope table, dev-tooling-only changes with no observable
  application behavior change may skip the full capability-spec lifecycle — this proposal still
  goes through OpenSpec because it touches shared build configuration (`nuxt.config.ts`,
  `i18n.config.ts`) and a dependency audit, both worth a recorded decision trail, but does not
  introduce a `specs/<capability>/spec.md` delta.

### Modified Capabilities
- None. No existing capability's requirements change — `auth`, `agents`, `navigation-roadmap`,
  `hades-vocabulary-mapping` are all unaffected in their observable behavior.

## Non-Goals

- **No migration to Bun as package manager or Nitro runtime preset.** Investigated and rejected
  with evidence: neither touches Vite's dependency pre-bundling or module transformation, which is
  the actual warm-up bottleneck. `nitro.preset: 'bun'` only affects the production server
  entrypoint (`Bun.serve()` vs `http.createServer`), never consulted by `nuxt dev`. Swapping
  `pnpm` for `bun install` requires reconfiguring `trustedDependencies` (Bun replaces, not extends,
  its default-trusted lifecycle-script list — `@parcel/watcher` and `unrs-resolver` are not on
  that default list and would silently stop building their native bindings without an explicit
  entry) for zero warm-up benefit.
- **No migration to Bun's native bundler replacing Vite.** Investigated and rejected: not a real
  option today. Nuxt's builder architecture supports only Vite and webpack (confirmed in Nuxt Kit's
  own docs and source — no Bun builder package exists). Bun's native bundler has no `.vue` loader
  and no `.scss`/`.sass` loader; none of this repo's four Vite-only plugins
  (`vite-plugin-vuetify`, `vite-svg-loader`, `vite-plugin-vue-meta-layouts`,
  `@intlify/unplugin-vue-i18n`) have a Bun-native equivalent, and the upstream Vite-plugin
  compatibility layer that would bridge this gap is an open, unimplemented feature request
  (`oven-sh/bun#39976`).
- **No structural Sass architecture rework.** `@core/scss/template/index.scss`'s multi-partial
  `@use` chain is confirmed shared layout/skin/nav infrastructure (not per-page demo bloat), and
  restructuring it is larger, riskier surgery than this change's scope — a candidate for a future,
  separately-proposed change if the dependency-audit and devtools/i18n fixes prove insufficient.
- **No further demo page/view deletion.** The large stale-demo-tree premise (108/117 pages,
  499/526 views) was already remediated by the archived `2026-08-26-simplify-sidebar-navigation`
  change; current counts (28 pages, 28 views) are not a live warm-up lever.
- **No change to VM/environment memory or CPU allocation** — outside this repository's control.
