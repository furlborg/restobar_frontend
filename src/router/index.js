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
    component: () => import("@/layout/LayoutIndex.vue"),
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard/DashboardIndex.vue"),
      },
      {
        path: "/customer",
        name: "Customer",
        meta: {
          requiredPerm: "view_customer",
        },
        component: () => import("@/views/Customer/CustomerIndex.vue"),
      },
      {
        path: "/birthday",
        name: "Cums",
        component: () => import("@/views/Cums/CumsIndex.vue"),
      },
      {
        path: "/anulate",
        name: "Anulate",
        component: () => import("@/views/Anulate/ViewAnulate.vue"),
      },
      {
        path: "/orders",
        name: "Orders",
        meta: {
          requiredPerm: "view_order",
        },
        component: () => import("@/views/Order/OrderIndex.vue"),
      },
      {
        path: "/sales",
        name: "Sales",
        meta: {
          requiredPerm: "view_sale",
        },
        component: () => import("@/views/Sale/SaleIndex.vue"),
      },
      {
        path: "/menus",
        name: "Menu",
        meta: {
          requiredPerm: "view_menu",
        },
        component: () => import("@/views/Menu/MenuIndex.vue"),
      },
      {
        path: "/combos",
        name: "Combo",
        meta: {
          requiredPerm: "view_combo",
        },
        component: () => import("@/views/Combo/ComboIndex.vue"),
      },
      {
        path: "/reports",
        name: "Reports",
        meta: {
          requiredPerm: "view_sale", // ajustar si existe un permiso específico de reportes
        },
        component: () => import("@/views/Reports/ReportsIndex.vue"),
        children: [
          {
            path: "products-sold",
            name: "ProductsSoldReport",
            component: () =>
              import("@/views/Reports/components/ProductsSold.vue"),
          },
          {
            path: "cash-flow",
            name: "CashFlowReport",
            component: () =>
              import("@/views/Reports/components/CashReport.vue"),
          },
          {
            path: "sales-by-date",
            name: "SalesByDateReport",
            component: () =>
              import("@/views/Reports/components/SalesByDate.vue"),
          },
          {
            path: "sales-detailed",
            name: "SalesDetailedReport",
            component: () =>
              import("@/views/Reports/components/SalesDetailed.vue"),
          },
          {
            path: "sales-record",
            name: "SalesRecordReport",
            component: () =>
              import("@/views/Reports/components/SalesRecord.vue"),
          },
        ],
      },
      {
        path: "/credits",
        name: "Credits",
        component: () => import("@/views/Sale/SaleCredits.vue"),
      },
      {
        path: "/free-sale",
        name: "FreeSale",
        component: () => import("@/views/Sale/FreeSale.vue"),
      },
      {
        path: "/till",
        name: "Till",
        redirect: { name: "CurrentTill" },
        component: () => import("@/views/Till/CurrentTillIndex.vue"),
        children: [
          {
            path: "",
            name: "CurrentTill",
            meta: {
              requiredPerm: "view_tilldetails",
            },
            component: () => import("@/views/Till/CurrentTill.vue"),
            beforeEnter: async (to, from, next) => {
              const tillStore = useTillStore();
              await retrieveCurrentTill()
                .then((response) => {
                  if (response.status === 200) {
                    tillStore.currentTillID = response.data.id;
                    tillStore.currentTillOrders = response.data.orders_count;
                  }
                })
                .catch((error) => {
                  if (error.response.status === 404) {
                    tillStore.currentTillID = null;
                    tillStore.currentTillOrders = 0;
                  }
                });
              tillStore.currentTillID !== null
                ? next()
                : next({ name: "TillList" });
            },
          },
          {
            path: "till-list",
            name: "TillList",
            meta: {
              requiredPerm: "view_till",
            },
            component: () => import("@/views/Till/TillList.vue"),
          },
          {
            path: ":till",
            name: "TillDetails",
            meta: {
              requiredPerm: "view_tilldetails",
            },
            component: () => import("@/views/Till/TillDetails.vue"),
          },
        ],
      },
      {
        path: "/table",
        name: "Table",
        redirect: { name: "TableHome" },
        component: () => import("@/views/Table/TableIndex.vue"),
        meta: {
          onlyWaiter: true,
        },
        beforeEnter: async (to, from, next) => {
          const tillStore = useTillStore();
          const userStore = useUserStore();
          await retrieveCurrentTill()
            .then((response) => {
              if (response.status === 200) {
                tillStore.currentTillID = response.data.id;
                tillStore.currentTillOrders = response.data.orders_count;
              }
            })
            .catch((error) => {
              if (error.response.status === 404) {
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
            component: () => import("@/views/Table/components/TableHome.vue"),
          },
          {
            name: "TakeOrder",
            path: "take-order",
            meta: { requiredPerm: "take_away_order" },
            redirect: { name: "CategoriesOrder" },
            component: () =>
              import("@/views/Order/components/TakeOrderLayout.vue"),
            children: [
              {
                name: "CategoriesOrder",
                path: "order-items",
                component: () =>
                  import("@/views/Order/components/CategoriesList.vue"),
              },
              {
                name: "CategoriesOrderItems",
                path: "order-items/:category_id",
                component: () =>
                  import("@/views/Order/components/CategoriesItem.vue"),
              },
            ],
          },
          {
            name: "TableOrder",
            path: ":table",
            meta: {
              requiredPerm: "view_order",
            },
            redirect: { name: "ProductCategories" },
            component: () =>
              import("@/views/Table/components/TableOrderLayout.vue"),
            children: [
              {
                name: "ProductCategories",
                path: "product-categories",
                component: () =>
                  import("@/views/Table/components/CategoriesList.vue"),
              },
              {
                name: "CategoriesItems",
                path: "product-categories/:category",
                component: () =>
                  import("@/views/Table/components/CategoriesItems.vue"),
              },
              {
                name: "TablePayment",
                path: "payment",
                component: () =>
                  import("@/views/Table/components/TablePayment.vue"),
              },
            ],
          },
        ],
      },
      {
        path: "/product",
        name: "Product",
        meta: {
          requiredPerm: "view_product",
        },
        component: () => import("@/views/Product/ProductIndex.vue"),
      },
      {
        path: "/shopping",
        name: "Shopping",
        component: () => import("@/views/Shopping/ShoppingIndex.vue"),
      },
      {
        path: "/supplier",
        name: "Supplier",
        meta: {
          requiredPerm: "view_supplier",
        },
        component: () => import("@/views/Supplier/SupplierIndex.vue"),
      },
      {
        path: "/supplies",
        name: "Supplies",
        meta: {
          requiredPerm: "view_supplies",
        },
        component: () => import("@/views/Supplies/SuppliesIndex.vue"),
      },
      {
        path: "/kardex",
        name: "Kardex",
        redirect: { name: "KardexHome" },
        meta: {
          requiredPerm: "view_kardex",
        },
        component: () => import("@/views/Kardex/KardexIndex.vue"),
        children: [
          {
            path: "",
            name: "KardexHome",
            component: () =>
              import("@/views/Kardex/components/KardexBySupply.vue"),
          },
          {
            path: ":list",
            name: "KardexList",
            component: () => import("@/views/Kardex/components/KardexList.vue"),
            beforeEnter: (to, from) => {
              if (
                !["products", "supplies"].some(
                  (option) => option === to.params.list,
                )
              ) {
                return from.path === "/" ? { name: "Dashboard" } : false;
              }
            },
          },
        ],
      },
      {
        path: "/settings",
        name: "Settings",
        redirect: { name: "HomeSettings" },
        component: () => import("@/views/Settings/index.vue"),
        beforeEnter: async (to, from, next) => {
          const userStore = useUserStore();
          if (!userStore.user.role || userStore.user.role === "ADMINISTRADOR") {
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
              import("@/views/Settings/components/HomeSettings.vue"),
          },
          {
            name: "GeneralSettings",
            path: "general-settings",

            component: () =>
              import("@/views/Settings/components/GeneralSettings.vue"),
          },
          {
            name: "BusinessSettings",
            path: "business-settings",
            meta: {
              requiredPerm: "view_business",
            },
            component: () =>
              import("@/views/Settings/components/BusinessSettings.vue"),
          },
          {
            name: "DocumentCounters",
            path: "document-counters",
            component: () =>
              import("@/views/Settings/components/DocumentCounters.vue"),
          },
          {
            name: "AdvancedSettings",
            path: "advanced-settings",

            component: () =>
              import("@/views/Settings/components/AdvancedSettings.vue"),
          },
          {
            name: "UserSettings",
            path: "user-settings",
            meta: {
              requiredPerm: "view_user",
            },
            component: () =>
              import("@/views/Settings/components/UserSettings.vue"),
          },
          {
            name: "ConsultationSunat",
            path: "consultation-sunat",
            component: () =>
              import("@/views/Settings/components/ConsultationSunat.vue"),
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/LoginIndex.vue"),
    beforeEnter: async (to, from, next) => {
      const userStore = useUserStore();
      await userStore.checkAuthentication();
      if (!userStore.isAuthenticated) {
        next();
      } else {
        next({ name: userStore.user.role === "MOZO" ? "WaiterMode" : "App" });
      }
    },
  },
  {
    path: "/initial-setup",
    name: "InitialSetup",
    component: () => import("@/InitialSetup/InitialSetupIndex.vue"),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/waiter-mode",
    name: "WaiterMode",
    redirect: { name: "WHome" },
    component: () => import("@/WaiterMode/WaiterModeIndex.vue"),
    meta: {
      requiresAuth: true,
      onlyWaiter: true,
    },
    children: [
      {
        name: "WHome",
        path: "",
        component: () => import("@/WaiterMode/views/WaiterHome.vue"),
      },
      {
        name: "WOrder",
        path: ":table",
        redirect: { name: "WCategories" },
        component: () => import("@/WaiterMode/views/WaiterOrder.vue"),
        children: [
          {
            name: "WCategories",
            path: "",
            component: () => import("@/WaiterMode/views/Categories.vue"),
          },
          {
            name: "WCombos",
            path: "combos",
            component: () => import("@/WaiterMode/views/WaiterCombos.vue"),
          },
          {
            name: "WProducts",
            path: ":category",
            component: () => import("@/WaiterMode/views/Products.vue"),
          },
        ],
      },
    ],
  },
  {
    path: "/chef-mode",
    name: "CMode",
    redirect: { name: "CHome" },
    component: () => import("@/ChefMode/ChefIndex.vue"),
    meta: {
      requiresAuth: true,
      onlyWaiter: true,
    },
    children: [
      {
        name: "CHome",
        path: "",
        component: () => import("@/ChefMode/views/ChefHome.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)",
    name: "Page not found",
    redirect: "/",
    meta: { requireAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const genericsStore = useGenericsStore();
  genericsStore.updateDevice();
  await userStore.checkAuthentication();

  console.log("Navigating to:", to.name);
  console.log("User authenticated:", userStore.user);

  // Original authentication logic
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (userStore.isAuthenticated) {
      if (to.matched.some((record) => record.meta.requiredPerm)) {
        if (
          to.matched.some((record) =>
            userStore.hasPermission(record.meta.requiredPerm),
          )
        ) {
          if (!to.matched.some((record) => record.meta.onlyWaiter)) {
            if (userStore.user.role === "MOZO") {
              next({
                name:
                  genericsStore.device === "desktop"
                    ? "TableHome"
                    : "WaiterMode",
              });
              return;
            } else if (userStore.user.role === "COCINERO") {
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
