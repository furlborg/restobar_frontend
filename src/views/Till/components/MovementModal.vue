<template>
  <n-modal :class="{
    'w-100': genericsStore.device === 'mobile',
    'w-50': genericsStore.device === 'tablet',
    'w-25': genericsStore.device === 'desktop',
  }" preset="card" :title="detailId
    ? (movementType === '0' ? 'Editar Ingreso' : 'Editar Egreso')
    : (movementType === '0' ? 'Registrar Ingreso' : 'Registrar Egreso')" :show="show"
    :on-close="() => ($emit('update:show'), cleanDetail())">
    <n-spin :show="isLoading">
      <n-form :rules="extendedMovementRules" :model="detail" ref="detailRef">
        <transition name="mode-fade" mode="out-in">
          <n-form-item v-if="conceptForm" :label="!concept.id ? 'Crear Concepto' : 'Editar Concepto'">
            <n-input-group>
              <n-input v-model:value="concept.description" placeholder="" @keypress="isLetter($event)" />
              <n-button type="info" tertiary :disabled="concept.description ===
                tillStore.getConceptDescription(concept.id) ||
                !concept.description
                ? true
                : false
                " @click="
                  !concept.id
                    ? performCreateConcept(movementType)
                    : performUpdateConcept()
                  ">
                <v-icon name="md-save-round" />
              </n-button>
              <n-button type="error" tertiary @click="conceptForm = false">
                <v-icon name="md-close-round" />
              </n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item v-else label="Concepto" path="concept">
            <n-input-group>
              <n-button v-if="userStore.hasPermission('add_concept')" type="info" tertiary @click="
                conceptForm = true;
              concept.id = null;
              concept.description = null;
              ">
                <v-icon name="md-add-round" />
              </n-button>
              <n-select v-model:value="detail.concept" :options="movementType === '0'
                ? tillStore.getIncomeConceptsOptions
                : tillStore.getOutcomeConceptsOptions
                " placeholder="" clearable />
              <n-button v-if="
                userStore.hasPermission('change_concept')
                  ? detail.concept
                  : false
              " type="warning" tertiary @click="
                conceptForm = true;
              concept.id = detail.concept;
              concept.description = tillStore.getConceptDescription(
                detail.concept,
              );
              ">
                <v-icon name="ri-edit-fill" />
              </n-button>
            </n-input-group>
          </n-form-item>
        </transition>
        <transition name="mode-fade" mode="out-in">
          <n-form-item v-if="paymentForm" :label="!payment.id ? 'Crear Método Pago' : 'Editar Método Pago'">
            <n-input-group>
              <n-input v-model:value="payment.description" placeholder="" @keypress="isLetter($event)" />
              <n-button type="info" tertiary :disabled="payment.description ===
                saleStore.getPaymentMethodDescription(payment.id) ||
                !payment.description
                ? true
                : false
                " @click="
                  !payment.id ? performCreatePayment() : performUpdatePayment()
                  ">
                <v-icon name="md-save-round" />
              </n-button>
              <n-button type="error" tertiary @click="paymentForm = false">
                <v-icon name="md-close-round" />
              </n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item v-else label="Método Pago" path="payment_method">
            <n-input-group>
              <n-button v-if="userStore.hasPermission('add_paymentmethodtype')" type="info" tertiary @click="
                paymentForm = true;
              payment.id = null;
              payment.description = null;
              ">
                <v-icon name="md-add-round" />
              </n-button>
              <n-select v-model:value="detail.payment_method" :options="saleStore.getPaymentMethodsOptions"
                placeholder="" clearable />
              <n-button v-if="
                userStore.hasPermission('change_paymentmethodtype')
                  ? detail.payment_method
                  : false
              " type="warning" tertiary @click="
                paymentForm = true;
              payment.id = detail.payment_method;
              payment.description = saleStore.getPaymentMethodDescription(
                detail.payment_method,
              );
              ">
                <v-icon name="ri-edit-fill" />
              </n-button>
            </n-input-group>
          </n-form-item>
        </transition>
        <n-form-item label="Operación" path="operation" v-if="detail.payment_method && detail.payment_method !== 1">
          <n-input v-model:value="detail.operation" @keypress="isLetterOrNumber($event)" />
        </n-form-item>
        <n-form-item label="Descripción" path="description">
          <n-input v-model:value="detail.description" @keypress="isLetterOrNumber($event)" />
        </n-form-item>
        <n-form-item label="Monto" path="amount">
          <n-input-number class="w-100" v-model:value="detail.amount" :min="0" :show-button="false" />
        </n-form-item>
      </n-form>
    </n-spin>
    <template #action>
      <n-button type="success" :loading="isLoading" :disabled="isLoading" block @click="handleSaveDetail">
        {{ detailId ? 'Actualizar' : 'Registrar' }}
        {{ movementType === "0" ? "Ingreso" : "Egreso" }}</n-button>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, watch } from "vue";

import { useUserStore } from "@/store/modules/user";
import { useGenericsStore } from "@/store/modules/generics";
import { isLetter, isNumber, isLetterOrNumber } from "@/utils";
import { useTillDetail } from "../composables/useTillDetail";

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
    detailId: {
      type: Number,
      default: null
    }
  },
  setup(props, { emit }) {
    const userStore = useUserStore();
    const genericsStore = useGenericsStore();

    const tillDetail = useTillDetail();

    const {
      detail,
      cleanDetail,
      isLoading,
      detailRef,
      performCreateDetail,
      tillStore,
      extendedMovementRules,
      performCreateConcept,
      performUpdateConcept,
      performCreatePayment,
      performUpdatePayment,
      concept,
      conceptForm,
      payment,
      paymentForm,
      saleStore,
      performUpdateDetail,
      detailId,
      performFindDetailById,
    } = tillDetail;

    const handleSaveDetail = () => {
      if (detailId.value) {
        performUpdateDetail(() => { emit("on-success"); }, () => emit("update:show", false));
      } else {
        performCreateDetail(() => emit("on-success"));
      }
    };

    watch(() => props.detailId, (newId) => {
      if (newId) { performFindDetailById(newId) }
      else {
        detailId.value = null;
        cleanDetail();
      }
    }, { immediate: true })

    return {
      userStore,
      isNumber,
      isLetter,
      isLetterOrNumber,
      genericsStore,
      tillStore,
      saleStore,
      isLoading,
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
      extendedMovementRules,
      handleSaveDetail,
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
