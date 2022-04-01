<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Apertura de Caja"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-spin :show="isLoading">
      <n-form>
        <n-form-item label="Observaciones">
          <n-input
            v-model:value="till.closing_observations"
            type="textarea"
            @keypress="isLetter($event)"
          />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-button
        type="error"
        :disabled="isLoading"
        :loading="isLoading"
        block
        secondary
        @click="closureTill"
        >Cerrar Caja</n-button
      >
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { updateTill } from "@/api/modules/tills";
import { isDecimal, isLetter, isNumber } from "@/utils";

export default defineComponent({
  name: "TillClosureModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    idTill: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { emit }) {
    const { show, idTill } = toRefs(props);
    const genericsStore = useGenericsStore();
    const tillStore = useTillStore();
    const userStore = useUserStore();
    const message = useMessage();
    const isLoading = ref(false);
    const till = ref({
      closing_responsable: userStore.user.id,
      closing_observations: "",
    });

    const closureTill = async () => {
      isLoading.value = true;
      await updateTill(idTill.value, till.value)
        .then((response) => {
          if (response.status === 202) {
            tillStore.currentTillID = null;
            message.success("Caja cerrada!");
            emit("on-success");
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    return {
      isDecimal,
      isNumber,
      isLetter,
      genericsStore,
      isLoading,
      till,
      closureTill,
    };
  },
});
</script>

<style>
</style>