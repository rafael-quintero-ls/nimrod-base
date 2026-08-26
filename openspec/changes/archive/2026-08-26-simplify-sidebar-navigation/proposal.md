## Why

nimrod is the scaffolded Vuexy admin template — every page, view, and nav entry outside auth/ACL
is unmodified demo content (Ecommerce, Academy, Logistics, Chat, Email, Kanban, Invoice, Front
Pages, Wizard Examples, Charts, Forms, UI Elements, Tables, duplicate Authentication v1/v2
variants, misc/cards demo pages). It ships with ~90 route files and a sidebar advertising a
product surface that doesn't exist, which misleads anyone navigating it (operator or agent) about
what's actually implemented, and carries dead weight (bundle size, lint/type-check surface, future
migration surface) for code that will never be exercised. Only three things in the current app are
real: authentication (`@nuxtjs/better-auth`, migrated in `2026-08-25-migrate-better-auth`), user
management, and role/permission management (CASL). Everything else should be deleted, not hidden,
per the operator's explicit direction — a full cutover leaves no dead code, no soft-hidden routes
still reachable by direct URL.

Separately, the operator asked for the sidebar's full future shape to be defined now, following
Vuexy's own pattern for known-but-unbuilt destinations: a visible nav entry, real CASL
`action`/`subject` gating (not a disabled/greyed-out stub), pointing at a real, rendering,
authenticated route — never a dangling link or an empty group. `docs/architecture/
ecosystem-architecture.md` and `docs/architecture/sidebar-roadmap.md` (already written, this
session) name the six domain-agnostic module families this repo will eventually need: Agents,
Workflows, Tools, Model Providers, Context & Memory, Observability. This change defines all six as
real, CASL-gated "coming soon" routes now, so the target sidebar shape is fully specified in one
place before any of their backends exist — each is later swapped for real content in its own
OpenSpec change (per `AGENTS.md`) without touching navigation structure again.

