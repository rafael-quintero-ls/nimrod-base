import { defineServerAuth } from '@nuxtjs/better-auth/config'
import { createAuthMiddleware } from 'better-auth/api'
import { rumborAdapter } from '@/server/auth/rumbor-adapter'

export default defineServerAuth(ctx => ({
  database: rumborAdapter({
    identityBackendUrl: ctx.runtimeConfig.identityBackendUrl,
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      username: { type: 'string', required: false, input: false },
      role: { type: 'string', required: false, input: false },
      abilityRules: { type: 'string', required: false, input: false },
    },
  },

  // ℹ️ Mirrors what pages/login.vue used to write manually to the `userAbilityRules` cookie
  // after `signIn()` resolved — moved server-side so plugins/casl/index.ts (unchanged) reads
  // an up-to-date cookie on both first SSR render and client hydration, per design.md
  // decision 5.
  hooks: {
    after: createAuthMiddleware(async authCtx => {
      const newSession = authCtx.context.newSession

      if (!newSession)
        return

      const sessionUser: unknown = newSession.user

      const abilityRules = sessionUser && typeof sessionUser === 'object' && 'abilityRules' in sessionUser
        ? sessionUser.abilityRules
        : undefined

      authCtx.setCookie('userAbilityRules', typeof abilityRules === 'string' ? abilityRules : '[]', {
        path: '/',
        sameSite: 'lax',
      })
    }),
  },
}))
