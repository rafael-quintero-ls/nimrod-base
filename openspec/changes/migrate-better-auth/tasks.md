## 1. Approval Gate

- [x] 1.1 Present `proposal.md`, `design.md`, `specs/auth/spec.md`, and this `tasks.md` to the
      operator and obtain explicit approval before any implementation task below starts (per
      `AGENTS.md` human-in-the-loop gate)
- [x] 1.2 Plan approved by operator in session, 2026-08-25 ("lo apruebo")

## 2. Branch Setup

- [ ] 2.1 Branch from tip of `main`: `feat/migrate-better-auth`

## 3. Dependency Swap

- [ ] 3.1 Remove `next-auth` and `@sidebase/nuxt-auth` from `package.json`
- [ ] 3.2 Add `better-auth` and `@nuxtjs/better-auth` to `package.json`
- [ ] 3.3 Run `pnpm install`; capture and resolve any peer-dependency warnings (or explicitly
      document ones left open, matching the prior dependency-security change's convention)

## 4. Server-Side Adapter

- [ ] 4.1 Create `server/auth/rumbor-adapter.ts` implementing better-auth's
      `createAdapterFactory` interface (`create`/`findOne`/`findMany`/`update`/`updateMany`/
      `delete`/`deleteMany`/`count`) for the `user`, `session`, `account`, `verification` models
- [ ] 4.2 Implement demo-mode fixture data inside the adapter (ported 1:1 from
      `server/fake-db/auth/index.ts`'s two demo users — `admin@demo.com`/`admin` with
      `manage all`, `client@demo.com`/`client` with `read Auth`/`read AclDemo`), active when
      `NUXT_IDENTITY_BACKEND_URL` is unset
- [ ] 4.3 Implement the real-backend branch of the adapter that proxies to
      `NUXT_IDENTITY_BACKEND_URL` when set (best-effort against `rumbor-core`'s contract as it
      exists at implementation time; document any gap found)
- [ ] 4.4 Create `server/auth.config.ts` (`defineServerAuth`) wiring the adapter,
      `emailAndPassword` credential auth, and a `session` hook that writes the
      `userAbilityRules` cookie from the session user's `abilityRules` field (replacing
      `pages/login.vue`'s manual cookie write)
- [ ] 4.5 Remove `server/api/auth/[...].ts`, `server/fake-db/auth/*`, `server/api/login.post.ts`

## 5. Client-Side Wiring

- [ ] 5.1 Create `app/auth.config.ts` (`defineClientAuth`)
- [ ] 5.2 Update `pages/login.vue`: replace `useAuth()`'s `signIn`/session read with the module's
      sign-in composable; remove the manual `userAbilityRules`/`userData` cookie writes (now
      server-side per 4.4); keep the existing field-level error handling behavior
- [ ] 5.3 Update `layouts/components/UserProfile.vue`: replace `useAuth()`'s `signOut` with the
      module's sign-out composable; keep existing post-signout cleanup (ability reset, navigate
      to login)
- [ ] 5.4 Update `middleware/acl.global.ts`: replace `useAuth().status` with the module's session
      composable's equivalent authenticated/unauthenticated check; keep `canNavigate`/
      `to.meta.public`/`to.meta.unauthenticatedOnly` logic unchanged
- [ ] 5.5 Update `app/router.options.ts`'s role-based redirect: swap the dynamically-imported
      `useAuth` for the module's session composable, preserving the existing deferred-import
      pattern (`callWithNuxt`) that works around `nuxt/nuxt#35982`
- [ ] 5.6 Add type augmentation for `#nuxt-better-auth`'s `AuthUser` (`abilityRules: Rule[]`,
      `role: string`, `username`, `fullName`, `avatar`), replacing `next-auth.d.ts`; delete
      `next-auth.d.ts`

## 6. Server API Routes

- [ ] 6.1 Delete `server/utils/auth.ts`
- [ ] 6.2 Update `server/api/me.get.ts` to call `requireUserSession(event)` directly
- [ ] 6.3 Delete `server/api/token.get.ts` (no other code in the repo calls it — confirmed by
      grep during scoping)

## 7. Config Cleanup

- [ ] 7.1 Remove `nuxt.config.ts`'s `auth` block (Auth.js provider config) and add
      `@nuxtjs/better-auth` to `modules`
