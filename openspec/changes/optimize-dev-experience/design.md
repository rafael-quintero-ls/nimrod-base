## Context

Warm-up diagnosis (this session's investigation) ranked six contributing factors to slow
`pnpm dev` boot, by confirmed evidence:

1. VM memory/CPU constraint (7.3GB/4 cores, swap frequently full) — environment-level, amplifies
   every other factor, not addressable in this repo.
2. `@nuxt/devtools` module setup: ~16s (`nuxt.config.ts`, `devtools: { enabled: true }`).
3. `@nuxtjs/i18n` module setup: ~7.4s, independent of locale-file size — `i18n.config.ts` eagerly
   globs and inlines all locale JSON via `import.meta.glob(..., { eager: true })` at every boot.
4. Sass compilation surface (`@core/scss/template/index.scss`'s multi-partial `@use` chain) —
   structural, shared layout/skin/nav infrastructure, not a config-level fix.
5. Unused demo page/view tree — already remediated by the archived
   `2026-08-26-simplify-sidebar-navigation` change (28 pages/28 views today, not 108/499).
6. Dead heavy dependencies (`@tiptap/*`, `chart.js`+`vue-chartjs`, `mapbox-gl`, `@fullcalendar/*`,
   `shepherd.js`/`vue-shepherd`) resolved/scanned at cold start despite zero live page reachability
   — only reachable via `@core/`-only components that `components.dirs` auto-registers regardless
   of usage.

Separately, a Bun-migration investigation (package manager / Nitro runtime preset / full Vite
replacement) found none of the three levels address factor 2-4's actual bottleneck except a full
Vite replacement, which is not viable for this stack today (see proposal.md Non-Goals for full
evidence). The one Bun-adjacent option worth a bounded look — `bun --bun run dev`, which runs the
orchestrating CLI process under Bun's runtime while Vite itself still does the bundling — was
spiked in this environment (see "Bun spike result" below): it was **slower** than Node, not
faster, confirming the investigation's prediction that this option doesn't touch the actual
bottleneck and adding no value here.

## Goals / Non-Goals

**Goals:**
- Remove the two confirmed, named, near-zero-risk module-setup costs (devtools, i18n) from the
  default dev boot path.
- Reduce dependency-resolution and Vite dependency-scan surface by removing confirmed-dead heavy
  packages, without touching any live-used dependency (explicitly verified per package before
  removal).
- Get a real, repeatable measurement of whether `bun --bun run dev` helps in this specific
  environment, rather than relying on an unrepresentative fresh-starter-app number, before
  deciding whether it's worth adopting as a documented alternative dev command.

**Non-Goals:**
- Not restructuring the Sass architecture (factor 4) — larger, riskier surgery, deferred to a
  future change if this change's fixes prove insufficient.
- Not touching the VM/environment (factor 1) — outside repo control.
- Not adopting Bun as package manager or production runtime (see proposal.md Non-Goals for full
  rejection evidence) — this change's Bun-related work is limited to the bounded spike.
- Not deleting any further pages/views (factor 5 already resolved).

## Decisions

- **Devtools gated by env var, not deleted from config**: `devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' }`
  in `nuxt.config.ts` — defaults to disabled (fixing the common-case warm-up cost) while staying a
  one-line env-var flip for anyone who wants the inspector for a specific debugging session.
  Rejected alternative: removing the `devtools` module entirely — loses the capability outright for
  no additional warm-up benefit over the env-gated default-off approach.
- **`@nuxtjs/i18n` module replaced entirely with plain `vue-i18n` (`plugins/i18n/index.ts`),
  not merely configured for lazy-loading — this is a deviation from the original plan (see
  "i18n lazy-loading attempt and empirically-confirmed bug" below for why).** The module is
  removed from `nuxt.config.ts`'s `modules` array and `package.json`; `useI18n` is auto-imported
  from `vue-i18n` directly via `imports.presets`; locale JSON files are loaded via simple dynamic
  `import()` in the new plugin, with the active locale's file awaited before `createI18n()` runs
  so there is no window where the composer has an empty message set. Justified because
  `@nuxtjs/i18n`'s own routing-strategy/unplugin-wiring setup cost (~7.4s, independent of
  lazy-loading) is eliminated entirely, not just deferred, and grep-confirmed zero call sites
  exist in this repo for any of that module's routing helpers (`localePath`,
  `switchLocalePath`, etc.) — `strategy: 'no_prefix'` was already the only strategy ever used,
  confirming locale-prefixed routing was never a real dependency.
