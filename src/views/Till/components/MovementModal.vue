<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    :title="movementType === '0' ? 'Registrar Ingreso' : 'Registrar Egreso'"
    :show="show"
    :on-close="() => ($emit('update:show'), cleanDetail())"
  >
    <n-spin :show="isLoading">
      <n-form :rules="movementRules" :model="detail" ref="detailRef">
        <transition name="mode-fade" mode="out-in">
          <n-form-item
            v-if="conceptForm"
            :label="!concept.id ? 'Crear Concepto' : 'Editar Concepto'"
          >
            <n-input-group>
              <n-input
                v-model:value="concept.description"
                placeholder=""
                @keypress="isLetter($event)"
              />
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
          </n-form-item>
          <n-form-item v-else label="Concepto" path="concept">
            <n-input-group>
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
                :options="
                  movementType === '0'
                    ? tillStore.getIncomeConceptsOptions
                    : tillStore.getOutcomeConceptsOptions
                "
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
          </n-form-item>
        </transition>
        <transition name="mode-fade" mode="out-in">
          <n-form-item
            v-if="paymentForm"
            :label="!payment.id ? 'Crear Método Pago' : 'Editar Método Pago'"
          >
            <n-input-group>
              <n-input
                v-model:value="payment.description"
                placeholder=""
                @keypress="isLetter($event)"
              />
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
                  !payment.id ? performCreatePayment() : performUpdatePayment()
                "
              >
                <v-icon name="md-save-round" />
              </n-button>
              <n-button type="error" tertiary @click="paymentForm = false">
                <v-icon name="md-close-round" />
              </n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item v-else label="Método Pago" path="payment_method">
            <n-input-group>
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
          </n-form-item>
        </transition>
        <n-form-item label="Descripción" path="description">
          <n-input
            v-model:value="detail.description"
            @keypress="isLetter($event)"
          />
        </n-form-item>
        <n-form-item label="Monto" path="amount">
          <n-input
            v-model:value="detail.amount"
            @keypress="isDecimal($event)"
          />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-button type="success" block @click="performCreateDetail"
        >Registrar {{ movementType === "0" ? "Ingreso" : "Egreso" }}</n-button
      >
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import { isDecimal, isLetter, isNumber } from "@/utils";
import {
  createTillDetails,
  createConcept,
  updateConcept,
} from "@/api/modules/tills";
import { createPaymentMethod, updatePaymentMethod } from "@/api/modules/sales";
import { movementRules } from "@/utils/constants";

export default defineComponent({
  name: "TillModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    movementType: {
      type: String,
      default: null,
    },
  },
  setup(props, { emit }) {
    const { show, movementType } = toRefs(props);
    const genericsStore = useGenericsStore();
    const message = useMessage();
    const tillStore = useTillStore();
    const saleStore = useSaleStore();

    const isLoading = ref(false);

    const detailRef = ref(null);

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
      detailRef.value.validate((errors) => {
        if (!errors) {
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
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const conceptForm = ref(false);

    const concept = ref({
      id: null,
      description: null,
      concept_type: movementType.value,
    });

    const performCreateConcept = () => {
      concept.value.concept_type = movementType.value;
      createConcept(concept.value)
        .then((response) => {
          if (response.status === 201) {
            tillStore.refreshConcepts().then(() => {
              detail.value.concept = tillStore.getConceptID(
                concept.value.description
              );
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          conceptForm.value = false;
        });
    };

    const performUpdateConcept = () => {
      updateConcept(concept.value.id, concept.value)
        .then((response) => {
          if (response.status === 202) {
            tillStore.refreshConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          conceptForm.value = false;
        });
    };

    const paymentForm = ref(false);

    const payment = ref({
      id: null,
      description: null,
    });

    const performCreatePayment = () => {
      createPaymentMethod(payment.value)
        .then((response) => {
          if (response.status === 201) {
            saleStore.refreshPaymentMethods().then(() => {
              detail.value.payment_method = saleStore.getPaymentMethodID(
                payment.value.description
              );
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          paymentForm.value = false;
        });
    };

    const performUpdatePayment = () => {
      updatePaymentMethod(payment.value.id, payment.value)
        .then((response) => {
          if (response.status === 202) {
            saleStore.refreshPaymentMethods();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          paymentForm.value = false;
        });
    };

    return {
      isDecimal,
      isNumber,
      isLetter,
      genericsStore,
      tillStore,
      saleStore,
      isLoading,
      movementRules,
      detailRef,
      cleanDetail,
      detail,
      performCreateDetail,
      conceptForm,
      concept,
      performCreateConcept,
      performUpdateConcept,
      paymentForm,
      payment,
      performCreatePayment,
      performUpdatePayment,
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