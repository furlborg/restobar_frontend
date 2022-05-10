<template>
  <div id="AdvancedSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración Avanzada</n-text>
      </template>
    </n-page-header>
    <!-- <n-tabs type="card">
      <n-tab-pane name="printing" tab="Impresiones">
        <n-grid responsive="screen" cols="1 s:1 m:2 l:2 xl:2 2xl:2">
          <n-form></n-form>
        </n-grid>
      </n-tab-pane>
    </n-tabs> -->
    <n-card>
      <n-text class="fs-4">Impresiones</n-text>
      <n-form class="mt-2" :disabled="!editMode">
        <n-grid
          responsive="screen"
          cols="6 s:6 m:12 l:12 xl:24 2xl:24"
          :x-gap="12"
        >
          <n-form-item-gi :span="3" label="Formato ticket pedidos">
            <n-select
              v-model:value="businessSettings.printer.kitchen_printer_format"
              :options="printOptions"
            ></n-select>
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Formato ticket caja">
            <n-select
              v-model:value="businessSettings.printer.invoice_printer_format"
              :options="printOptions"
            ></n-select>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Ventas</n-text>
        <n-grid
          class="mt-2"
          responsive="screen"
          cols="6 s:6 m:12 l:12 xl:24 2xl:24"
          x-gap="12"
        >
          <n-form-item-gi :span="3" label="Formato ticket pedidos">
            <n-select
              v-model:value="businessSettings.sale.default_invoice"
              :options="invoiceOptions"
            ></n-select>
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-checkbox v-model:checked="businessSettings.sale.auto_send"
              >Auto envío CPE</n-checkbox
            >
          </n-form-item-gi>
        </n-grid>
        <n-space justify="end">
          <n-space>
            <n-button
              :type="editMode ? 'info' : 'warning'"
              secondary
              @click="
                !editMode ? (editMode = true) : performUpdateBusinessSettings()
              "
              >{{ editMode ? "Guardar" : "Editar" }}</n-button
            >
            <n-button
              type="error"
              secondary
              :disabled="!editMode"
              @click="resetSettings"
              >Cancelar</n-button
            >
          </n-space>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { useSettingsStore } from "@/store/modules/settings";
import { updateBusinessSettings } from "@/api/modules/business";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "AdvancedSettings",
  setup() {
    const router = useRouter();
    const settingsStore = useSettingsStore();
    const message = useMessage();
    const businessSettings = ref(cloneDeep(settingsStore.businessSettings));
    const editMode = ref(false);

    const printOptions = [
      {
        label: "80 mm",
        value: 80,
      },
      {
        label: "58 mm",
        value: 58,
      },
    ];

    const invoiceOptions = [
      {
        label: "FACTURA",
        value: 1,
      },
      {
        label: "BOLETA",
        value: 3,
      },
      {
        label: "N. VENTA",
        value: 80,
      },
    ];

    const performUpdateBusinessSettings = () => {
      updateBusinessSettings(businessSettings.value)
        .then((response) => {
          if (response.status === 202) {
            message.success("Actualizado correctamente!");
            settingsStore.business_settings = response.data;
            editMode.value = false;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    const resetSettings = () => {
      businessSettings.value = cloneDeep(settingsStore.businessSettings);
      editMode.value = false;
    };

    return {
      handleBack,
      printOptions,
      invoiceOptions,
      businessSettings,
      performUpdateBusinessSettings,
      editMode,
      resetSettings,
    };
  },
});
</script>

<style>
</style>