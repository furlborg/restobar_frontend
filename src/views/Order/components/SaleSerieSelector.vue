<template>
  <div class="d-flex align-items-center">
    <n-text class="fs-4">{{ displayText }}</n-text>
    <n-dropdown
      trigger="click"
      :options="serieOptions"
      :show-arrow="true"
      placement="bottom-end"
      size="huge"
      key-field="key"
      label-field="label"
      @select="handleSerieSelect"
    >
      <n-button type="info" text>
        <v-icon class="p-0" name="md-arrowdropdown-round" scale="1.75" />
      </n-button>
    </n-dropdown>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useSaleStore } from "@/store/modules/sale";

export default defineComponent({
  name: "SaleSerieSelector",
  props: {
    sale: {
      type: Object,
      required: true,
      validator: (sale) => {
        return sale && typeof sale === 'object';
      }
    },
    invoiceType: {
      type: Number,
      required: true
    }
  },
  emits: ['update:serie', 'serie-changed'],
  setup(props, { emit }) {
    const saleStore = useSaleStore();

    const displayText = computed(() => {
      if (!props.sale?.serie) {
        return 'Sin serie';
      }
      const description = saleStore.getSerieDescription(props.sale.serie);
      const number = props.sale.number || '';
      return `${description}-${number}`;
    });

    const serieOptions = computed(() => {
      const options = saleStore.getDocumentSeriesOptions(props.invoiceType);
      const formattedOptions = options.map(option => ({
        label: String(option.label),
        value: option.value,
        key: String(option.value)
      }));
      return formattedOptions;
    });

    const handleSerieSelect = (selectedKey) => {
      const selectedOption = serieOptions.value.find(option => option.key === selectedKey);
      const selectedSerie = selectedOption ? selectedOption.value : selectedKey;

      const options = saleStore.getDocumentSeriesOptions(props.invoiceType);

      if (selectedSerie === null || selectedSerie === undefined) {
        if (options.length > 0) {
          const fallbackSerie = options[0].value;
          emit('update:serie', fallbackSerie);
          emit('serie-changed', fallbackSerie);
        }
        return;
      }

      emit('update:serie', selectedSerie);
      emit('serie-changed', selectedSerie);
    };

    return {
      displayText,
      serieOptions,
      handleSerieSelect
    };
  }
});
</script>