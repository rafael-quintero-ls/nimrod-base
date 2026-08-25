# dependency-security-baseline Specification

## Purpose
Keeps the application's runtime and auth/ACL dependencies outside the version ranges `pnpm audit --prod` reports as critical or high severity, so known-exploitable auth-bypass, prototype-pollution, and RCE issues in the dependency tree cannot be used against a running deployment.
## Requirements
### Requirement: Production dependencies stay outside critical/high vulnerable ranges
The system SHALL pin every package in `package.json` `dependencies` to a version outside any range `pnpm audit --prod` reports at critical or high severity.

#### Scenario: Audit run after a dependency update
- **WHEN** `pnpm audit --prod` is run against the committed lockfile
- **THEN** the report contains zero critical-severity and zero high-severity advisories for packages listed in `package.json` `dependencies`

### Requirement: Auth provider and its Nuxt integration module move together
The system SHALL keep `next-auth` and `@sidebase/nuxt-auth` on mutually compatible versions, so the credentials-provider login flow (`server/api/auth/[...].ts`) continues to issue and validate JWTs after either package is upgraded.

#### Scenario: Credentials login after the auth dependency bump
- **WHEN** a user submits valid credentials to the login page after `next-auth`/`@sidebase/nuxt-auth` have been upgraded
- **THEN** the server issues a session JWT containing `username`, `fullName`, `avatar`, `abilityRules`, and `role`, matching the shape produced before the upgrade

### Requirement: ACL route guarding behavior is unchanged by the CASL upgrade
The system SHALL continue to enforce `middleware/acl.global.ts`'s existing navigation rules (public routes, unauthenticated-only routes, `canNavigate` ability checks) identically after `@casl/ability`/`@casl/vue` are upgraded to patched versions.

#### Scenario: Unauthorized route access after the CASL dependency bump
- **WHEN** an authenticated user without the required ability navigates to a route gated by `canNavigate`
- **THEN** the middleware redirects to the `not-authorized` route, same as before the upgrade

#### Scenario: Public route access after the CASL dependency bump
- **WHEN** any user, authenticated or not, navigates to a route with `meta.public` set
- **THEN** the middleware allows navigation without redirect, same as before the upgrade

### Requirement: Nuxt route rules remain case-insensitive by default
The system SHALL rely on Nuxt's default case-insensitive `routeRules` matching (the CVE-2026-53721 regression fix shipped in Nuxt 4.5.1+) rather than any case-sensitive assumption, since `nuxt.config.ts` defines no `routeRules` in this application.

#### Scenario: Nuxt upgrade with no routeRules configured
- **WHEN** `nuxt` is upgraded to a version at or above 4.5.1
- **THEN** `nuxt.config.ts` still defines no `routeRules`, so the case-insensitive matching change has no observable effect on this application's routing

