<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-50': genericsStore.device === 'desktop',
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
                <span>{{ detail.product_name || detail.product_set?.name }}</span><br>
                <span v-if="order?.indication?.some(dt => dt?.description && dt.description.trim())">
                      {{ order.indication.map(dt => dt?.description?.split(', ') || []).flat().map(s => s.trim()).filter(Boolean).join(', ') }}
                </span> <br v-if="order?.indication?.some(dt => dt?.description && dt.description.trim())">
            </td>
            <td>
              {{ detail.quantity || detail.product_set?.quantity || 1 }}
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
                (detail) => {
                  const qty = Number(detail.quantity || detail.product_set?.quantity || detail.initial_quantity || 1);
                  const price = parseFloat(detail.price || detail.product_set?.computed_price || detail.product_set?.price || 0);
                  detail.subTotal = qty * price;
                }
              );
            }
          })
          .catch((error) => {
            console.error(error);
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