- **Dependency audit is verify-then-remove, per package, not a bulk deletion**: each of the five
  candidate families (`@tiptap/*`, `chart.js`+`vue-chartjs`, `mapbox-gl`, `@fullcalendar/*`,
  `shepherd.js`/`vue-shepherd`) gets an explicit `lsp references` / grep check confirming zero call
  sites outside the specific orphaned `@core/` component(s) already identified by the warm-up
  investigation, before that package and its sole consuming component(s) are removed together.
  `vue3-apexcharts`/`apexcharts` is explicitly out of scope (confirmed live).
- **Bun spike is measurement-only, gated on results**: run `bun --bun run dev` in this same
  environment, capture the same warm-up log lines this session already captured for the Node-based
  baseline (`Vite client/server warmed up`, `Nuxt Nitro server built`, total time-to-first-response
  on a representative route), and record the comparison in this change's `tasks.md`/PR description.
  If the spike shows no measurable, repeatable improvement (or introduces any functional
  regression, e.g. in `@nuxtjs/better-auth` session handling, which has no stated Bun-runtime
  support), the spike's finding is "no adoption" and no further code changes result from it — this
  is explicitly allowed to conclude in a no-op.

## Risks / Trade-offs

- **Devtools env-gating changes a contributor's default experience**: anyone used to devtools being
  on by default now needs to set `NUXT_DEVTOOLS=true` (or add it to a personal, gitignored `.env`).
  Mitigated by documenting the flag in `.env.example` (commented, not set) and in this change's PR
  description.
- **i18n module replacement is high-blast-radius**: every page using `useI18n()`/`$t()`
  ultimately depends on `plugins/i18n/index.ts`. A mistake here could break translations
  repo-wide, not just slow it down — this is exactly what the original `lazy: true` plan turned
  into (see the dedicated section above). Mitigated by keeping the same locale keys/values, only
  changing the loading mechanism, and by empirically verifying (not just reading code) SSR
  output across `en`/`fr`/`ar` locale cookies both signed-in and signed-out, plus a clean-cache
  full rebuild confirming zero `[intlify]` warnings for any key that actually exists in the
  locale files.
- **Dependency removal risk**: an orphaned-looking `@core/` component could still be reachable via
  a dynamic import, a slot, or a not-yet-discovered page. No language server was available for
  Vue in this environment (`lsp references` returned "No language server found"), so this was
  mitigated instead with exhaustive component-name and import-path grep across every live
  directory (`pages`, `views`, `components`, `layouts`, `@core`, `@layouts`, `server`) before
  removing anything, keeping removal scoped to `package.json` + the specific dead component
  file(s), never touching a page/view that's confirmed live.
- **Bun spike risk is contained by design**: it's a measurement exercise on a throwaway local run,
  not a change to any committed script, config, or lockfile unless the spike's own findings
  justify a follow-up decision (which would itself need a fresh proposal, not silently folded into
  this change).

## i18n lazy-loading attempt and empirically-confirmed bug (why the module was replaced, not configured)

