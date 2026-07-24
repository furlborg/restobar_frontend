<template>
  <n-menu :collapsed-width="64" :collapsed-icon-size="22" :options="menuOptions"
    :collapsed="userStore.user.role !== 'MOZO' ? collapsed : true" :value="openKey" />
</template>

<script setup>
import { h, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useUserStore } from "@/store/modules/user";
import { useTillStore } from "@/store/modules/till";
import { useSettingsStore } from "@/store/modules/settings";
import { renderIcon } from "@/utils";

defineProps({
  collapsed: Boolean,
});
defineOptions({
  name: "AsideMenu",
});
const userStore = useUserStore();
const tillStore = useTillStore();
const settingsStore = useSettingsStore();
const currentRoute = useRoute();

const openKey = computed(() => {
  const matched = currentRoute.matched;
  const getOpenKeys =
    matched && matched.length ? matched.map((item) => item.name) : [];
  return getOpenKeys.length ? getOpenKeys[1] : null;
});

const menuOptions = computed(() => {
  const options = [];
  // if (settingsStore.business_settings?.modules?.show_dashboard ?? true) {
  options.push({
    label: () => h(RouterLink, { to: { name: "Dashboard" } }, () => h("span", "Dashboard")),
    key: "Dashboard",
    icon: renderIcon("md-spacedashboard-twotone"),
  });
  // }

  if ((settingsStore.business_settings?.modules?.show_till ?? true) && userStore.hasPermission("view_till")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Till" } }, () => h("span", "Caja")),
      key: "Till",
      icon: renderIcon("md-pointofsale-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_tables ?? true) && userStore.hasPermission("view_table")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Table" } }, () => h("span", "Mesas")),
      key: "Table",
      icon: renderIcon("md-dining-twotone"),
      disabled: !tillStore.currentTillID,
    });
  }

  if ((settingsStore.business_settings?.modules?.show_orders ?? true) && userStore.hasPermission("view_order")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Orders" } }, () => h("span", "Pedidos")),
      key: "Orders",
      icon: renderIcon("md-pendingactions-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_sales ?? true) && userStore.hasPermission("view_sale")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Sales" } }, () => h("span", "Ventas")),
      key: "Sales",
      icon: renderIcon("md-description-twotone"),
    });
  }

  if (settingsStore.business_settings?.modules?.show_anulates ?? true) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Anulate" } }, () => h("span", "Anulaciones")),
      key: "Anulate",
      icon: renderIcon("md-cancelpresentation-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_products ?? true) && userStore.hasPermission("view_product")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Product" } }, () => h("span", "Productos")),
      key: "Product",
      icon: renderIcon("md-fastfood-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_menus ?? true) && userStore.hasPermission('view_menu')) {
    options.push({
      label: () => h(
        RouterLink,
        { to: { name: 'Menu' } },
        () => h('span', 'Menu')
      ),
      key: 'Menu',
      icon: renderIcon('md-fastfood-twotone'),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_combos ?? true) && userStore.hasPermission('view_combo')) {
    options.push({
      label: () =>
        h(
          RouterLink,
          {
            to: { name: "Combo" },
          },
          () => h("span", "Combos")
        ),
      key: "Combo",
      icon: renderIcon("md-fastfood-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_suppliers ?? true) && userStore.hasPermission("view_supplier")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Supplier" } }, () => h("span", "Proveedores")),
      key: "Supplier",
      icon: renderIcon("md-villa-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_supplies ?? true) && userStore.hasPermission("view_supplies")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Supplies" } }, () => h("span", "Insumos")),
      key: "Supplies",
      icon: renderIcon("md-kitchen-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_kardex ?? true) && userStore.hasPermission("view_kardex")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Kardex" } }, () => h("span", "Kardex")),
      key: "Kardex",
      icon: renderIcon("md-equalizer-twotone"),
    });
  }

  if ((settingsStore.business_settings?.modules?.show_customers ?? true) && userStore.hasPermission("view_customer")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Customer" } }, () => h("span", "Clientes")),
      key: "Customer",
      icon: renderIcon("md-supervisedusercircle-twotone"),
    });
    
    // Cumpleaños is tied to customer view permission natively
    if (settingsStore.business_settings?.modules?.show_birthdays ?? true) {
      options.push({
        label: () => h(RouterLink, { to: { name: "Cums" } }, () => h("span", "Cumpleaños")),
        key: "Cums",
        icon: renderIcon("co-birthday-cake"),
      });
    }
  }

  if ((settingsStore.business_settings?.modules?.show_reports ?? true) && userStore.hasPermission("view_sale")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Reports" } }, () => h("span", "Reportes")),
      key: "Reports",
      icon: renderIcon("md-insertchart-outlined"),
    });
  }

  // if ((settingsStore.business_settings?.modules?.show_settings ?? true) && userStore.hasPermission("view_business")) {
  if (userStore.hasPermission("view_business")) {
    options.push({
      label: () => h(RouterLink, { to: { name: "Settings" } }, () => h("span", "Configuración")),
      key: "Settings",
      icon: renderIcon("md-settings-twotone"),
    });
  }
  // }

  return options;
});
</script>

<style scoped></style>
