import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  builder: 'rspack',

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

  // ℹ️ Disabled by default — devtools' own module setup adds meaningful cost to every dev
  // boot (observed ~16s in this environment). Set NUXT_DEVTOOLS=true to re-enable for a
  // specific debugging session (component inspector, timeline, module graph UI).
  devtools: {
    enabled: process.env.NUXT_DEVTOOLS === 'true',
  },

  css: [
    '#core/scss/template/index.scss',
    '#styles/styles.scss',
    '@/plugins/iconify/icons.css',
  ],

  /*
    ❗ Please read the docs before updating runtimeConfig
    https://nuxt.com/docs/guide/going-further/runtime-config
  */
  runtimeConfig: {
    // Private: server-only, used by server/auth/identity-backend-adapter.ts. Unset = demo-mode
    // fixture data; set = proxy to the identity backend's real endpoint.
    identityBackendUrl: process.env.NUXT_IDENTITY_BACKEND_URL,

    // Private: server-only, used by server/agents/agent-runtime-adapter.ts. Unset = fixture
    // data; set = proxy to the agent runtime backend's real endpoint.
    agentRuntimeUrl: process.env.NUXT_AGENT_RUNTIME_URL,

    // Public keys that are exposed to the client.
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,

      // Read by @nuxtjs/better-auth for deterministic OAuth callbacks and origin checks —
      // unset falls back to inferring the origin from each request, which is non-deterministic
      // across ports/domains (see https://better-auth.nuxt.dev/getting-started/configuration).
      // No OAuth providers are configured yet, so this has no observable auth behavior change
      // today; it fixes the "Using inferred baseURL" warning and prepares for OAuth/self-host.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
  components: {
    dirs: [{
      path: '@/@core/components',
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
    '@/plugins/i18n/index.ts',
    '@/plugins/vuetify/index.ts',
    '@/plugins/iconify/index.ts',
  ],

  imports: {
    dirs: ['@/@core/utils', '@/@core/composable/', '@/plugins/*/composables/*'],

    // ℹ️ Auto-import useI18n now that @nuxtjs/i18n (which provided this by default) is
    // replaced by plain vue-i18n + plugins/i18n/index.ts — see that plugin's header comment.
    presets: [
      {
        from: 'vue-i18n',
        imports: ['useI18n'],
      },
    ],
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
        // ℹ️ `unplugin-icons/nuxt`'s wrapper would normally add this automatically, but
        // that wrapper has no Rspack branch (see `modules/rspack-vite-replacements.ts`, which
        // registers `unplugin-icons` directly for both builders instead), so this type
        // augmentation for `~icons/*` imports must be added here directly.
        types: ['unplugin-icons/types/vue'],
        paths: {
          '@/*': ['../*'],
          '@themeConfig': ['../themeConfig.ts'],
          '#layouts/*': ['../@layouts/*'],
          '#layouts': ['../@layouts'],
          '@layouts/*': ['../@layouts/*'],
          '@layouts': ['../@layouts'],
          '#core/*': ['../@core/*'],
          '#core': ['../@core'],
          '@core/*': ['../@core/*'],
          '@core': ['../@core'],
          '#images/*': ['../assets/images/*'],
          '@images/*': ['../assets/images/*'],
          '#styles/*': ['../assets/styles/*'],
          '@styles/*': ['../assets/styles/*'],
          '@validators': ['../@core/utils/validators'],
          '#db/*': ['../server/fake-db/*'],
          '@db/*': ['../server/fake-db/*'],
          '#api-utils/*': ['../server/utils/*'],
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

  // ℹ️ Every alias below is dual-registered under both a `#name` and the original `@name`
  // key, pointing at the same target. `#name` is REQUIRED for JS/TS `import` statements:
  // `@nuxt/rspack-builder`'s externals resolver only recognizes a short fixed prefix list
  // (`#`, `~`, `@/`, …) as definitely-internal before falling back to filesystem
  // resolution — a bare `@core` specifier fails that fast path and gets misresolved as an
  // external npm scoped package (`@scope/package`), 500ing every SSR request. `@name` is
  // STILL REQUIRED for Sass: every `@use`/`@forward` statement in this repo's `.scss` files
  // and `<style lang="scss">` blocks references the `@name` form and resolves via this same
  // alias map directly (not through the JS module resolver the bug above lives in) — do NOT
  // remove the `@name` entries without first migrating every `@use`/`@forward` statement to
  // `#name`.
  alias: {
    '@': fileURLToPath(new URL('.', import.meta.url)),
    '@themeConfig': fileURLToPath(new URL('./themeConfig.ts', import.meta.url)),
    '#core': fileURLToPath(new URL('./@core', import.meta.url)),
    '@core': fileURLToPath(new URL('./@core', import.meta.url)),
    '#layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
    '@layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
    '#images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
    '@images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
    '#styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
    '@styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
    '#configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
    '@configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
    '#db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
    '@db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
    '#api-utils': fileURLToPath(new URL('./server/utils/', import.meta.url)),
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
        '#core': fileURLToPath(new URL('./@core', import.meta.url)),
        '@core': fileURLToPath(new URL('./@core', import.meta.url)),
        '#layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./@layouts', import.meta.url)),
        '#images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
        '@images': fileURLToPath(new URL('./assets/images/', import.meta.url)),
        '#styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
        '@styles': fileURLToPath(new URL('./assets/styles/', import.meta.url)),
        '#configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
        '@configured-variables': fileURLToPath(new URL('./assets/styles/variables/_template.scss', import.meta.url)),
        '#db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
        '@db': fileURLToPath(new URL('./server/fake-db/', import.meta.url)),
        '#api-utils': fileURLToPath(new URL('./server/utils/', import.meta.url)),
        '@api-utils': fileURLToPath(new URL('./server/utils/', import.meta.url)),
      },
    },

    build: {
      chunkSizeWarningLimit: 5000,
    },

    optimizeDeps: {
      exclude: ['vuetify'],
    },

    // ℹ️ Vuetify auto-import/component-resolution and `~icons/<collection>/<name>` (task 5's
    // SVG-as-icon migration) plugins are registered centrally in
    // `modules/rspack-vite-replacements.ts` for both this Vite path and the Rspack path —
    // not duplicated here.
  },

  build: {
    transpile: ['vuetify', 'vue-demi'],
  },

  compatibilityDate: '2025-07-15',

  modules: [
    '@vueuse/nuxt',
    '@nuxtjs/device',
    '@nuxtjs/better-auth',
    '@pinia/nuxt',
    '@vuetify/unplugin-styles/nuxt',
    './modules/rspack-vite-replacements',
  ],

  // ℹ️ `settings` intentionally omitted for now: the generated settings virtual template
  // fails to compile under Rspack (documented defect, tasks.md 4.5a) — Vuetify defaults used
  // until that's resolved. This module itself now handles per-component style extraction for
  // all three builder targets (Vite, webpack, Rspack) via its own `/nuxt` wrapper.
  vuetifyStyles: {},

  auth: {
    // ℹ️ Explicit absolute paths, not the module's own `'server/auth.config'`/
    // `'app/auth.config'` defaults — those default paths are resolved through internal
    // per-layer heuristics that misbehave once `srcDir` is pinned to the repo root (see the
    // `srcDir` comment above); absolute paths sidestep that resolution entirely.
    serverConfig: fileURLToPath(new URL('./server/auth.config.ts', import.meta.url)),
    clientConfig: fileURLToPath(new URL('./app/auth.config.ts', import.meta.url)),
  },
})
