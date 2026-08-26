## 1. Approval Gate

- [x] 1.1 Present proposal.md, design.md, the `navigation-roadmap` spec delta, and this tasks.md
      to the operator and obtain explicit approval before any implementation task below starts
      (per `AGENTS.md` human-in-the-loop gate)
- [x] 1.2 Plan approved by operator in session, 2026-08-26 ("bueno, apruebo la propuesta")

## 2. Branch Setup

- [x] 2.1 Branch from tip of `main`: `docs/openspec-simplify-sidebar-navigation` for the plan PR
      (this OpenSpec change only, no application code)

## 3. Plan PR (PR #N)

- [x] 3.1 Commit only `openspec/changes/simplify-sidebar-navigation/` and open the plan PR titled
      `docs(openspec): propose simplify-sidebar-navigation`
- [x] 3.2 Wait for CODEOWNER merge to `main` before starting implementation (per the two-PR
      workflow in `CONTRIBUTING.md`) — merged as PR #7, 2026-08-26

## 4. Implementation Branch

- [x] 4.1 Branch from the now-updated `main`: `refactor/simplify-sidebar-navigation`

## 5. Delete pages and views

- [x] 5.1 `delete-manifest.txt` generated and committed in the plan PR (#7), covering all `.vue`
      files per `design.md`'s KEEP-set derivation
- [x] 5.2 Deleted every file in the manifest (`xargs -a delete-manifest.txt rm`) — 108 pages + 499
      views removed, KEEP set confirmed exact match to `design.md` (9 pages, 27 views)
- [x] 5.3 Deleted now-empty directories under `pages/**`/`views/**`. Found and removed 55
      additional orphaned non-`.vue` files the manifest didn't cover (it only tracked `*.vue`):
      `types.ts`/`types.d.ts` and `demoCode*.ts` support files for deleted components, plus two
      files sharing a directory with kept views (`views/apps/user/types.ts`,
      `views/dashboards/analytics/types.d.ts`) — confirmed via `grep` that no kept `.vue` file
      imports them (the kept views that do import types use `@db/apps/{users,invoice}/types`
      instead, a separate `server/fake-db` alias, unaffected)

## 6. Delete server API and fake-db

- [x] 6.1 Deleted `server/api/app-bar/search/index.ts`,
      `server/api/apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics}/**`,
      `server/api/pages/{datatable,faq,help-center,profile}/**` (note: `datatable`/`faq` were
      double-extension files `datatable.get.ts`/`faq.get.ts`, not directories — `rm -rf` on the
      directory name missed them; removed explicitly by exact filename)
- [x] 6.2 Deleted `server/fake-db/app-bar-search/**`,
      `server/fake-db/apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics}/**`,
      `server/fake-db/pages/{datatable,faq,help-center,profile}/**`
- [x] 6.3 Confirmed remaining: `server/api/apps/{permissions,users}/**` (4 files),
      `server/api/dashboard/analytics/projects.get.ts`, `server/api/me.get.ts`,
      `server/fake-db/apps/{permissions,users}/**`, `server/fake-db/dashboard/**` — exact match
      to `design.md`'s KEEP set

## 7. Rewrite navigation (kept modules)

- [x] 7.1 Deleted `navigation/vertical/{apps-and-pages,charts,forms,ui-elements,others}.ts` and
      `navigation/horizontal/{apps,charts,forms,ui-elements,pages,tables,misc}.ts` (horizontal
      nav uses different filenames than vertical for the same content — confirmed by reading
      `navigation/horizontal/index.ts` before deleting)
- [x] 7.2 Rewrote both `navigation/vertical/dashboard.ts` and `navigation/horizontal/
      dashboard.ts` to a single-entry Dashboard link (dropped the 5-variant `children` group,
      `badgeContent`, and the "Front Pages" group)
- [x] 7.3 Added Users and Roles & Permissions entries to both trimmed `dashboard.ts` files
      (`apps-user-list`/`apps-roles`/`apps-permissions`, matching the entries from the deleted
      `apps-and-pages.ts`)

## 8. Add future-module "in development" routes

- [x] 8.1 Created `views/shared/ModuleComingSoon.vue` (props: `title`, `description`; no form,
      no fake data, no CTA — a static card with an "In development" chip)
- [x] 8.2 Created the six thin route wrappers (`pages/{agents,workflows,tools,model-providers,
      memory,observability}/index.vue`), each `definePageMeta({ action: 'read', subject:
      '<Module>' })`, each rendering `ModuleComingSoon` with its title/description
- [x] 8.3 Added the six new subject string literals to `plugins/casl/ability.ts`'s `Subjects`
      union type. Also fixed a pre-existing gap found while editing: `'Auth'` was already used at
      runtime (`server/auth/rumbor-adapter.ts`'s `client` seed) but missing from the `Subjects`
      union (silently unchecked because `abilityRules` is JSON-stringified, bypassing
      type-checking) — added `'Auth'`, removed the never-referenced `'Post'`/`'Comment'`/
      `'AclDemo'` literals (the demo comment in the file already said `'Post'`/`'Comment'` were
      unused; `'AclDemo'` became unused once `pages/access-control.vue` was deleted in section 5)
- [x] 8.4 Created `navigation/vertical/modules.ts` (six entries + `{ heading: 'Roadmap' }`) and
      `navigation/horizontal/modules.ts` (six entries nested under one `{ title: 'Roadmap' }`
      group, matching horizontal nav's existing children-group convention)
- [x] 8.5 Rewrote `navigation/vertical/index.ts` and `navigation/horizontal/index.ts` to export
      `dashboard` + `modules` only

## 9. Fix dangling references

- [x] 9.1 `app/router.options.ts`: both `admin` and `client` now redirect `/` to
      `{ name: 'dashboards-analytics' }` (found `admin`'s target, `dashboards-crm`, was *also*
      dangling — the original plan only flagged `client`'s `access-control` target). Removed the
      `dashboards-logistics`/`dashboards-academy`/`apps-ecommerce-dashboard` hand-registered
      routes and the now-unused `emailRouteComponent`/email-filter/email-label route entries
      (their target `pages/apps/email/index.vue` was deleted in section 5). Also removed the
      `/pages/user-profile` redirect entry — its target page (`pages/pages/user-profile/[tab]
      .vue`) was deleted in section 5 and nothing links to it anymore.
- [x] 9.2 Removed `{ action: 'read', subject: 'AclDemo' }` from the `client` seed (kept
      `{ action: 'read', subject: 'Auth' }`); added the six new module `read` rules to the
      `admin` seed. Also fixed a pre-existing gap: `'Auth'` was used at runtime but missing from
      `plugins/casl/ability.ts`'s `Subjects` type (see 8.3).
- [x] 9.3 Removed the `apps-calendar` and `apps-invoice-list` entries from
      `NavbarShortcuts.vue`'s `shortcuts` array.
- [x] 9.4 Deleted `layouts/components/NavSearchBar.vue` outright (not just its search trigger) —
      every one of its ~90 hardcoded suggestion entries and its backing `/app-bar/search`
      endpoint were demo-only, so an emptied-but-present component would have been dead weight
      with no real function. Removed its two usages (`DefaultLayoutWithHorizontalNav.vue`,
      `DefaultLayoutWithVerticalNav.vue`). Confirmed `@core/components/AppBarSearch.vue` has no
      other caller — left in place as an unused-but-generic, props-driven `@core` component (no
      demo data of its own), reusable if a real search feature is built later.
- [x] 9.5 Repo-wide grep for every deleted route name found and fixed 3 dangling references not
      anticipated in the original plan, all inside files kept by the transitive-import trace in
      section 5 but never checked for their own dead `useApi`/route dependencies:
      - `views/apps/user/view/UserInvoiceTable.vue` and `views/pages/account-settings/
        BillingHistoryTable.vue` both called the deleted `/apps/invoice` endpoint and linked to
        deleted `apps-invoice-*` routes — deleted both components and their usage in
        `UserTabAccount.vue`/`AccountSettingsBillingAndPlans.vue` (each was one supplementary
        section of a larger page, not the page's sole content)
      - `pages/login.vue`'s "Create an account" link to the deleted `register` route — removed
        the link and its surrounding `<VCol>`
      Final grep (all deleted-route patterns, whole repo) returned zero matches.


## 10. Clean up i18n

- [x] 10.1 Corrected the plan's grep method mid-implementation: a raw literal-string grep against
      the whole `pages/`/`views/`/`navigation/`/`layouts/` tree gives false positives (e.g.
      `'Pages'` matched a `<!-- 👉 Pages -->` code comment, not an actual `$t('Pages')` call) —
      confirmed via `getDynamicI18nProps(item.title, ...)` in `@layouts/components/
      {Vertical,Horizontal}Nav{Link,Group}.vue` and `$t(shortcut.title/subtitle)` in
      `@core/components/Shortcuts.vue` that the *only* real consumers of these locale keys are
      nav `title`/`heading` fields and `NavbarShortcuts.vue`'s shortcut `title`/`subtitle` — so
      the correct usage check is: does the key appear as a `title:`/`heading:`/`subtitle:` value
      in the surviving `navigation/**/*.ts` files or `NavbarShortcuts.vue`, not "does this string
      appear anywhere in the tree." Re-derived the used-key set with that precise check: 19 keys.
- [x] 10.2 Removed the 155 zero-match keys from `en.json`/`fr.json`/`ar.json` (174/176/175 before
      -> 19 after each), keeping all three files' key sets identical; preserved existing
      translations for the 12 keys that survive from before this change.
- [x] 10.3 Added 7 new locale entries (`en`/`fr`/`ar`) for "Roadmap" and the six module titles
      (Agents, Workflows, Tools, Model Providers, Context & Memory, Observability), translated in
      `fr`/`ar`, matching the existing key style.
- [x] 10.4 Before/after: `en.json` 174 -> 19 kept + 7 new = 19 (12 kept + 7 new, both counted in
      final 19); same for `fr.json` (176 -> 19) and `ar.json` (175 -> 19).


## 11. Verify

- [x] 11.1 Real-browser check found and fixed a bug not anticipated in `design.md`: `dashboards-
       analytics`, `apps-user-list`, `apps-roles`, `apps-permissions` never had `definePageMeta`
       ACL gates in the original template (they relied only on the generic auth middleware) —
       harmless before this change because `client` never landed on them (redirected to
       `access-control` instead). Once both roles redirect to `dashboards-analytics` (per this
       change's design), `client` hit `canNavigate`'s ungated fallback (`ability.can(undefined,
       undefined)`, which only `admin`'s `manage all` wildcard satisfies) and was bounced to
       `/not-authorized`; worse, `canViewNavMenuGroup` hid Dashboard/Users/Roles & Permissions
       from `client`'s sidebar entirely (nothing there had explicit gates either). Fixed by:
       adding `definePageMeta({ action: 'read', subject: '<Dashboard|User|Role>' })` to
       `dashboards/analytics.vue`, `apps/user/list/index.vue`, `apps/user/view/[id].vue`,
       `apps/roles/index.vue`, `apps/permissions/index.vue`; adding `Dashboard`/`User`/`Role`
       subjects to `plugins/casl/ability.ts` and both demo seeds (`client` gets `Dashboard`,
       `User`, `Role` — not the six Roadmap modules); adding matching `action`/`subject` to the
       three kept nav entries in `navigation/{vertical,horizontal}/dashboard.ts` (individually on
       the `Roles`/`Permissions` children, not just the parent group — `canViewNavMenuGroup`
       requires each visible child to independently pass its own gate, a parent-only gate isn't
       enough). A second bug found and fixed along the way: an earlier locale-cleanup pass
       (section 10) had deleted the `"$vuetify"` key (Vuetify's internal i18n block for
       data-table/pagination/badge aria-labels) because it isn't a nav `title` — restored it from
       `git show HEAD:plugins/i18n/locales/{en,fr,ar}.json` in all three locale files.
       Confirmed via real browser (Chromium, `browser` tool): `admin` sees Dashboard, Users,
       Roles & Permissions, and all six Roadmap entries; `client` sees only Dashboard, Users,
       Roles & Permissions (no Roadmap); both land on `/dashboards/analytics` after login.
- [x] 11.2 `admin` click-through confirmed: Dashboard renders real data ($28,450 Average Daily
       Sales, Website Analytics, Sales Overview, Earning Reports, Support Tracker — all from
       `/dashboard/analytics/projects`), Users list renders (21,459 Total Users stat card from
       `/apps/users`), Roles & Permissions renders ("Roles List" heading with real role cards),
       Account Settings redirects to its `account` tab and renders. Each of the six Roadmap
       entries (Agents screenshotted) renders its title/description/"In development" chip with
       no console error.
- [x] 11.3 `client` direct-navigated to `/agents` — confirmed redirect to `/not-authorized`.
- [x] 11.4 `client` and `admin` direct-navigated to `/apps/kanban` — confirmed a real 404 page
       ("Page Not Found", server-thrown `createError`), not a stale shell.
- [x] 11.5 `pnpm build && node .output/server/index.mjs`: succeeded after fixing an unrelated
       pre-existing environment issue found first — `pnpm build` failed with `Cannot find module
       '@nuxt/kit'` (missing from `node_modules/@nuxt/kit`, present only inside the pnpm store);
       confirmed via `git stash` that this reproduces identically on this branch's unmodified
       parent commit, i.e. not caused by this change. Fixed with a clean `rm -rf node_modules
       .nuxt && pnpm install` (same remediation this repo's `migrate-better-auth` change
       documented for the same class of issue). Repeated 11.1-11.4 against the production build
       (`node .output/server/index.mjs`): `admin` sign-in -> `/dashboards/analytics` redirect,
       full sidebar with all six Roadmap entries, zero `pageerror`; `client` sign-in -> same
       Dashboard/Users/Roles & Permissions sidebar, no Roadmap group; `client` direct-navigate to
       `/agents` -> `/not-authorized`; `/apps/kanban` -> real 404 for both roles. All identical
       to the dev-mode results in 11.1-11.4.
- [x] 11.6 `pnpm lint` exits `0` (run earlier in section 9/10 work, before the ACL-gate fixes in
       this section — re-run as part of 11.5's build pass to cover the final state)
- [x] 11.7 Real-browser check (per this repo's established practice after the
       `migrate-better-auth` `nuxt/nuxt#35982` regression): confirmed via the `browser` tool
       across both demo accounts, hard reloads, and direct-URL navigation, in both dev and
       production mode — no console `pageerror` at any point once the ACL-gate fix (11.1) landed.
       (Before that fix, the only errors observed were two transient Vite HMR "Failed to fetch
       dynamically imported module" incidents caused by editing files while the dev server was
       live — resolved by a page reload, not an application bug; noted here so the evidence trail
       isn't mistaken for an unresolved issue.)

- [x] 11.8 Ran the `reviewer` agent over the full staged diff. Verdict: `incorrect` (needs
       changes), 0.99 confidence — found 4 real dangling-reference bugs not caught by my own
       manual grep passes in section 9, all now fixed:
       - `layouts/components/UserProfile.vue`'s user menu had "Pricing"/"FAQ" entries targeting
         the deleted `pages-pricing`/`pages-faq` routes — removed both entries (kept "Profile"/
         "Settings"/"Billing Plan", which target real kept routes).
       - `components/AppPricing.vue` (rendered from the kept Account Settings > Billing tab via
         `PricingPlanDialog`) had its "Upgrade" button targeting the deleted `front-pages-payment`
         route — removed the `:to` binding rather than pointing it at a fake destination (no real
         payment page exists to link to).
       - Six components lost their only caller when this change's page deletions removed
         `pages/pages/dialog-examples/index.vue`, `pages/pages/faq.vue`, and
         `pages/front-pages/help-center/index.vue`, and were left as dead files:
         `components/AppSearchHeader.vue`, `components/dialogs/{CreateAppDialog,
         ShareProjectDialog,ReferAndEarnDialog,PaymentProvidersDialog,AddPaymentMethodDialog}.vue`
         — deleted all six (confirmed zero remaining callers for each before deleting).
       Re-ran `pnpm lint` (exit `0`) and a repo-wide grep for all six flagged identifiers (zero
       matches) after the fixes.


## 12. Archive and ship

- [x] 12.1 Pushed implementation PR #8 (https://github.com/rafael-quintero-ls/nimrod/pull/8),
       referencing this OpenSpec change; `CLEAN`/`MERGEABLE` — awaiting CODEOWNER approval
- [x] 12.2 `openspec validate simplify-sidebar-navigation --strict` (passed) and
       `openspec archive simplify-sidebar-navigation --yes` run before pushing (not strictly
       "before merging" as originally phrased — done this way so the implementation PR carries
       the completed archive from the start, matching `migrate-better-auth`'s precedent); archive
       committed as this same implementation branch's final commit before push
- [ ] 12.3 Operator merges both PRs (plan + implementation) — not the agent
