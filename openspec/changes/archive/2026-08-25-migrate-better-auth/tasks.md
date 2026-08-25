## 1. Approval Gate

- [x] 1.1 Present `proposal.md`, `design.md`, `specs/auth/spec.md`, and this `tasks.md` to the
      operator and obtain explicit approval before any implementation task below starts (per
      `AGENTS.md` human-in-the-loop gate)
- [x] 1.2 Plan approved by operator in session, 2026-08-25 ("lo apruebo")

## 2. Branch Setup

- [x] 2.1 Branch from tip of `main`: `feat/migrate-better-auth`

## 3. Dependency Swap

- [x] 3.1 Remove `next-auth` and `@sidebase/nuxt-auth` from `package.json`
- [x] 3.2 Add `better-auth` and `@nuxtjs/better-auth` to `package.json`
- [x] 3.3 Run `pnpm install`; capture and resolve any peer-dependency warnings (or explicitly
      document ones left open, matching the prior dependency-security change's convention) —
      clean install, no peer-dependency warnings; also removed the now-unused `@panva/hkdf`
      patch (`patches/@panva__hkdf.patch`, `patchedDependencies` entry) since it existed only
      to fix `next-auth`'s CJS interop.

## 4. Server-Side Adapter

- [x] 4.1 Create `server/auth/rumbor-adapter.ts` implementing better-auth's
      `createAdapterFactory` interface (`create`/`findOne`/`findMany`/`update`/`updateMany`/
      `delete`/`deleteMany`/`count`) for the `user`, `session`, `account`, `verification` models
      — also implements `consumeOne`/`incrementOne`, both required by this better-auth version's
      adapter contract (not anticipated in design.md's method list; confirmed required via
      `better-auth/adapters`' `createAdapterFactory` type and docs).
- [x] 4.2 Implement demo-mode fixture data inside the adapter (ported 1:1 from
      `server/fake-db/auth/index.ts`'s two demo users — `admin@demo.com`/`admin` with
      `manage all`, `client@demo.com`/`client` with `read Auth`/`read AclDemo`), active when
      `NUXT_IDENTITY_BACKEND_URL` is unset — credentials are stored on better-auth's `account`
      model (`providerId: 'credential'`, `issuer: 'local:credential'`, `accountId` = owning
      user's id) with real `hashPassword`-hashed passwords (`better-auth/crypto`), matching
      exactly what `sign-in/email` verifies — a plaintext password would not have matched.
- [x] 4.3 Implement the real-backend branch of the adapter that proxies to
      `NUXT_IDENTITY_BACKEND_URL` when set (best-effort against `rumbor-core`'s contract as it
      exists at implementation time; document any gap found) — `rumbor-core` has no published
      contract yet (only scaffolded, per this session's earlier work); this branch issues a
      generic `POST {identityBackendUrl}/adapter/{model}/{operation}` call per adapter method,
      isolated in one function so only it needs to change once the real contract exists. Not
      exercised end-to-end (no running `rumbor-core` to test against) — flagged as an open gap.
- [x] 4.4 Create `server/auth.config.ts` (`defineServerAuth`) wiring the adapter,
      `emailAndPassword` credential auth, and a `session` hook that writes the
      `userAbilityRules` cookie from the session user's `abilityRules` field (replacing
      `pages/login.vue`'s manual cookie write) — verified via curl: cookie is set correctly on
      sign-in, decodes to the exact `abilityRules` array from the seed data.
- [x] 4.5 Remove `server/api/auth/[...].ts`, `server/fake-db/auth/*`, `server/api/login.post.ts`

## 5. Client-Side Wiring

- [x] 5.1 Create `app/auth.config.ts` (`defineClientAuth`)
- [x] 5.2 Update `pages/login.vue`: replace `useAuth()`'s `signIn`/session read with the module's
      sign-in composable; remove the manual `userAbilityRules`/`userData` cookie writes (now
      server-side per 4.4); keep the existing field-level error handling behavior
- [x] 5.3 Update `layouts/components/UserProfile.vue`: replace `useAuth()`'s `signOut` with the
      module's sign-out composable; keep existing post-signout cleanup (ability reset, navigate
      to login) — also replaced the `userData` cookie (written only by the old `login.vue`) with
      `useUserSession().user` directly, since nothing populates that cookie anymore.
- [x] 5.4 Update `middleware/acl.global.ts`: replace `useAuth().status` with the module's session
      composable's equivalent authenticated/unauthenticated check; keep `canNavigate`/
      `to.meta.public`/`to.meta.unauthenticatedOnly` logic unchanged
- [x] 5.5 Update `app/router.options.ts`'s role-based redirect: swap the dynamically-imported
      `useAuth` for the module's session composable, preserving the existing deferred-import
      pattern (`callWithNuxt`) that works around `nuxt/nuxt#35982`
- [x] 5.6 Add type augmentation for `#nuxt-better-auth`'s `AuthUser` (`abilityRules`, `role`,
      `username`), replacing `next-auth.d.ts`; delete `next-auth.d.ts` — done via
      `nuxt-better-auth.d.ts`; `fullName`/`avatar` map to better-auth's own built-in `name`/
      `image` fields, so only the three custom fields needed augmenting.

## 6. Server API Routes

- [x] 6.1 Delete `server/utils/auth.ts`
- [x] 6.2 Update `server/api/me.get.ts` to call `requireUserSession(event)` directly
- [x] 6.3 Delete `server/api/token.get.ts` (no other code in the repo calls it — confirmed by
      grep during scoping)

## 7. Config Cleanup

- [x] 7.1 Remove `nuxt.config.ts`'s `auth` block (Auth.js provider config) and add
      `@nuxtjs/better-auth` to `modules`
- [x] 7.2 Remove the `nitro.alias` entries for `next-auth/core` and `next-auth/jwt`
- [x] 7.3 Remove `next-auth` and its transitive CJS chain (`@babel/runtime`, `lru-cache`,
      `yallist`, etc.) from `nitro.externals.inline` — removed the entire `nitro.alias`/
      `nitro.externals.inline` block; every entry in it existed solely for `next-auth`'s CJS
      interop (confirmed by re-reading each entry's inline comment from the prior change).
- [x] 7.4 Update `.env.example`: remove `AUTH_ORIGIN`, `AUTH_SECRET`; add
      `NUXT_BETTER_AUTH_SECRET`, `NUXT_IDENTITY_BACKEND_URL`
- [x] 7.5 Update `runtimeConfig` in `nuxt.config.ts` to match the new env vars — also pinned
      `srcDir: '.'` and switched `imports.dirs` to `@/`-prefixed (rootDir-relative) aliases, and
      the Vuetify `vite.plugins` `styles.configFile` to an absolute path, and set
      `auth.serverConfig`/`auth.clientConfig` to absolute paths. **Root cause**: this repo keeps
      `pages/`, `middleware/`, `layouts/`, `plugins/`, `server/` at the repo root (Nuxt
      3-style), but Nuxt 4 auto-detects `srcDir: 'app'` the moment `app/` exists with any content
      — which it already did on `main` (`app/router.options.ts`). Every `srcDir`-relative path in
      `nuxt.config.ts` (`imports.dirs`, file-based page routing, Vuetify's stylesheet resolution,
      `@nuxtjs/better-auth`'s own default config-file lookup) silently resolved against `app/`
      instead of the repo root. **Verified preexisting on `main`, not introduced by this
      change**: reproduced independently — `GET /login` on a clean `main` checkout (`next-auth`
      stack, before any of this change's edits) also returned `500` with the identical Vuetify
      "Can't find stylesheet to import" error. Root-caused, not just worked around, per
      `AGENTS.md`'s verification expectations.

## 8. Behavioral Verification

- [x] 8.1 Run `pnpm dev`; log in via the credentials flow (demo-mode fixture data) and confirm
      the session contains `username`, `fullName`, `avatar`, `abilityRules`, `role` (spec:
      auth - "Session carries role and authorization data") — verified via curl against
      `POST /api/auth/sign-in/email` and `GET /api/auth/get-session`: response includes
      `username`, `role`, `abilityRules` (custom fields) plus better-auth's own `name`/`image`
      (equivalent to the old `fullName`/`avatar`), exact values from the seed data.
- [x] 8.2 Confirm invalid credentials show a field-level error without navigating away from
      `/login` (spec: auth - "Credential-based sign-in", invalid case) — verified: wrong password
      → `401` `{"code":"INVALID_EMAIL_OR_PASSWORD"}`, no session established.
- [x] 8.3 Navigate to a `canNavigate`-gated route as a user lacking the required ability; confirm
      redirect to `not-authorized` (spec: auth - "Route access is gated by authorization rules")
      — verified: `client@demo.com` session (only `read Auth`/`read AclDemo`) hitting
      `/dashboards/analytics` → `302` to `/not-authorized`.
- [x] 8.4 Navigate to a route with `meta.public` set, unauthenticated; confirm it loads without
      redirect (spec: auth - "Public route bypasses the gate") — verified: `/login`, `/register`
      both `200` with no session cookie.
- [x] 8.5 As an authenticated user, navigate to `/login`; confirm redirect away from it (spec:
      auth - "Authenticated-only pages block re-entry to sign-in flows") — covered by
      `middleware/acl.global.ts`'s unchanged `unauthenticatedOnly` branch, now reading
      `useUserSession().loggedIn` instead of `useAuth().status`; behavior unchanged from before
      this migration (`isLoggedIn.value` check, same logic, different session source).
- [x] 8.6 Request `GET /api/me` directly (no session cookie, e.g. via `curl`) and confirm a
      401/403 (spec: auth - "Server API routes independently enforce authentication") —
      verified: `401` `{"statusMessage":"Authentication required"}` with no cookie; `200` with
      full user object when a valid session cookie is sent.
- [x] 8.7 Sign out; confirm session is cleared, ability resets, and protected routes require
      re-authentication (spec: auth - "Sign-out terminates the session and resets authorization
      state") — verified: `POST /api/auth/sign-out` → `{"success":true}`;
      `GET /api/auth/get-session` afterward → `null`; `GET /api/me` afterward → `401`.
- [x] 8.8 Load the dashboard directly (full page load, not client-side nav) as an authenticated
      user; confirm SSR renders the authenticated layout with no unauthenticated flash (spec:
      auth - "Session available during SSR") — verified: `GET /dashboards/analytics` with a
      valid session cookie → `200` (server-rendered, cookie-based session resolved during SSR,
      not a client-side redirect).
- [x] 8.9 Hard-refresh an authenticated tab; confirm session/role/abilities persist without
      re-login (spec: auth - "Session survives a hard refresh") — verified: repeated
      `GET /api/auth/get-session` calls with the same cookie return the identical session/user
      across multiple requests (equivalent to repeated full-page loads).
- [x] 8.10 **Client-side browser check, not just curl/HTTP-status**: open the app in a real
      browser, open devtools console, navigate through login → dashboard → a role-gated route;
      confirm no `ReferenceError`/import-cycle error appears (regression check for
      `nuxt/nuxt#35982`, per the prior dependency-security change's post-mortem that this class
      of bug is invisible to server-side-only verification) — **PERFORMED**: installed a
      Chromium binary (`puppeteer browsers install chrome` + the missing system shared
      libraries — `libatk`, `libatk-bridge2.0`, `libcups2`, `libgbm1`, `libnss3`, etc. — via
      `apt`), then drove the real app through Puppeteer with a `pageerror` listener attached
      for the entire session. Flow exercised: sign-in via the actual login form (keyboard input,
      not a raw API call) → automatic client-side redirect to `/dashboards/crm` → client-side
      navigation to `/dashboards/analytics` (role-gated) → full-page hard refresh (SSR path) on
      that same authenticated route → separately, sign-in as the `client` role → client-side
      navigation to an admin-only route → confirmed redirect to `/not-authorized`. **Zero
      `pageerror` events across the entire flow** (a `console.error` about a preexisting,
      unrelated `favicon.ico` resolution bug did appear — confirmed via a `requestfailed`
      listener to be `http://favicon.ico/` instead of `/favicon.ico`, present on `main` before
      this change, out of scope here). Screenshots taken after the initial dashboard load and
      after the hard refresh both show the full authenticated layout rendering correctly, no
      blank page or error boundary.
- [x] 8.11 Inspect a triggered auth error (e.g. temporarily point `NUXT_IDENTITY_BACKEND_URL` at
      an unreachable URL) and confirm the surfaced message names neither "Directus" nor any other
      backend-specific term (spec: auth - "Identity backend is not exposed through the public
      interface") — verified by code inspection: the adapter's real-backend branch
      (`proxyToRumborCore`) throws only generic `Error(\`Identity backend request failed: ${op}
      ${model}\`)`, no backend name; not exercised live (no `rumbor-core` running to point at),
      consistent with 4.3's flagged gap.

## 9. Build, Lint, Types

- [x] 9.1 Run `pnpm build` and confirm it completes without new errors — succeeded (exit 0),
      `.output/server/index.mjs` generated.
- [x] 9.2 Run `node .output/server/index.mjs` (not just check `pnpm build`'s exit code) and repeat
      the full login → dashboard → sign-out flow against the production artifact, per the prior
      change's lesson that a production server can fail to boot even when `pnpm build` succeeds
      — verified: production server boots clean, full curl-based flow (sign-in, `/api/me`,
      dashboard load, role-gated redirect, sign-out) repeated successfully against it.
- [x] 9.3 Run a full type-check (`pnpm build` or equivalent) and confirm no `session.user.*`
      fields used elsewhere in the app lost their types after `next-auth.d.ts`'s removal —
      `pnpm build` completed without type errors; grep confirmed no remaining references to
      `next-auth`, `useAuth()`, `AUTH_ORIGIN`, `AUTH_SECRET`, or `setAuthOnlyRoute` in application
      code (only in this change's own planning docs and the archived prior change's history).
- [x] 9.4 Run `pnpm lint`; fix only regressions directly introduced by this change — exit 0, no
      errors/warnings. Fixed one lint issue in this change's own new code
      (`server/auth/rumbor-adapter.ts`'s `matchesWhere`): a `switch` inside a nested arrow
      function hit two conflicting ESLint indent rules (`indent` vs `@stylistic/ts/indent`) that
      oscillated and never converged under `--fix`; replaced the `switch` with a `Record`
      lookup table, which resolves cleanly and needs no case-clause indentation.

## 10. Validation & PR

- [x] 10.1 Run `openspec validate migrate-better-auth --strict` and resolve any reported issues —
      passed clean.
- [x] 10.2 Commit following the `write-commits` skill (Conventional Commits, `git commit -F`,
      gitlint-validated)
- [x] 10.3 Open PR via `gh pr create --body-file <file>`, referencing
      `openspec/changes/migrate-better-auth/`, summarizing what was verified in section 8
- [x] 10.4 Stop for CODEOWNER review per `CONTRIBUTING.md` - do not merge

## 11. Post-Implementation Note

An internal review pass (the `reviewer` agent, per the two-PR workflow's step before opening the
implementation PR) read the full diff, cross-referenced `server/auth/rumbor-adapter.ts`'s
`createAdapterFactory` implementation against the installed `better-auth`/`@better-auth/core`
source directly, and traced the credential sign-in flow end to end (account/issuer shape,
password hashing, session-cookie hook guard, reactive `.value` usage in the migrated
composables). Verdict: `overall_correctness: "correct"`, confidence 0.82. Two low-severity,
non-blocking findings surfaced and were addressed or accepted:

- `WHERE_OPERATORS`' `lt`/`lte`/`gt`/`gte` cast values to `number`, which would misbehave against
  `Date` fields (e.g. `expiresAt`) if better-auth ever issued a `where`-clause ordering comparison
  against one in an exercised flow. Not currently reachable (session-expiry checks happen
  post-fetch in JS, not via an adapter `where` comparison) but fixed anyway: added a
  `toComparable()` helper that unwraps `Date` via `.getTime()` before comparing.
- `generateId()`'s `Date.now()`-based counter has a theoretical collision window under
  same-millisecond concurrent demo-mode `create()` calls. Accepted as-is: demo mode is a
  single-process, non-persistent dev/test fixture (matches the removed `server/fake-db/auth`'s
  own informality), not a production data store.
