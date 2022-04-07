<template>
  <n-spin :show="isLoading">
    <n-form
      :disabled="!editBranch"
      :rules="branchOfficeRules"
      :model="branch"
      ref="branchForm"
    >
      <n-grid
        responsive="screen"
        cols="12 s:12 m:12 l:12 xl:24 2xl:24"
        :x-gap="12"
      >
        <n-form-item-gi :span="12" label="Descripción" path="description">
          <n-input v-model:value="branch.description" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="6" label="Celular">
          <n-input v-model:value="branch.phone" placeholder="" />
        </n-form-item-gi>
        <n-form-item-gi :span="6" label="Email">
          <n-input v-model:value="branch.email" placeholder="" />
        </n-form-item-gi>
        <!-- <n-form-item-gi :span="12" label="Dirección fiscal">
        <n-input v-model:value="branch.fiscal_address" placeholder="" />
        </n-form-item-gi> -->
        <n-form-item-gi :span="12" label="Ubigeo" path="ubigeo">
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
        <n-form-item-gi
          :span="12"
          label="Dirección comercial"
          path="commercial_address"
        >
          <n-input v-model:value="branch.commercial_address" placeholder="" />
        </n-form-item-gi>
        <!-- <n-form-item-gi :span="12" label="Sitio web">
        <n-input v-model:value="branch.website" placeholder="" />
        </n-form-item-gi> -->
        <n-form-item-gi :span="12" label="Información adicional">
          <n-input
            type="textarea"
            v-model:value="branch.extra_info"
            placeholder=""
          />
        </n-form-item-gi>
      </n-grid>
      <n-space v-if="!editBranch" justify="end">
        <n-button type="warning" secondary @click="editBranch = true"
          >Editar</n-button
        >
      </n-space>
      <n-space v-else justify="end">
        <n-button
          type="success"
          :loading="isLoading"
          :disabled="isLoading"
          secondary
          @click="performUpdateBranch"
          >Guardar</n-button
        >
        <n-button
          type="error"
          :disabled="isLoading"
          secondary
          @click="cancelBranchEdit"
          >Cancelar</n-button
        >
      </n-space>
    </n-form>
  </n-spin>
</template>

<script>
import { defineComponent, ref, toRefs } from "vue";
import { useMessage } from "naive-ui";
import { useBusinessStore } from "@/store/modules/business";
import { useCustomerStore } from "@/store/modules/customer";
import { updateBranch } from "@/api/modules/business";
import { branchOfficeRules } from "@/utils/constants";

export default defineComponent({
  name: "BranchForm",
  props: {
    branch: {
      type: Object,
      default: () => {},
    },
  },
  emits: ["on-success", "on-cancel"],
  setup(props, { emit }) {
    const customerStore = useCustomerStore();
    const businessStore = useBusinessStore();
    const { branch } = toRefs(props);
    const isLoading = ref(false);
    const message = useMessage();
    const editBranch = ref(false);
    const branchForm = ref(null);

    const performUpdateBranch = async () => {
      branchForm.value.validate(async (errors) => {
        if (!errors) {
          isLoading.value = true;
          await updateBranch(branch.value.id, branch)
            .then((response) => {
              if (response.status === 202) {
                businessStore
                  .refreshBusiness()
                  .then(() => {
                    editBranch.value = false;
                    emit("on-success");
                  })
                  .catch((error) => {
                    console.error(error);
                    message.error("Algo salió mal...");
                  })
                  .finally(() => {
                    isLoading.value = false;
                  });
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            });
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const cancelBranchEdit = () => {
      editBranch.value = false;
      branchForm.value.restoreValidation();
      emit("on-cancel");
    };

    return {
      isLoading,
      editBranch,
      branchForm,
      branchOfficeRules,
      customerStore,
      performUpdateBranch,
      cancelBranchEdit,
    };
  },
});
</script>

<style>
</style>