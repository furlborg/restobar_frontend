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
        <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
          <n-form-item-gi :span="3" label="QZ Host IP">
            <n-input v-model:value="businessSettings.qz_config.host" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Signature">
            <n-input type="textarea" v-model:value="businessSettings.qz_config.signature" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Certificate">
            <n-input type="textarea" v-model:value="businessSettings.qz_config.certificate">
              >Mostrar categoría producto</n-input>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Formatos</n-text>
        <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" :x-gap="12">
          <n-form-item-gi :span="3" label="Formato ticket pedidos">
            <n-select v-model:value="businessSettings.printer.kitchen_printer_format" :options="printOptions" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Formato ticket caja">
            <n-select v-model:value="businessSettings.printer.invoice_printer_format" :options="printOptions" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra cabecera">
            <n-input-number v-model:value="businessSettings.printer.header_font_size" placeholder="" :min="6"
              :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra subtitulo">
            <n-input-number v-model:value="businessSettings.printer.sub_header_font_size" placeholder="" :min="6"
              :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra cuerpo">
            <n-input-number v-model:value="businessSettings.printer.body_font_size" placeholder="" :min="6" :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra pie de página">
            <n-input-number v-model:value="businessSettings.printer.footer_font_size" placeholder="" :min="6"
              :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra delivery">
            <n-input-number v-model:value="businessSettings.printer.delivery_ticket_font_size" placeholder="" :min="6"
              :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Tamaño letra pre-cuenta">
            <n-input-number v-model:value="
              businessSettings.printer.pre_account_ticket_font_size
            " placeholder="" :min="6" :max="20" />
          </n-form-item-gi>
          <n-form-item-gi :span="4">
            <n-checkbox v-model:checked="businessSettings.printer.show_cat">Mostrar categoría producto</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Formato ticket pedidos">
            <n-select v-model:value="businessSettings.printer.kitchen_ticket_format"
              :options="kitchenPrinterFormatOptions" />
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-checkbox v-model:checked="businessSettings.printer.print_delivery_ticket">Imprimir ticket delivery
            </n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="4">
            <n-checkbox v-model:checked="businessSettings.printer.show_delivery_kitchen">Mostrar información de delivery
            </n-checkbox>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Pedidos</n-text>
        <n-grid class="mt-2" responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" x-gap="12">
          <n-form-item-gi :span="3">
            <n-checkbox v-model:checked="businessSettings.order.order_customer_name">Nombre de Cliente</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-checkbox v-model:checked="businessSettings.order.select_order_user">Seleccionar Usuario</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-checkbox v-model:checked="businessSettings.order.table_order_total">Mostrar total de pedido</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="4">
            <n-checkbox v-model:checked="businessSettings.order.required_null_reason">Motivo de anulación de pedido
              requerido</n-checkbox>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Reportes</n-text>
        <n-grid class="mt-2" responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" x-gap="12">
          <n-form-item-gi :span="6" label="Correos">
            <n-select v-model:value="businessSettings.reports.report_emails" filterable multiple tag placeholder=""
              :show-arrow="false" :show="false" />
          </n-form-item-gi>
          <n-form-item-gi :span="4">
            <n-checkbox v-model:checked="businessSettings.reports.auto_send_mail">Auto envío (Cierre de caja)
            </n-checkbox>
          </n-form-item-gi>
        </n-grid>
        <n-text class="fs-4">Ventas</n-text>
        <n-grid class="mt-2" responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" x-gap="12">
          <n-form-item-gi :span="3" label="Documento por defecto">
            <n-select v-model:value="businessSettings.sale.default_invoice" :options="invoiceOptions" />
          </n-form-item-gi>
          <n-form-item-gi :span="5" label="Afectación por defecto">
            <n-select v-model:value="businessSettings.sale.default_affectation"
              :options="productStore.affectationsOptions" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Valor IGV (%)" placeholder="" disabled>
            <n-input-number v-model:value="igv_percentage" :show-button="false" :min="0" :max="100" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="3" label="Valor ICBPER">
            <n-input v-model:value="businessSettings.sale.icbper_tax" />
          </n-form-item-gi>
          <n-form-item-gi :span="2">
            <n-checkbox v-model:checked="businessSettings.sale.auto_send">Auto envío CPE</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="4">
            <n-checkbox v-model:checked="businessSettings.sale.required_null_reason">Motivo de anulación de venta
              requerido</n-checkbox>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Caja</n-text>
        <n-grid class="mt-2" responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" x-gap="12">
          <n-form-item-gi :span="6">
            <n-checkbox v-model:checked="businessSettings.till.closure_cash_total">
              Monto efectivo requerido (Cierre de caja)
            </n-checkbox>
          </n-form-item-gi>
        </n-grid>
        <n-divider />
        <n-text class="fs-4">Clientes</n-text>
        <n-grid class="mt-2" responsive="screen" cols="6 s:6 m:12 l:12 xl:24 2xl:24" x-gap="12">
          <n-form-item-gi :span="6" label="API Token">
            <n-input type="textarea" v-model:value="businessSettings.customers.api_token" />
          </n-form-item-gi>
        </n-grid>
        <n-space justify="end">
          <n-space>
            <n-button :type="editMode ? 'info' : 'warning'" secondary @click="
              !editMode ? (editMode = true) : performUpdateBusinessSettings()
            ">{{ editMode ? "Guardar" : "Editar" }}</n-button>
            <n-button type="error" secondary :disabled="!editMode" @click="resetSettings">Cancelar</n-button>
          </n-space>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";
import { updateBusinessSettings } from "@/api/modules/business";
import { cloneDeep } from "@/utils";

export default defineComponent({
  name: "AdvancedSettings",
  setup() {
    const router = useRouter();
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();
    const message = useMessage();
    const businessSettings = ref(cloneDeep(settingsStore.businessSettings));
    const editMode = ref(false);

    const igv_percentage = computed({
      get: () => Math.round(Number(businessSettings.value.sale.igv_tax) * 100),
      set: v => businessSettings.value.sale.igv_tax = v / 100
    })

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

    const kitchenPrinterFormatOptions = [
      {
        label: "FORMATO 1",
        value: 1,
      },
      {
        label: "FORMATO 2",
        value: 2,
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
      igv_percentage,
      handleBack,
      printOptions,
      invoiceOptions,
      productStore,
      businessSettings,
      performUpdateBusinessSettings,
      editMode,
      resetSettings,
      kitchenPrinterFormatOptions,
    };
  },
});
</script>

<style>

</style>