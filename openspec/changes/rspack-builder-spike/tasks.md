## 1. Approval gate

- [x] 1.1 Plan approved by operator in session, 2026-08-28

## 2. Baseline measurement

- [ ] 2.1 Record current Vite-based cold `pnpm dev` time-to-first-response on `/login` (clean
      cache: `rm -rf node_modules/.cache node_modules/.vite .nuxt/dev`), for direct comparison.

## 3. Remove confirmed-dead dependency (unconditional, not gated on spike outcome)

- [ ] 3.1 Remove `vite-plugin-vue-meta-layouts` from `package.json` — confirmed not registered in
      `nuxt.config.ts`'s `vite.plugins` array.
- [ ] 3.2 Remove the `virtual:meta-layouts` entry from `.eslintrc.cjs`'s import-resolver ignore
      list if it becomes unresolvable/unnecessary after removal (verify first — it may still
      resolve to something else or simply be an inert pattern).
- [ ] 3.3 `pnpm install`, confirm no broken imports (`vue-tsc --noEmit`, `eslint` both pass).

## 4. Rspack builder switch (spike branch only)

- [ ] 4.1 Add `@nuxt/rspack-builder` (version matching this repo's `nuxt` version) as a
      devDependency.
- [ ] 4.2 Set `builder: 'rspack'` in `nuxt.config.ts`.
- [ ] 4.3 Remove `nuxt.config.ts`'s `vite.plugins` array and any other Vite-specific config block
      that doesn't apply under Rspack (confirm exactly what Nuxt's rspack builder ignores vs.
      errors on, rather than assuming).

## 5. Vuetify styles + auto-import replacement

- [ ] 5.1 Add `@vuetify/unplugin-styles` and register `@vuetify/unplugin-styles/nuxt` as a Nuxt
      module (`modules: ['@vuetify/unplugin-styles/nuxt']`), with `vuetifyStyles.settings`
      pointed at this repo's existing `assets/styles/variables/_vuetify.scss` (the same file
      `vite-plugin-vuetify`'s `styles.configFile` currently uses).
- [ ] 5.2 Add `unplugin-vue-components`, register its `/rspack` export with the built-in
      `Vuetify3Resolver` via a Nuxt module hook using `@nuxt/kit`'s `addRspackPlugin` (the
      package's own `/nuxt` wrapper has no Rspack branch — confirmed in design.md's Context —
      so this must be hand-wired).
- [ ] 5.3 Confirm every existing Vuetify component usage across the app (`<VBtn>`, `<VCard>`,
      etc. — no explicit imports anywhere today) still resolves and renders without a manual
      import added anywhere.
- [ ] 5.4 Remove `vite-plugin-vuetify` from `package.json` and the manual `vuetify(...)` plugin
      registration it required.

## 6. SVG-as-icon-component replacement

- [ ] 6.1 Add `unplugin-icons`, register its `/rspack` export with `compiler: 'vue3'`.
- [ ] 6.2 Configure `FileSystemIconLoader` custom collections pointing at this repo's existing
      `@images/svg` and `@images/customizer-icons` directories (or equivalent — confirm the
      real directory names/aliases at implementation time).
- [ ] 6.3 Update every call site currently importing a `.svg` file as a Vue component (confirmed
      via grep: `@core/components/TheCustomizer.vue`, `components/dialogs/
      AddEditAddressDialog.vue`, `plugins/vuetify/icons.ts`, plus any others found during
      implementation) to the `~icons/<collection>/<name>` import convention.
- [ ] 6.4 Manually verify each changed icon renders identically (visual/DOM comparison, not just
      "no error thrown") — a missed import is a visible regression per design.md's Risks.
- [ ] 6.5 Remove `vite-svg-loader` from `package.json`.

## 7. Verification

- [ ] 7.1 Cold `pnpm dev` (clean cache, same methodology as task 2.1) — record
      time-to-first-response on `/login`, compare against the Vite baseline.
- [ ] 7.2 Manually verify, via `curl`/browser (not just "the server started"): login page
      renders and authenticates (`admin@demo.com`/`admin`), dashboard renders with Vuetify
      components styled correctly, agents catalog list/detail renders, locale switching (`en`/
      `fr`/`ar`) still works, theme/color-scheme switching still works.
- [ ] 7.3 Explicitly test for `vuetifyjs/nuxt-module#381`'s symptom: reload a page containing a
      `VBtn size="small"` (or equivalent small-sized component) 8-10 times with cold/no cache,
      checking computed style consistency each time. Record whether the symptom reproduces.
- [ ] 7.4 Run `pnpm build` under the Rspack builder — record whether it completes, and any error
      output, even though production-build parity is a Non-Goal for this spike's own completion.
- [ ] 7.5 Full project `vue-tsc --noEmit` and `eslint` — both must still pass with zero errors.

## 8. Finding and disposition

- [ ] 8.1 Record the finding — adopt / adopt-with-follow-up / no-adopt — with the concrete numbers
      and observations from tasks 7.1-7.4, in this change's PR description (even though the PR
      itself may only land the task-3 cleanup, per 8.2 below).
- [ ] 8.2 If **no-adopt**: discard the Rspack-switch portion of the spike branch (tasks 4-6);
      keep and land only the unconditional `vite-plugin-vue-meta-layouts` removal (task 3) as a
      small, separate, real PR. This is an acceptable, complete outcome — no further code change
      required.
- [ ] 8.3 If **adopt** or **adopt-with-follow-up**: do not merge this spike branch directly — open
      a new, separately-scoped OpenSpec change proposing the real migration, referencing this
      spike's findings as its evidence base, subject to its own approval gate before any
      implementation PR.

## 9. PR

- [ ] 9.1 Commit only `openspec/changes/rspack-builder-spike/` planning artifacts on
      `docs/openspec-rspack-builder-spike`, per AGENTS.md Phase A.
- [ ] 9.2 Open PR #1 (plan-only), title `docs(openspec): propose rspack-builder-spike`, no
      application code. Wait for CODEOWNER approval and merge before starting Phase B.

## 10. Implementation (Phase B — only after PR #1 above is merged)

- [ ] 10.1 Branch `spike/rspack-builder` from the tip of `main`.
- [ ] 10.2 Implement tasks 2-8.
- [ ] 10.3 Run an internal review pass over the diff (reviewer agent) before opening any PR.
- [ ] 10.4 Open a PR containing **only** task 3's unconditional cleanup if the finding is
      no-adopt (per task 8.2), or state the adopt finding and point to a fresh follow-up change
      if adopt/adopt-with-follow-up (per task 8.3) — never merge the Rspack-switch portion itself
      through this PR.
- [ ] 10.5 Wait for CODEOWNER approval.
- [ ] 10.6 Before merging: `openspec validate rspack-builder-spike --strict`, then
      `openspec archive rspack-builder-spike --yes`, committed as the PR's final commit (before
      merge, not after).
- [ ] 10.7 Merge (human review, not the agent).
