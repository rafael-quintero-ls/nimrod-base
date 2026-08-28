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
orchestrating CLI process under Bun's runtime while Vite itself still does the bundling — has no
independently verified benchmark at this repo's scale, only Bun's own trivial-starter-app trace.

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
- **i18n lazy-loading via `langDir` + `lazy: true`, not a locale-content reduction**: locale files
  are already small (19 keys, per the prior `simplify-sidebar-navigation` cutover) so content-size
  reduction has no room left; the ~7.4s cost is `@nuxtjs/i18n`'s own module-setup/routing-strategy
  work, which lazy-loading defers to first request instead of eager dev-boot-time work. Requires
  restructuring `i18n.config.ts`'s single-glob `messages` block into one file per locale under a
  `langDir`, matching `@nuxtjs/i18n`'s documented lazy-loading shape.
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
- **i18n lazy-loading restructuring touches a file every locale-aware page depends on
  (`i18n.config.ts`)** — a mistake here could break translations repo-wide, not just slow it down.
  Mitigated by keeping the same locale keys/values, only changing *how* they're loaded, and by
  manually verifying at least one page in each configured locale (`en`, `fr`, `ar`) after the
  change, per this repo's verification convention (drive the real thing, not assert a plan).
- **Dependency removal risk**: an orphaned-looking `@core/` component could still be reachable via
  a dynamic import, a slot, or a not-yet-discovered page — mitigated by `lsp references` (not just
  text grep) before removing anything, and by keeping removal scoped to package.json +
  the specific dead component file(s), never touching a page/view that's confirmed live.
- **Bun spike risk is contained by design**: it's a measurement exercise on a throwaway local run,
  not a change to any committed script, config, or lockfile unless the spike's own findings
  justify a follow-up decision (which would itself need a fresh proposal, not silently folded into
  this change).
