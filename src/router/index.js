import { createRouter, createWebHistory } from "vue-router";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { retrieveCurrentTill } from "@/api/modules/tills";

export const routes = [
  {
    path: "",
    name: "App",
    redirect: { name: "Dashboard" },
    component: () => import("@/layout/index.vue"),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () =>
            import("@/views/Dashboard/index.vue")
      },
      {
        path: "/customer",
        name: "Customer",
        meta: {
          requiredPerm: "view_customer"
        },
        component: () =>
            import(/* webpackChunkName: "customer" */ "@/views/Customer/index.vue")
      },
      {
        path: "/birthday",
        name: "Cums",
        component: () =>
            import(/* webpackChunkName: "customer" */ "@/views/Cums/index.vue")
      },
      {
        path: "/anulate",
        name: "Anulate",
        component: () =>
            import(/* webpackChunkName: "customer" */ "@/views/Anulate/ViewAnulate.vue")
      },
      {
        path: "/orders",
        name: "Orders",
        meta: {
          requiredPerm: "view_order"
        },
        component: () =>
            import(/* webpackChunkName: "order" */ "@/views/Order/index.vue")
      },
      {
        path: "/sales",
        name: "Sales",
        meta: {
          requiredPerm: "view_sale"
        },
        component: () => import(/* webpackChunkName: "sale" */ "@/views/Sale/index.vue")
      },
      {
        path: "/credits",
        name: "Credits",
        // meta: {
        //   requiredPerm: "view_sale",
        // },
        component: () =>
            import(/* webpackChunkName: "credits" */ "@/views/Sale/SaleCredits.vue")
      },
      {
        path: "/free-sale",
        name: "FreeSale",
        // meta: {
        //   requiredPerm: "view_sale",
        // },
        component: () => import( "@/views/Sale/FreeSale.vue")
      },
      {
        path: "/till",
        name: "Till",
        redirect: { name: "CurrentTill" },
        component: () => import(/* webpackChunkName: "till" */ "@/views/Till/index.vue"),
        children: [
          {
            path: "",
            name: "CurrentTill",
            meta: {
              requiredPerm: "view_tilldetails"
            },
            component: () =>
                import(
                    /* webpackChunkName: "currentTill" */ "@/views/Till/CurrentTill.vue"
                    ),
            beforeEnter: async(to, from, next) => {
              const tillStore = useTillStore();
              await retrieveCurrentTill().then((response) => {
                if(response.status === 200) {
                  tillStore.currentTillID = response.data.id;
                  tillStore.currentTillOrders = response.data.orders_count;
                }
              }).catch((error) => {
                if(error.response.status === 404) {
                  tillStore.currentTillID = null;
                  tillStore.currentTillOrders = 0;
                }
              });
              tillStore.currentTillID !== null
              ? next()
              : next({ name: "TillList" });
            }
          },
          {
            path: "till-list",
            name: "TillList",
            meta: {
              requiredPerm: "view_till"
            },
            component: () =>
                import(
                    /* webpackChunkName: "till-list" */ "@/views/Till/TillList.vue"
                    )
          },
          {
            path: ":till",
            name: "TillDetails",
            meta: {
              requiredPerm: "view_tilldetails"
            },
            component: () =>
                import(
                    /* webpackChunkName: "till-details" */ "@/views/Till/TillDetails.vue"
                    )
          }
        ]
      },
      {
        path: "/table",
        name: "Table",
        redirect: { name: "TableHome" },
        component: () =>
            import(/* webpackChunkName: "table" */ "@/views/Table/index.vue"),
        meta: {
          onlyWaiter: true
        },
        beforeEnter: async(to, from, next) => {
          const tillStore = useTillStore();
          const userStore = useUserStore();
          await retrieveCurrentTill().then((response) => {
            if(response.status === 200) {
              tillStore.currentTillID = response.data.id;
              tillStore.currentTillOrders = response.data.orders_count;
            }
          }).catch((error) => {
            if(error.response.status === 404) {
              tillStore.currentTillID = null;
              tillStore.currentTillOrders = 0;
            }
          });
          tillStore.currentTillID !== null
          ? next()
          : userStore.user.role === "MOZO"
            ? next()
            : next({ name: "TillList" });
        },
        children: [
          {
            name: "TableHome",
            path: "",
            meta: { requiredPerm: "view_table" },
            component: () => import("@/views/Table/components/TableHome.vue")
          },
          {
            name: "TakeOrder",
            path: "/take-order",
            meta: { requiredPerm: "take_away_order" },
            component: () => import("@/views/Order/components/TakeOrderLayout.vue")
          },
          {
            name: "TableOrder",
            path: ":table",
            meta: { requiredPerm: "view_order" },
            redirect: { name: "ProductCategories" },
            component: () => import("@/views/Table/components/TableOrderLayout.vue" ),
            children: [
              {
                name: "ProductCategories",
                path: "product-categories",
                component: () => import("@/views/Table/components/CategoriesList.vue" )
              },
              {
                name: "CategoriesItems",
                path: "product-categories/:category",
                component: () => import("@/views/Table/components/CategoriesItems.vue")
              },
              {
                name: "TablePayment",
                path: "payment",
                component: () => import("@/views/Table/components/TablePayment.vue")
              }
            ]
          }
        ]
      },
      {
        path: "/product",
        name: "Product",
        meta: {
          requiredPerm: "view_product"
        },
        component: () =>
            import(/* webpackChunkName: "product" */ "@/views/Product/index.vue")
      },
      {
        path: "/shopping",
        name: "Shopping",
        component: () =>
            import(/* webpackChunkName: "shopping" */ "@/views/Shopping/index.vue")
      },
      {
        path: "/supplier",
        name: "Supplier",
        meta: {
          requiredPerm: "view_supplier"
        },
        component: () =>
            import(/* webpackChunkName: "supplier" */ "@/views/Supplier/index.vue")
      },
      {
        path: "/supplies",
        name: "Supplies",
        meta: {
          requiredPerm: "view_supplies"
        },
        component: () =>
            import(/* webpackChunkName: "supplies" */ "@/views/Supplies/index.vue")
      },
      {
        path: "/kardex",
        name: "Kardex",
        redirect: { name: "KardexHome" },
        meta: {
          requiredPerm: "view_kardex"
        },
        component: () =>
            import(/* webpackChunkName: "kardex" */ "@/views/Kardex/index.vue"),
        children: [
          {
            path: "",
            name: "KardexHome",
            component: () =>
                import(
                    /* webpackChunkName: "kardex-by-supply" */ "@/views/Kardex/components/KardexBySupply.vue"
                    )
          },
          {
            path: ":list",
            name: "KardexList",
            component: () =>
                import(
                    /* webpackChunkName: "kardex-list" */ "@/views/Kardex/components/KardexList.vue"
                    ),
            beforeEnter: (to, from) => {
              if(
                  !["products", "supplies"].some(
                      (option) => option === to.params.list
                  )
              ) {
                return from.path === "/" ? { name: "Dashboard" } : false;
              }
            }
          }
        ]
      },
      {
        path: "/settings",
        name: "Settings",
        redirect: { name: "HomeSettings" },
        component: () =>
            import(/* webpackChunkName: "settings" */ "@/views/Settings/index.vue"),
        beforeEnter: async(to, from, next) => {
          const userStore = useUserStore();
          if(!userStore.user.role || userStore.user.role === "ADMINISTRADOR") {
            next();

          } else {
            next(from.path === "/" ? { name: "Dashboard" } : false);

          }
        },
        children: [
          {
            name: "HomeSettings",
            path: "",
            component: () =>
                import(
                    /* webpackChunkName: "home-settings" */ "@/views/Settings/components/HomeSettings.vue"
                    )
          },
          {
            name: "GeneralSettings",
            path: "general-settings",
            /* meta: {
             requiredPerm: "view_supplier",
             }, */
            component: () =>
                import(
                    /* webpackChunkName: "general-settings" */ "@/views/Settings/components/GeneralSettings.vue"
                    )
          },
          {
            name: "BusinessSettings",
            path: "business-settings",
            meta: {
              requiredPerm: "view_business"
            },
            component: () =>
                import(
                    /* webpackChunkName: "business-settings" */ "@/views/Settings/components/BusinessSettings.vue"
                    )
          },
          {
            name: "AdvancedSettings",
            path: "advanced-settings",
            /* meta: {
             requiredPerm: "view_supplier",
             }, */
            component: () =>
                import(
                    /* webpackChunkName: "business-settings" */ "@/views/Settings/components/AdvancedSettings.vue"
                    )
          },
          {
            name: "UserSettings",
            path: "user-settings",
            meta: {
              requiredPerm: "view_user"
            },
            component: () =>
                import(
                    /* webpackChunkName: "user-settings" */ "@/views/Settings/components/UserSettings.vue"
                    )
          }
        ]
      }
    ]
  },
  {
    path: "/login",
    name: "Login",
    component: () => import(/* webpackChunkName: "login" */ "@/views/login/index.vue"),
    beforeEnter: async(to, from, next) => {
      const userStore = useUserStore();
      await userStore.checkAuthentication();
      if(!userStore.isAuthenticated) {
        next();
      } else {
        next({ name: userStore.user.role === "MOZO" ? "WaiterMode" : "App" });
      }
    }
  },
  {
    path: "/initial-setup",
    name: "InitialSetup",
    component: () =>
        import("@/InitialSetup/index.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/waiter-mode",
    name: "WaiterMode",
    redirect: { name: "WHome" },
    component: () =>
        import("@/WaiterMode/index.vue"),
    meta: {
      requiresAuth: true,
      onlyWaiter: true
    },
    children: [
      {
        name: "WHome",
        path: "",
        component: () =>
            import("@/WaiterMode/views/Home.vue")
      },
      {
        name: "WOrder",
        path: ":table",
        redirect: { name: "WCategories" },
        component: () =>
            import(/* webpackChunkName: "w-order" */ "@/WaiterMode/views/Order.vue"),
        children: [
          {
            name: "WCategories",
            path: "",
            component: () =>
                import(
                    /* webpackChunkName: "w-categories" */ "@/WaiterMode/views/Categories.vue"
                    )
          },
          {
            name: "WProducts",
            path: ":category",
            component: () =>
                import(
                    /* webpackChunkName: "w-products" */ "@/WaiterMode/views/Products.vue"
                    )
          }
        ]
      }
    ]
  },
  {
    path: "/chef-mode",
    name: "ChefMode",
    redirect: { name: "CHome" },
    component: () => import(/* webpackChunkName: "chef-mode" */ "@/ChefMode/index.vue"),
    meta: {
      requiresAuth: true,
      onlyWaiter: true
    },
    children: [
      {
        name: "CHome",
        path: "",
        component: () =>
            import(/* webpackChunkName: "waiter-mode" */ "@/ChefMode/views/Home.vue")
      }
    ]
  },
  {
    path: "/:catchAll(.*)", name: "Page not found", redirect: "/",
    meta: { requireAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async(to, from, next) => {
  const userStore = useUserStore();
  const genericsStore = useGenericsStore();
  genericsStore.updateDevice();
  await userStore.checkAuthentication();
  if(to.matched.some((record) => record.meta.requiresAuth)) {
    if(userStore.isAuthenticated) {
      if(to.matched.some((record) => record.meta.requiredPerm)) {
        if(to.matched.some((record) => userStore.hasPermission(record.meta.requiredPerm))) {
          if(!to.matched.some((record) => record.meta.onlyWaiter)) {
            if(userStore.user.role === "MOZO") {
              next({
                name:
                    genericsStore.device === "desktop"
                    ? "TableHome"
                    : "WaiterMode"
              });
              return;
            } else if(userStore.user.role === "COCINERO") {
              next({ name: "ChefMode" });
              return;
            } else {
              next();
              return;
            }
          } else {
            next();
            return;
          }
        } else {
          next(from.path === "/" ? { name: "Dashboard" } : false);
          window.location.reload();
          return;
        }
      } else {
        next();
        return;
      }
    } else {
      next({ name: "Login" });
      return;
    }
  } else {
    next();
    return;
  }
});

export default router;
