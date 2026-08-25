import { fileURLToPath } from 'node:url'
import svgLoader from 'vite-svg-loader'
import vuetify from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ℹ️ This repo keeps `pages/`, `middleware/`, `layouts/`, `components/`, `plugins/`, and
  // `server/` at the repo root (Nuxt 3-style layout), not inside `app/`. Nuxt 4 auto-detects
  // `srcDir: 'app'` whenever `app/` exists with content (here: `app/router.options.ts`,
  // `app/auth.config.ts`) — left implicit, every `srcDir`-relative path (`imports.dirs`,
  // file-based routing, layouts/middleware discovery, `vite.plugins.vuetify.styles.configFile`)
  // silently resolves against `app/` instead of the repo root, breaking page discovery,
  // composable auto-imports, and Vuetify's stylesheet resolution (all reproduced independently
  // against `main`, not introduced by this change). Pinning `srcDir` to the repo root matches
  // the actual file layout everywhere else in this repo.
  srcDir: '.',

  app: {
    head: {
      titleTemplate: '%s - NuxtJS Admin Template',
      title: 'Vuexy',

      link: [{
        rel: 'icon',
        type: 'image/x-icon',
        href: `${process.env.NUXT_APP_BASE_URL}/favicon.ico`,
      }],
    },
  },

  devtools: {
    enabled: true,
  },

  css: [
    '@core/scss/template/index.scss',
    '@styles/styles.scss',
    '@/plugins/iconify/icons.css',
  ],

  /*
    ❗ Please read the docs before updating runtimeConfig
    https://nuxt.com/docs/guide/going-further/runtime-config
  */
  runtimeConfig: {
    // Private: server-only, used by server/auth/rumbor-adapter.ts. Unset = demo-mode fixture
    // data; set = proxy to rumbor-core's identity endpoint.
    identityBackendUrl: process.env.NUXT_IDENTITY_BACKEND_URL,

    // Public keys that are exposed to the client.
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    },
  },
  components: {
    dirs: [{
      path: '@/@core/components',
      pathPrefix: false,
    }, {
      path: '@/views/demos',
      pathPrefix: false,
    }, {
      path: '~/components/global',
      global: true,
    }, {
      path: '~/components',
      pathPrefix: false,
    }],
  },

  plugins: [
    '@/plugins/casl/index.ts',
    '@/plugins/vuetify/index.ts',
    '@/plugins/iconify/index.ts',
  ],

  imports: {
    dirs: ['@/@core/utils', '@/@core/composable/', '@/plugins/*/composables/*'],
  },

  /*
    ⚠️ Workaround for a Nuxt 4.5.2 defect: pages with no explicit `layout` meta crash SSR
    with "routeRulesMatcher is not a function" inside `resolveLayoutName` (nuxt/dist/app/composables/layout.js,
    the `useLayout()` composable new in Nuxt 4.5.0). This repo defines no `routeRules`, so every
    page is forced onto the same 'default' layout it would have resolved to anyway — this hook
    only makes that resolution explicit at build time instead of relying on the broken runtime
    fallback. Remove once the upstream Nuxt bug is fixed and confirmed on a patch release.
  */
  hooks: {
    'pages:extend': pages => {
      const setDefaultLayout = (list: typeof pages) => {
        for (const page of list) {
          page.meta ??= {}
          page.meta.layout ??= 'default'
          if (page.children?.length)
            setDefaultLayout(page.children)
        }
      }

      setDefaultLayout(pages)
    },
  },

  experimental: {
    typedPages: true,

    // ℹ️ Required so `layout` from `definePageMeta` is extracted into `route.meta` at
    // build time, before the `pages:extend` hook above runs — otherwise the hook's
    // `??=` default cannot see a page's own declared layout and overwrites it.
    extraPageMetaExtractionKeys: ['layout'],
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '@/*': ['../*'],
          '@themeConfig': ['../themeConfig.ts'],
          '@layouts/*': ['../@layouts/*'],
          '@layouts': ['../@layouts'],
          '@core/*': ['../@core/*'],
          '@core': ['../@core'],
          '@images/*': ['../assets/images/*'],
          '@styles/*': ['../assets/styles/*'],
          '@validators': ['../@core/utils/validators'],
          '@db/*': ['../server/fake-db/*'],
          '@api-utils/*': ['../server/utils/*'],
        },
      },
    },
  },

  // ℹ️ Disable source maps until this is resolved: https://github.com/vuetifyjs/vuetify-loader/issues/290
  sourcemap: {
    server: false,
    client: false,
  },

  alias: {
    '@': fileURLToPath(new URL('.', import.meta.url)),
    '@themeConfig': fileURLToPath(new URL('./themeConfig.ts', import.meta.url)),
    '@core': fileURLToPath(new URL('./@core', import.meta.url)),
    '@layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
    '@images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
    '@styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
    '@configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
    '@db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
    '@api-utils': fileURLToPath(new URL('./server/utils/', import.meta.url)),
  },
  vue: {
    compilerOptions: {
      isCustomElement: tag => tag === 'swiper-container' || tag === 'swiper-slide',
    },
  },

  vite: {
    define: { 'process.env': {} },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
        '@themeConfig': fileURLToPath(new URL('./themeConfig.ts', import.meta.url)),
        '@core': fileURLToPath(new URL('./@core', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
        '@images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
        '@styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
        '@configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
        '@db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
        '@api-utils': fileURLToPath(new URL('./server/utils/', import.meta.url)),
      },
    },

    build: {
      chunkSizeWarningLimit: 5000,
    },

    optimizeDeps: {
      exclude: ['vuetify'],
    },

    plugins: [
      svgLoader(),
      vuetify({
        styles: {
          // ℹ️ Absolute path (not relative to Vite's `root`, which Nuxt 4 sets to `srcDir`/
          // `app/` by convention) — a relative path here silently resolved against `app/`
          // instead of the repo root, producing "Can't find stylesheet to import" for every
          // Vuetify component style on every route (preexisting on `main`, not introduced by
          // this change — reproduced there independently before this fix).
          configFile: fileURLToPath(new URL('./assets/styles/variables/_vuetify.scss', import.meta.url)),
        },
      }),
    ],
  },

  build: {
    transpile: ['vuetify'],
  },

  compatibilityDate: '2025-07-15',

  i18n: {
    vueI18n: '../i18n.config.ts',

    bundle: {
      optimizeTranslationDirective: true,
    },
  },

  modules: [
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/device',
    '@nuxtjs/better-auth',
    '@pinia/nuxt',
  ],

  auth: {
    // ℹ️ Explicit absolute paths, not the module's own `'server/auth.config'`/
    // `'app/auth.config'` defaults — those default paths are resolved through internal
    // per-layer heuristics that misbehave once `srcDir` is pinned to the repo root (see the
    // `srcDir` comment above); absolute paths sidestep that resolution entirely.
    serverConfig: fileURLToPath(new URL('./server/auth.config.ts', import.meta.url)),
    clientConfig: fileURLToPath(new URL('./app/auth.config.ts', import.meta.url)),
  },
})
