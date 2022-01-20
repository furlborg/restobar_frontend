<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Registrar Ingreso"
    :show="show"
    :on-close="() => ($emit('update:show'), cleanDetail())"
  >
    <n-spin :show="isLoading">
      <n-form>
        <n-form-item label="Concepto">
          <transition name="mode-fade" mode="out-in">
            <n-input-group v-if="conceptForm">
              <n-input v-model:value="concept.description" placeholder="" />
              <n-button
                type="info"
                tertiary
                :disabled="
                  concept.description ===
                    tillStore.getConceptDescription(concept.id) ||
                  !concept.description
                    ? true
                    : false
                "
                @click="
                  !concept.id ? performCreateConcept() : performUpdateConcept()
                "
              >
                <v-icon name="md-save-round" />
              </n-button>
              <n-button type="error" tertiary @click="conceptForm = false">
                <v-icon name="md-close-round" />
              </n-button>
            </n-input-group>
            <n-input-group v-else>
              <n-button
                type="info"
                tertiary
                @click="
                  conceptForm = true;
                  concept.id = null;
                  concept.description = null;
                "
              >
                <v-icon name="md-add-round" />
              </n-button>
              <n-select
                v-model:value="detail.concept"
                :options="tillStore.getIncomeConceptsOptions"
                placeholder=""
                clearable
              />
              <n-button
                v-if="detail.concept"
                type="warning"
                tertiary
                @click="
                  conceptForm = true;
                  concept.id = detail.concept;
                  concept.description = tillStore.getConceptDescription(
                    detail.concept
                  );
                "
              >
                <v-icon name="ri-edit-fill" />
              </n-button>
            </n-input-group>
          </transition>
        </n-form-item>
        <n-form-item label="Método Pago">
          <transition name="mode-fade" mode="out-in">
            <n-input-group v-if="paymentForm">
              <n-input v-model:value="payment.description" placeholder="" />
              <n-button
                type="info"
                tertiary
                :disabled="
                  payment.description ===
                    saleStore.getPaymentMethodDescription(payment.id) ||
                  !payment.description
                    ? true
                    : false
                "
                @click="
                  !payment.id ? performCreateConcept() : performUpdateConcept()
                "
              >
                <v-icon name="md-save-round" />
              </n-button>
              <n-button type="error" tertiary @click="paymentForm = false">
                <v-icon name="md-close-round" />
              </n-button>
            </n-input-group>
            <n-input-group v-else>
              <n-button
                type="info"
                tertiary
                @click="
                  paymentForm = true;
                  payment.id = null;
                  payment.description = null;
                "
              >
                <v-icon name="md-add-round" />
              </n-button>
              <n-select
                v-model:value="detail.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                placeholder=""
                clearable
              />
              <n-button
                v-if="detail.payment_method"
                type="warning"
                tertiary
                @click="
                  paymentForm = true;
                  payment.id = detail.payment_method;
                  payment.description = saleStore.getPaymentMethodDescription(
                    detail.payment_method
                  );
                "
              >
                <v-icon name="ri-edit-fill" />
              </n-button>
            </n-input-group>
          </transition>
        </n-form-item>
        <n-form-item label="Descripción">
          <n-input v-model:value="detail.description" />
        </n-form-item>
        <n-form-item label="Monto">
          <n-input v-model:value="detail.amount" />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button type="success" @click="performCreateDetail"
          >Registrar</n-button
        >
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import { createTillDetails } from "@/api/modules/tills";

export default defineComponent({
  name: "TillModal",
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
    const saleStore = useSaleStore();

    const isLoading = ref(false);

    const detail = ref({
      till: tillStore.currentTillID,
      document: "",
      description: "",
      payment_method: null,
      amount: 0.0,
      concept: null,
    });

    const cleanDetail = () => {
      detail.value = {
        till: tillStore.currentTillID,
        document: "",
        description: "",
        payment_method: null,
        amount: 0.0,
        concept: null,
      };
    };

    const performCreateDetail = () => {
      isLoading.value = true;
      createTillDetails(detail.value)
        .then((response) => {
          if (response.status === 201) {
            emit("on-success");
          }
        })
        .catch((error) => {
          console.error(error.response.data);
        })
        .finally(() => {
          isLoading.value = false;
        });
    };

    const conceptForm = ref(false);

    const concept = ref({
      id: null,
      description: null,
    });

    const paymentForm = ref(false);

    const payment = ref({
      id: null,
      description: null,
      concept_type: 0,
    });

    return {
      genericsStore,
      tillStore,
      isLoading,
      cleanDetail,
      detail,
      conceptForm,
      concept,
      performCreateDetail,
      saleStore,
      paymentForm,
      payment,
    };
  },
});
</script>

<style lang="scss">
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>