import '#nuxt-better-auth'

declare module '#nuxt-better-auth' {
  interface AuthUser {
    username?: string
    role?: string
    abilityRules?: string
  }
}
