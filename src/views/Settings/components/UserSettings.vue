<template>
  <div id="UserSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración de Usuarios</n-text>
      </template>
    </n-page-header>
    <n-card title="Usuarios" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-space>
          <n-button
            v-if="userStore.user.is_owner"
            type="warning"
            secondary
            @click="showPassModal = true"
            >Cambiar clave de seguridad</n-button
          >
          <n-button
            v-if="userStore.hasPermission('add_user')"
            type="primary"
            @click="newUser(), (showModal = true)"
            secondary
          >
            <template #icon>
              <n-icon>
                <v-icon name="la-user-plus-solid" />
              </n-icon>
            </template>
            Crear
          </n-button>
        </n-space>
      </template>

      <n-form label-placement="left">
        <n-grid cols="1 xs:1 s:3 m:6" responsive="screen">
          <n-gi>
            <n-input
              placeholder="Buscar"
              @keyup.enter="SearchFilter()"
              v-model:value="textsearch"
              round
            >
              <template #prefix>
                <n-icon style="margin-top: -4px"
                  ><v-icon name="md-search-round"
                /></n-icon>
              </template>
            </n-input>
          </n-gi>
        </n-grid>
      </n-form>

      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="users.results"
        size="small"
        :scroll-x="900"
        :loading="isLoadingData"
        remote
        :pagination="pagination"
      />
    </n-card>
    <!-- Customer Modal -->
    <user-settings-modal
      v-model:show="showModal"
      @on-success="listUsers"
      :items="items"
    />
    <user-password
      v-model:show="showModalPass"
      @on-success="listUsers"
      :items="itemsUser"
    />
    <n-modal
      :class="{
        'w-100': genericsStore.device === 'mobile',
        'w-50': genericsStore.device === 'tablet',
        'w-25': genericsStore.device === 'desktop',
      }"
      preset="card"
      v-model:show="showPassModal"
      title="Cambiar clave de seguridad"
      :mask-closable="false"
      closable
      @close="onCloseSecurity"
    >
      <n-form ref="securityForm" :model="securityPass" :rules="securityRules">
        <n-form-item label="Ingrese clave actual" path="currentPass">
          <n-input
            type="password"
            v-model:value="securityPass.currentPass"
            placeholder=""
          />
        </n-form-item>
        <n-form-item label="Ingrese nueva clave" path="newPass">
          <n-input
            type="password"
            v-model:value="securityPass.newPass"
            @input="handlePasswordInput"
            placeholder=""
          />
        </n-form-item>
        <n-form-item
          label="Reingrese nueva clave"
          ref="rePassRef"
          path="rePass"
        >
          <n-input
            type="password"
            v-model:value="securityPass.rePass"
            placeholder=""
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button
            type="success"
            :loading="isLoading"
            :disabled="
              !securityPass.currentPass ||
              !securityPass.newPass ||
              !securityPass.rePass ||
              isLoading
            "
            secondary
            @click.prevent="performUpdateSecurityPass"
            >Confirmar</n-button
          >
        </n-space>
      </template>
    </n-modal>
    <permission-modal v-model:show="showPermissions" :user="userPermission" />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog } from "naive-ui";
import { createUserColumns } from "@/utils/constants";
import UserSettingsModal from "./UserSettingsModal";
import UserPassword from "./UserPassword";
import PermissionModal from "./PermissionModal";
import { useGenericsStore } from "@/store/modules/generics";
import { useUserStore } from "@/store/modules/user";
import { updateGeneralPass } from "@/api/modules/business";
import { getUsers, disableUsers } from "@/api/modules/users";

