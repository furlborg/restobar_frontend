<template>
  <!-- Modal para configurar operación gratuita o afectación por ítem (FLZ-GRA-05). -->
  <n-modal
    :show="show"
    preset="card"
    title="Operación gratuita / Afectación"
    :mask-closable="false"
    closable
    style="max-width: 480px"
    @update:show="(val) => !val && close()"
  >
    <n-space vertical :size="16">
      <div v-if="detail">
        <n-text strong class="fs-6">{{ detail.product_name }}</n-text>
        <div class="text-muted" style="font-size: 13px">
          Cantidad: {{ detail.quantity }} · Precio regular: S/. {{ Number(detail._last_price_sale || detail.price_sale || 0).toFixed(2) }}
        </div>
      </div>

      <n-radio-group v-model:value="operationType" name="optype">
        <n-space>
          <n-radio value="REGULAR">Venta regular (cobrada)</n-radio>
          <n-radio value="FREE">Operación gratuita</n-radio>
        </n-space>
      </n-radio-group>

      <template v-if="operationType === 'FREE'">
        <n-form-item label="Motivo de gratuidad" :show-feedback="false">
          <n-select
            v-model:value="selectedReason"
            :options="reasonOptions"
            placeholder="Seleccione motivo"
            @update:value="onReasonChange"
          />
        </n-form-item>

        <n-form-item label="Tipo de afectación SUNAT" :show-feedback="false">
          <n-select
            v-model:value="selectedAffectation"
            :options="affectationOptions"
            placeholder="Seleccione afectación"
            :loading="loadingOptions"
          />
        </n-form-item>

        <n-alert v-if="isTaxed" type="info" :show-icon="true">
          <template #header>Gravado – Retiro (no se cobra)</template>
          <div style="font-size: 13px">
            <div>Valor referencial base: <strong>S/. {{ calculatedAmounts.priceBase.toFixed(2) }}</strong></div>
            <div>IGV referencial: <strong>S/. {{ calculatedAmounts.igvTax.toFixed(2) }}</strong> (se informa a SUNAT, no entra a caja)</div>
          </div>
        </n-alert>
        <n-alert v-else type="success" :show-icon="true">
          <template #header>Exonerado – Transferencia gratuita</template>
          <div style="font-size: 13px">
            Valor referencial: <strong>S/. {{ calculatedAmounts.priceSale.toFixed(2) }}</strong> (no se cobra)
          </div>
        </n-alert>
      </template>

      <template v-else>
        <n-form-item label="Afectación de la venta regular" :show-feedback="false">
          <n-select v-model:value="regularAffectation" :options="regularAffectationOptions" />
        </n-form-item>
        <div class="text-muted" style="font-size: 13px">
          El producto se cobrará normalmente; no se registra como operación gratuita.
        </div>
      </template>
    </n-space>

    <template #action>
      <n-space justify="end">
        <n-button @click="close">Cancelar</n-button>
        <n-button type="primary" @click="save">Aplicar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { getFreeAffectationOptions } from "@/api/modules/products";
import { useSettingsStore } from "@/store/modules/settings";
import {
  AFFECTATION_TAXED,
  AFFECTATION_EXONERATED,
  AFFECTATION_FREE,
  FREE_REASONS,
  FREE_REASON_COURTESY,
  FREE_REASON_INTERNAL_CONSUMPTION,
  allowedFreeAffectations,
  calculateTaxedFreeAmounts,
  defaultFreeAffectation,
  isFreeAffectation,
} from "@/utils/freeOperations";

const props = defineProps({
  show: { type: Boolean, default: false },
  detail: { type: Object, default: null },
});

const emit = defineEmits(["update:show", "apply"]);

const settingsStore = useSettingsStore();

const operationType = ref("REGULAR");
const selectedReason = ref(FREE_REASON_INTERNAL_CONSUMPTION);
const selectedAffectation = ref(AFFECTATION_FREE);
const regularAffectation = ref(AFFECTATION_EXONERATED);
const affectationOptions = ref([]);
const loadingOptions = ref(false);

const regularAffectationOptions = [
  { label: "10 - Gravado", value: AFFECTATION_TAXED },
  { label: "20 - Exonerado", value: AFFECTATION_EXONERATED },
];

const reasonOptions = FREE_REASONS.map((r) => ({
  label: `${r.label} — ${r.description}`,
  value: r.value,
}));

