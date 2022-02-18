<template>
  <n-modal
    preset="card"
    :show="show"
    :on-close="closeModal"
    :title="items.id ? 'Editar usuario' : 'Crear usuario'"
    style="width: 1000px"
  >
    <n-spin :show="isLoadingData">
      <n-form v-model:model="formitem" :rules="rules" ref="formRef">
        <n-tabs type="line">
          <n-tab-pane name="info" tab="Información General">
            <n-grid cols="12 100:1 450:12" :x-gap="12">
              <n-form-item-gi label="Nombres" :span="4" path="names">
                <n-input
                  v-model:value="formitem.names"
                  placeholder="Nombres"
                  :maxlength="200"
                  @input="formitem.names = $event.toUpperCase()"
                />
              </n-form-item-gi>
              <n-form-item-gi label="Sucursal" :span="4" path="branchoffice">
                <n-select
                  v-model:value="formitem.branchoffice"
                  placeholder="Seleccione"
                  :options="optionsBranch"
                />
              </n-form-item-gi>
              <n-form-item-gi label="Perfil" :span="4" path="profile">
                <n-select
                  v-model:value="formitem.profile"
                  placeholder="Seleccione"
                  :options="optionsProfile"
                />
              </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
              <n-form-item-gi label="DNI" :span="4" path="dni">
                <n-input
                  v-model:value="formitem.dni"
                  placeholder="DNI"
                  :maxlength="8"
                />
              </n-form-item-gi>
              <n-form-item-gi label="Corrreo Electrónico" :span="8">
                <n-input
                  v-model:value="formitem.email"
                  placeholder="Correo@ejemplo.com"
                  :maxlength="200"
                />
              </n-form-item-gi>
            </n-grid>
            <n-grid cols="12 100:1 450:12" :x-gap="12">
              <n-form-item-gi label="Usuario" :span="4" path="username">
                <n-input
                  v-model:value="formitem.username"
                  placeholder="Usuario"
                  :maxlength="11"
                  @input="formitem.username = $event.toUpperCase()"
                />
              </n-form-item-gi>
              <n-form-item-gi v-if="!items.id" label="Contraseña" :span="4">
                <n-input
                  type="password"
                  v-model:value="formitem.password"
                  :maxlength="10"
                  show-password-on="click"
                  placeholder="Contraseña"
                />
              </n-form-item-gi>
              <n-form-item-gi
                v-if="!items.id"
                label="Confirmar Contraseña"
                :span="4"
              >
                <n-input
                  type="password"
                  v-model:value="confirmPass"
                  :maxlength="10"
                  show-password-on="click"
                  placeholder="Confirmar contraseña"
                />
              </n-form-item-gi>
            </n-grid>
          </n-tab-pane>
          <n-tab-pane name="permissions" tab="Permisos">
            <n-tree
              cascade
              checkable
              :data="permissions"
              :default-checked-keys="formitem.user_permission"
              @update:checked-keys="updateCheckedKeys"
            />
          </n-tab-pane>
        </n-tabs>
      </n-form>
      <!-- <pre>{{  JSON.stringify(formitem, 0, 2) }}</pre> -->
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button @click="closeModal()" ghost>Cancelar</n-button>
        <n-button type="primary" @click="save(formitem)">{{
          items.id ? "Guardar" : "Crear"
        }}</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, onMounted, onUpdated, ref, toRefs } from "vue";
import { useMessage } from "naive-ui";
import { getBranchs } from "@/api/modules/business";
import {
  getProfile,
  createUsers,
  updateUsers,
  getPermission,
} from "@/api/modules/users";

