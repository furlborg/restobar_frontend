<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
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
              {{ detail.initial_quantity }}
            </td>
            <td>S/. {{ detail.subTotal.toFixed(2) }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-spin>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, watch } from "vue";
import { useMessage } from "naive-ui";
import { useGenericsStore } from "@/store/modules/generics";
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
  setup(props) {
    const message = useMessage();
    const genericsStore = useGenericsStore();
    const { show, idOrder } = toRefs(props);
    const isLoadingData = ref(false);
    const details = ref([]);

    watch(show, async () => {
      if (show.value === true) {
        isLoadingData.value = true;
        await listOrderDetails(idOrder.value)
          .then((response) => {
            if (response.status === 200) {
              details.value = response.data;
              details.value.forEach(
                (detail) =>
                  (detail.subTotal =
                    Number(detail.initial_quantity) *
                    parseFloat(detail.price).toFixed(2))
              );
            }
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

<style></style>
