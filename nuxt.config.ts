import { fileURLToPath } from 'node:url'
import svgLoader from 'vite-svg-loader'
import vuetify from 'vite-plugin-vuetify'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
    // Private keys are only available on the server
    AUTH_ORIGIN: process.env.AUTH_ORIGIN,
    AUTH_SECRET: process.env.AUTH_SECRET,

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

  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    globalAppMiddleware: false,

    provider: {
      type: 'authjs',
    },
  },

  plugins: [
    '@/plugins/casl/index.ts',
    '@/plugins/vuetify/index.ts',
    '@/plugins/iconify/index.ts',
  ],

  imports: {
    dirs: ['./@core/utils', './@core/composable/', './plugins/*/composables/*'],
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
          configFile: 'assets/styles/variables/_vuetify.scss',
        },
      }),
    ],
  },

  build: {
    transpile: ['vuetify'],
  },

  nitro: {
    alias: {
      'next-auth/core': fileURLToPath(new URL('./node_modules/next-auth/core/index.js', import.meta.url)),
      'next-auth/jwt': fileURLToPath(new URL('./node_modules/next-auth/jwt/index.js', import.meta.url)),
    },

    // ℹ️ Forces Nitro to bundle next-auth's transitive CJS dependency chain into the server
    // output rather than leaving them as runtime external imports. Nitro's CJS-external-as-
    // ESM-namespace-import handling breaks for plain-CJS packages under Vite 8/rolldown:
    // externalizing them one at a time surfaced a chain of interop errors
    // (`ERR_UNSUPPORTED_DIR_IMPORT` on `next-auth/jwt`, `_interopRequireDefault$1 is not a
    // function` on `@babel/runtime/helpers/*`, `LRU$2 is not a constructor` on `lru-cache`,
    // `Yallist is not a constructor` on `lru-cache`'s own dependency `yallist`). Every package
    // in this list is CJS and reachable only through next-auth/@sidebase-nuxt-auth.
    externals: {
      inline: [
        'next-auth',
        '@babel/runtime',

        // ℹ️ @panva/hkdf is deliberately NOT inlined here (kept as an external import). Its
        // `dist/node/esm/index.js` build lacked the `__esModule` marker Babel's
        // `_interopRequireDefault` (embedded in next-auth's own CJS build) checks for, so
        // whichever module condition the bundler picked for this bare specifier — `import`
        // in production, something else again in `pnpm dev`'s Vite-driven server bundling —
        // `_interopRequireDefault` double-wrapped it and broke `hkdf(...)` at call time in
        // exactly the way `sidebase/nuxt-auth#953` describes. Fixed at the source via a
        // `pnpm patch` (`patches/@panva__hkdf.patch`) adding `export const __esModule = true`
        // to that build, rather than aliasing to the CJS build — an alias only covers one
        // bundling context (Nitro's production rollup) and left `pnpm dev` broken.
        'jose',
        'oauth',
        'openid-client',
        'preact',
        'preact-render-to-string',
        'uuid',
        'lru-cache',
        'yallist',
        'object-hash',
        'oidc-token-hash',
        'cookie',
      ],
    },
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
    '@sidebase/nuxt-auth',
    '@pinia/nuxt',
  ],
})
