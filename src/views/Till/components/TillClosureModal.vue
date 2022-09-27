<template>
  <n-modal :class="{
    'w-100': genericsStore.device === 'mobile',
    'w-50': genericsStore.device === 'tablet',
    'w-25': genericsStore.device === 'desktop',
  }" preset="card" title="Cierre de Caja" :show="show" :on-close="() => $emit('update:show')">
    <n-spin :show="isLoading">
      <n-form ref="formRef" :model="till" :rules="rules">
        <n-form-item v-if="settingsStore.business_settings.till.closure_cash_total" path="closure_cash_total"
          label="Monto">
          <n-input v-model:value="till.closure_cash_total" @keypress="isDecimal($event)" placeholder="" />
        </n-form-item>
        <n-form-item label="Observaciones">
          <n-input v-model:value="till.closing_observations" type="textarea" @keypress="isLetterOrNumber($event)"
            placeholder="" />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-button type="error" :disabled="isLoading" :loading="isLoading" block secondary @click="closureTill">Cerrar Caja
      </n-button>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, computed } from "vue";
import { useMessage } from "naive-ui";
import { useSettingsStore } from "@/store/modules/settings";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useUserStore } from "@/store/modules/user";
import { updateTill, sendTillReport } from "@/api/modules/tills";
import { isDecimal, isLetterOrNumber, isNumber } from "@/utils";

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
    const settingsStore = useSettingsStore();
    const genericsStore = useGenericsStore();
    const tillStore = useTillStore();
    const userStore = useUserStore();
    const message = useMessage();
    const isLoading = ref(false);
    const till = ref({
      closing_responsable: userStore.user.id,
      closing_observations: "",
    });

    const formRef = ref(null)

    const rules = computed(() => {
      return {
        closure_cash_total: {
          required: settingsStore.business_settings.till.closure_cash_total,
          trigger: ['blur', 'input'],
          message: 'Monto requerido'
        }
      }
    })

    const errorLabel = (field) => {
      switch (field) {
        case "closure_cash_total":
          return "Total Efectivo";
        default:
          return null;
      }
    };

    const closureTill = async () => {
      isLoading.value = true;
      await updateTill(idTill.value, till.value)
        .then((response) => {
          if (response.status === 202) {
            tillStore.currentTillID = null;
            message.success("Caja cerrada!");
            if (settingsStore.business_settings.reports.auto_send_mail) {
              sendTillReport(idTill.value)
                .then((response) => {
                  if (response.status === 204) {
                    message.success("Envío exitoso!");
                  }
                })
                .catch((error) => {
                  message.error("Algo salió mal...");
                  console.error(error);
                });
            }
            emit("on-success");
          }
        })
        .catch((error) => {
          if (error.response.status === 400) {
            for (const value in error.response.data) {
              message.error(
                `${errorLabel(value)}: ${error.response.data[`${value}`][0]
                }`
              );
            }
          } else {
            console.error(error);
            message.error("Algo salió mal...");
          }
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
      settingsStore,
      isLoading,
      till,
      closureTill,
      formRef,
      rules
    };
  },
});
</script>

<style>

</style>