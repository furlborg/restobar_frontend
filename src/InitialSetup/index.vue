<template>
  <n-card class="vh-100" title="Configuración Inicial">
    <template #action>
      <n-steps :current="current" :status="currentStatus">
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
import { defineComponent } from "vue";

export default defineComponent({
  name: "InitialSetup",
  setup() {
    return {};
  },
});
</script>

<style>
</style>