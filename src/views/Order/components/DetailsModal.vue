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
                <span>{{ detail.product_name || detail.product_set?.name }}</span>
                <template v-if="formatIndications(detail.indication)">
                  <br>
                  <span style="font-size: 0.85em; color: #555;">{{ formatIndications(detail.indication) }}</span>
                </template>
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

    const formatIndications = (indications) => {
      if (!Array.isArray(indications)) return "";
      const valid = [];
      indications.forEach((ind) => {
        let itemDesc = "";
        if (ind?.quick_indications && ind.quick_indications.length) {
          itemDesc = ind.quick_indications.join(", ");
        }
        if (ind?.description && ind.description.trim() !== "" && !ind.description.includes("[]")) {
          itemDesc = itemDesc ? `${itemDesc}, ${ind.description.trim()}` : ind.description.trim();
        }
        if (ind?.takeAway) {
          itemDesc = itemDesc ? `${itemDesc} [LLEVAR]` : "[LLEVAR]";
        }
        if (itemDesc) {
          valid.push(`[${itemDesc}]`);
        }
      });
      return valid.join(" ");
    };

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
      formatIndications,
    };
  },
});
</script>

<style></style>
