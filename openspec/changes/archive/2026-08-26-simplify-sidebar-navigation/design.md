# Design: Simplify sidebar navigation

## Context

nimrod is the Vuexy admin template scaffold. Post `2026-08-25-migrate-better-auth`, the only real
capability is auth (login/forgot-password via `@nuxtjs/better-auth`, role/permission via CASL).
Everything else — 108 of 117 `pages/**/*.vue` files and 499 of 526 `views/**/*.vue` files — is
unmodified Vuexy demo content (Ecommerce, Academy, Logistics, Chat, Email, Kanban, Invoice, Front
Pages, Wizard Examples, Charts, Forms, UI Elements, Tables, duplicate Authentication v1/v2 pages).

The operator's instruction is explicit: full cutover, not soft-hide. Deleted means deleted — no
routes reachable by direct URL, no dead code, no orphaned server endpoints backing removed pages.

Separately, the operator asked for the sidebar's full *future* shape to be defined now, following
Vuexy's own pattern for known-but-unbuilt destinations: a visible nav entry, real CASL gating, and
a route that renders — never a dangling link, an empty group, or a silently hidden feature.
`docs/architecture/ecosystem-architecture.md` and `docs/architecture/sidebar-roadmap.md` (written
earlier this session) name six domain-agnostic module families this repo will eventually need:
Agents, Workflows, Tools, Model Providers, Context & Memory, Observability. See "Future modules"
below for how this change adds all six as real, gated, honestly-labeled "in development" routes —
an explicit, operator-approved exception to the no-stub rule, scoped to exactly this pattern.

## Scope-of-investigation note

This change's investigation expanded past `pages/`/`views/`/`navigation/` (the operator's literal
"sidebar" ask) into `server/api/**` and `server/fake-db/**`, because most demo pages call a
demo-only backend endpoint — deleting the page without its endpoint leaves orphaned server code
serving nothing, which is exactly the "no dead code" bar the operator set. Investigated by direct
`grep`/`glob`/import-graph tracing (see Method below), not by a subagent — a prior scout dispatch
for this same inventory task hit its execution budget and returned no output; the inventory here
was built directly instead.

## Method: how the KEEP set was derived

1. Started from the 4 capabilities confirmed real: auth (login/forgot-password/not-authorized),
   Dashboard (Analytics variant only, per operator pick), Users, Roles & Permissions.
2. Resolved the exact page files for each: `pages/login.vue`, `pages/forgot-password.vue`,
   `pages/not-authorized.vue` (referenced by `middleware/acl.global.ts`'s ACL-denial redirect —
   must stay regardless of nav), `pages/dashboards/analytics.vue`, `pages/apps/user/list/index.vue`,
   `pages/apps/user/view/[id].vue`, `pages/apps/roles/index.vue`, `pages/apps/permissions/index.vue`.
   `pages/pages/account-settings/[tab].vue` also kept — it's the authenticated user's own account
   settings (linked from the user menu, tied to the real session), not a demo page.
3. Traced `@/views/...` imports transitively from those 9 pages (regex over `from '@/views/...'`,
   BFS to fixed point) — found 2 levels deep (`UserList.vue` -> `AddNewUserDrawer.vue`,
   `UserTabAccount.vue` -> `UserInvoiceTable.vue`, `AccountSettingsBillingAndPlans.vue` ->
   `BillingHistoryTable.vue`), converging at 27 kept `views/**` files with no further imports.
4. Cross-checked every kept page for a `useApi(...)` call to find its real backend dependency:
   `/apps/permissions`, `/apps/users` (+ `[id]`), `/dashboard/analytics/projects`. `apps/roles`
   (`RoleCards.vue`) has no backend call — static demo data in the component itself, unaffected by
   this change either way.
5. Checked every deleted route name against `grep` across `navigation/**`, `app/router.options.ts`,
   `layouts/components/*.vue`, `server/fake-db/app-bar-search/index.ts`, and
   `server/auth/rumbor-adapter.ts` for stale references outside `pages/`/`views/` — see Dangling
   references below.

## KEEP set (27 files)

**Pages (9):**
```
pages/login.vue
pages/forgot-password.vue
pages/not-authorized.vue
pages/dashboards/analytics.vue
pages/apps/user/list/index.vue
pages/apps/user/view/[id].vue
pages/apps/roles/index.vue
pages/apps/permissions/index.vue
pages/pages/account-settings/[tab].vue
```

