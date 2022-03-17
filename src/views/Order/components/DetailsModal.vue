<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-20': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Detalle de pedido"
    :mask-closable="false"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-spin :show="isLoadingData">
      <n-table>
        <thead>
          <tr>
            <th width="50%">Producto</th>
            <th width="25%">Cantidad</th>
            <th width="25%">SubTotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(detail, index) in details" :key="index">
            <td>
              {{ detail.product_name }}
            </td>
            <td>
              {{ detail.quantity }}
            </td>
            <td>S/. {{ detail.subTotal.toFixed(2) }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-spin>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, watch, computed } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
import { isNumber, isLetter } from "@/utils";
import { listOrderDetails } from "@/api/modules/orders";

export default defineComponent({
  name: "DetailsModal",
  emits: ["update:show"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    idOrder: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { emit }) {
    const message = useMessage();
    const genericsStore = useGenericsStore();
    const { show, idOrder } = toRefs(props);
    const isLoadingData = ref(false);
    const details = ref([]);

    watch(show, () => {
      if (show.value === true) {
        document.title = "Detalle de Pedido | App";
        isLoadingData.value = true;
        listOrderDetails(idOrder.value)
          .then((response) => {
            if (response.status === 200) {
              details.value = response.data;
              details.value.forEach(
                (detail) =>
                  (detail.subTotal =
                    Number(detail.quantity) *
                    parseFloat(detail.price).toFixed(2))
              );
            }
            console.log(details.value);
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isLoadingData.value = false;
          });
      } else {
        details.value = [];
      }
    });

    return {
      genericsStore,
      isLoadingData,
      details,
    };
  },
});
</script>

<style>
</style>