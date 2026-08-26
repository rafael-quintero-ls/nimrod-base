## 1. Approval Gate

- [x] 1.1 Present proposal.md, design.md, the `navigation-roadmap` spec delta, and this tasks.md
      to the operator and obtain explicit approval before any implementation task below starts
      (per `AGENTS.md` human-in-the-loop gate)
- [x] 1.2 Plan approved by operator in session, 2026-08-26 ("bueno, apruebo la propuesta")

## 2. Branch Setup

- [ ] 2.1 Branch from tip of `main`: `docs/openspec-simplify-sidebar-navigation` for the plan PR
      (this OpenSpec change only, no application code)

## 3. Plan PR (PR #N)

- [ ] 3.1 Commit only `openspec/changes/simplify-sidebar-navigation/` and open the plan PR titled
      `docs(openspec): propose simplify-sidebar-navigation`
- [ ] 3.2 Wait for CODEOWNER merge to `main` before starting implementation (per the two-PR
      workflow in `CONTRIBUTING.md`)

## 4. Implementation Branch

- [ ] 4.1 Branch from the now-updated `main`: `refactor/simplify-sidebar-navigation`

## 5. Delete pages and views

- [ ] 5.1 Generate `delete-manifest.txt` (108 `pages/**` + 499 `views/**` paths per `design.md`'s
      KEEP-set derivation) and commit it inside the change folder before deleting, so the deletion
      is reproducible from a fixed list rather than an ad hoc pass
- [ ] 5.2 Delete every file in the manifest (`xargs rm` over the committed list)
- [ ] 5.3 Delete now-empty directories left under `pages/**`/`views/**`

## 6. Delete server API and fake-db

- [ ] 6.1 Delete `server/api/app-bar/search/index.ts`,
      `server/api/apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics}/**`,
      `server/api/pages/{datatable,faq,help-center,profile}/**`
- [ ] 6.2 Delete `server/fake-db/app-bar-search/**`,
      `server/fake-db/apps/{academy,calendar,chat,ecommerce,email,invoice,kanban,logistics}/**`,
      `server/fake-db/pages/{datatable,faq,help-center,profile}/**`
- [ ] 6.3 Confirm `server/api/apps/{permissions,users}/**`, `server/api/dashboard/analytics/
      projects.get.ts`, `server/api/me.get.ts`, `server/fake-db/apps/{permissions,users}/**`,
      `server/fake-db/dashboard/**` remain untouched

## 7. Rewrite navigation (kept modules)

- [ ] 7.1 Delete `navigation/vertical/{apps-and-pages,charts,forms,ui-elements,others}.ts` and
      their `navigation/horizontal/*` counterparts
- [ ] 7.2 Rewrite `navigation/vertical/dashboard.ts` to the single-entry Dashboard link (drop the
      5-variant `children` group, `badgeContent`, and the "Front Pages" group) per `design.md`
- [ ] 7.3 Add Users and Roles & Permissions entries to the trimmed nav (pointing at
      `apps-user-list`/`apps-roles`/`apps-permissions`, matching current `apps-and-pages.ts`
      entries before deletion)

## 8. Add future-module "in development" routes

- [ ] 8.1 Create `views/shared/ModuleComingSoon.vue` (props: `title`, `description`; renders
      inside the default authenticated dashboard layout; no form, no fake data, no CTA — per
      `design.md`'s "Future modules" section and `navigation-roadmap`'s spec)
- [ ] 8.2 Create the six thin route wrappers: `pages/agents/index.vue`, `pages/workflows/
      index.vue`, `pages/tools/index.vue`, `pages/model-providers/index.vue`, `pages/memory/
      index.vue`, `pages/observability/index.vue` — each `definePageMeta({ action: 'read',
      subject: '<Module>' })` per `design.md`'s table, each rendering `ModuleComingSoon` with its
      title/description
- [ ] 8.3 Add the six new subject string literals (`Agent`, `Workflow`, `Tool`, `ModelProvider`,
      `Memory`, `Observability`) to `plugins/casl/ability.ts`'s `Subjects` union type
- [ ] 8.4 Create `navigation/vertical/modules.ts` (six entries + `{ heading: 'Roadmap' }`, per
      `design.md`) and its `navigation/horizontal/modules.ts` mirror
- [ ] 8.5 Rewrite `navigation/vertical/index.ts` and `navigation/horizontal/index.ts` to export
      `dashboard` + `modules`, with no import of the files deleted in task 7.1

## 9. Fix dangling references

