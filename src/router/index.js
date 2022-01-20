import { useTillStore } from "@/store/modules/till";
import { createRouter, createWebHistory } from 'vue-router'
import { retrieveCurrentTill } from '@/api/modules/tills'

const routes = [
  {
    path: "",
    name: "App",
    redirect: { name: "Dashboard" },
    component: () => import(/* webpackChunkName: "dashboard" */ '@/layout'),
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
        path: '/till',
        name: 'Till',
        component: () => import(/* webpackChunkName: "till" */ '@/views/Till'),
        beforeEnter: async (to, from, next) => {
          const tillStore = useTillStore()
          await retrieveCurrentTill()
            .then(response => {
              if (response.status === 200) {
                tillStore.currentTillID = response.data
              }
            })
            .catch(error => {
              if (error.response.status !== 404) {
                console.error('Algo salió mal...')
                tillStore.currentTillID = null
              }
            })
          tillStore.currentTillID !== null ? next() : next({ name: 'TillList' })
        }
      },
      {
        path: '/till-list',
        name: 'TillList',
        component: () => import(/* webpackChunkName: "till-list" */ '@/views/Till/TillList')
      },
      {
        path: '/table',
        name: 'Table',
        redirect: { name: "TableHome" },
        component: () => import(/* webpackChunkName: "table" */ '@/views/Table'),
        children: [
          {
            name: "TableHome",
            path: '',
            component: () => import(/* webpackChunkName: "table-home" */ '@/views/Table/components/TableHome'),
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
                component: () => import(/* webpackChunkName: "table-order" */ '@/views/Table/components/CategoriesList'),
              },
              {
                name: "CategoriesItems",
                path: "product-categories/:category",
                component: () => import(/* webpackChunkName: "table-order" */ '@/views/Table/components/CategoriesItems'),
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
        path: '/settings',
        name: 'Settings',
        redirect: { name: "HomeSettings" },
        component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings'),
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
            name: 'UserSettings',
            path: 'user-settings',
            component: () => import(/* webpackChunkName: "user-settings" */ '@/views/Settings/components/UserSettings')
          }
        ]
      }
    ]
  },
  {
    path: '/initial-setup',
    name: 'InitialSetup',
    component: () => import(/* webpackChunkName: "waiter-mode" */ '@/InitialSetup'),
  },
  {
    path: '/waiter-mode',
    name: 'WaiterMode',
    redirect: { name: 'WHome' },
    component: () => import(/* webpackChunkName: "waiter-mode" */ '@/WaiterMode'),
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
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
