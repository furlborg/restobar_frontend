<template>
  <n-modal
      class="w-50"
      preset="card"
      title="Nuevo Cliente"
      :mask-closable="false"
      :show="show"
      :on-close="() => $emit('update:show', !show)"
  >
    <n-spin :show="isLoadingData">
      <n-form>
        <n-tabs type="line">
          <n-tab-pane name="info" tab="Información General">
            <n-grid responsive="screen" cols="6 s:6 m:12 l:24 xl:24 2xl:24" :x-gap="12">
              <n-form-item-gi label="Nombres" :span="12">
                <n-input v-model:value="costumer.names" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Tipo Documento" :span="4">
                <n-select v-model:value="costumer.doc_type" :options="documentOptions" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Nº Documento" :span="4">
                <n-input-number v-model:value="costumer.doc_num" :show-button="false" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Género" :span="4">
                <n-radio-group v-model:value="costumer.gender" name="genderGroup">
                  <n-radio-button key="gender" value="F">F</n-radio-button>
                  <n-radio-button key="gender" value="M">M</n-radio-button>
                </n-radio-group>
              </n-form-item-gi>
              <n-form-item-gi label="Correo" :span="12">
                <n-input v-model:value="costumer.email" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Fecha de Nacimiento" :span="6">
                <n-date-picker type="date" placeholder="" clearable></n-date-picker>
              </n-form-item-gi>
              <n-form-item-gi label="Celular" :span="6">
                <n-input-number  v-model:value="costumer.phone" :show-button="false" placeholder="" />
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
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button type="success" @click="">Registrar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import {defineComponent, ref, toRefs, watch} from "vue"
import {http} from "@/api"
import {documentOptions} from "@/utils/constants"

export default defineComponent({
  name: "CustomerModal",
  emits: [
    'update:show',
  ],
  props: {
    show : {
      type: Boolean,
      default: false,
    },
    idCostumer: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const {idCostumer} = toRefs(props)
    const costumer = ref({
      names: null,
      doc_type: null,
      doc_num: null,
      email: null,
      phone: null,
      birthdate: null,
      gender: null,
    })
    const isLoadingData = ref(false)

    watch(idCostumer, () => {
      if (idCostumer.value !== 0) {
        isLoadingData.value = true
        http.get(`customers/${idCostumer.value}`)
            .then(response => {
              costumer.value=response.data
            })
            .catch(error => {
            })
            .finally(() => {
              isLoadingData.value = false
            })
      } else {
        costumer.value = {
          names: null,
          doc_type: null,
          doc_num: null,
          email: null,
          phone: null,
          birthdate: null,
          gender: null,
        }
      }
    })

    return {
      costumer,
      documentOptions,
      isLoadingData,
    }
  }
})
</script>

<style lang="scss" scoped>

</style>