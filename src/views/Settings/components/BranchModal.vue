<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-50': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Crear sucursal nueva"
    :show="show"
    :on-close="
      () => {
        $emit('update:show');
        branch = {};
      }
    "
  >
    <n-spin :show="isLoading">
      <n-form>
        <n-grid
          responsive="screen"
          cols="12 s:12 m:12 l:12 xl:24 2xl:24"
          :x-gap="12"
        >
          <n-form-item-gi :span="12" label="Descripción">
            <n-input v-model:value="branch.description" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Celular">
            <n-input v-model:value="branch.phone" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="Email">
            <n-input v-model:value="branch.email" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="Ubigeo">
            <n-input-group>
              <n-input-group-label>PE</n-input-group-label>
              <n-cascader
                separator=" ⏵ "
                :options="customerStore.ubigee"
                v-model:value="branch.ubigeo"
                check-strategy="child"
              />
            </n-input-group>
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="Dirección comercial">
            <n-input v-model:value="branch.commercial_address" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="Información adicional">
            <n-input
              type="textarea"
              v-model:value="branch.extra_info"
              placeholder=""
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button type="success" @click="performCreateBranch">Crear</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { useCustomerStore } from "@/store/modules/customer";
import { createBranch } from "@/api/modules/business";

export default defineComponent({
  name: "BranchModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const genericsStore = useGenericsStore();
    const customerStore = useCustomerStore();
    const isLoading = ref(false);
    const message = useMessage();
    const branch = ref({});

    const performCreateBranch = () => {
      isLoading.value = true;
      createBranch(branch.value)
        .then((response) => {
          if (response.status === 201) {
            isLoading.value = false;
            emit("on-success");
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algos salió mal...");
        })
        .finally(() => (isLoading.value = false));
    };

    return {
      genericsStore,
      isLoading,
      customerStore,
      branch,
      performCreateBranch,
    };
  },
});
</script>

<style>
</style>