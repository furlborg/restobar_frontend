<template>
  <n-modal
      class="w-50"
      preset="card"
      :title="modalTitle"
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
                <n-input v-model:value="customer.names" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Tipo Documento" :span="4">
                <n-select v-model:value="customer.doc_type" :options="documentOptions" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Nº Documento" :span="4">
                <n-input-number v-model:value="customer.doc_num" :show-button="false" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Género" :span="4">
                <n-radio-group v-model:value="customer.gender" name="genderGroup">
                  <n-radio-button key="gender" value="F">F</n-radio-button>
                  <n-radio-button key="gender" value="M">M</n-radio-button>
                </n-radio-group>
              </n-form-item-gi>
              <n-form-item-gi label="Correo" :span="12">
                <n-input v-model:value="customer.email" placeholder="" />
              </n-form-item-gi>
              <n-form-item-gi label="Fecha de Nacimiento" :span="6">
                <n-date-picker v-model:value="customer.birthdate" type="date" placeholder="" clearable></n-date-picker>
              </n-form-item-gi>
              <n-form-item-gi label="Celular" :span="6">
                <n-input-number  v-model:value="customer.phone" :show-button="false" placeholder="" />
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
import {documentOptions} from "@/utils/constants"
import {retrieveCustomer} from "@/api/modules/customer"
import {useMessage} from "naive-ui"

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
    idCustomer: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const message = useMessage()
    const {idCustomer} = toRefs(props)
    const modalTitle = ref('Registrar Cliente')
    const customer = ref({
      names: null,
      doc_type: null,
      doc_num: null,
      email: null,
      phone: null,
      birthdate: null,
      gender: null,
    })
    const isLoadingData = ref(false)

    watch(idCustomer, () => {
      if (idCustomer.value !== 0) {
        isLoadingData.value = true
        modalTitle.value = 'Modificar Cliente'
        retrieveCustomer(idCustomer.value)
          .then(response => {
            customer.value=response.data
          })
          .catch(error => {
            console.error(error)
            message.error('Algo salió mal...')
          })
          .finally(() => {
            isLoadingData.value = false
          })
      } else {
        customer.value = {
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
      modalTitle,
      customer,
      documentOptions,
      isLoadingData,
    }
  }
})
</script>

<style lang="scss" scoped>

</style>