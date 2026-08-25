import type { RouteRecordRaw } from 'vue-router'
import type { RouterConfig } from '@nuxt/schema'

const emailRouteComponent = () => import('@/pages/apps/email/index.vue')

// 👉 Redirects
const redirects: RouteRecordRaw[] = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    meta: {
      middleware: async to => {
        // ℹ️ Dynamic import (not the auto-imported `useAuth` directly) to avoid a static
        // top-level import cycle: `app/router.options.ts` is imported by the generated
        // `#build/route-rules.mjs`, which `layout.js`/`manifest.js` also import — a static
        // `useAuth` import here closes that cycle and the bundler emits `layout.js`'s
        // `const routeRulesMatcher = _routeRulesMatcher` before route-rules.mjs runs,
        // throwing "Cannot access '_routeRulesMatcher' before initialization" client-side.
        // Confirmed as an upstream Nuxt 4.5.1+ regression (nuxt/nuxt#35982); the community
        // workaround is exactly this - defer any composable/store import in this file to
        // inside the callback that needs it. `useNuxtApp()` is captured before the `await`
        // (which drops the active Nuxt instance context) and `callWithNuxt` restores it for
        // the subsequent `useAuth()` call.
        const nuxtApp = useNuxtApp()
        const [{ useAuth }, { callWithNuxt }] = await Promise.all([import('#imports'), import('nuxt/app')])
        const { data: sessionData } = await callWithNuxt(nuxtApp, useAuth)

        const userRole = sessionData.value?.user.role

        if (userRole === 'admin')
          return { name: 'dashboards-crm' }
        if (userRole === 'client')
          return { name: 'access-control' }

        return { name: 'login', query: to.query }
      },
    },
    component: h('div'),
  },
  {
    path: '/pages/user-profile',
    name: 'pages-user-profile',
    redirect: () => ({ name: 'pages-user-profile-tab', params: { tab: 'profile' } }),
  },
  {
    path: '/pages/account-settings',
    name: 'pages-account-settings',
    redirect: () => ({ name: 'pages-account-settings-tab', params: { tab: 'account' } }),
  },
]

const routes: RouteRecordRaw[] = [
  // Email filter
  {
    path: '/apps/email/filter/:filter',
    name: 'apps-email-filter',
    component: emailRouteComponent,
    meta: {
      navActiveLink: 'apps-email',
      layoutWrapperClasses: 'layout-content-height-fixed',
    },
  },

  // Email label
  {
    path: '/apps/email/label/:label',
    name: 'apps-email-label',
    component: emailRouteComponent,
    meta: {
      // contentClass: 'email-application',
      navActiveLink: 'apps-email',
      layoutWrapperClasses: 'layout-content-height-fixed',
    },
  },

  {
    path: '/dashboards/logistics',
    name: 'dashboards-logistics',
    component: () => import('@/pages/apps/logistics/dashboard.vue'),
  },
  {
    path: '/dashboards/academy',
    name: 'dashboards-academy',
    component: () => import('@/pages/apps/academy/dashboard.vue'),
  },
  {
    path: '/apps/ecommerce/dashboard',
    name: 'apps-ecommerce-dashboard',
    component: () => import('@/pages/dashboards/ecommerce.vue'),
  },
]

// https://router.vuejs.org/api/interfaces/routeroptions.html
export default <RouterConfig>{
  routes: scannedRoutes => [
    ...redirects,
    ...routes,
    ...scannedRoutes,
  ],
  scrollBehaviorType: 'smooth',
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
}