export default defineComponent({
  name: "UserSettingsModal",
  emits: ["update:show", "on-success"],
  props: {
    items: { type: Object, default: {} },
    show: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { show } = toRefs(props);
    const isLoadingData = ref(false);
    const formitem = ref({});
    const confirmPass = ref("");
    const optionsBranch = ref([]);
    const optionsProfile = ref([]);
    const formRef = ref(null);
    const message = useMessage();
    const permissions = ref([]);

    onUpdated(() => {
      if (show.value == true) {
        formitem.value = props.items;
        if (formitem.value.user_permission) {
          formitem.value.user_permission = formitem.value.user_permission.map(
            (v) => {
              return v.permission;
            }
          );
        }
      }
    });

    onMounted(() => {
      listOptions();
    });

    const listOptions = () => {
      getBranchs()
        .then((response) => {
          optionsBranch.value = response.data.map((v) => ({
            label: v.description,
            value: v.id,
          }));
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });

      getProfile()
        .then((response) => {
          optionsProfile.value = response.data.map((v) => ({
            label: v.description,
            value: v.id,
          }));
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });

      getPermission()
        .then((response) => {
          listPermission(response.data);
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });
    };

    const listPermission = (values) => {
      let cat = [];
      let child = [];

      const preparePermisShow = values.map((val, index) => {
        cat.push(val.category);
        let generateDat = {
          label: val.description,
          key: val.id,
          cat: val.category,
        };
        return child.push(generateDat);
      });

      cat = cat.filter((val, index) => {
        return cat.indexOf(val) == index;
      });

      const showPermiss = cat.map((val) => {
        let selectChild = child.filter((v) => {
          if (v.cat === val) return v;
        });
        return {
          label: val === null ? "OPCIONALES" : val,
          key: val === null ? "OPCIONALES" : val,
          children: selectChild,
        };
      });

      permissions.value = showPermiss;
    };

    const updateCheckedKeys = (valuesSlec) => {
      const setupDatPer = valuesSlec.filter((val) => {
        if (typeof val !== "string") {
          return val;
        }
      });
      let dataForValPer = setupDatPer.map((val) => {
        return val;
      });
      formitem.value.user_permission = dataForValPer;
    };

    const closeModal = () => {
      emit("update:show");
    };

    const save = (formitem) => {
      formRef.value.validate(async (errors) => {
        if (
          !formitem.names ||
          !formitem.username ||
          !formitem.dni ||
          !formitem.branchoffice ||
          !formitem.profile
        ) {
          message.warning("Campos Requeridos");
        } else if (
          formitem.user_permission == undefined ||
          formitem.user_permission.length == 0
        ) {
          message.warning("Necesitas asignar permisos.");
        } else if (!formitem.id && formitem.password !== confirmPass.value) {
          message.warning("Las contraseñas no son iguales.");
        } else {
          if (!errors) {
            if (formitem.id) {
              updateUsers(formitem.id, formitem)
                .then((response) => {
                  emit("on-success");
                  closeModal();
                  message.success("Usuario editado correctamente.");
                })
                .catch((error) => {
                  if ("username" in error.response.data) {
                    message.warning("El usuario ya existe.");
                  } else if ("email" in error.response.data) {
                    message.warning("El correo ya existe.");
                  } else if ("dni" in error.response.data) {
                    message.warning("El DNI ya existe.");
                  } else {
                    message.error("Algo salió mal...");
                  }
                });
            } else {
              createUsers(formitem)
                .then((response) => {
                  emit("on-success");
                  closeModal();
                  message.success("Usuario registrado correctamente.");
                })
                .catch((error) => {
                  if ("username" in error.response.data) {
                    message.warning("El usuario ya existe.");
                  } else if ("email" in error.response.data) {
                    message.warning("El correo ya existe.");
                  } else if ("dni" in error.response.data) {
                    message.warning("El DNI ya existe.");
                  } else {
                    message.error("Algo salió mal...");
                  }
                });
            }
          } else {
            message.warning("Campos Requeridos");
          }
        }
      });
    };

    return {
      closeModal,
      formitem,
      formRef,
      isLoadingData,
      optionsBranch,
      updateCheckedKeys,
      optionsProfile,
      save,
      permissions,
      confirmPass,
      rules: {
        names: {
          required: true,
          message: "Requerido",
          trigger: "blur",
        },
        branchoffice: {
          type: "number",
          required: true,
          message: "Requerido",
          trigger: "blur",
        },
        profile: {
          type: "number",
          required: true,
          message: "Requerido",
          trigger: "blur",
        },
        dni: {
          required: true,
          message: "Requerido",
          trigger: "blur",
        },
        username: {
          required: true,
          message: "Requerido",
          trigger: "blur",
        },
      },
    };
  },
});
</script>

<style lang="scss" scoped>
</style>