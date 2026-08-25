## Context

Current auth stack (see `proposal.md` - Why for the motivating history): `@sidebase/nuxt-auth`
wrapping `next-auth@4` (`NuxtAuthHandler` in `server/api/auth/[...].ts`, `CredentialsProvider`
calling `server/api/login.post.ts`, which reads `server/fake-db/auth/index.ts` — a hardcoded demo
user table). Session is a JWT cookie; `jwt`/`session` callbacks copy `username`, `fullName`,
`avatar`, `abilityRules`, `role` from the demo user onto the token/session. `middleware/acl.global.ts`
reads `useAuth().status`/`to.meta.public`/`to.meta.unauthenticatedOnly` and calls CASL's
`canNavigate(to)`. `plugins/casl/index.ts` seeds a `createMongoAbility` from a `userAbilityRules`
cookie written manually in `pages/login.vue` after `signIn()` resolves. Two Nitro server routes
(`server/api/me.get.ts`, `server/api/token.get.ts`) gate on `setAuthOnlyRoute` →
`getServerSession`. `nuxt.config.ts` carries `nitro.alias` + `nitro.externals.inline` entries that
exist only to make `next-auth`'s CJS build loadable under Nitro/Vite 8 (documented at length in
`openspec/changes/archive/2026-08-25-update-critical-dependencies-security/design.md`).

