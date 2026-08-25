## Why

`pnpm audit --prod` reports 8 critical / 91 high vulnerabilities across the dependency tree, including critical prototype-pollution in `@casl/ability` (the ACL engine behind `middleware/acl.global.ts`) and in `next-auth` (the credentials provider behind `server/api/auth/[...].ts`), plus `nuxt@4.2.0` sitting inside the vulnerable range for a dedicated Nuxt security release (2026-07-27, `nuxt.com/blog/v4-5-security`) covering a route-rule authorization bypass, server-side RCE via server islands, server-component DoS, and cross-user cached-payload disclosure. These are exploitable gaps in auth/authorization, not stale-version noise, so they need patching now rather than at the next routine bump.

## What Changes

- Bump `nuxt` 4.2.0 → 4.5.2 (patches CVE-2026-53721 route-rule bypass regression, server-island RCE/DoS, cached-payload cross-user leak; pulls in patched `@nuxt/devtools`, `h3`, `nitropack`, `vite`-adjacent transitive fixes).
- Bump `vite` 7.1.12 → 8.2.2 (patches high-severity vulnerable range `>=7.1.0 <=7.3.1`; `nuxt@4.5.2`'s `@nuxt/vite-builder` declares a `vite: ^8.2.0` peer, so `>=7.3.2` alone left two vite major versions coexisting and broke the dev server's `#components` virtual-module resolution — discovered during behavioral verification and corrected here).
- Bump `@casl/ability` 6.7.3 → ≥6.7.5 and `@casl/vue` 2.2.2 → matching compatible release (patches critical prototype pollution, `GHSA-x9vf-53q3-cvx6`).
- Bump `next-auth` 4.21.1 → 4.24.15 and `@sidebase/nuxt-auth` 1.1.0 → 1.3.1 together (the installed `@sidebase/nuxt-auth@1.1.0` peer-pins `next-auth: ~4.21.1`; only `1.3.x` permits the patched `next-auth` range, so both move as one unit).
- Bump `swiper` 11.2.10 → ≥12.1.2 (patches critical prototype pollution, `GHSA-hmx5-qpq5-p643`); re-verify the ~10 `views/demos/components/swiper/*` demo pages after the major bump.
- Bump `vuetify` 3.10.8 → 3.13.2 and `vite-plugin-vuetify` to a matching compatible release — latest Vuetify **3.x** line only, no move to Vuetify 4 (Vuetify 4 has confirmed breaking changes across theme defaults, grid, `v-btn`, `v-select` slots — out of scope for a security patch track, would need its own change). Also bumps `sass` `~1.76.0` → `^1.93.2`, required because `vuetify@3.13.2` ships a `.sass` file `sass < 1.84.0` cannot parse (see design.md).
- No `eslint`/`typescript` major bumps in this track (ESLint 9/10 flat-config migration and TS 7 are unrelated to the audit findings and are breaking; left for a separate tooling change).
- **Config-only workarounds required to make the target versions actually run** (discovered during Behavioral Verification, both documented with rationale and removal criteria in `design.md`): a `nuxt.config.ts` `nitro.alias` for `next-auth/core` (the subpath `next-auth@4.24.15` removed from its `exports` map but `@sidebase/nuxt-auth@1.3.1`'s bundled runtime still imports), and a `nuxt.config.ts` `pages:extend` hook defaulting every page's layout to `'default'` (works around an apparent Nuxt 4.5.2 core defect where any page without an explicit `layout:` meta crashes SSR). Neither changes observable application behavior; both are documented as workarounds for external defects, not new capabilities.
- **BREAKING**: none intended at the application-behavior level for end users; `nuxt@4.5.x` restores case-insensitive `routeRules` matching as the documented default (fixing the regression), which only affects behavior if a `routeRules` key relies on case-sensitive matching — this repo's `nuxt.config.ts` defines no `routeRules`, so no observable change is expected. Verified in Behavioral Verification.

## Capabilities

### New Capabilities
- `dependency-security-baseline`: the application's runtime and auth/ACL dependency versions must stay outside the known-vulnerable ranges reported by `pnpm audit` for critical/high severity findings reachable from `dependencies` (not `devDependencies`-only, tooling-only findings).

### Modified Capabilities
(none — no existing `openspec/specs/` capabilities exist yet in this repo; auth/ACL behavior itself is not intentionally changing, only the library versions enforcing it)

## Impact

- **Dependencies**: `package.json` (`dependencies`: `nuxt`, `vuetify`, `@casl/ability`, `@casl/vue`, `next-auth`, `swiper`; `devDependencies`: `@sidebase/nuxt-auth`, `vite`, `vite-plugin-vuetify`, `sass`), `pnpm-lock.yaml` full regeneration, `pnpm-workspace.yaml` (new file — `overrides.tar`, `shamefullyHoist: true`, `allowBuilds` entries; see design.md), `.env` (local-only, gitignored, needed to run `pnpm dev`/`pnpm build` for verification).
- **Code touched directly**: `nuxt.config.ts` only — a `nitro.alias` entry and a `pages:extend` hook, both workarounds for external defects (see "What Changes" and `design.md`), not application logic changes. `middleware/acl.global.ts` and `server/api/auth/[...].ts` were read-verified and are unmodified.
- **Systems**: local dev (`pnpm dev`), production build (`pnpm build` — verified passing), auth login flow, ACL route guarding, all Vuetify-rendered pages, swiper demo page. All behaviorally verified — see `tasks.md` sections 5 and 6 for exact commands and observed results.
- **Out of scope**: Vuetify 4 migration, Nuxt 5 migration, ESLint 9/10 flat-config migration, TypeScript 7 migration — each needs its own OpenSpec change per `AGENTS.md`'s "one intent per change" rule.
