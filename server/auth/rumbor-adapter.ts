import { type CleanedWhere, createAdapterFactory } from 'better-auth/adapters'
import { hashPassword } from 'better-auth/crypto'

/**
 * better-auth database adapter that resolves users/sessions/accounts through
 * rumbor-core's identity contract, rather than a local database better-auth owns
 * directly.
 *
 * rumbor-core is still scaffold-only (no HTTP contract published yet — see
 * openspec/changes/migrate-better-auth/design.md, decision 3). Until
 * `NUXT_IDENTITY_BACKEND_URL` is set, this adapter serves a small in-memory fixture
 * (ported 1:1 from the removed `server/fake-db/auth/index.ts` demo users) so `pnpm dev`
 * keeps working through the migration. When the env var is set, every call proxies to
 * that URL instead.
 *
 * This file is the ONLY place in this repo allowed to know rumbor-core's concrete
 * request/response shape — nothing outside it may reference that contract directly
 * (see AGENTS.md's "identity backend is not exposed through the public interface" rule).
 */

interface RumborAdapterConfig {
  identityBackendUrl?: string
}

interface StoredRecord {
  id: string
  [key: string]: unknown
}

// ℹ️ In-memory store keyed by model name, used only in demo mode (no identityBackendUrl).
// Not persisted across server restarts — matches the prior fake-db's behavior exactly.
const demoStore = new Map<string, StoredRecord[]>()

function demoTable(model: string): StoredRecord[] {
  if (!demoStore.has(model))
    demoStore.set(model, [])

  return demoStore.get(model)!
}

// ℹ️ better-auth's sign-in/email route matches a credential account by
// `issuer === "local:" + encodeURIComponent(providerId)` (see
// better-auth/dist/crypto/../db/schema/account.mjs's `createLocalAccountIssuer`) and verifies
// the stored `password` against `better-auth/crypto`'s `hashPassword`/`verifyPassword` — plain
// text won't match. Seeding is async (hashing is async) and memoized so it only runs once.
const CREDENTIAL_ISSUER = 'local:credential'

let seedPromise: Promise<void> | null = null
function ensureDemoUsersSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const now = new Date()

      demoTable('user').push(
        {
          id: 'demo-admin',
          email: 'admin@demo.com',
          emailVerified: true,
          name: 'John Doe',
          username: 'johndoe',
          image: '/images/avatars/avatar-1.png',
          role: 'admin',
          abilityRules: JSON.stringify([{ action: 'manage', subject: 'all' }]),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'demo-client',
          email: 'client@demo.com',
          emailVerified: true,
          name: 'Jane Doe',
          username: 'janedoe',
          image: '/images/avatars/avatar-2.png',
          role: 'client',
          abilityRules: JSON.stringify([
            { action: 'read', subject: 'Auth' },
            { action: 'read', subject: 'AclDemo' },
          ]),
          createdAt: now,
          updatedAt: now,
        },
      )

      // ℹ️ better-auth's emailAndPassword provider stores credentials on the `account` model
      // (providerId: 'credential'), keyed by userId, with `accountId` set to the owning
      // user's id — not on `user` itself.
      demoTable('account').push(
        {
          id: 'demo-admin-account',
          userId: 'demo-admin',
          providerId: 'credential',
          issuer: CREDENTIAL_ISSUER,
          accountId: 'demo-admin',
          password: await hashPassword('admin'),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'demo-client-account',
          userId: 'demo-client',
          providerId: 'credential',
          issuer: CREDENTIAL_ISSUER,
          accountId: 'demo-client',
          password: await hashPassword('client'),
          createdAt: now,
          updatedAt: now,
        },
      )
    })()
  }

  return seedPromise
}

// ℹ️ better-auth stores `expiresAt`/`createdAt`/`updatedAt` as real `Date` objects when
// `supportsDates: true` (set below); ordering operators must compare on the same numeric
// timeline whether the value is a `Date`, a numeric timestamp, or a `Date`-parseable string.
function toComparable(value: unknown): number {
  if (value instanceof Date)
    return value.getTime()

  return Number(value)
}

// ℹ️ Record lookup instead of a switch: this repo's ESLint config has two conflicting indent
// rules (`indent` vs `@stylistic/ts/indent`) that oscillate on `case` bodies inside a nested
// arrow function, so `--fix` never converges — a lookup table sidesteps the conflict entirely
// and needs no case-clause indentation at all.
const WHERE_OPERATORS: Record<string, (fieldValue: unknown, value: CleanedWhere['value']) => boolean> = {
  eq: (fieldValue, value) => fieldValue === value,
  ne: (fieldValue, value) => fieldValue !== value,
  in: (fieldValue, value) => Array.isArray(value) && (value as unknown[]).includes(fieldValue),
  not_in: (fieldValue, value) => Array.isArray(value) && !(value as unknown[]).includes(fieldValue),
  contains: (fieldValue, value) => typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.includes(value),
  starts_with: (fieldValue, value) => typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.startsWith(value),
  ends_with: (fieldValue, value) => typeof fieldValue === 'string' && typeof value === 'string' && fieldValue.endsWith(value),
  lt: (fieldValue, value) => toComparable(fieldValue) < toComparable(value),
  lte: (fieldValue, value) => toComparable(fieldValue) <= toComparable(value),
  gt: (fieldValue, value) => toComparable(fieldValue) > toComparable(value),
  gte: (fieldValue, value) => toComparable(fieldValue) >= toComparable(value),
}