The original plan (see this document's earlier draft, superseded) was to configure
`@nuxtjs/i18n`'s `lazy: true` + `langDir` and keep the module. That was implemented, then
dropped after empirical debugging surfaced a real, reproducible defect:

1. **Symptom**: `[intlify] Not found '$vuetify.input.appendAction' key in 'en' locale messages`
   logged on every SSR request, and the untranslated key literal (`appendAction`) rendered into
   the response HTML's `aria-label` — confirmed via `curl` diffing the rendered output, not just
   console warnings. Reproduced on a clean baseline check (stashed the change, confirmed the
   warning does NOT occur without `lazy: true` — this was a regression, not pre-existing).
2. **Ruled out plugin ordering**: added `dependsOn: ['i18n:plugin:route-locale-detect']` to
   `plugins/vuetify/index.ts` (the consumer, via `vuetify/locale/adapters/vue-i18n`'s
   `createVueI18nAdapter`) — warning persisted.
3. **Ruled out async/context issues**: added an explicit
   `await nuxtApp.runWithContext(() => $i18n.loadLocaleMessages($i18n.locale.value))` before
   Vuetify's `createVuetify()` call — warning persisted.
4. **Confirmed via injected debug logging** (`console.error`, not just reading source): even
   after that explicit await resolved, `$i18n.messages[locale]` and `$i18n.getLocaleMessage(locale)`
   both returned an empty object (`{}`) for the locale `@nuxtjs/i18n` itself reported as active.
   This means the module's `loadLocaleMessages` was not populating the composer instance
   reachable from a user plugin in this SSR request context — a real integration defect in how
   `@nuxtjs/i18n`'s extended composer surfaces lazy-loaded messages, not a config mistake in this
   repo, and not resolvable via any documented option (`ExperimentalFeatures` was checked in
   full — no flag forces synchronous/blocking message loading before component render).
5. **Resolution**: replacing `@nuxtjs/i18n` with plain `vue-i18n` (`createI18n()`, this repo's own
   `plugins/i18n/index.ts`) eliminates the intermediate composer-extension layer entirely — the
   plugin awaits the initial locale's messages and constructs `createI18n()` with them already
   present, so there is no window where the composer can be read with an incomplete message set.
   Verified via the same empirical method: `curl` diffing rendered HTML across `en`/`fr`/`ar`
   locale cookies (French correctly rendered `"Tableau de bord"` for `"Dashboard"`, confirming
   the composer's messages are both loaded and locale-switchable), and zero
   `[intlify] Not found`/`Fall back to translate` warnings for any key that exists in the locale
   files (see "known pre-existing gap" below for a key that doesn't).

**Known pre-existing gap, not introduced by this change**: `$vuetify.dataTable.ariaLabel.selectRow`
logs the same "not found" warning under both the old and new i18n setup, because
`plugins/i18n/locales/en.json`'s `$vuetify` block has never covered every Vuetify-internal
translation key (confirmed via `git show origin/main:plugins/i18n/locales/en.json` — that key was
never present). This is a translation-content gap, not a loading-mechanism defect; out of scope
for this change (which is about warm-up performance, not translation completeness).

## Bun spike result (measurement only, no adoption)

Ran `bun --bun run dev` (Bun 1.3.14, this environment's installed version) against this repo,
cold cache, same measurement method as the Node-baseline numbers below: time-to-first-response
on `/login`.

- **Node baseline** (pre-optimization, cold cache): 52.9s.
- **Node, all this change's optimizations applied** (devtools off, `@nuxtjs/i18n` replaced,
  dead dependencies removed, cold cache): 34.4s.
- **`bun --bun run dev`, same optimized code, cold cache**: 59.5s — slower than both the
  optimized Node run and the original Node baseline.

No functional regression found: `POST /api/auth/sign-in/email` (the `@nuxtjs/better-auth` path
with no stated official Bun-runtime support) returned 200 under Bun, same as under Node.

**Finding: no adoption.** `bun --bun run dev` only changes which runtime executes the
orchestrating Nuxt CLI process — Vite's own dependency pre-bundling and module transformation
(the actual bottleneck, per the warm-up diagnosis) is unaffected and still runs the same way.
In this specific memory-constrained environment, running under Bun's runtime was measurably
worse, not better. Not documented as an alternative dev command; `pnpm dev` remains the only
documented way to run this repo's dev server.
