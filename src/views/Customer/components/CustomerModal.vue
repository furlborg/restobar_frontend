<template>
  <n-modal
      class="w-50"
      preset="card"
      title="Nuevo Cliente"
      :mask-closable="false"
      :show="show"
      :on-close="() => $emit('update:show', !show)"
  >
    <n-form>
      <n-tabs type="line">
        <n-tab-pane name="info" tab="Información General">
          <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:12 2xl:12" :x-gap="12">
            <n-form-item-gi label="Nombres" :span="6">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Tipo Documento" :span="3">
              <n-select :options="documentOptions" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Nº Documento" :span="3">
              <n-input-number :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Correo" :span="6">
              <n-input placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Celular" :span="3">
              <n-input-number :show-button="false" placeholder="" />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha de Nacimiento" :span="3">
              <n-date-picker type="date" placeholder="" clearable></n-date-picker>
            </n-form-item-gi>
            <n-form-item-gi label="Género">
              <n-radio-group name="genderGroup">
                <n-radio-button key="gender" value="F">F</n-radio-button>
                <n-radio-button key="gender" value="M">M</n-radio-button>
              </n-radio-group>
            </n-form-item-gi>
          </n-grid>
        </n-tab-pane>
        <n-tab-pane name="addresses" tab="Direcciones">
          <n-grid responsive="screen" cols="6 s:6 m:12 l:12 xl:12 2xl:12" :x-gap="12">
            <n-form-item-gi label="Direcciones" :span="12">
              <n-input placeholder=""></n-input>
            </n-form-item-gi>
          </n-grid>
        </n-tab-pane>
      </n-tabs>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button type="success" @click="">Registrar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import {defineComponent} from "vue"

export default defineComponent({
  name: "CustomerModal",
  emits: [
    'update:show',
  ],
  props: {
    show : {
      type: Boolean,
      default: false,
    }
  },
  setup() {
    return {}
  }
})
</script>

<style lang="scss" scoped>

</style>