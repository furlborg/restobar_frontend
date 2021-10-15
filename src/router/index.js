import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard')
  },
  {
    path: '/customer',
    name: 'Customer',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "customer" */ '@/views/Customer')
  },
  {
    path: '/table',
    name: 'Table',
    component: () => import(/* webpackChunkName: "table" */ '@/views/Table')
  },
  {
    path: '/product',
    name: 'Product',
    component: () => import(/* webpackChunkName: "product" */ '@/views/Product')
  },
  {
    path: '/settings',
    name: 'Settings',
    redirect: { name: "HomeSettings"},
    component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings'),
    children: [
      {
        name: 'HomeSettings',
        path: '',
        component: () => import(/* webpackChunkName: "general-settings" */ '@/views/Settings/components/HomeSettings')
      },
      {
        name: 'GeneralSettings',
        path: 'general-settings',
        component: () => import(/* webpackChunkName: "general-settings" */ '@/views/Settings/components/GeneralSettings')
      },
      {
        name: 'BusinessSettings',
        path: 'business-settings',
        component: () => import(/* webpackChunkName: "general-settings" */ '@/views/Settings/components/BusinessSettings')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