// Determinar afectación original del producto
const originalAfc = computed(() => {
  if (!props.detail) return AFFECTATION_EXONERATED;
  if (props.detail.original_affectation) {
    return Number(props.detail.original_affectation);
  }
  const current = Number(props.detail.product_affectation);
  if (!isFreeAffectation(current)) {
    return current;
  }
  // Si ya era gratuita, inferir de los impuestos o de la configuración del negocio
  if (Number(props.detail.product_igv) > 0 || Number(props.detail.igv_tax) > 0) {
    return AFFECTATION_TAXED;
  }
  return Number(settingsStore.businessSettings?.sale?.default_affectation) || AFFECTATION_EXONERATED;
});

const isTaxed = computed(() => originalAfc.value === AFFECTATION_TAXED);

const currentPrice = computed(() => {
  const last = Number(props.detail?._last_price_sale);
  if (last > 0) return last;
  const cur = Number(props.detail?.price_sale);
  return cur > 0 ? cur : 0;
});

const calculatedAmounts = computed(() => {
  const price = currentPrice.value;
  if (!isTaxed.value) {
    return { priceSale: price, priceBase: price, igvTax: 0 };
  }
  const rawRate = settingsStore.businessSettings?.sale?.igv_tax ?? 0.18;
  const { priceBase, igvTax } = calculateTaxedFreeAmounts(price, rawRate);
  return { priceSale: price, priceBase, igvTax };
});

const loadAffectationOptions = async () => {
  const original = originalAfc.value;
  loadingOptions.value = true;
  try {
    const res = await getFreeAffectationOptions(original);
    const data = res.data;
    if (data?.options && Array.isArray(data.options)) {
      affectationOptions.value = data.options.map((opt) => ({
        label: `${opt.id} - ${opt.description}`,
        value: opt.id,
      }));
      return;
    }
  } catch (err) {
    console.error("Error cargando opciones de afectacion gratuita:", err);
  } finally {
    loadingOptions.value = false;
  }

  // Fallback con opciones estándar según catálogo
  if (original === AFFECTATION_TAXED) {
    affectationOptions.value = [
      { label: "13 - GRAVADO - RETIRO POR CONSUMO PROPIO", value: 13 },
      { label: "15 - GRAVADO - BONIFICACIONES", value: 15 },
      { label: "11 - GRAVADO - RETIRO POR PREMIO", value: 11 },
      { label: "12 - GRAVADO - RETIRO POR DONACIÓN", value: 12 },
      { label: "14 - GRAVADO - RETIRO POR PUBLICIDAD", value: 14 },
      { label: "16 - GRAVADO - RETIRO POR ENTREGA A TRABAJADORES", value: 16 },
    ];
  } else {
    affectationOptions.value = [
      { label: "21 - EXONERADO - TRANSFERENCIA GRATUITA", value: 21 },
    ];
  }
};

const onReasonChange = (reason) => {
  selectedAffectation.value = defaultFreeAffectation(originalAfc.value, reason);
};

watch(
  () => props.show,
  (val) => {
    if (!val || !props.detail) return;
    const currentAfc = Number(props.detail.product_affectation);
    if (isFreeAffectation(currentAfc)) {
      operationType.value = "FREE";
      selectedReason.value = props.detail.free_reason || FREE_REASON_INTERNAL_CONSUMPTION;
      selectedAffectation.value = currentAfc;
    } else {
      operationType.value = "REGULAR";
      regularAffectation.value = currentAfc;
      selectedReason.value = FREE_REASON_INTERNAL_CONSUMPTION;
      selectedAffectation.value = defaultFreeAffectation(originalAfc.value, FREE_REASON_INTERNAL_CONSUMPTION);
    }
    loadAffectationOptions();
  },
  { immediate: true }
);

const close = () => {
  emit("update:show", false);
};

const save = () => {
  if (operationType.value === "REGULAR") {
    emit("apply", {
      is_free: false,
      product_affectation: regularAffectation.value,
      free_reason: null,
      original_affectation: regularAffectation.value,
    });
  } else {
    emit("apply", {
      is_free: true,
      product_affectation: selectedAffectation.value,
      free_reason: selectedReason.value,
      original_affectation: originalAfc.value,
    });
  }
  close();
};
</script>