- [ ] 9.1 `app/router.options.ts`: change the `client` role's `/` redirect target from
      `{ name: 'access-control' }` to `{ name: 'dashboards-analytics' }`; remove the
      `dashboards-logistics`/`dashboards-academy`/`apps-ecommerce-dashboard` hand-registered routes
      (they point at deleted page components)
- [ ] 9.2 `server/auth/rumbor-adapter.ts`: remove the `{ action: 'read', subject: 'AclDemo' }` rule
      from the demo `client` user's seeded `abilityRules`, keep `{ action: 'read', subject: 'Auth' }`;
      add the six new `{ action: 'read', subject: '<Module>' }` rules to the demo `admin` seed only
      (per `design.md`'s "Future modules" > "CASL: admin-only for now")
- [ ] 9.3 `layouts/components/NavbarShortcuts.vue`: remove the `apps-calendar` and
      `apps-invoice-list` shortcut entries
- [ ] 9.4 `layouts/components/NavSearchBar.vue`: remove the search trigger + `LazyAppBarSearch`
      usage (its backing endpoint is deleted in task 6.1); confirm `@core/components/
      AppBarSearch.vue` has no other caller before deciding whether to delete it too or leave it
      as an unused-but-shared `@core` component (document the call either way)
- [ ] 9.5 Repo-wide `grep` for every deleted route name (`apps-ecommerce*`, `apps-academy*`,
      `apps-logistics*`, `apps-chat`, `apps-email*`, `apps-calendar`, `apps-kanban*`,
      `apps-invoice*`, `dashboards-crm`, `dashboards-ecommerce`, `dashboards-academy`,
      `dashboards-logistics`, `front-pages-*`, `wizard-examples-*`, `access-control`, `register`,
      `pages-authentication-*`) across the whole repo (not just `pages`/`views`/`navigation`) to
      catch any reference missed above; fix or confirm each hit

## 10. Clean up i18n

- [ ] 10.1 For each key in `plugins/i18n/locales/en.json`, grep its literal string against the
       post-deletion `pages/`/`views/`/`navigation/`/`layouts/` tree; list keys with zero matches
- [ ] 10.2 Remove the zero-match keys from `en.json`, `fr.json`, `ar.json` (same key set, keep the
       three files' key sets identical)
- [ ] 10.3 Add six new locale entries (`en`/`fr`/`ar`) for the "Roadmap" heading and the six
       module titles from `design.md`'s table (Agents, Workflows, Tools, Model Providers,
       Context & Memory, Observability), matching the existing key style
- [ ] 10.4 Capture the before/after key count as verification evidence

## 11. Verify

- [ ] 11.1 `pnpm dev`: root `/` redirects `admin` and `client` demo accounts both to
       `/dashboards/analytics`; `admin`'s sidebar shows Dashboard, Users, Roles & Permissions,
       and a "Roadmap" group with all six modules; `client`'s sidebar shows only Dashboard, Users,
       Roles & Permissions (no "Roadmap" group)
- [ ] 11.2 Click through as `admin`: Dashboard renders with real data from
       `/dashboard/analytics/projects`, Users list -> user detail view renders from
       `/apps/users`, Roles & Permissions renders, Account Settings (all tabs) renders, each of
       the six Roadmap entries renders its title/description with no console error
- [ ] 11.3 As `client`, direct-navigate to each of the six module routes (e.g. `/agents`) and
       confirm redirect to `/not-authorized`
- [ ] 11.4 Direct-navigate to a deleted route (e.g. `/apps/kanban`, `/dashboards/crm`,
       `/access-control`) and confirm a 404 (not a stale authenticated shell or crash)
- [ ] 11.5 `pnpm build && node .output/server/index.mjs`: repeat 11.1-11.4 against the production
       build
- [ ] 11.6 `pnpm lint` exits `0`
- [ ] 11.7 Real-browser check (per this repo's established practice after the
       `migrate-better-auth` `nuxt/nuxt#35982` regression): open the app in a Chromium tab via the
       `browser` tool, confirm no console `pageerror` through login -> dashboard -> hard refresh
       -> a Roadmap module page
- [ ] 11.8 Run the `reviewer` agent (or relevant review skill) over the full diff before pushing
       the implementation PR, per `CONTRIBUTING.md`'s workflow step 2

## 12. Archive and ship

- [ ] 12.1 Push implementation PR referencing this OpenSpec change; wait for CODEOWNER approval
- [ ] 12.2 Before merging: `openspec validate simplify-sidebar-navigation --strict`, then
       `openspec archive simplify-sidebar-navigation --yes`, commit the archive as the PR's final
       commit
- [ ] 12.3 Operator merges both PRs (plan + implementation) — not the agent