**Views (27):**
```
views/pages/authentication/AuthProvider.vue
views/dashboards/analytics/{AnalyticsAverageDailySales,AnalyticsEarningReportsWeeklyOverview,
  AnalyticsMonthlyCampaignState,AnalyticsProjectTable,AnalyticsSalesByCountries,
  AnalyticsSalesOverview,AnalyticsSourceVisits,AnalyticsSupportTracker,AnalyticsTotalEarning,
  AnalyticsWebsiteAnalytics}.vue
views/apps/user/list/AddNewUserDrawer.vue
views/apps/user/view/{UserBioPanel,UserTabAccount,UserTabBillingsPlans,UserTabConnections,
  UserTabNotifications,UserTabSecurity,UserInvoiceTable}.vue
views/apps/roles/{RoleCards,UserList}.vue
views/pages/account-settings/{AccountSettingsAccount,AccountSettingsBillingAndPlans,
  AccountSettingsConnections,AccountSettingsNotification,AccountSettingsSecurity,
  BillingHistoryTable}.vue
```

**Server API (5) + fake-db (3 dirs) backing them:**
```
server/api/me.get.ts                              (unaffected - already auth-real)
server/api/apps/permissions/index.get.ts           <- server/fake-db/apps/permissions/{index,types}.ts
server/api/apps/users/{index.get,index.post,[id].get,[id].delete}.ts
                                                    <- server/fake-db/apps/users/{index,types}.ts
server/api/dashboard/analytics/projects.get.ts     <- server/fake-db/dashboard/{index,types}.ts
```

## DELETE set

**Pages: 108 files.** By area:
```
pages/                    register.vue, access-control.vue                              (2)
pages/apps/               chat.vue, calendar.vue, email/, ecommerce/ (11), academy/ (3),
                           logistics/ (2), invoice/ (4)                                   (23)
pages/charts/             apex-chart.vue, chartjs.vue                                     (2)
pages/components/         alert, avatar, badge, button, chip, dialog, expansion-panel,
                           list, menu, pagination, progress-circular, progress-linear,
                           snackbar, tabs, timeline, tooltip                              (16)
pages/dashboards/         crm.vue, ecommerce.vue                                          (2)
pages/extensions/         swiper.vue, tour.vue                                            (2)
pages/forms/               all 19 form-component demo pages                              (19)
pages/front-pages/        pricing, payment, checkout, landing-page/, help-center/ (+article)  (6)
pages/pages/               authentication/ (13 v1/v2 variants), cards/ (5), test/ (5),
                           user-profile/ (1), misc/{under-maintenance,coming-soon} (2),
                           dialog-examples/, faq, icons, pricing, typography             (31)
pages/tables/              simple-table.vue, data-table.vue                              (2)
pages/wizard-examples/     checkout.vue, property-listing.vue, create-deal.vue           (3)
```
Full file-by-file list: `openspec/changes/simplify-sidebar-navigation/delete-manifest.txt`
(generated during investigation, committed alongside this plan for exact reproducibility — the
implementation task runs `xargs rm` over it rather than re-deriving the list by hand).

**Views: 499 files** — everything under `views/**` not in the KEEP set above, i.e. `views/demos/**`
(327 files: forms + components demo galleries), `views/dashboards/{crm,ecommerce}/**`,
`views/apps/**` except `user`/`roles` subtrees, `views/front-pages/**`, `views/wizard-examples/**`,
`views/pages/**` except `account-settings`/the single `authentication/AuthProvider.vue`. Same
manifest file covers both pages and views.

**Server API: 44 of 49 files** — everything under `server/api/**` except the 5 KEEP-set files above:
`app-bar/search/`, `apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics}/**`,
`pages/{datatable,faq,help-center,profile}/**`. `server/fake-db/**`: everything except
`apps/{permissions,users}/` and `dashboard/` — i.e. `app-bar-search/`, `apps/{academy,calendar,
chat,ecommerce,email,invoice,kanban,logistics}/`, `pages/{datatable,faq,help-center,profile}/`.

**Navigation:** `navigation/vertical/{apps-and-pages,charts,forms,ui-elements,others}.ts` and their
`navigation/horizontal/*` counterparts, deleted whole (every entry in them points at a deleted
route). `navigation/vertical/index.ts` and `navigation/horizontal/index.ts` rewritten to export
only a trimmed `dashboard.ts` (Dashboard + Users + Roles & Permissions, single dashboard entry, no
`badgeContent`/"Front Pages" group — see next section).

## Decisions

