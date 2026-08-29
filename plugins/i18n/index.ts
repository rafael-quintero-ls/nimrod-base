/**
 * Manual vue-i18n setup, replacing @nuxtjs/i18n. That module's own setup cost (~7.4s, observed
 * per this repo's `pnpm dev` warm-up diagnosis) is routing-strategy scanning, unplugin wiring,
 * and locale-file resolution machinery this repo never needed: no locale-prefixed routing
 * (`strategy: 'no_prefix'` was already the only strategy in use), no `localePath`/
 * `switchLocalePath`/routing helpers (grep-confirmed zero call sites — this repo only ever used
 * `useI18n()` + `$t()`). Its `lazy`/`langDir` lazy-loading also had a real, empirically-confirmed
 * bug where Vuetify's `createVueI18nAdapter` (plugins/vuetify/index.ts) read an empty composer
 * even after explicitly awaiting `loadLocaleMessages()` — see
 * openspec/changes/optimize-dev-experience/design.md for the full diagnosis. Plain `vue-i18n`
 * with locale files loaded via simple dynamic `import()` avoids both costs: no module setup, and
 * a composer we construct and populate ourselves, so there's no cross-package lazy-load race.
 *
 * `useI18n` is auto-imported from `vue-i18n` directly (see nuxt.config.ts's `imports.presets`).
 */
import { createI18n } from 'vue-i18n'
import { cookieRef } from '#layouts/stores/config'
import { themeConfig } from '@themeConfig'

const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('@/plugins/i18n/locales/en.json'),
  fr: () => import('@/plugins/i18n/locales/fr.json'),
  ar: () => import('@/plugins/i18n/locales/ar.json'),
}

export default defineNuxtPlugin({
  name: 'app:i18n',
  async setup(nuxtApp) {
    const defaultLocale = themeConfig.app.i18n.defaultLocale
    const initialLocale = cookieRef('language', defaultLocale).value ?? defaultLocale

    // ℹ️ Load the initial locale's messages before creating the i18n instance — synchronous
    // from the composer's perspective (awaited before `createI18n` ever runs), so there's no
    // window where a component can read an empty message set for the active locale.
    const { default: initialMessages } = await localeLoaders[initialLocale]()

    const i18n = createI18n({
      legacy: false,
      locale: initialLocale,
      fallbackLocale: 'en',
      messages: {
        [initialLocale]: initialMessages,
      },
    })

    nuxtApp.vueApp.use(i18n)

    // ℹ️ Loads and merges a locale's messages on demand, then switches the active locale.
    // Mirrors @nuxtjs/i18n's `loadLocaleMessages` + `setLocale` shape closely enough that
    // components/I18n.vue's `locale.value = lang.i18nLang` pattern keeps working unchanged.
    async function setLocale(locale: string) {
      const composer = i18n.global
      if (!(locale in composer.messages.value)) {
        const { default: messages } = await localeLoaders[locale]()

        composer.mergeLocaleMessage(locale, messages)
      }
      composer.locale.value = locale
    }

    return {
      provide: {
        i18n: i18n.global,
        setLocale,
      },
    }
  },
})
