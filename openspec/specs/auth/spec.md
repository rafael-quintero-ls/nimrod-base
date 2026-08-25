# auth Specification

## Purpose
Defines how a user establishes, reads, and ends an authenticated session in nimrod, and how that
session's role/permission data feeds the application's authorization layer (CASL), independent of
which identity backend or auth library implements it.
## Requirements
### Requirement: Credential-based sign-in
The system SHALL allow a user to authenticate with an email and password, establishing a session
on success and returning a field-level error without establishing a session on failure.

#### Scenario: Valid credentials
- **WHEN** a user submits a correct email and password on the login page
- **THEN** a session is established and the user is navigated to the originally requested route
  (or `/` if none was requested)

#### Scenario: Invalid credentials
- **WHEN** a user submits an email/password pair that does not match any account
- **THEN** no session is established, the login page remains, and a field-level error is shown on
  the form without a full-page navigation

### Requirement: Session carries role and authorization data
An established session SHALL expose the authenticated user's role and a set of authorization
rules (action/subject pairs) sufficient to drive route- and UI-level access control, both during
server-side rendering and after client-side hydration.

#### Scenario: Session available during SSR
- **WHEN** an authenticated user's browser requests a protected page directly (full page load, not
  a client-side navigation)
- **THEN** the server-rendered response reflects the authenticated state and the user's role-gated
  navigation, without a flash of unauthenticated content

#### Scenario: Session survives a hard refresh
- **WHEN** an authenticated user reloads the browser tab
- **THEN** the session, role, and authorization rules are available again without requiring
  re-authentication, as long as the session has not expired or been revoked

### Requirement: Route access is gated by authorization rules
The system SHALL deny navigation to a route the current session's authorization rules do not
permit, redirecting an authenticated-but-unauthorized user to a distinct "not authorized" page and
an unauthenticated user to the login page.

#### Scenario: Authenticated user lacking permission
- **WHEN** a logged-in user navigates to a route their authorization rules do not grant
- **THEN** they are redirected to the "not authorized" page, not the login page

#### Scenario: Unauthenticated user on a protected route
- **WHEN** a user with no session navigates to a route that requires authentication
- **THEN** they are redirected to the login page, with enough context to return to the originally
  requested route after signing in

#### Scenario: Public route bypasses the gate
- **WHEN** any user (authenticated or not) navigates to a route explicitly marked public
- **THEN** navigation proceeds without a redirect

### Requirement: Authenticated-only pages block re-entry to sign-in flows
The system SHALL redirect an already-authenticated user away from sign-in/sign-up pages rather
than re-rendering them.

#### Scenario: Already-authenticated user visits the login page
- **WHEN** a user with an active session navigates to the login page
- **THEN** they are redirected away from it (to `/`, subject to role-based landing routing) rather
  than shown the login form

### Requirement: Server API routes independently enforce authentication
Every server API route that returns or mutates user-specific data SHALL verify the caller has an
active session on the server, independent of and in addition to any client-side route gating.

#### Scenario: Direct request to a protected API route without a session
- **WHEN** a request with no valid session reaches a server API route that requires authentication
- **THEN** the server rejects the request (401/403) before executing the route's business logic,
  regardless of what the client-side UI would have allowed

### Requirement: Sign-out terminates the session and resets authorization state
The system SHALL let an authenticated user end their session, after which the client's
authorization rules reset to the unauthenticated default and protected routes are no longer
reachable without re-authenticating.

#### Scenario: User signs out
- **WHEN** an authenticated user triggers sign-out
- **THEN** their session is invalidated, client-held authorization rules reset to empty/default,
  and they are navigated to the login page

### Requirement: Identity backend is not exposed through the public interface
Whatever system of record resolves a user's identity, role, and authorization rules SHALL NOT be
named or otherwise identifiable in nimrod's user-facing UI, error messages, environment variable
names, or public configuration keys.

#### Scenario: Authentication failure surfaced to the user
- **WHEN** sign-in fails for a reason originating in the identity backend (e.g. backend
  unreachable, malformed backend response)
- **THEN** the error shown to the user is generic and backend-agnostic, naming neither the backend
  nor its underlying technology

