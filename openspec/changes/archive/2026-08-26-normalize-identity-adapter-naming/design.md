# Design: Normalize identity adapter naming

## Context

`server/auth/rumbor-adapter.ts` is the `better-auth` custom database adapter added in
`2026-08-25-migrate-better-auth`. Its job is to translate better-auth's user/session/account
model to and from an external identity backend (a demo-mode in-memory fixture today; a real
backend once `NUXT_IDENTITY_BACKEND_URL` is set). The file's own header comment already states
the intended contract: *"This file is the ONLY place in this repo allowed to know [the backend]'s
concrete request/response shape — nothing outside it may reference that contract directly."*

That contract holds for every *consumer* of the file (confirmed via repo-wide grep: only
`server/auth.config.ts` imports it), but the file's own identifiers — filename, exported symbol,
type name, internal helper, two strings passed to `better-auth`, and a demo-ID prefix — all name
the commercial product ("rumbor"/"Rumbor Core") this repo's adapters are supposed to keep
invisible. This change makes the file's own naming consistent with the contract it already
enforces on everyone else.

## Method: confirming the full rename surface

1. `grep -n "rumbor\|Rumbor" server/auth/rumbor-adapter.ts` — found every occurrence inside the
   file (11 total, across doc comments, the type, the exported function, the internal proxy
   helper, two `better-auth` config strings, and the demo-ID template literal).
2. `grep -rln "rumbor-adapter\|rumborAdapter\|RumborAdapterConfig"` across the whole repo
   (excluding `node_modules`) — found exactly 3 files: the adapter itself,
   `server/auth.config.ts` (imports and calls it), `nuxt.config.ts` (one comment naming the old
   filename). No LSP was available in this environment to cross-check via "find references"; the
   grep is exhaustive for these exact identifier strings, and a rename that changes every string
   occurrence cannot silently miss a caller using the same names.
3. Confirmed `NUXT_IDENTITY_BACKEND_URL` / `identityBackendUrl` (the runtime config key threading
   the identity backend's URL into the adapter) was already generic — added correctly in
   `migrate-better-auth`, unaffected by this change.

## Rename table

| Kind | Before | After |
|---|---|---|
| File | `server/auth/rumbor-adapter.ts` | `server/auth/identity-backend-adapter.ts` |
| Exported function | `rumborAdapter` | `identityBackendAdapter` |
| Type | `RumborAdapterConfig` | `IdentityBackendAdapterConfig` |
| Internal helper | `proxyToRumborCore` | `proxyToIdentityBackend` |
| `better-auth` config string | `adapterId: 'rumbor-core'` | `adapterId: 'identity-backend'` |
| `better-auth` config string | `adapterName: 'Rumbor Core Identity Adapter'` | `adapterName: 'Identity Backend Adapter'` |
| Demo-mode ID prefix | `` `rumbor_${Date.now()}_${nextId++}` `` | `` `local_${Date.now()}_${nextId++}` `` |
| Doc comments | "rumbor-core's identity contract", "rumbor-core is still scaffold-only", "rumbor-core's concrete request/response shape", "proxies every call to rumbor-core's identity endpoint" | generic: "the identity backend's...", same structure, product name removed |

## Decisions

### `adapterId`/`adapterName` are a real (minor) information-disclosure fix, not just cosmetic
`better-auth`'s `createAdapterFactory` accepts `debugLogs` (currently `false`) and surfaces
`adapterId`/`adapterName` in its own error/debug output when enabled. If `debugLogs` were ever
flipped on in a non-demo environment (misconfiguration, not intended, but not impossible), these
two strings would be the first thing leaked in server logs — naming the concrete backend product
to anyone with log access. Renaming them closes that leak proactively, consistent with
`AGENTS.md`'s "identity backend is not exposed" rule, rather than waiting for it to matter.

### Demo-mode ID prefix: `local_`, not `demo_`
The existing code already has a concept boundary between "demo mode" (`identityBackendUrl` unset)
and "real backend" (`identityBackendUrl` set) — but the ID-generation helper (`generateId`) is
shared code that could, in principle, be reused if a future no-backend/embedded mode needs local
IDs for reasons other than the current demo fixture. `local_` describes what the ID actually is
(non-backend-issued, locally generated) rather than conflating it with "demo" specifically. Low
-stakes choice; either prefix is fine, but `local_` is slightly more precise and avoids implying
the ID scheme is tied to the demo-account seed data (`ensureDemoUsersSeeded`) rather than to the
adapter's local-generation branch in general.

### No change to `NUXT_IDENTITY_BACKEND_URL` or any behavior
This is a pure identifier rename. The demo-mode fixture's data (seeded `admin@demo.com`/
`client@demo.com` users, their `abilityRules`), the `matchesWhere`/`WHERE_OPERATORS` query logic,
the real-backend proxy's request shape (`POST ${identityBackendUrl}/adapter/${model}/${operation}`),
and every other line of logic are untouched — confirmed by diffing only identifier names, never
logic, during implementation.

## Risks / trade-offs

- **None identified.** This is the lowest-risk kind of change this repo's rules allow through the
  full OpenSpec gate anyway (per `AGENTS.md`: "Auth/ACL changes are high-blast-radius [...] always
  go through the full OpenSpec + approval-gate flow, never a quick edit" — the file lives under
  `server/auth/`, so the gate applies regardless of how small the actual diff is).
- The only way this could regress something is a typo in one of the renamed identifiers breaking
  the `server/auth.config.ts` import — caught immediately by `pnpm dev` failing to start, and by
  TypeScript's own module resolution.

## Verification plan

- `pnpm dev`: full login flow for both `admin@demo.com`/`admin` and `client@demo.com`/`client`
  demo accounts — confirms the renamed demo-mode fixture branch (`ensureDemoUsersSeeded`,
  `matchesWhere`, etc.) still seeds and authenticates correctly.
- `grep -rn "rumbor" --include='*.ts' --include='*.vue' .` (excluding `node_modules`,
  `openspec/changes/archive/**`, and `docs/architecture/**`'s already-trimmed historical mentions)
  returns zero matches in active source code after the rename.
- `pnpm build && node .output/server/index.mjs`: repeat the login flow in production mode.
- `pnpm lint` exits `0`.
