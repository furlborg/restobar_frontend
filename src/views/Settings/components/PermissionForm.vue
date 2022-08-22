<template>
  <n-tree
    v-model:checked-keys="permissions"
    :data="options"
    :selectable="false"
    accordion
    block-line
    cascade
    checkable
  />
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import {
  listUserPermissions,
  updateUserPermissions,
} from "@/api/modules/users";

export default defineComponent({
  name: "PermissionForm",
  props: {
    user: {
      type: Number,
    },
    options: {
      type: Array,
    },
  },
  setup(props, { expose }) {
    const message = useMessage();

    const permissions = ref([]);

    const getUserPermission = async () => {
      await listUserPermissions(props.user)
        .then((response) => {
          if (response.status === 200) {
            permissions.value = response.data.user_permissions;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    expose({ savePermissions });

    async function savePermissions() {
      const perms = permissions.value.filter((perm) => !isNaN(perm));
      return await updateUserPermissions(props.user, perms);
    }

    onMounted(async () => {
      await getUserPermission();
    });

    return {
      permissions,
    };
  },
});
</script>

<style>
</style>