### Dashboard: single entry, Analytics variant
Operator confirmed Analytics over CRM as the sole survivor (neutral, generic KPI dashboard vs. a
CRM-flavored one). `navigation/vertical/dashboard.ts` becomes:
```ts
export default [
  {
    title: 'Dashboard',
    icon: { icon: 'tabler-smart-home' },
    to: 'dashboards-analytics',
  },
]
```
(A single top-level link, not a `children` group with one item — matches how `Users` and
`Roles & Permissions` will be expressed, avoids a redundant one-item disclosure group.) The
`badgeContent: '5'` (advertised the 5-dashboard demo count) and the entire "Front Pages" nav group
are dropped with it — Front Pages was demo marketing-page content, unrelated to Dashboard, already
in the DELETE set above.

### `pages/access-control.vue` and the `AclDemo` ability
`others.ts`'s only non-pure-demo nav entry ("Access Control") points at `pages/access-control.vue`,
gated on `action: 'read', subject: 'AclDemo'`. It has no replacement in the kept surface and is
itself a CASL-demo page (its own template literally renders "here's what gated content looks
like"). Deleting it has two downstream touches, both required to avoid a dangling reference:
- `app/router.options.ts`'s `/` redirect currently sends the `client` role to
  `{ name: 'access-control' }`. Changed to redirect `client` to `{ name: 'dashboards-analytics' }`
  (same target as `admin`, since there's no second real dashboard to differentiate roles by
  anymore — role differentiation still happens via CASL-gated route access and sidebar visibility,
  not via a different landing page).
- `server/auth/rumbor-adapter.ts`'s demo `client` user seed
  (`ensureDemoUsersSeeded`, line ~77) currently grants `{ action: 'read', subject: 'AclDemo' }`.
  Removed — the `AclDemo` subject no longer maps to any route or UI. The `client` seed keeps its
  `{ action: 'read', subject: 'Auth' }` rule (unrelated, still meaningful — used by
  `middleware/acl.global.ts`'s general auth gate, not by the deleted page).

### `pages/register.vue` and the "Register" link on `pages/login.vue`
No real registration flow exists (`@nuxtjs/better-auth`'s configured flows are sign-in/sign-out
only — confirmed via `app/auth.config.ts`'s empty `defineClientAuth({})` and the absence of any
`signUp`/registration call anywhere in `pages/`/`views/`). `pages/register.vue` is demo-only,
imports `views/pages/authentication/AuthProvider.vue` (shared with `login.vue`, stays) plus
demo-only illustration assets. Deleted along with its "Register" link on `pages/login.vue`
(`:to="{ name: 'register' }"`, line 216) removed from the template.

### `pages/pages/authentication/*` (13 files) vs. root `login.vue`/`forgot-password.vue`
The v1/v2-suffixed files under `pages/pages/authentication/` are Vuexy's template-gallery
duplicates (unstyled/alt-styled variants for demo browsing), never wired to
`@nuxtjs/better-auth` — confirmed no `useSignIn`/`useSignOut`/`authClient` usage in any of them
(only the root `pages/login.vue` and `pages/forgot-password.vue` call those composables). All 13
deleted; the real flows are unaffected.

### `pages/pages/misc/{coming-soon,under-maintenance}.vue`
No nav entry references either today. Both are deleted, but *not* because there's no future use
for an "in development" pattern — there is (see "Future modules" below) — rather because these
specific two files are the wrong shape for it: `layout: 'blank'` (unauthenticated marketing
layout, not the dashboard shell), `public: true`, and `coming-soon.vue` additionally ships a fake
email-capture `<VForm>` that submits nowhere (`@submit.prevent="() => {}"`) — exactly the kind of
implied-but-nonexistent functionality this repo's delivery contract prohibits. The six future
modules get a purpose-built replacement instead (see below), not a reuse of these two.

### `layouts/components/NavbarShortcuts.vue`
Not a page/view but a layout component with two hardcoded shortcut entries pointing at deleted
routes: `{ name: 'apps-calendar' }` ("Calendar") and `{ name: 'apps-invoice-list' }` ("Invoice
App"). Both entries removed from the `shortcuts` array; the remaining four (`apps-user-list`,
`apps-roles`, `dashboards-analytics`, `pages-account-settings-tab`) all resolve to KEEP-set routes,
left as-is.

### `layouts/components/NavSearchBar.vue` / app-bar search feature
`NavSearchBar.vue` itself contains no hardcoded route names — it renders whatever
`server/api/app-bar/search/index.ts` returns, which is 100% backed by
`server/fake-db/app-bar-search/index.ts` (checked in full: all ~90 entries there are `{ name: ...
}` route targets, and every single one falls in the DELETE set — dashboards, front-pages, all demo
apps, plus a handful of KEEP-set routes like `apps-user-list`/`pages-account-settings-tab` mixed
in). Since the search feature's entire result set becomes either broken links or a near-empty
list, `server/api/app-bar/search/index.ts` and `server/fake-db/app-bar-search/{index,types}.ts` are
deleted outright, and `NavSearchBar.vue`'s search trigger + `LazyAppBarSearch` usage in the app bar
is removed (not left calling a 404'd endpoint) — same for `layouts/components/AppBarSearch.vue` if
that component has no other caller (verified during implementation, listed in `tasks.md`).

### i18n locale keys
`plugins/i18n/locales/{en,fr,ar}.json` (174 keys in `en.json`) hold UI-element/demo-page labels
("Kanban", "Cards", "Charts & Maps", "UI Elements", etc.). Exact orphaned-key list is computed
during implementation by diffing key usage (`grep` each key's literal string against the
post-deletion `pages/`/`views/`/`navigation/` tree) rather than hand-enumerated here, since several
keys are ambiguous strings ("List", "Add") that also appear in kept surface — a mechanical
post-deletion diff is the only reliable way to avoid deleting a key still in use. Recorded as an
explicit `tasks.md` step with its diff output captured as evidence.

## Future modules: the "in development" pattern

### Scope and reuse from `docs/architecture/sidebar-roadmap.md`
The six module families (Agents, Workflows, Tools, Model Providers, Context & Memory,
Observability) and their route slugs come directly from `docs/architecture/sidebar-roadmap.md`'s
table — this change does not re-derive them, it implements the nav/placeholder layer for exactly
that roadmap. Route slugs: `/agents`, `/workflows`, `/tools`, `/model-providers`, `/memory`,
`/observability`.

### Shared placeholder component, not six bespoke pages
All six route files (`pages/agents/index.vue`, `pages/workflows/index.vue`,
`pages/tools/index.vue`, `pages/model-providers/index.vue`, `pages/memory/index.vue`,
`pages/observability/index.vue`) are thin wrappers passing a title + description into one shared
`views/shared/ModuleComingSoon.vue`, rather than six near-duplicate templates — matches this
repo's `pages/` (thin route) + `views/` (actual UI) convention from `AGENTS.md`, and means the
"in development" visual treatment (icon, layout, copy style) is defined once. Each wrapper page
sets `definePageMeta({ action: 'read', subject: '<Module>' })` (no `public`, no `layout: 'blank'`
— inherits the default authenticated dashboard layout, appears inside the real app shell like any
real page).

`ModuleComingSoon.vue` props: `title: string`, `description: string`. Content per module (used
for both the nav entry label and the placeholder page):

| Route | subject | title | description |
|---|---|---|---|
| `/agents` | `Agent` | Agents | Catalog, configuration, and runtime status for the agents this platform will orchestrate. |
| `/workflows` | `Workflow` | Workflows | Composition of agents, tools, and policies into executable units of work. |
| `/tools` | `Tool` | Tools | Catalog of tools available to agents, with per-agent access scopes. |
| `/model-providers` | `ModelProvider` | Model Providers | Connected model providers and routing between them. |
| `/memory` | `Memory` | Context & Memory | What context persists across agent runs, and for how long. |
| `/observability` | `Observability` | Observability | Execution traces, logs, and quality evaluations for agent runs. |

No functional element beyond a static description: no form, no submit button, no fake data table
— satisfies `navigation-roadmap`'s "never fakes functionality" requirement.

### Navigation
New `navigation/vertical/modules.ts`:
```ts
export default [
  { heading: 'Roadmap' },
  { title: 'Agents', icon: { icon: 'tabler-robot' }, to: 'agents', action: 'read', subject: 'Agent' },
  { title: 'Workflows', icon: { icon: 'tabler-git-branch' }, to: 'workflows', action: 'read', subject: 'Workflow' },
  { title: 'Tools', icon: { icon: 'tabler-tool' }, to: 'tools', action: 'read', subject: 'Tool' },
  { title: 'Model Providers', icon: { icon: 'tabler-brain' }, to: 'model-providers', action: 'read', subject: 'ModelProvider' },
  { title: 'Context & Memory', icon: { icon: 'tabler-database' }, to: 'memory', action: 'read', subject: 'Memory' },
  { title: 'Observability', icon: { icon: 'tabler-activity' }, to: 'observability', action: 'read', subject: 'Observability' },
]
```
A distinct `{ heading: 'Roadmap' }` group (Vuexy's existing heading-item pattern, e.g. the
deleted `apps-and-pages.ts`'s `{ heading: 'Apps & Pages' }`) keeps these visually and
structurally separate from the three real, shipped modules (Dashboard/Users/Roles &
Permissions) — a user with the ability to see them should never mistake "in development" for
"real". `navigation/horizontal/modules.ts` mirrors the same six entries in horizontal-nav shape.
`navigation/vertical/index.ts`/`horizontal/index.ts` import and concatenate `modules` after
`dashboard`.

### CASL: admin-only for now
Per operator decision, only the demo `admin` seed in `server/auth/rumbor-adapter.ts` gets the six
new rules (`{ action: 'read', subject: 'Agent' }`, ...`'Workflow'`, ...`'Tool'`,
...`'ModelProvider'`, ...`'Memory'`, ...`'Observability'`) — added explicitly even though
`admin`'s existing `{ action: 'manage', subject: 'all' }` already implies them, so the ability
list documents per-module intent and gives a future non-wildcard operator/admin-like role a
concrete set of rules to copy. The demo `client` seed is untouched — gets none of the six, so
`canViewNavMenuGroup` hides the entire "Roadmap" nav group for `client`, and `canNavigate` 403s a
direct URL to any of the six routes for `client`. `plugins/casl/ability.ts`'s `Subjects` union
type gains the six new string literals.

### Why this is scoped as an explicit rule exception, not silently applied
`AGENTS.md`'s delivery contract prohibits placeholders/stubs. This is a deliberate,
narrowly-scoped exception requested and approved by the operator in this session, formalized as
its own spec (`openspec/specs/navigation-roadmap/spec.md`'s `ADDED Requirements`) rather than an
unstated one-off — so the rule ("visible, honestly labeled, CASL-gated, real route, no fake
functionality") is enforceable and auditable the same way any other requirement in this repo is,
and so it's clear this pattern is intentionally allowed only for this exact shape, not a general
license to add placeholders elsewhere.

## Risks / trade-offs

- **Deleting `server/fake-db/**`/`server/api/**` widens blast radius beyond "sidebar."** Necessary
  per the no-dead-code bar; flagged here so the PR review explicitly covers server-side changes,
  not just `pages/`/`navigation/`.
- **`client` role landing page becomes identical to `admin`'s.** Acceptable per the KEEP set having
  no second real dashboard; if role-differentiated landing pages matter later, that's a new,
  deliberate change once there's a second real destination to land on.
- **No rollback path via soft-hide.** Operator explicitly chose full delete over hide; reversing
  this later means restoring from git history, not toggling a flag — acceptable given this is
  template scaffold, not product data.
- **The "in development" pattern is a real, tracked exception to the no-stub rule.** Contained by
  `navigation-roadmap`'s explicit spec (only these six routes, this exact shape); flagged here so
  future contributors don't read it as a general license to ship placeholder pages elsewhere.

## Verification plan

- `pnpm dev`: load `/`, confirm role-based redirect for both `admin`/`client` demo accounts lands
  on `/dashboards/analytics`; confirm `admin`'s sidebar shows Dashboard, Users, Roles &
  Permissions, and a "Roadmap" group with all six future modules; confirm `client`'s sidebar shows
  only Dashboard/Users/Roles & Permissions with no "Roadmap" group; click through Users list ->
  user detail, Roles & Permissions, Account Settings tabs — confirm each renders with real data
  from its `useApi` call (network tab or server log, not just "no error"); click each of the six
  Roadmap entries as `admin` — confirm each renders its own title/description, no console error.
- As `client`, direct-navigate to each of the six module routes (e.g. `/agents`) — confirm
  redirect to `/not-authorized`, not a render.
- `pnpm build && node .output/server/index.mjs`: same click-through in production mode (per
  `AGENTS.md`'s verification-by-change-type table and the precedent set in
  `2026-08-25-migrate-better-auth`'s post-merge production-build fix).
- Direct URL to a deleted route (e.g. `/apps/kanban`) returns a 404 (not a broken/blank
  authenticated shell) — confirms deletion is real, not soft-hidden.
- `pnpm lint` exits `0` — catches any surviving import of a deleted file.
- `openspec validate simplify-sidebar-navigation --strict`.
