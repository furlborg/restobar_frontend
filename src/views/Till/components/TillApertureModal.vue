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
    @close="() => $emit('update:show')"
  >
    <n-spin :show="isLoading">
      <n-form>
        <n-form-item label="Monto Inicial">
          <n-input
            v-model:value="till.opening_amount"
            @keypress="isDecimal($event)"
          />
        </n-form-item>
        <n-form-item label="Observaciones">
          <n-input
            v-model:value="till.opening_observations"
            type="textarea"
            @keypress="isLetterOrNumber($event)"
          />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-button
        type="success"
        :disabled="isLoading"
        :loading="isLoading"
        block
        secondary
        @click="apertureTill"
        >Aperturar Caja</n-button
      >
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { createTill } from "@/api/modules/tills";
import { isDecimal, isLetterOrNumber, isNumber } from "@/utils";

export default defineComponent({
  name: "TillApertureModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const genericsStore = useGenericsStore();
    const tillStore = useTillStore();
    const userStore = useUserStore();
    const message = useMessage();
    const isLoading = ref(false);
    const till = ref({
      opening_responsable: userStore.user.id,
      opening_amount: "0.00",
      opening_observations: "",
    });

    const apertureTill = async () => {
      isLoading.value = true;
      await createTill(till.value)
        .then((response) => {
          if (response.status === 201) {
            message.success("Caja aperturada!");
            emit("on-success");
            tillStore.currentTillID = response.data.id;
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
      isLetterOrNumber,
      genericsStore,
      isLoading,
      till,
      apertureTill,
    };
  },
});
</script>

<style>
</style>