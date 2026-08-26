## Why

`server/auth/rumbor-adapter.ts` names a specific commercial product ("rumbor"/"Rumbor Core") in
its filename, exported function (`rumborAdapter`), type (`RumborAdapterConfig`), the
`adapterId`/`adapterName` strings better-auth surfaces (potentially in logs/telemetry), an
internal helper (`proxyToRumborCore`), and even the prefix of every locally-generated demo-mode
ID (`` `rumbor_${...}` ``). This directly contradicts a rule this same file's own header comment
states: *"This file is the ONLY place in this repo allowed to know [the identity backend]'s
concrete request/response shape"* — the file is meant to be the single point of adapter-specific
knowledge, invisible from the rest of the app, but its own name and internals are the adapter's
biggest leak of that knowledge. It also contradicts `AGENTS.md`'s standing rule: *"La interfaz
pública nunca revela qué adapter concreto resuelve una capability [...] el adapter es un detalle
de implementación interno, sustituible sin romper el contrato."*

This was flagged in a prior session's review of every "rumbor" reference in this repo (see
`docs/architecture/ecosystem-architecture.md`'s trimmed note and the operator's explicit
instruction to normalize this file). The rest of the identity-backend surface was already
generic when it was built (`NUXT_IDENTITY_BACKEND_URL`, `identityBackendUrl` in `nuxt.config.ts`
and `server/auth.config.ts`) — only this one file's internals lag behind that convention.

## What Changes

- **Rename** `server/auth/rumbor-adapter.ts` → `server/auth/identity-backend-adapter.ts`.
- **Rename** exported function `rumborAdapter` → `identityBackendAdapter`.
- **Rename** type `RumborAdapterConfig` → `IdentityBackendAdapterConfig`.
- **Rename** internal helper `proxyToRumborCore` → `proxyToIdentityBackend`.
- **Change** `adapterId: 'rumbor-core'` → `adapterId: 'identity-backend'` and
  `adapterName: 'Rumbor Core Identity Adapter'` → `adapterName: 'Identity Backend Adapter'` (these
  two strings are passed to `better-auth`'s `createAdapterFactory` and may surface in
  `debugLogs`/error messages — both a product-name leak and a real information-disclosure concern
  if `debugLogs` is ever enabled in a non-demo environment).
- **Change** the demo-mode generated-ID prefix `` `rumbor_${Date.now()}_${nextId++}` `` →
  `` `local_${Date.now()}_${nextId++}` `` (this ID is only ever visible in the demo-mode in-memory
  fixture, never persisted or sent to a real backend, but still shouldn't carry the product name).
- **Update** every doc comment inside the file that names "rumbor-core" to describe the identity
  backend generically (e.g. "the identity backend's concrete request/response shape" instead of
  "rumbor-core's concrete request/response shape").
- **Update** the two consumers: `server/auth.config.ts`'s import
  (`import { rumborAdapter } from '@/server/auth/rumbor-adapter'` →
  `import { identityBackendAdapter } from '@/server/auth/identity-backend-adapter'`, and its
  `database: rumborAdapter({...})` call site) and `nuxt.config.ts`'s comment referencing the old
  filename/product name.
- **No behavior change.** This is a pure rename/naming normalization — the demo-mode fixture
  logic, the real-backend proxy logic, the `identityBackendUrl` runtime config key, and every
  request/response shape are untouched.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
(none — `openspec/specs/auth/spec.md`'s requirements describe session/authentication behavior at
a level of abstraction that never names the adapter file, function, or internal identifiers being
renamed here. No requirement or scenario text changes.)

## Impact

- **Affected code**: `server/auth/rumbor-adapter.ts` (renamed + internals renamed),
  `server/auth.config.ts` (import + call site), `nuxt.config.ts` (comment only).
- **Unaffected**: `NUXT_IDENTITY_BACKEND_URL` env var name, `identityBackendUrl` runtime config
  key, `.env.example`, the demo-mode fixture's actual data/behavior, the real-backend proxy's
  request/response shape, `@nuxtjs/better-auth` config, CASL, every page/route outside this one
  file's rename.
- **Verified via grep, not LSP** (no TypeScript language server available in this environment):
  confirmed exactly 3 files reference `rumbor-adapter`/`rumborAdapter`/`RumborAdapterConfig` in
  the whole repo (the file itself, `server/auth.config.ts`, and a comment in `nuxt.config.ts`) —
  no other callers exist to miss.
