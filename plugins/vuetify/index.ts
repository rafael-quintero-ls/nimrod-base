import { deepMerge } from '@antfu/utils'

import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import { VVideo } from 'vuetify/labs/VVideo'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import defaults from './defaults'
import { icons } from './icons'
import { staticPrimaryColor, staticPrimaryDarkenColor, themes } from './theme'
import { themeConfig } from '@themeConfig'

// Styles
import { cookieRef } from '@/@layouts/stores/config'
import '#core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default defineNuxtPlugin({
  name: 'app:vuetify',

  // ℹ️ Ordered after `plugins/i18n/index.ts` in nuxt.config.ts's `plugins` array — that plugin's
  // `setup()` fully awaits the initial locale's messages before returning, so by the time this
  // plugin runs, `$i18n`'s composer already has the active locale (including its `$vuetify`
  // block) loaded. No `dependsOn` needed: Nuxt runs the `plugins` array in declared order.
  setup(nuxtApp) {
    const { $i18n } = nuxtApp
    const i18n = { global: $i18n }

    const cookieThemeValues = {
      defaultTheme: resolveVuetifyTheme(themeConfig.app.theme),
      themes: {
        light: {
          colors: {
            'primary': cookieRef('lightThemePrimaryColor', staticPrimaryColor).value,
            'primary-darken-1': cookieRef('lightThemePrimaryDarkenColor', staticPrimaryDarkenColor).value,
          },
        },
        dark: {
          colors: {
            'primary': cookieRef('darkThemePrimaryColor', staticPrimaryColor).value,
            'primary-darken-1': cookieRef('darkThemePrimaryDarkenColor', staticPrimaryDarkenColor).value,
          },
        },
      },
    }

    const optionTheme = deepMerge({ themes }, cookieThemeValues)

    const vuetify = createVuetify({
      ssr: true,
      aliases: {
        IconBtn: VBtn,
      },
      components: {
        VVideo,
      },
      defaults,
      icons,
      theme: optionTheme,
      locale: { adapter: createVueI18nAdapter({ i18n, useI18n }) },
    })

    nuxtApp.vueApp.use(vuetify)
  },
})
