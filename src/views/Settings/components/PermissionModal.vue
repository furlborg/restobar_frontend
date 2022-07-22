<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    title="Permisios de Usuario"
    preset="card"
    :segmented="{ content: 'hard' }"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
  >
    <permission-form ref="permissionForm" :options="options" :user="user" />
    <template #action>
      <n-space justify="end">
        <n-button type="info" secondary @click="save()">Guardar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { listPermissions } from "@/api/modules/users";
import { permissionsLabels } from "@/utils/constants";
import PermissionForm from "./PermissionForm";

export default defineComponent({
  name: "PermissionModal",
  components: {
    PermissionForm,
  },
  props: {
    show: {
      type: Boolean,
    },
    user: {
      type: Number,
    },
  },
  emits: ["update:show"],
  setup(props, { emit }) {
    const genericsStore = useGenericsStore();

    const options = ref([]);

    const message = useMessage();

    const permissionForm = ref(null);

    const getPermissions = async () => {
      await listPermissions()
        .then((response) => {
          response.data.forEach((option) => {
            option.key = option.label;
            option.label = permissionsLabels[`${option.label}`];
            option.children.forEach((child) => {
              child.label = permissionsLabels[`${child.label}`];
            });
          });
          options.value = response.data;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const save = async () => {
      await permissionForm.value
        .savePermissions()
        .then((response) => {
          if (response.status === 200) {
            message.success("Permisos de usuario actualizados!");
            emit("update:show", false);
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    onMounted(async () => {
      await getPermissions();
    });

    return {
      genericsStore,
      permissionForm,
      save,
      options,
    };
  },
});
</script>

<style>
</style>