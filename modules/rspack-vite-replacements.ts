import { fileURLToPath } from 'node:url'
import { addRspackPlugin, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import ViteIcons from 'unplugin-icons/vite'
import RspackIcons from 'unplugin-icons/rspack'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import ViteComponents from 'unplugin-vue-components/vite'
import RspackVueComponents from 'unplugin-vue-components/rspack'
import { Vuetify3Resolver } from 'unplugin-vue-components/resolvers'

// ℹ️ Registers this repo's `~icons/<collection>/<name>` (task 5) and Vuetify
// auto-import/component-resolution (task 4) plugins for whichever builder is active, in one
// place — this is now the ONLY registration of either, since `vite-plugin-vuetify` and
// `vite-svg-loader` were removed from `package.json`/`vite.plugins` once every call site
// migrated off them.
//
// 1. `unplugin-icons` + `FileSystemIconLoader` replaces `vite-svg-loader`'s SVG-as-Vue-
//    component imports (`import x from '#images/svg/home.svg'` used as `<VIcon :icon="x">`).
//    Registered for BOTH builders unconditionally (`addVitePlugin` always runs;
//    `addRspackPlugin` below only actually applies when Rspack is the active builder — Nuxt
//    only invokes the builder whose config is being built) since neither has a working `/nuxt`
//    wrapper for both targets: `unplugin-icons/nuxt`'s wrapper only hooks
//    `webpack:config`/`vite:extend`, no Rspack branch.
//
// 2. `unplugin-vue-components` + `Vuetify3Resolver` replaces `vite-plugin-vuetify`'s implicit
//    `<VBtn>`-style auto-import every page/view in this repo relies on without an explicit
//    `import { VBtn } from 'vuetify/components'` anywhere. Same gap: its own `/nuxt` wrapper
//    only calls addWebpackPlugin/addVitePlugin — no Rspack branch — registered directly for
//    both targets here instead. (Per-component style extraction, the other half of what
//    `vite-plugin-vuetify` did, is handled separately by `@vuetify/unplugin-styles/nuxt`,
//    registered in `nuxt.config.ts`'s `modules` array — that package's own `/nuxt` wrapper
//    already covers Vite, webpack, and Rspack.)
const iconCollections = {
  'svg-icons': FileSystemIconLoader(
    fileURLToPath(new URL('../assets/images/svg', import.meta.url)),
  ),
  'customizer-icons': FileSystemIconLoader(
    fileURLToPath(new URL('../assets/images/customizer-icons', import.meta.url)),
  ),
}

export default defineNuxtModule({
  meta: {
    name: 'rspack-vite-replacements',
  },
  setup(_options, nuxt) {
    addVitePlugin(ViteIcons({
      compiler: 'vue3',
      customCollections: iconCollections,
    }))
    addVitePlugin(ViteComponents({
      resolvers: [Vuetify3Resolver()],
      dts: false,
    }))

    if (nuxt.options.builder !== '@nuxt/rspack-builder')
      return

    addRspackPlugin(RspackVueComponents({
      resolvers: [Vuetify3Resolver()],
      dts: false,
    }))

    addRspackPlugin(RspackIcons({
      compiler: 'vue3',
      customCollections: iconCollections,
    }))

    // ℹ️ `@nuxt/rspack-builder`'s `postcss-loader` (v8) always tries to locate an external
    // `postcss.config.*` file for every `.scss` module, and fails hard for virtual modules
    // (e.g. `@vuetify/unplugin-styles`'s generated settings file) since `dirname()` of a
    // virtual module's resource path does not exist on disk. `postcssOptions.config: false`
    // disables that search. Setting `nuxt.options.postcss.postcssOptions` in this module's
    // `setup()` (before this hook runs) does not reach the loader: the builder's own
    // `getPostcssConfig` (called during this same `rspack:config` hook, just via its own
    // internal invocation, not by us) constructs its `postcssOptions` object fresh from
    // `nuxt.options.postcss` at that point, and Nuxt's own `postcss` config schema strips any
    // key besides `order`/`plugins` from `nuxt.options.postcss` before any module ever runs —
    // so the mutation is invisible by the time it matters. Patching the already-built
    // `postcss-loader` rule entries directly here, after the builder has assembled them, is
    // the only point this survives.
    nuxt.hook('rspack:config', configs => {
      for (const config of configs) {
        config.module ??= {}
        config.module.rules ??= []

        for (const rule of config.module.rules) {
          const ruleSets = rule.oneOf ?? [rule]
          for (const oneOf of ruleSets) {
            for (const use of oneOf.use ?? []) {
              if (use && typeof use === 'object' && use.loader?.includes('postcss-loader')) {
                use.options ??= {}
                use.options.postcssOptions ??= {}
                use.options.postcssOptions.config = false
              }
            }
          }
        }

        // ℹ️ Rspack has no built-in equivalent of Vite's universal `?raw` resource query
        // (this repo's `themeConfig.ts` relies on it for
        // `import logo from '#images/logo.svg?raw'`, to get the SVG's literal text content,
        // not a Vue component or asset URL). The builder's own `raw-loader` dependency is
        // only wired to `.pug` files internally — no generic `resourceQuery: /raw/` rule
        // exists — and unlike Vite (where a matching rule short-circuits others), Rspack's
        // top-level (non-`oneOf`) rules ALL apply to a matching module in sequence: adding a
        // `resourceQuery: /raw/` rule alongside the existing `url-loader` image rule (not
        // instead of it) double-processes the request — `url-loader` runs first, producing
        // a base64 data URL module, then this rule wraps THAT already-transformed output as
        // a second literal string, instead of the original file's raw text. The fix must
        // actively exclude `?raw` requests from the existing image rule, not just add a
        // competing one.
        for (const rule of config.module.rules) {
          if (rule.test instanceof RegExp && rule.test.test('x.svg') && !rule.resourceQuery)
            rule.resourceQuery = { not: [/raw/] }
        }

        // Idempotent: `rspack:config` can fire more than once (e.g. on rebuild), and a
        // duplicate `resourceQuery: /raw/` rule ahead of the loader-selecting rule would
        // wrap an already-processed `asset/source` result in a second layer, double-wrapping
        // the resulting string.
        const alreadyPatched = config.module.rules.some(r => r?.resourceQuery instanceof RegExp && r.resourceQuery.source === 'raw' && r.type === 'asset/source')
        if (!alreadyPatched) {
          config.module.rules.unshift({
            resourceQuery: /raw/,
            type: 'asset/source',
          })
        }
      }
    })
  },
})
