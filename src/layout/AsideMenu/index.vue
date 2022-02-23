<template>
  <n-menu
    :collapsed-width="64"
    :collapsed-icon-size="22"
    :options="menuOptions"
    :collapsed="collapsed"
  />
</template>

<script>
import { defineComponent, h } from "vue";
import { RouterLink } from "vue-router";
import { renderIcon } from "@/utils";

export default defineComponent({
  name: "AsideMenu",
  props: {
    collapsed: {
      type: Boolean,
    },
  },
  setup() {
    const menuOptions = [
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
              to: { name: "Table" },
            },
            () => h("span", "Mesas")
          ),
        key: "Table",
        icon: renderIcon("md-dining-twotone"),
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
      },
      {
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
      },
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
      },
    ];
    return {
      menuOptions,
    };
  },
});
</script>

<style scoped>
</style>