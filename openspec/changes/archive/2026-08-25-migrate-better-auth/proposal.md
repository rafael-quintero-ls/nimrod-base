## Why

nimrod's auth stack (`@sidebase/nuxt-auth` + `next-auth` CredentialsProvider) already required three
rounds of post-merge fixes (`nitro.alias`/`nitro.externals.inline` workarounds for `next-auth`'s CJS
export map, a layout-resolution regression, a client-side import cycle) just to keep working against
a template demo backend — see `openspec/changes/archive/2026-08-25-update-critical-dependencies-security/`.
nimrod is becoming the control-plane UI for Leadsales' agentic infrastructure (Sentinel, Trask,
9router), backed by `rumbor-core` (a dedicated backend embedding Directus as its Backend-for-Agents,
among other adapters). That backend needs to be nimrod's real identity source, and Directus's own
user/role system needs to feed CASL abilities without exposing "Directus" as a visible implementation
detail anywhere in nimrod's UI, config keys, or error messages. `@sidebase/nuxt-auth` has no adapter
for this (it wraps Auth.js, which has its own separate provider/adapter model) — `better-auth`'s
official Nuxt module (`@nuxtjs/better-auth`) supports exactly this shape via its "external auth
backend" / custom-database-adapter modes, and is a more current, actively maintained base for a
project with a multi-year horizon than the NextAuth compatibility shim.

## What Changes

- **BREAKING**: Replace `@sidebase/nuxt-auth` + `next-auth` with `@nuxtjs/better-auth` as nimrod's
  session/auth layer.
- Remove `server/api/auth/[...].ts` (the `NuxtAuthHandler` CredentialsProvider mount), `next-auth.d.ts`,
  and the `nitro.alias`/`nitro.externals.inline` workarounds in `nuxt.config.ts` that exist solely to
  make `next-auth`'s CJS build loadable under Nitro/Vite 8 — none of that machinery is needed once
  `next-auth` is gone.
- Add `server/auth.config.ts` (`defineServerAuth(...)`) with a custom better-auth database adapter
  that translates better-auth's user/session/account shape to and from a Directus-backed identity
  store — routed through `rumbor-core`'s public interface, never calling Directus directly or naming
  it in code, config keys, error messages, or types (this repo's boundary; `rumbor-core`'s own
  `AGENTS.md` independently enforces the adapter-agnostic-interface rule on its side).
  `rumbor-core`'s concrete HTTP contract for this is still undefined — this change defines the
  adapter's shape against that gap and documents it as an explicit dependency in `design.md`, not a
  guess at a contract that doesn't exist yet.
  - This is the "traductor de usuarios de better-auth a usuarios Directus" from the project's
    working assumptions, packaged as a better-auth custom adapter rather than a bespoke shim.
- Add `app/auth.config.ts` (`defineClientAuth(...)`) and swap every `useAuth()` call
  (`middleware/acl.global.ts`, `layouts/components/UserProfile.vue`, `pages/login.vue`,
  `app/router.options.ts`) for the module's `useUserSession()`/`useSignIn()`/`useSignOut()`
  composables.
- Replace `server/utils/auth.ts`'s `getServerSession`-based `setAuthOnlyRoute` helper with the
  module's `requireUserSession(event)` in `server/api/me.get.ts` and `server/api/token.get.ts`
  (`server/api/token.get.ts`'s `getToken` call, `next-auth`-specific, is removed — better-auth's
  session model doesn't expose a raw JWT the same way; if a bearer token is still needed for a
  downstream API call, `design.md` records the replacement, not a stub).
- Keep CASL (`@casl/ability` + `@casl/vue`, `plugins/casl/*`, `middleware/acl.global.ts`'s
  `canNavigate` logic) as-is at the ability-evaluation layer — only its session data source changes,
  from `next-auth`'s JWT-backed session to better-auth's session, both exposing the same
  `abilityRules`/`role` shape via the adapter/plugin's user-object augmentation. No behavior change
  to how routes are gated.
- Update `.env.example`: remove `AUTH_ORIGIN`, `AUTH_SECRET` (Auth.js-specific); add
  `NUXT_BETTER_AUTH_SECRET` and whatever `rumbor-core` connection variable the adapter needs
  (name TBD in `design.md`, generic — e.g. `NUXT_IDENTITY_BACKEND_URL`, never `DIRECTUS_*`).
- `server/fake-db/auth/*` and `server/api/login.post.ts` (the template's demo credential store) are
  removed once the adapter can talk to a real backend; until `rumbor-core`'s identity endpoint
  exists, `design.md` records how local/demo login keeps working during the transition (e.g. a
  demo-mode adapter) so `pnpm dev` isn't broken mid-migration.

## Capabilities

### New Capabilities
- `auth`: session/identity capability for nimrod — how a user authenticates, how a session is
  established and read (server + client), and how session data feeds CASL authorization. This is
  the first spec for this capability (none existed before this change).

### Modified Capabilities
(none — no existing capability spec covers auth today; this is a new capability, not a modification)

## Impact

- **Affected code**: `nuxt.config.ts` (`auth` block, `runtimeConfig`, `nitro.alias`/`externals.inline`
  workarounds removed), `server/api/auth/[...].ts` (removed), `server/utils/auth.ts`,
  `server/api/me.get.ts`, `server/api/token.get.ts`, `server/fake-db/auth/*` (removed or replaced),
  `server/api/login.post.ts` (removed or replaced), `middleware/acl.global.ts`,
  `layouts/components/UserProfile.vue`, `pages/login.vue`, `pages/register.vue`,
  `app/router.options.ts`, `next-auth.d.ts` (removed, replaced by better-auth type augmentation),
  `.env.example`.
- **Dependencies**: remove `next-auth`, `@sidebase/nuxt-auth`; add `better-auth`, `@nuxtjs/better-auth`.
- **External dependency**: this change's server-side adapter has a hard dependency on `rumbor-core`
  exposing a stable identity/user contract. That contract does not exist yet (confirmed: no
  REST/GraphQL surface in `sentinel`/`trask` today, and `rumbor-core` itself is only scaffolded, no
  code). `design.md` states this as an explicit, tracked blocker with a fallback (demo-mode adapter)
  rather than blocking this proposal on it.
- **Unaffected**: CASL ability-evaluation logic itself (`plugins/casl/ability.ts`'s `Actions`/
  `Subjects`/`Rule` types, `canNavigate`), route/page structure, everything outside the auth surface.
