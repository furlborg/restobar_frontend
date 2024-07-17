<template>
  <!-- @close="() => $emit('update:show')" -->
  <n-modal
          :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-75 ': genericsStore.device === 'desktop',
    }"
    id="SaleUpdate"
    preset="card"
    title="Editar Venta"
    :show="show"
    :mask-closable="false"
    @close="() => $emit('update:sale')"
  >
    <n-spin :show="loading">
      <SaleForm
        :id="sale"
        :data="data"
        @on-success="() => $emit('on-success')"
      />
    </n-spin>
  </n-modal>
</template>

<script>
import { defineComponent, toRefs, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { retrieveSale } from "@/api/modules/sales";
import SaleForm from "./SaleForm";

export default defineComponent({
  name: "SaleUpdate",
  components: {
    SaleForm,
  },
  emits: ["update:sale", "on-success"],
  props: {
    sale: {
      type: Number,
      default: null,
    },
  },
  setup(props) {
    const genericsStore = useGenericsStore();
    const { sale } = toRefs(props);
    const message = useMessage();

    const data = ref({});

    const show = ref(false);

    const loading = ref(false);

    const loadSale = async () => {
      loading.value = true;
      await retrieveSale(sale.value)
        .then((response) => {
          if (response.status === 200) {
            data.value = response.data;
            show.value = true;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loading.value = false;
        });
    };

    watch(sale, () => {
      if (sale.value) {
        loadSale(sale.value);
      } else {
        data.value = {};
        show.value = false;
      }
    });

    return {
      genericsStore,
      loading,
      show,
      data,
    };
  },
});
</script>

<style></style>
