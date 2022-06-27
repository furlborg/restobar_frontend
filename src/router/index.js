import { createRouter, createWebHistory } from 'vue-router'
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from '@/store/modules/user';
import { useGenericsStore } from "@/store/modules/generics";
import { retrieveCurrentTill } from '@/api/modules/tills'
const useCookie = require('vue-cookies')

export const routes = [
  {
    path: "",
    name: "App",
    redirect: { name: "Dashboard" },
    component: () => import(/* webpackChunkName: "dashboard" */ '@/layout'),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard')
      },
      {
        path: '/customer',
        name: 'Customer',
        component: () => import(/* webpackChunkName: "customer" */ '@/views/Customer')
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import(/* webpackChunkName: "customer" */ '@/views/Order'),
        beforeEnter: async (to, from, next) => {
          const tillStore = useTillStore()
          await retrieveCurrentTill()
            .then(response => {
              if (response.status === 200) {
                tillStore.currentTillID = response.data.id
                tillStore.currentTillOrders = response.data.orders_count
              }
            })
            .catch(error => {
              if (error.response.status === 404) {
                tillStore.currentTillID = null
                tillStore.currentTillOrders = 0
              }
            })
          tillStore.currentTillID !== null ? next() : next({ name: 'TillList' })
        },
      },
      {
        path: '/sales',
        name: 'Sales',
        component: () => import(/* webpackChunkName: "customer" */ '@/views/Sale')
      },
      {
        path: '/till',
        name: 'Till',
        redirect: { name: 'CurrentTill' },
        component: () => import(/* webpackChunkName: "till" */ '@/views/Till'),
        children: [
          {
            path: '',
            name: 'CurrentTill',
            component: () => import(/* webpackChunkName: "currentTill" */ '@/views/Till/CurrentTill'),
            beforeEnter: async (to, from, next) => {
              const tillStore = useTillStore()
              await retrieveCurrentTill()
                .then(response => {
                  if (response.status === 200) {
                    tillStore.currentTillID = response.data.id
                    tillStore.currentTillOrders = response.data.orders_count
                  }
                })
                .catch(error => {
                  if (error.response.status === 404) {
                    tillStore.currentTillID = null
                    tillStore.currentTillOrders = 0
                  }
                })
              tillStore.currentTillID !== null ? next() : next({ name: 'TillList' })
            }
          },
          {
            path: 'till-list',
            name: 'TillList',
            component: () => import(/* webpackChunkName: "till-list" */ '@/views/Till/TillList')
          },
          {
            path: ':till',
            name: "TillDetails",
            component: () => import(/* webpackChunkName: "till-list" */ '@/views/Till/TillDetails')
          }
        ]
      },
      {
        path: '/table',
        name: 'Table',
        redirect: { name: "TableHome" },
        component: () => import(/* webpackChunkName: "table" */ '@/views/Table'),
        meta: {
          onlyWaiter: true,
        },
        beforeEnter: async (to, from, next) => {
          const tillStore = useTillStore()
          const userStore = useUserStore()
          await retrieveCurrentTill()
            .then(response => {
              if (response.status === 200) {
                tillStore.currentTillID = response.data.id
                tillStore.currentTillOrders = response.data.orders_count
              }
            })
            .catch(error => {
              if (error.response.status === 404) {
                tillStore.currentTillID = null
                tillStore.currentTillOrders = 0
              }
            })
          tillStore.currentTillID !== null ? next() : userStore.user.profile_des === 'MOZO' ? next() : next({ name: 'TillList' })
        },
        children: [
          {
            name: "TableHome",
            path: '',
            component: () => import(/* webpackChunkName: "table-home" */ '@/views/Table/components/TableHome'),
          },
          {
            name: "TakeOrder",
            path: '/take-order',
            component: () => import(/* webpackChunkName: "take-order" */ '@/views/Order/components/TakeOrder'),
          },
          {
            name: "TableOrder",
            path: ":table",
            redirect: { name: "ProductCategories" },
            component: () => import(/* webpackChunkName: "table-order" */ '@/views/Table/components/TableOrder'),
            children: [
              {
                name: "ProductCategories",
                path: "product-categories",
                component: () => import(/* webpackChunkName: "product-categories" */ '@/views/Table/components/CategoriesList'),
              },
              {
                name: "CategoriesItems",
                path: "product-categories/:category",
                component: () => import(/* webpackChunkName: "product-categories-get" */ '@/views/Table/components/CategoriesItems'),
              },
              {
                name: "TablePayment",
                path: "payment",
                component: () => import(/* webpackChunkName: "table-payment" */ '@/views/Table/components/TablePayment'),
              }
            ]
          },
        ]
      },
      {
        path: '/product',
        name: 'Product',
        component: () => import(/* webpackChunkName: "product" */ '@/views/Product')
      },
      {
        path: '/shopping',
        name: 'Shopping',
        component: () => import(/* webpackChunkName: "shopping" */ '@/views/Shopping'),
      },
      {
        path: '/supplier',
        name: 'Supplier',
        component: () => import(/* webpackChunkName: "supplier" */ '@/views/Supplier'),
      },
      {
        path: '/supplies',
        name: 'Supplies',
        component: () => import(/* webpackChunkName: "supplies" */ '@/views/Supplies'),
      },
      {
        path: '/kardex',
        name: 'Kardex',
        component: () => import(/* webpackChunkName: "supplies" */ '@/views/Kardex'),
      },
      {
        path: '/settings',
        name: 'Settings',
        redirect: { name: "HomeSettings" },
        component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings'),
        beforeEnter: async (to, from, next) => {
          const userStore = useUserStore()
          if (!userStore.user.profile_des || userStore.user.profile_des === 'ADMINISTRADOR') {
            next()
            return
          } else {
            next({ name: 'Dashboard' })
            return
          }
        },
        children: [
          {
            name: 'HomeSettings',
            path: '',
            component: () => import(/* webpackChunkName: "home-settings" */ '@/views/Settings/components/HomeSettings')
          },
          {
            name: 'GeneralSettings',
            path: 'general-settings',
            component: () => import(/* webpackChunkName: "general-settings" */ '@/views/Settings/components/GeneralSettings')
          },
          {
            name: 'BusinessSettings',
            path: 'business-settings',
            component: () => import(/* webpackChunkName: "business-settings" */ '@/views/Settings/components/BusinessSettings')
          },
          {
            name: 'AdvancedSettings',
            path: 'advanced-settings',
            component: () => import(/* webpackChunkName: "business-settings" */ '@/views/Settings/components/AdvancedSettings')
          },
          {
            name: 'UserSettings',
            path: 'user-settings',
            component: () => import(/* webpackChunkName: "user-settings" */ '@/views/Settings/components/UserSettings')
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "waiter-mode" */ '@/views/login'),
    beforeEnter: async (to, from, next) => {
      const userStore = useUserStore()
      await userStore.checkAuthentication()
      if (!userStore.isAuthenticated) {
        next()
        return
      } else {
        next({ name: userStore.user.profile_des === 'MOZO' ? 'WaiterMode' : 'App' })
        return
      }
    }
  },
  {
    path: '/initial-setup',
    name: 'InitialSetup',
    component: () => import(/* webpackChunkName: "waiter-mode" */ '@/InitialSetup'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/waiter-mode',
    name: 'WaiterMode',
    redirect: { name: 'WHome' },
    component: () => import(/* webpackChunkName: "waiter-mode" */ '@/WaiterMode'),
    meta: {
      requiresAuth: true,
      onlyWaiter: true,
    },
    children: [
      {
        name: 'WHome',
        path: '',
        component: () => import(/* webpackChunkName: "w-home" */ '@/WaiterMode/views/Home'),
      },
      {
        name: 'WOrder',
        path: ':table',
        redirect: { name: 'WCategories' },
        component: () => import(/* webpackChunkName: "w-order" */ '@/WaiterMode/views/Order'),
        children: [
          {
            name: 'WCategories',
            path: '',
            component: () => import(/* webpackChunkName: "w-categories" */ '@/WaiterMode/views/Categories'),
          },
          {
            name: 'WProducts',
            path: ':category',
            component: () => import(/* webpackChunkName: "w-products" */ '@/WaiterMode/views/Products'),
          }
        ]
      }
    ]
  },
  {
    path: '/chef-mode',
    name: 'ChefMode',
    redirect: { name: 'CHome' },
    component: () => import(/* webpackChunkName: "chef-mode" */ '@/ChefMode'),
    meta: {
      requiresAuth: true,
      onlyWaiter: true,
    },
    children: [
      {
        name: 'CHome',
        path: '',
        component: () => import(/* webpackChunkName: "waiter-mode" */ '@/ChefMode/views/Home'),
      }
    ]
  },
  {
    path: "/:catchAll(.*)",
    name: "Page not found",
    component: () => import(/* webpackChunkName: "NotFound" */ "@/views/exception/404"),
    meta: { requireAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const genericsStore = useGenericsStore()
  genericsStore.updateDevice()
  await userStore.checkAuthentication()
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (userStore.isAuthenticated) {
      if (!to.matched.some((record) => record.meta.onlyWaiter)) {
        if (userStore.user.profile_des === 'MOZO') {
          next({ name: genericsStore.device === 'desktop' ? 'TableHome' : 'WaiterMode' })
          return
        } else if (userStore.user.profile_des === 'COCINERO') {
          next({ name: 'ChefMode' })
          return
        } else {
          next()
          return}
      } else {
        next()
        return
      }
    } else {
      next({ name: 'Login' })
      return
    }
  } else {
    next()
    return
  }
})

export default router
