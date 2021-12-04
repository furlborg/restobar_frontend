<template>
  <n-card class="vh-100" :segmented="{ content: 'hard', action: 'hard' }">
    <template #header
      ><n-text class="fs-1">Configuración Inicial</n-text></template
    >
    <n-text class="fs-2">Datos de la Empresa</n-text>
    <n-form v-if="current === 1" key="BusinessForm">
      <n-grid
        responsive="screen"
        cols="6 s:6 m:12 l:12 xl:18 2xl:18"
        :x-gap="12"
        :y-gap="12"
      >
        <n-form-item-gi label="RUC" :span="6">
          <n-input-group>
            <n-input v-model:value="business.ruc" :maxlength="11" show-count />
            <n-button
              type="info"
              :disabled="business.ruc.length !== 11"
              secondary
            >
              <v-icon name="md-search-round" />
            </n-button>
          </n-input-group>
        </n-form-item-gi>
        <n-form-item-gi label="Nombre" :span="6">
          <n-input v-model:value="business.name" />
        </n-form-item-gi>
        <n-form-item-gi label="Nombre Comercial" :span="6">
          <n-input v-model:value="business.commercial_name" />
        </n-form-item-gi>
        <n-form-item-gi label="Dirección Fiscal" :span="6">
          <n-input v-model:value="business.fiscal_address" />
        </n-form-item-gi>
        <n-form-item-gi label="Representante Legal" :span="6">
          <n-input v-model:value="business.legal_representative" />
        </n-form-item-gi>
        <n-form-item-gi label="Teléfono" :span="3">
          <n-input v-model:value="business.phone" />
        </n-form-item-gi>
        <n-form-item-gi label="Email" :span="3">
          <n-input v-model:value="business.email" />
        </n-form-item-gi>
      </n-grid>
    </n-form>
    <template #action>
      <n-steps :current="current" :status="status">
        <n-step title="Empresa" description="Datos de la empresa" />
        <n-step
          title="Sucursal principal"
          description="Datos de la sucursal principal"
        />
        <n-step
          title="Lugares de Preparación"
          description="Establecer los lugares de preparación"
        />
      </n-steps>
    </template>
  </n-card>
</template>

<script>
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "InitialSetup",
  setup() {
    const current = ref(1);
    const status = ref("process");
    const business = ref({
      ruc: "",
      name: null,
      commercial_name: null,
      fiscal_address: null,
      legal_representative: null,
      phone: null,
      email: null,
    });

    return { current, status, business };
  },
});
</script>

<style>
</style>