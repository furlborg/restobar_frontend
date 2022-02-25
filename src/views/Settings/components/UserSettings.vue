<template>
  <div id="UserSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración de Usuarios</n-text>
      </template>
    </n-page-header>
    <n-card title="Usuarios" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
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
      </template>

      <n-form
        label-placement="left"
        style="width: 350px; margin-top: -8px; margin-bottom: 12px"
      >
        <n-input
          placeholder="Buscar"
          @keydown.enter="SearchFilter()"
          v-model:value="textsearch"
          round
        >
          <template #prefix>
            <n-icon style="margin-top: -4px"
              ><v-icon name="md-search-round"
            /></n-icon>
          </template>
        </n-input>
      </n-form>

      <n-data-table
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
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useMessage, useDialog, NButton } from "naive-ui";
import { createUserColumns } from "@/utils/constants";
import UserSettingsModal from "./UserSettingsModal";
import UserPassword from "./UserPassword";
import { getUsers, disableUsers } from "@/api/modules/users";

export default defineComponent({
  name: "UserSettings",
  components: {
    UserSettingsModal,
    UserPassword,
  },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const dialog = useDialog();
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
        (items.profile = data.profile),
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

    return {
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
      tableColumns: createUserColumns({
        editUser(data) {
          editUser(data);
          showModal.value = true;
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