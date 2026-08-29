## Context

`openspec/changes/rspack-builder-spike/` (PR #11, merged) previously investigated
`@nuxt/rspack-builder` and concluded no-adopt, attributing the failure broadly
to this repo's `@name` alias convention. This proposal's own investigation
(see proposal.md's "Investigation findings") found that attribution
incomplete: the alias problem has a specific, verified, mechanical fix; two
other failures (`sass-loader` never installed, `vue-demi` not transpiled)
were misdiagnosed as part of the same "Sass is broken" problem when they were
independent missing-dependency issues; and the actual remaining blocker —
Vuetify's own components failing to resolve because `vite-plugin-vuetify` is
Vite-only — was never reached in the prior spike because the alias bug
blocked every request before render even started.

This repo's current Vite-based `vite.plugins` array (`nuxt.config.ts`)
registers `svgLoader()` (`vite-svg-loader`) and `vuetify(...)`
(`vite-plugin-vuetify`, configured with `styles: { configFile: ... }`
pointing at `assets/styles/variables/_template.scss`). Neither package has an
Rspack-compatible path; both must be replaced, not configured differently.

## Goals / Non-Goals

**Goals:**
- Land the four verified config-level fixes (alias `#name` rename with dual
  `@name` retained for Sass, `sass-loader` installed, `vue-demi` transpiled)
  as a working foundation — these are de-risked, not experimental, per this
  proposal's own investigation.
- Get Vuetify's component auto-import and per-component style extraction
  working under Rspack via `@vuetify/unplugin-styles` +
  `unplugin-vue-components`, verified by real rendered output (not just "the
  server didn't crash").
- Replace `vite-svg-loader` with an Rspack-compatible SVG-as-icon-component
  mechanism (`unplugin-icons`), verified per call site.
- Get a clean, repeatable cold-start measurement against the existing Vite
  baseline (52.2s, from `openspec/changes/optimize-dev-experience/`) so the
  final adopt/no-adopt decision has real numbers, not just "it doesn't
  crash."

**Non-Goals:**
- Not re-deriving the alias/`sass-loader`/`vue-demi` fixes from scratch —
  they're already verified in this proposal's investigation; this design
  only covers applying them to the real repo and the remaining Vuetify/SVG
  work.
- Not achieving full production-build parity as a hard gate — `pnpm build`
  is checked and any error recorded, but the go/no-go decision rests on
  `pnpm dev` correctness and measurement, matching the prior spike's own
  scope boundary.
- Not vendoring or patching any upstream package (Rspack, Vuetify, Nuxt) —
  if a package's Rspack path is broken for this repo's usage after the
  planned replacements, that reopens the no-adopt finding; it does not
  become a fork-and-fix project.

## Decisions

- **Dual-register every alias (`@name` and `#name`) rather than fully
  removing the `@name` form.** The clean alternative — rewriting every
  Sass `@use`/`@forward` statement to the new `#name` form too — was
  considered and rejected for this change: Sass's `@use`/`@forward` resolve
  via the bundler's `resolve.alias` map already, so dual-registration is a
  zero-behavior-change, one-line-per-alias fix, versus rewriting 70+
  `@use`/`@forward` statements across `.scss` files and `<style>` blocks for
  no functional benefit. Trade-off: the config now carries two names for the
  same seven paths, which needs a comment explaining why (JS-import
  resolution vs. Sass resolution have different constraints) so it isn't
  "cleaned up" by a future contributor who doesn't know the reason.
- **Register `unplugin-vue-components/rspack` directly via `@nuxt/kit`'s
  `addRspackPlugin` in a local Nuxt module, not via the package's own
  `/nuxt` wrapper** — verified in the prior spike's `design.md` that the
  wrapper has no Rspack branch (still true, not re-checked in this
  investigation since it wasn't reached; re-verify against the currently
  installed version during implementation, task-gated, before relying on
  it).
- **Explicitly test `vuetifyjs/nuxt-module#381`'s cascade-order symptom** as
  part of Vuetify-component verification, since it's caused by
  `@vuetify/unplugin-styles`'s own runtime style-injection mechanism, not by
  a package this repo doesn't use — a real, direct risk for this specific
  choice.
- **Keep the Vite-based dev/build commands (`pnpm dev`, `pnpm build`) working
  throughout this change's implementation** — don't remove `vite.plugins`,
  `vite-plugin-vuetify`, or `vite-svg-loader` from `package.json` until the
  Rspack path is fully verified end-to-end (including a real measurement and
  the cascade-order check). This keeps the repo in a working, revertible
  state at every commit, matching this repo's `optimize-dev-experience`
  precedent for staged, always-working intermediate states.

## Risks / Trade-offs

- **Vuetify's component-resolution failure (this proposal's core remaining
  unknown) may not be fully solved by `@vuetify/unplugin-styles` +
  `unplugin-vue-components` alone.** No production deployment of this exact
  combination (Nuxt 4.5 + Vuetify 3.13 + Rspack + these two packages) was
  found during either this or the prior spike's research. Mitigation: verify
  with real rendered output (`VApp`/`VLocaleProvider` resolving, form fields
  visible, no `Failed to resolve component` warnings) at each step, not just
  absence of a 500 — this proposal's own investigation showed a 200 status
  code is not sufficient evidence of correctness.
- **Dual-alias registration risk**: if a future contributor adds an eighth
  alias and only registers the `#name` form (following what looks like "the
  convention"), any Sass file using the `@name` form for it will silently
  break only under the Rspack path, not under Vite — inconsistent behavior
  between the two builders during the period both are kept working.
  Mitigated by a comment directly in `nuxt.config.ts`'s `alias` block
  explaining the dual-registration requirement.
- **Icon-import migration touches ~14 call sites**, each needing
  per-site visual verification that the same icon renders after the syntax
  change (`import x from '@images/foo.svg'` → `unplugin-icons`'s
  `~icons/<collection>/foo` form) — a missed or mistranslated import is a
  visible regression, not caught by `vue-tsc`/`eslint`.
- **`pnpm` bin-name conflict** (`nuxt`/`nuxi` silently renamed to
  `nuxt-cli`/`nuxi-ng` when `@nuxt/rspack-builder` is installed, observed in
  the prior spike) may recur. Mitigation: reproduce and resolve it, or
  document a working non-manual mitigation, before this change is considered
  complete — a broken `pnpm dev`/`pnpm build` invocation is not an
  acceptable end state regardless of the Rspack finding.

## Migration Plan

1. Land the four verified fixes (alias dual-registration, `sass-loader`,
   `vue-demi` transpile, `builder: 'rspack'`) on a dedicated branch; confirm
   `/login` returns `HTTP 200` under Rspack (already reproduced in this
   proposal's investigation, re-verify against the real repo state).
2. Replace `vite-plugin-vuetify` with `@vuetify/unplugin-styles` +
   `unplugin-vue-components`; verify real rendered Vuetify component output,
   not just status code.
3. Replace `vite-svg-loader` with `unplugin-icons`; verify each of the ~14
   call sites renders the same icon.
4. Resolve the `pnpm` bin-name conflict.
5. Run the full verification pass from `specs/build-tooling/spec.md`'s
   scenarios, plus a cold-start measurement against the 52.2s Vite baseline,
   plus `pnpm build` and a real production preview (`node
   .output/server/index.mjs`, matching the rigor `update-critical-dependencies-security`
   used when a `pnpm build`-only check missed a runtime-only defect).
6. Only if every scenario passes and the measurement is favorable (or at
   least not a regression): remove the Vite-only packages
   (`vite-plugin-vuetify`, `vite-svg-loader`) and the dev-time fallback to
   Vite, and land as a real adopt. If any step fails: revert to `main`,
   record the finding in this change's `tasks.md`, same disposition pattern
   as the prior spike's no-adopt outcome — this change is allowed to
   conclude in "confirmed the remaining blocker cannot be resolved" without
   that being a failure of the process.
