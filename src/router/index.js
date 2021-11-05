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
    component: () => import(/* webpackChunkName: "customer" */ '@/views/Customer')
  },
  {
    path: '/till',
    name: 'Till',
    component: () => import(/* webpackChunkName: "till" */ '@/views/Till')
  },
  {
    path: '/till-list',
    name: 'TillList',
    component: () => import(/* webpackChunkName: "till-list" */ '@/views/Till/TillList')
  },
  {
    path: '/table',
    name: 'Table',
    redirect: { name: "TableHome"},
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
        redirect: { name: "ProductCategories"},
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
            name:"TablePayment",
            path:"payment",
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
    redirect: { name: "HomeSettings"},
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
        component: () => import(/* webpackChunkName: "User-settings" */ '@/views/Settings/components/UserSettings')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