`rumbor-core` (sibling project, `~/projects/rumbor-core`) is scaffolded but has no code: no
identity/user HTTP contract exists yet. It will embed Directus as one adapter among several
(Laminar, OpenLIT, 9router), behind an interface that never names the underlying adapter
(`rumbor-core`'s own `AGENTS.md` enforces this independently). This design cannot assume a
specific request/response shape from `rumbor-core` today — it defines the seam nimrod's adapter
code talks to, and treats the concrete contract as an explicit dependency, not a guess.

Known upstream landmine from the prior dependency-security change: a static top-level
`useAuth`/session-composable import in `app/router.options.ts` previously closed an import cycle
through `#build/route-rules.mjs` (`nuxt/nuxt#35982`), crashing `layout.js` client-side. Any
better-auth composable import in that file must repeat the same deferred-import pattern
(`callWithNuxt` inside the async callback) until that upstream Nuxt bug is fixed, or the migration
reintroduces a client-side-only crash no server-rendered/HTTP-status check would catch.

## Goals / Non-Goals

**Goals:**
- Cut over nimrod's session/auth layer from `@sidebase/nuxt-auth`+`next-auth` to
  `@nuxtjs/better-auth`+`better-auth`, full replacement, no dual-stack period.
- Define the shape of a custom better-auth database adapter that resolves users through
  `rumbor-core`'s (still-undefined) identity contract, isolated behind one module so that once
  `rumbor-core` ships its real contract, only that module's internals change.
- Preserve CASL as the authorization/ability-evaluation layer unchanged; only its session data
  source moves.
- Keep `pnpm dev` working throughout the migration via a demo-mode fallback adapter, since
  `rumbor-core` has no running identity endpoint yet.

**Non-Goals:**
- Building `rumbor-core`'s identity/user HTTP contract itself — that is `rumbor-core`'s own
  OpenSpec change, tracked in that repository, not this one.
- Changing CASL's ability model (`Actions`/`Subjects`/`Rule` shape) or `canNavigate` semantics.
- OAuth/social login, 2FA, or any better-auth plugin beyond email+password credentials — matches
  today's feature set exactly, expandable later as its own change.
- Directus provisioning, schema, or any Directus-specific code — that lives in `rumbor-core`, and
  per this repo's boundary rule, nimrod's code never references Directus by name at all.

## Decisions

**1. `@nuxtjs/better-auth` in "custom database" mode with a hand-written adapter, not
`clientOnly`/"external auth backend" mode.**
better-auth's external-auth-backend guide (`clientOnly: true`) assumes a *separately deployed
Better Auth server* the Nuxt app only talks to as an HTTP client — it skips
`server/auth.config.ts`, server middleware, and SSR session hydration entirely. That loses SSR
session availability (this spec's "Session available during SSR" requirement) and moves CSRF/cookie
handling to a cross-origin setup we don't need, since better-auth itself will run inside nimrod's
own Nitro server — only its *storage* is external (routed through `rumbor-core`). Custom-database
mode (`defineServerAuth({ database: <adapter> })`) keeps better-auth's server running in-process
(full SSR support, same-origin cookies, no CORS) while the adapter is free to proxy every read/write
to `rumbor-core` instead of a local SQL database.

**2. The adapter is a `better-auth` `createAdapterFactory`-based adapter, not one of the bundled
ORM adapters (Drizzle/Prisma/Kysely).**
Those three assume a local SQL schema better-auth manages directly. Here, the system of record is
`rumbor-core` over HTTP, not a database nimrod owns. `createAdapterFactory` (see
`better-auth/docs/guides/create-a-db-adapter`) is the documented extension point for exactly this:
implement `create`/`findOne`/`findMany`/`update`/`updateMany`/`delete`/`deleteMany`/`count` against
an arbitrary backend. Each method translates better-auth's internal `user`/`session`/`account`/
`verification` model to/from calls against `rumbor-core`'s (future) identity endpoints. Isolating
all such calls in one file (`server/auth/rumbor-adapter.ts`, name TBD at implementation time) is
what makes "no adapter name leaks" and "swap the backend later" both hold — nothing outside that
file imports or knows about `rumbor-core`'s specific contract.

**3. Demo-mode fallback via an environment-switched adapter implementation, not a second auth
stack.**
Until `rumbor-core` exposes a real identity contract, the adapter's `create`/`findOne`/etc.
implementations read a small in-memory/JSON fixture (a direct port of today's
`server/fake-db/auth/index.ts` two demo users) when a `NUXT_IDENTITY_BACKEND_URL` env var is unset,
and proxy to that URL when it is set. This keeps exactly one code path (the adapter interface)
instead of maintaining `next-auth`-shaped and better-auth-shaped demo logic side by side, and it
means the moment `rumbor-core`'s endpoint exists, flipping the env var is the only change needed —
no code path deletion, no second migration.

**4. `abilityRules`/`role` ride on better-auth's "additional fields" mechanism on the `user` model,
mirroring today's `next-auth` `User`/`Session` augmentation.**
better-auth supports arbitrary additional fields on its core `user` table via adapter-returned data
plus type augmentation (`#nuxt-better-auth`'s `AuthUser` interface, see
`better-auth.nuxt.dev/getting-started/type-augmentation`). The adapter's `findOne`/`create` for the
`user` model return `abilityRules`/`role` alongside better-auth's own fields; `nuxt.d.ts` augments
`AuthUser` with `abilityRules: Rule[]` and `role: string`, replacing today's `next-auth.d.ts`
`UserAdditionalData` augmentation one-for-one.

**5. `plugins/casl/*` keeps reading a cookie, but that cookie is now written by a `session` hook
in `server/auth.config.ts`, not by `pages/login.vue` after `signIn()` resolves.**
Today, `pages/login.vue` manually sets the `userAbilityRules` cookie post-signIn — a client-side
side effect the module's `useSignIn` composable doesn't need or expect. Moving this to a
better-auth server-side hook (writing the cookie whenever a session is created, matching the
`abilityRules` already present on `AuthUser`) means `plugins/casl/index.ts` (unchanged) picks it up
identically on both first SSR render and client hydration, and `pages/login.vue` no longer needs a
manual `useCookie` write.

**6. `server/api/token.get.ts` is removed outright, not reimplemented against a better-auth
equivalent.**
It exists today only to expose `next-auth`'s internal JWT to the client via `getToken({ event })` —
grep confirms no other server or client code in this repo calls `GET /api/token`. better-auth's
session model doesn't expose an equivalent raw bearer JWT by default (its client/server session
objects are the primitive, not a JWT you forward elsewhere). Since nothing consumes this route,
removing it is a clean cutover, not a scope cut — if a future change needs a bearer token for a
downstream API call (e.g. calling `rumbor-core` from the client directly), that is new scope for
that change to define, not a gap this one leaves open.

**7. Route/page gating keeps today's two-layer shape (`middleware/acl.global.ts` +
`definePageMeta({ unauthenticatedOnly, public })`) instead of switching to `@nuxtjs/better-auth`'s
own `routeRules`/`definePageMeta({ auth: ... })` mechanism.**
The module's route-rules-based protection (`nuxt.config.ts` `routeRules: { '/app/**': { auth: {
only: 'user' } } }`) is a real alternative, but it's UX-layer only per its own docs ("Route Rules
and Page Meta are primarily for UX... Always protect your API endpoints with
`requireUserSession`") and would require re-expressing every route's current CASL-driven ability
check (`canNavigate`, which checks specific action/subject rules, not just "is logged in") as
`routeRules` — a second, parallel gating mechanism next to CASL, not a replacement for it. Keeping
`middleware/acl.global.ts` as the single source of navigation-gating truth, swapping only its
`useAuth()` call for `useUserSession()`, is the smaller and less risky change; `requireUserSession`
is still adopted server-side (decision 8) since that's the module's real security boundary, not a
competing UX mechanism.

**8. Server API auth changes from `setAuthOnlyRoute` (custom wrapper around `getServerSession`) to
the module's `requireUserSession(event)` directly, and `server/utils/auth.ts` is deleted.**
`requireUserSession` already throws a 401 and returns `{ user, session }` — functionally what
`setAuthOnlyRoute` hand-rolled around `next-auth`'s `getServerSession`. Keeping a repo-local wrapper
around a well-documented module primitive adds a layer with no behavior difference; `me.get.ts`
calls `requireUserSession(event)` directly.

## Risks / Trade-offs

- **[Risk] `rumbor-core`'s identity contract doesn't exist yet — the adapter is designed against an
  assumed shape, not a verified one.** → Mitigation: the adapter's `rumbor-core`-calling code is
  isolated to one file behind the `createAdapterFactory` interface (decision 2); demo-mode fallback
  (decision 3) means this change ships and is fully testable today without `rumbor-core` being
  ready; `tasks.md` marks the real-backend wiring as a follow-up task gated on `rumbor-core`
  publishing its contract, not a blocker for merging this change's demo-mode-verified state.
- **[Risk] better-auth's session/cookie model differs from `next-auth`'s JWT cookie — any code
  reading the old `next-auth.session-token`-shaped cookie directly (outside the composables) breaks
  silently.** → Mitigation: grep confirms no code in this repo reads Auth.js's session cookie by
  name directly; all access goes through `useAuth()`/`getServerSession()`, both of which are being
  replaced at their call sites in this same change. Verified via the reference grep performed
  during scoping (`useAuth()`, `getServerSession`, `NuxtAuthHandler` — all four call sites listed in
  `proposal.md` - Impact).
- **[Risk] Reintroducing the `nuxt/nuxt#35982` import-cycle crash if a better-auth composable is
  statically imported in `app/router.options.ts`.** → Mitigation: decision carries forward the
  existing deferred-import pattern (dynamic `import('#imports')` + `callWithNuxt`) verbatim, just
  swapping which composable is dynamically imported; `tasks.md` includes an explicit client-side
  browser check (not just an HTTP-status check) for this exact regression, per the prior change's
  post-mortem lesson that curl-based verification missed it.
- **[Risk] Removing `next-auth.d.ts` and its `next-auth`/`next-auth/jwt` module augmentation
  without an equivalent could silently untype `session.user` fields used elsewhere.** →
  Mitigation: `tasks.md` includes a full-repo type-check (`pnpm build` or a dedicated typecheck
  script) after the swap, not just a visual diff of the removed file.
- **[Trade-off] Losing `next-auth`'s broader provider ecosystem (OAuth providers, etc.) in exchange
  for a custom adapter.** Accepted: today's stack uses only `CredentialsProvider`; the commented-out
  `GoogleProvider` in `server/api/auth/[...].ts` was never wired up. better-auth supports OAuth
  providers natively if a future change needs one.

## Migration Plan

1. Add `better-auth` + `@nuxtjs/better-auth` to `package.json`; remove `next-auth` +
   `@sidebase/nuxt-auth`. Single `pnpm install`, one commit — no interim state where both stacks
   are installed and partially wired (avoids a half-migrated `nuxt.config.ts` `auth` block existing
   alongside a new one).
2. Write the adapter (`server/auth/rumbor-adapter.ts`) with demo-mode fixture data ported 1:1 from
   `server/fake-db/auth/index.ts`'s two users, gated on `NUXT_IDENTITY_BACKEND_URL` being unset.
3. Write `server/auth.config.ts` (`defineServerAuth`) and `app/auth.config.ts`
   (`defineClientAuth`), remove `server/api/auth/[...].ts`, `server/fake-db/auth/*`,
   `server/api/login.post.ts`.
4. Swap every `useAuth()`/`getServerSession`/`setAuthOnlyRoute` call site listed in `proposal.md` -
   Impact for the module's composables/utilities; delete `server/utils/auth.ts`,
   `server/api/token.get.ts`, `next-auth.d.ts`; add the `#nuxt-better-auth` type augmentation.
5. Remove the `nitro.alias`/`nitro.externals.inline` entries in `nuxt.config.ts` that exist solely
   for `next-auth`'s CJS build.
6. Update `.env.example` (remove `AUTH_ORIGIN`/`AUTH_SECRET`, add `NUXT_BETTER_AUTH_SECRET`,
   `NUXT_IDENTITY_BACKEND_URL`).
7. Verify per `tasks.md`'s Behavioral Verification section (both `pnpm dev` and a production
   `pnpm build` + run, per the prior change's lesson that only checking `pnpm build`'s exit code
   missed a production-only failure) before opening a PR.

**Rollback:** this is a single feature branch/PR per `CONTRIBUTING.md`; rollback is `git revert` of
that PR's merge commit, restoring the previous `next-auth` stack wholesale. No data migration is
involved (demo-mode fixture data, no persisted real user accounts yet) so revert is safe at any
point before `rumbor-core`'s real identity backend is wired in and holds real user data.

## Open Questions

- Exact env var name and shape of the value `NUXT_IDENTITY_BACKEND_URL` (or whatever it's finally
  called) takes once `rumbor-core` publishes its identity contract — deferred to that contract's
  own definition; does not change this change's adapter interface or task breakdown, only its
  demo-mode-to-real-backend cutover value.
- Whether `rumbor-core`'s identity contract will support password-based credential verification at
  all, or whether nimrod will eventually front an OAuth/OIDC flow against Directus's own auth
  instead of email+password — deferred; this change explicitly keeps the credentials-only feature
  set (Non-Goals) and does not need this answered to ship.