export default defineComponent({
  name: "UserSettings",
  components: {
    UserSettingsModal,
    UserPassword,
    PermissionModal,
  },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
    const genericsStore = useGenericsStore();
    const userStore = useUserStore();
    const showModal = ref(false);
    const showModalPass = ref(false);
    const itemsUser = ref({});
    const users = ref([]);
    const items = reactive({});
    const isLoadingData = ref(false);
    const textsearch = ref("");
    const page = ref(1);
    const linksearch = ref(null);
    const pagecount = ref(null);
    const pagination = ref({
      previusPage: null,
      offset: 0,
      page: page,
      pageSize: 15,
      pageCount: pagecount,
      pageSlot: 5,
      suffix: () => {
        return "Total: " + users.value.count;
      },

      onChange: (page) => {
        pagination.value.page = page;
        SearchFilter(page);
      },
    });
    const newUser = () => {
      (items.id = undefined),
        (items.names = undefined),
        (items.email = undefined),
        (items.dni = undefined),
        (items.username = undefined),
        (items.password = undefined),
        (items.branchoffice = undefined),
        (items.profile = undefined),
        (items.is_active = undefined);
    };

    const editUser = (data) => {
      (items.id = data.id),
        (items.names = data.names),
        (items.email = data.email),
        (items.dni = data.dni),
        (items.username = data.username),
        (items.password = data.password),
        (items.branchoffice = data.branchoffice),
        (items.profile = data.role_id),
        (items.is_active = data.is_active);
    };

    const listUsers = (search) => {
      isLoadingData.value = true;
      let filter = "users/";
      if (search) {
        filter = "users/" + search;
      }
      getUsers(filter)
        .then((response) => {
          users.value = response.data;
          PaginationF();
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const PaginationF = () => {
      let total = users.value.count / 15;

      if (total == 0) {
        pagecount.value = 1;
      } else {
        if (total % 1 == 0) {
          pagecount.value = total;
        } else {
          total += 1;
          pagecount.value = Math.trunc(total);
        }
      }
    };

    const SearchFilter = (val) => {
      let search;

      if (val) {
        search = "?page=" + page.value;
        if (linksearch.value !== null) {
          search = linksearch.value + "page=" + page.value;
        }
      } else {
        page.value = 1;
        linksearch.value = null;

        if (textsearch.value !== "") {
          search = "?search=" + textsearch.value + "&";
          linksearch.value = search;
        }
      }
      listUsers(search);
    };

    onMounted(() => {
      listUsers();
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    const changeState = async (id, state) => {
      const dial = state == false ? dialog.success : dialog.error;
      let titles =
        state == false ? "HABILITAR USUARIO" : "DESHABILITAR USUARIO";
      const button = state == false ? "Habilitar" : "Deshabilitar";

      dial({
        title: titles,
        content: "¿Estas seguro?",
        positiveText: button,
        negativeText: "Cancelar",
        onPositiveClick: async () => {
          disableUsers(id)
            .then((response) => {
              listUsers();
              message.success("Usuario deshabilitado correctamente.");
            })
            .catch((error) => {
              message.error("Algo salió mal...");
            });
        },
      });
    };

    const securityForm = ref(null);

    const rePassRef = ref(null);

    function handlePasswordInput() {
      if (securityPass.value.rePass) {
        rePassRef.value.validate({ trigger: "password-input" });
      }
    }

    function validatePasswordStartWith(rule, value) {
      return (
        !!securityPass.value.newPass &&
        securityPass.value.newPass.startsWith(value) &&
        securityPass.value.newPass.length >= value.length
      );
    }

    function validatePasswordSame(rule, value) {
      return value === securityPass.value.newPass;
    }

    const securityRules = {
      currentPass: {
        required: true,
        message: "Contraseña actual requerido",
        trigger: ["input", "blur"],
      },
      newPass: {
        required: true,
        message: "Nueva contraseña requerido",
        trigger: ["input", "blur"],
      },
      rePass: [
        {
          required: true,
          message: "Reingreso de contraseña requerido",
          trigger: ["input", "blur"],
        },
        {
          validator: validatePasswordStartWith,
          message: "Las contraseñas no son iguales!",
          trigger: "input",
        },
        {
          validator: validatePasswordSame,
          message: "Las contraseñas no son iguales!",
          trigger: ["blur", "password-input"],
        },
      ],
    };

    const securityPass = ref({
      currentPass: "",
      newPass: "",
      rePass: "",
    });

    const showPassModal = ref(false);

    const isLoading = ref(false);

    const performUpdateSecurityPass = () => {
      isLoading.value = true;
      updateGeneralPass(
        securityPass.value.currentPass,
        securityPass.value.newPass
      )
        .then((response) => {
          if (response.status === 204) {
            message.success("Clave de seguridad actualizada correctamente!");
            showPassModal.value = false;
            isLoading.value = false;
            onCloseSecurity();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const onCloseSecurity = () => {
      securityPass.value.currentPass = "";
      securityPass.value.newPass = "";
      securityPass.value.rePass = "";
    };

    const showPermissions = ref(false);

    const userPermission = ref(null);

    return {
      genericsStore,
      userStore,
      handleBack,
      showModal,
      showModalPass,
      textsearch,
      isLoadingData,
      listUsers,
      SearchFilter,
      newUser,
      pagination,
      itemsUser,
      items,
      users,
      showPassModal,
      isLoading,
      securityForm,
      rePassRef,
      securityRules,
      securityPass,
      onCloseSecurity,
      handlePasswordInput,
      performUpdateSecurityPass,
      showPermissions,
      userPermission,
      tableColumns: createUserColumns({
        editUser(data) {
          editUser(data);
          showModal.value = true;
        },
        changePermissions(rowData) {
          showPermissions.value = true;
          userPermission.value = rowData.id;
        },
        deleteUser(rowData) {
          changeState(rowData.id, rowData.is_active);
        },
        changePassword(row) {
          itemsUser.value = {
            id: row.id,
            names: "NUEVA CONTRASEÑA DE " + row.names,
            password: null,
          };
          showModalPass.value = true;
        },
      }),
    };
  },
});
</script>

<style>
</style>