- [ ] 7.2 Remove the `nitro.alias` entries for `next-auth/core` and `next-auth/jwt`
- [ ] 7.3 Remove `next-auth` and its transitive CJS chain (`@babel/runtime`, `lru-cache`,
      `yallist`, etc.) from `nitro.externals.inline` — keep only entries still needed by other
      dependencies, if any
- [ ] 7.4 Update `.env.example`: remove `AUTH_ORIGIN`, `AUTH_SECRET`; add
      `NUXT_BETTER_AUTH_SECRET`, `NUXT_IDENTITY_BACKEND_URL`
- [ ] 7.5 Update `runtimeConfig` in `nuxt.config.ts` to match the new env vars

## 8. Behavioral Verification

- [ ] 8.1 Run `pnpm dev`; log in via the credentials flow (demo-mode fixture data) and confirm
      the session contains `username`, `fullName`, `avatar`, `abilityRules`, `role` (spec:
      auth - "Session carries role and authorization data")
- [ ] 8.2 Confirm invalid credentials show a field-level error without navigating away from
      `/login` (spec: auth - "Credential-based sign-in", invalid case)
- [ ] 8.3 Navigate to a `canNavigate`-gated route as a user lacking the required ability; confirm
      redirect to `not-authorized` (spec: auth - "Route access is gated by authorization rules")
- [ ] 8.4 Navigate to a route with `meta.public` set, unauthenticated; confirm it loads without
      redirect (spec: auth - "Public route bypasses the gate")
- [ ] 8.5 As an authenticated user, navigate to `/login`; confirm redirect away from it (spec:
      auth - "Authenticated-only pages block re-entry to sign-in flows")
- [ ] 8.6 Request `GET /api/me` directly (no session cookie, e.g. via `curl`) and confirm a
      401/403 (spec: auth - "Server API routes independently enforce authentication")
- [ ] 8.7 Sign out; confirm session is cleared, ability resets, and protected routes require
      re-authentication (spec: auth - "Sign-out terminates the session and resets authorization
      state")
- [ ] 8.8 Load the dashboard directly (full page load, not client-side nav) as an authenticated
      user; confirm SSR renders the authenticated layout with no unauthenticated flash (spec:
      auth - "Session available during SSR")
- [ ] 8.9 Hard-refresh an authenticated tab; confirm session/role/abilities persist without
      re-login (spec: auth - "Session survives a hard refresh")
- [ ] 8.10 **Client-side browser check, not just curl/HTTP-status**: open the app in a real
      browser, open devtools console, navigate through login → dashboard → a role-gated route;
      confirm no `ReferenceError`/import-cycle error appears (regression check for
      `nuxt/nuxt#35982`, per the prior dependency-security change's post-mortem that this class
      of bug is invisible to server-side-only verification)
- [ ] 8.11 Inspect a triggered auth error (e.g. temporarily point `NUXT_IDENTITY_BACKEND_URL` at
      an unreachable URL) and confirm the surfaced message names neither "Directus" nor any other
      backend-specific term (spec: auth - "Identity backend is not exposed through the public
      interface")

## 9. Build, Lint, Types

- [ ] 9.1 Run `pnpm build` and confirm it completes without new errors
- [ ] 9.2 Run `node .output/server/index.mjs` (not just check `pnpm build`'s exit code) and repeat
      the full login → dashboard → sign-out flow against the production artifact, per the prior
      change's lesson that a production server can fail to boot even when `pnpm build` succeeds
- [ ] 9.3 Run a full type-check (`pnpm build` or equivalent) and confirm no `session.user.*`
      fields used elsewhere in the app lost their types after `next-auth.d.ts`'s removal
- [ ] 9.4 Run `pnpm lint`; fix only regressions directly introduced by this change

## 10. Validation & PR

- [ ] 10.1 Run `openspec validate migrate-better-auth --strict` and resolve any reported issues
- [ ] 10.2 Commit following the `write-commits` skill (Conventional Commits, `git commit -F`,
      gitlint-validated)
- [ ] 10.3 Open PR via `gh pr create --body-file <file>`, referencing
      `openspec/changes/migrate-better-auth/`, summarizing what was verified in section 8
- [ ] 10.4 Stop for CODEOWNER review per `CONTRIBUTING.md` - do not merge
