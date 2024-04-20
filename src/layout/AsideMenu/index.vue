<template>
  <n-menu
    :collapsed-width="64"
    :collapsed-icon-size="22"
    :options="menuOptions"
    :collapsed="userStore.user.role !== 'MOZO' ? collapsed : true"
    :value="openKey"
  />
</template>

<script>
import { defineComponent, h, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { renderIcon } from "@/utils";

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

    const menuOptions = computed(() => {
      return [
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
          disabled: !userStore.hasPermission("view_till"),
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
          disabled: !userStore.hasPermission("view_table")
            ? true
            : !tillStore.currentTillID,
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
          disabled: !userStore.hasPermission("view_order"),
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
          disabled: !userStore.hasPermission("view_sale"),
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
          disabled: !userStore.hasPermission("view_product"),
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
          disabled: !userStore.hasPermission("view_supplier"),
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
          disabled: !userStore.hasPermission("view_supplies"),
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
          disabled: !userStore.hasPermission("view_kardex"),
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
          disabled: !userStore.hasPermission("view_customer"),
        },
        {
          label: () =>
            h(
              RouterLink,
              {
                to: { name: "Cums" },
              },
              () => h("span", "Cumpleaños")
            ),
          key: "Cums",
          icon: renderIcon('co-birthday-cake'),
          // disabled: !userStore.hasPermission("view_customer"),
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
          disabled: !userStore.user.role === "ADMINISTRADOR",
        },
      ];
    });

    return {
      userStore,
      menuOptions,
      openKey,
    };
  },
});
</script>

<style scoped></style>
