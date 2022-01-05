<template>
  <div id="UserSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración de Usuarios</n-text>
      </template>
    </n-page-header>
    <n-card title="Usuarios" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button type="primary" @click="showModal = true" secondary>
          <template #icon>
            <n-icon>
              <v-icon name="la-user-plus-solid" />
            </n-icon>
          </template>
          Crear
        </n-button>
      </template>
      <n-data-table :columns="tableColumns" :data="users" />
    </n-card>
    <!-- Customer Modal -->
    <user-settings-modal
      v-model:show="showModal"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog, NButton } from "naive-ui";
import { createUserColumns } from "@/utils/constants";
import UserSettingsModal from "./UserSettingsModal";

export default defineComponent({
  name: "UserSettings",
  components: {
    UserSettingsModal,
  },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const showModal = ref(false);
    const users = ref([
      {
        id: 1,
        username: "admin",
        email: "admin@mail.com",
        profile: "Administrador",
        sucursal: "Sucursal 1",
      },
    ]);

    const onCloseModal = () => {
      document.title = "Productos | App";
      // idProduct.value = 0
    };

    const onSuccess = () => {
      showModal.value = false;
      onCloseModal();
      // loadProductsData()
    };

    onMounted(() => {
      document.title = "Productos | App";
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      handleBack,
      showModal,
      onCloseModal,
      onSuccess,
      users,
      tableColumns: createUserColumns({
        editUser(rowData) {
          message.info("Editar usuario " + rowData.id);
          /* showModal.value = true
                    idCustomer.value = rowData.id */
        },
        deleteUser(rowData) {
          dialog.error({
            title: "Deshabilitando usuario",
            content: "¿Está seguro?",
            positiveText: "Sí",
            onPositiveClick: () => {
              message.success("Usuario " + rowData.id + " eliminado");
              /* performDisableCustomer(rowData.id) */
            },
          });
        },
      }),
    };
  },
});
</script>

<style>
</style>