**This is a deliberate, operator-approved exception to this repo's normal
no-stub/no-placeholder rule** (`AGENTS.md`'s delivery contract), scoped narrowly: the six routes
render a real, honest "in development" page (own component, authenticated layout, not a copy of
Vuexy's public marketing `misc/coming-soon.vue` which is unauthenticated and carries a fake email
capture form) — never a broken link, never silently hidden, never claiming functionality that
doesn't exist.

## What Changes

- **BREAKING**: Delete every page/view/nav entry not tied to auth, dashboard-analytics, users, or
  roles/permissions. See `design.md` for the full file inventory.
- Collapse the "Dashboards" nav group from 5 variants (Analytics/CRM/Ecommerce/Academy/Logistics)
  to a single "Dashboard" entry pointing at the Analytics variant (`dashboards-analytics`);
  `dashboards-crm`, `dashboards-ecommerce`, `dashboards-academy`, `dashboards-logistics` and their
  page/view files are removed.
- Delete `navigation/vertical/{apps-and-pages,charts,forms,ui-elements,others}.ts` and their
  `navigation/horizontal/*` counterparts; `navigation/vertical/index.ts` and
  `navigation/horizontal/index.ts` are rewritten to export only `dashboard` (trimmed to
  Dashboard+Users+Roles&Permissions) — no `apps-and-pages`/`charts`/`forms`/`ui-elements`/`others`
  imports remain.
- Delete `pages/access-control.vue` and its "Access Control" nav entry (`others.ts`'s only
  non-demo-navigation item, gated on the `AclDemo` CASL subject) as part of the `others.ts` removal
  since it has no replacement in the kept surface; update `app/router.options.ts`'s role-based `/`
  redirect (`client` role currently redirects to `{ name: 'access-control' }`) to redirect `client`
  to the kept Dashboard route instead, and remove the now-unreferenced `AclDemo` ability rule from
  `server/auth/rumbor-adapter.ts`'s demo `client` user seed.
- Delete `pages/register.vue`, `pages/pages/authentication/*` (login/register/verify-email/
  forgot-password/reset-password/two-steps v1+v2 demo duplicates — the real, better-auth-wired
  flows are the root-level `pages/login.vue` and `pages/forgot-password.vue`), and the "Register"
  link on `pages/login.vue` pointing at the deleted `register` route.
- Delete `pages/dashboards/{crm,ecommerce}.vue`, `pages/apps/*` except `apps/user/*`,
  `apps/roles/*`, `apps/permissions/*` (i.e. remove `ecommerce`, `academy`, `logistics`, `email`,
  `chat.vue`, `calendar.vue`, `kanban`, `invoice`), `pages/front-pages/*`, `pages/wizard-examples/*`,
  `pages/charts/*`, `pages/forms/*`, `pages/components/*`, `pages/tables/*`, `pages/extensions/*`,
  and `pages/pages/*` except `account-settings` (real, tied to the authenticated user) — i.e. also
  remove `cards`, `dialog-examples`, `faq.vue`, `icons.vue`, `pricing.vue`, `typography.vue`,
  `test/*`, `user-profile/*` (unused demo profile page, distinct from `account-settings`), and
  `misc/*` except `not-authorized.vue` (referenced by `middleware/acl.global.ts`, must stay).
  `misc/coming-soon.vue` and `misc/under-maintenance.vue` (Vuexy's public, unauthenticated,
  `layout: 'blank'` marketing pages, one with a fake email-capture form) are also deleted — they
  are not reused for the six future-module placeholders below, which get their own authenticated,
  dashboard-layout page instead (see the new bullet on future modules).
- Delete every `views/**` file whose only consumer is a page deleted above (the majority of
  `views/demos/**`, `views/dashboards/{crm,ecommerce}/**`, `views/apps/**` except `user`/`roles`,
  `views/front-pages/**`, `views/wizard-examples/**`, `views/pages/**` except
  `account-settings`/`user-profile` used by kept pages — final list confirmed file-by-file in
  `design.md` before deletion, since `views/` isn't 1:1 with `pages/`).
- Remove now-orphaned i18n locale keys (`plugins/i18n/locales/{en,fr,ar}.json`) that only labeled
  deleted nav sections/pages (e.g. `"Kanban"`, `"Cards"`, `"Charts & Maps"`) — `design.md` lists the
  exact key set after cross-referencing remaining usage.
- No change to `@nuxtjs/better-auth`, CASL's ability-evaluation engine (`plugins/casl/ability.ts`'s
  types, `@layouts/plugins/casl.ts`'s `canNavigate`), or the `auth` capability spec itself.
- **New**: add six CASL-gated "in development" routes for the module families defined in
  `docs/architecture/sidebar-roadmap.md` — `agents`, `workflows`, `tools`, `model-providers`,
  `memory`, `observability`. Each gets its own top-level `pages/<module>/index.vue` (dashboard
  layout, authenticated) rendering a single shared `views/shared/ModuleComingSoon.vue` component
  (title + short description of what the module will cover + "in development" state — no fake
  form, no marketing copy), and its own nav entry with `action: 'read'`, `subject: '<PascalCase
  module>'` (e.g. `subject: 'Agent'`, `subject: 'Workflow'`) in a new `navigation/vertical/
  modules.ts` (+ `navigation/horizontal/modules.ts`). `navigation/vertical/index.ts`/
  `horizontal/index.ts` import and export this file alongside the trimmed `dashboard.ts`.
- **New**: grant the six new `{ action: 'read', subject: '<Module>' }` rules only to the demo
  `admin` user's seed in `server/auth/rumbor-adapter.ts` (already `{ action: 'manage', subject:
  'all' }`, which already covers them implicitly — the explicit per-module rules exist so
  `canViewNavMenuGroup`/`canNavigate` document intent per module rather than relying solely on the
  admin wildcard, and so a future non-wildcard admin-like role has a concrete rule set to copy).
  The demo `client` user's seed gets none of the six — `client` does not see these nav entries or
  routes (confirmed operator decision: roadmap modules are admin-only visibility for now).

## Capabilities

### New Capabilities
- `navigation-roadmap`: defines how nimrod exposes a not-yet-implemented module (nav entry, CASL
  gate, and placeholder route content) without violating this repo's no-stub delivery contract —
  the visible-but-honestly-labeled "in development" pattern this change introduces for Agents,
  Workflows, Tools, Model Providers, Context & Memory, and Observability, and that future modules
  reuse until each gets real content in its own change.

### Modified Capabilities
(none — `openspec/specs/auth/spec.md`'s requirements are written at the "role-based landing
routing" level of abstraction and never name a concrete route; the `client` role's redirect
target changes from `access-control` to `dashboards-analytics`, but no requirement or scenario
text describes that target, so no spec text changes. This is purely an `app/router.options.ts`
implementation detail, tracked in `design.md`.)

## Impact

- **Affected code**: `navigation/vertical/*.ts`, `navigation/horizontal/*.ts`, ~85 files under
  `pages/**`, the corresponding majority of `views/**` (~300+ files, exact count in `design.md`),
  `app/router.options.ts` (redirect target + the three demo-route entries it hand-registers for
  `dashboards-logistics`/`dashboards-academy`/`apps-ecommerce-dashboard`, all pointing at deleted
  pages), `server/auth/rumbor-adapter.ts` (drop `AclDemo` ability rule from the demo `client`
  seed; add six new `read`-on-`<Module>` rules to the `admin` seed only),
  `plugins/i18n/locales/{en,fr,ar}.json` (orphaned keys removed, six new module labels added).
- **New code**: six `pages/<module>/index.vue` route files, one shared
  `views/shared/ModuleComingSoon.vue` component, one new `navigation/vertical/modules.ts` +
  `navigation/horizontal/modules.ts`, new `openspec/specs/navigation-roadmap/spec.md`.
- **Unaffected**: `@nuxtjs/better-auth` config, CASL ability-evaluation logic, `server/api/**`
  outside the rumbor-adapter seed change above, `openspec/specs/auth/spec.md` structure (one
  requirement's scenario detail changes, not its shape).
- **Out of scope**: any real backend/content for Agents, Workflows, Tools, Model Providers,
  Context & Memory, or Observability — this change only adds their nav entry, gate, and honest
  "in development" placeholder route per `navigation-roadmap`; each module's real implementation
  is a separate future OpenSpec change once its backend contract exists.
