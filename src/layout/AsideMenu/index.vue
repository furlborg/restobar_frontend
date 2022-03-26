<template>
  <n-menu
    :collapsed-width="64"
    :collapsed-icon-size="22"
    :options="menuOptions"
    :collapsed="collapsed"
    :value="openKey"
  />
</template>

<script>
import { defineComponent, h, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { renderIcon } from "@/utils";
import { routes } from "@/router";

export default defineComponent({
  name: "AsideMenu",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
  setup() {
    const userStore = useUserStore();
    const tillStore = useTillStore();
    const currentRoute = useRoute();

    const openKey = computed(() => {
      const matched = currentRoute.matched;
      const getOpenKeys =
        matched && matched.length ? matched.map((item) => item.name) : [];
      return getOpenKeys.length ? getOpenKeys[1] : null;
    });

    const routesToOptions = [
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Dashboard" },
            },
            () => h("span", "Dashboard")
          ),
        key: "Dashboard",
        icon: renderIcon("md-spacedashboard-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Till" },
            },
            () => h("span", "Caja")
          ),
        key: "Till",
        icon: renderIcon("md-pointofsale-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Table" },
            },
            () => h("span", "Mesas")
          ),
        key: "Table",
        icon: renderIcon("md-dining-twotone"),
        exclude: [],
        tillOpened: true,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Orders" },
            },
            () => h("span", "Pedidos")
          ),
        key: "Orders",
        icon: renderIcon("md-pendingactions-twotone"),
        exclude: [],
        tillOpened: true,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Sales" },
            },
            () => h("span", "Ventas")
          ),
        key: "Sales",
        icon: renderIcon("md-description-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Product" },
            },
            () => h("span", "Productos")
          ),
        key: "Product",
        icon: renderIcon("md-fastfood-twotone"),
        exclude: [],
        tillOpened: false,
      },
      /* {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Shopping" },
            },
            () => h("span", "Compras")
          ),
        key: "Shopping",
        icon: renderIcon("md-shoppingcart-twotone"),
      }, */
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Supplier" },
            },
            () => h("span", "Proveedores")
          ),
        key: "Supplier",
        icon: renderIcon("md-villa-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Supplies" },
            },
            () => h("span", "Insumos")
          ),
        key: "Supplies",
        icon: renderIcon("md-kitchen-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Kardex" },
            },
            () => h("span", "Kardex")
          ),
        key: "Kardex",
        icon: renderIcon("md-equalizer-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Customer" },
            },
            () => h("span", "Clientes")
          ),
        key: "Customer",
        icon: renderIcon("md-supervisedusercircle-twotone"),
        exclude: [],
        tillOpened: false,
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: { name: "Settings" },
            },
            () => h("span", "Configuración")
          ),
        key: "Settings",
        icon: renderIcon("md-settings-twotone"),
        exclude: ["CAJERO"],
        tillOpened: false,
      },
    ];

    const menuOptions = computed(() => {
      let routes = routesToOptions;
      if (!tillStore.currentTillID) {
        routes = routesToOptions.filter((option) => !option.tillOpened);
      }
      return routes.filter(
        (option) =>
          !option.exclude.find((item) => item === userStore.user.profile_des)
      );
    });

    return {
      menuOptions,
      openKey,
    };
  },
});
</script>

<style scoped>
</style>