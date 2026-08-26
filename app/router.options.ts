import type { RouteRecordRaw } from 'vue-router'
import type { RouterConfig } from '@nuxt/schema'

// 👉 Redirects
const redirects: RouteRecordRaw[] = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    meta: {
      middleware: async to => {
        // ℹ️ Dynamic import (not the auto-imported `useUserSession` directly) to avoid a static
        // top-level import cycle: `app/router.options.ts` is imported by the generated
        // `#build/route-rules.mjs`, which `layout.js`/`manifest.js` also import — a static
        // session-composable import here closes that cycle and the bundler emits `layout.js`'s
        // `const routeRulesMatcher = _routeRulesMatcher` before route-rules.mjs runs,
        // throwing "Cannot access '_routeRulesMatcher' before initialization" client-side.
        // Confirmed as an upstream Nuxt 4.5.1+ regression (nuxt/nuxt#35982); the community
        // workaround is exactly this - defer any composable/store import in this file to
        // inside the callback that needs it. `useNuxtApp()` is captured before the `await`
        // (which drops the active Nuxt instance context) and `callWithNuxt` restores it for
        // the subsequent `useUserSession()` call.
        const nuxtApp = useNuxtApp()
        const [{ useUserSession }, { callWithNuxt }] = await Promise.all([import('#imports'), import('nuxt/app')])
        const { user } = await callWithNuxt(nuxtApp, useUserSession)

        const userRole = user.value?.role

        if (userRole === 'admin')
          return { name: 'dashboards-analytics' }
        if (userRole === 'client')
          return { name: 'dashboards-analytics' }

        return { name: 'login', query: to.query }
      },
    },
    component: h('div'),
  },
  {
    path: '/pages/account-settings',
    name: 'pages-account-settings',
    redirect: () => ({ name: 'pages-account-settings-tab', params: { tab: 'account' } }),
  },
]

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  routes: scannedRoutes => [
    ...redirects,
    ...scannedRoutes,
  ],
  scrollBehaviorType: 'smooth',
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
}