function matchesWhere(record: StoredRecord, where: CleanedWhere[]): boolean {
  if (where.length === 0)
    return true

  const results = where.map(clause => {
    const fieldValue = record[clause.field]
    const compare = WHERE_OPERATORS[clause.operator] ?? ((a: unknown, b: unknown) => a === b)

    return compare(fieldValue, clause.value)
  })

  // ℹ️ Mixed AND/OR connectors aren't needed for this adapter's usage (better-auth's own
  // queries against user/session/account are all single-connector); default to AND across
  // every clause, matching the `Where[]` default connector.
  return results.every(Boolean)
}

let nextId = 1
function generateId(): string {
  return `rumbor_${Date.now()}_${nextId++}`
}

export const rumborAdapter = (config: RumborAdapterConfig = {}) => {
  const identityBackendUrl = config.identityBackendUrl

  return createAdapterFactory({
    config: {
      adapterId: 'rumbor-core',
      adapterName: 'Rumbor Core Identity Adapter',
      usePlural: false,
      debugLogs: false,
      supportsJSON: false,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false,
    },
    adapter: () => {
      // ℹ️ Real-backend branch: proxies every call to rumbor-core's identity endpoint once
      // it exists. The exact request/response shape is not yet published (see design.md's
      // Open Questions) — this issues a generic REST-ish call per model/operation, isolated
      // here so only this function needs to change once the real contract is confirmed.
      async function proxyToRumborCore<T>(operation: string, payload: Record<string, unknown>): Promise<T> {
        const response = await fetch(`${identityBackendUrl}/adapter/${payload.model}/${operation}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok)
          throw new Error(`Identity backend request failed: ${operation} ${payload.model}`)

        return response.json() as Promise<T>
      }

      if (identityBackendUrl) {
        return {
          create: ({ model, data }) => proxyToRumborCore('create', { model, data }),
          findOne: ({ model, where }) => proxyToRumborCore('findOne', { model, where }),
          findMany: ({ model, where, limit, sortBy, offset }) =>
            proxyToRumborCore('findMany', { model, where, limit, sortBy, offset }),
          update: ({ model, where, update }) => proxyToRumborCore('update', { model, where, update }),
          updateMany: ({ model, where, update }) => proxyToRumborCore('updateMany', { model, where, update }),
          delete: ({ model, where }) => proxyToRumborCore('delete', { model, where }),
          deleteMany: ({ model, where }) => proxyToRumborCore('deleteMany', { model, where }),
          consumeOne: ({ model, where }) => proxyToRumborCore('consumeOne', { model, where }),
          incrementOne: ({ model, where, increment, set }) =>
            proxyToRumborCore('incrementOne', { model, where, increment, set }),
          count: ({ model, where }) => proxyToRumborCore('count', { model, where }),
        }
      }

      // ℹ️ Demo-mode branch: in-memory fixture, no network calls.
      return {
        create: async ({ model, data }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const record: StoredRecord = { id: generateId(), ...data }

          table.push(record)

          return record as never
        },
        findOne: async ({ model, where }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)

          return (table.find(record => matchesWhere(record, where)) ?? null) as never
        },
        findMany: async ({ model, where, limit, offset, sortBy }) => {
          await ensureDemoUsersSeeded()
          let results = demoTable(model).filter(record => (where ? matchesWhere(record, where) : true))

          if (sortBy) {
            const { field, direction } = sortBy

            results = [...results].sort((a, b) => {
              const cmp = String(a[field]).localeCompare(String(b[field]))

              return direction === 'desc' ? -cmp : cmp
            })
          }

          if (offset)
            results = results.slice(offset)

          if (limit !== undefined)
            results = results.slice(0, limit)

          return results as never
        },
        update: async ({ model, where, update }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const record = table.find(r => matchesWhere(r, where))

          if (!record)
            return null as never

          Object.assign(record, update)

          return record as never
        },
        updateMany: async ({ model, where, update }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const matches = table.filter(record => matchesWhere(record, where))

          matches.forEach(record => Object.assign(record, update))

          return matches.length
        },
        delete: async ({ model, where }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const remaining = table.filter(record => !matchesWhere(record, where))

          demoStore.set(model, remaining)
        },
        deleteMany: async ({ model, where }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const toDelete = table.filter(record => matchesWhere(record, where))

          demoStore.set(model, table.filter(record => !matchesWhere(record, where)))

          return toDelete.length
        },
        consumeOne: async ({ model, where }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const index = table.findIndex(record => matchesWhere(record, where))

          if (index === -1)
            return null as never

          const [record] = table.splice(index, 1)

          return record as never
        },
        incrementOne: async ({ model, where, increment, set }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)
          const record = table.find(r => matchesWhere(r, where))

          if (!record)
            return null as never

          for (const [field, delta] of Object.entries(increment))
            record[field] = (Number(record[field]) || 0) + delta

          if (set)
            Object.assign(record, set)

          return record as never
        },
        count: async ({ model, where }) => {
          await ensureDemoUsersSeeded()

          const table = demoTable(model)

          return where ? table.filter(record => matchesWhere(record, where)).length : table.length
        },
      }
    },
  })
}
