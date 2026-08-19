<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-50': genericsStore.device === 'tablet',
      'w-25': genericsStore.device === 'desktop',
    }"
    preset="card"
    title="Indicaciones"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-list>
      <n-list-item
        v-for="(indication, index) in indications"
        class="p-2 mb-1"
        :class="{ 
          'bg-selected': selectedIndication === index,
          'item-saved': isItemSaved(index),
          'item-new': !isItemSaved(index) && savedQuantity > 0
        }"
        :key="index"
        @click="handleItemClick(index)"
      >
        <n-thing>
          <template #header>
            <div class="d-flex align-items-center justify-content-between">
              <span>{{ order?.product_name }} #{{ index + 1 }}</span>
              <div>
                <n-tag v-if="isItemSaved(index)" size="tiny" :bordered="false" type="default" style="font-size: 10px; font-weight: 600; margin-left: 6px; padding: 0 4px; height: 18px;">
                  YA ENVIADO
                </n-tag>
                <n-tag v-else-if="savedQuantity > 0" size="tiny" type="success" style="font-size: 10px; font-weight: 600; margin-left: 6px; padding: 0 4px; height: 18px;">
                  NUEVO
                </n-tag>
              </div>
            </div>
          </template>
          <template #header-extra>
            <span class="text-muted">S/. {{ order?.price }}</span>
          </template>
          <template #description v-if="isItemSaved(index)">
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              <span v-if="indication.quick_indications?.length || indication.description">
                <strong>Indicación:</strong> {{ [ ...(indication.quick_indications || []), indication.description ].filter(Boolean).join(', ') }}
              </span>
              <span v-else style="font-style: italic;">Sin indicaciones</span>
            </div>
          </template>
        </n-thing>
        <n-collapse-transition :show="selectedIndication === index && !isItemSaved(index)">
          <div class="mt-2 pt-2 border-top">
            <n-tag
              v-for="(quick, qIndex) in quickIndications"
              :key="qIndex"
              class="mx-1 mb-1"
              checkable
              @click.stop
              :checked="indication.quick_indications.some((ind) => ind === quick)"
              @update:checked="() => handleIndications(indication, quick)"
            >
              {{ quick }}
            </n-tag>
            <n-form class="mt-2">
              <n-form-item
                v-if="selectedIndication !== null"
                :span="12"
                label="Indicaciones"
              >
                <n-input
                  @click.stop
                  type="textarea"
                  v-model:value="indication.description"
                  placeholder="Escriba especificaciones aquí..."
                />
              </n-form-item>
            </n-form>
          </div>
        </n-collapse-transition>
      </n-list-item>
    </n-list>
    <template #action>
      <n-space justify="end">
        <n-button type="info" @click="saveIndications">Guardar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, computed, ref, toRefs, watch } from "vue";
import { cloneDeep } from "@/utils";
import { useGenericsStore } from "@/store/modules/generics";
import { useSaleStore } from "@/store/modules/sale";

export default defineComponent({
  name: "OrderIndications",
  emits: ["update:show", "success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    order: {
      default: null,
    },
  },
  setup(props, { emit }) {
    const { show, order } = toRefs(props);
    const genericsStore = useGenericsStore();
    const saleStore = useSaleStore();
    const indications = ref([]);
    const selectedIndication = ref(null);

    const savedQuantity = computed(() => {
      if (!order.value || !order.value.id) return 0;
      return saleStore.getOrderQuantity(order.value.id) || order.value.initial_quantity || 0;
    });

    const isItemSaved = (index) => {
      return index < savedQuantity.value;
    };

    const quickIndications = computed(() => {
      if (order.value?.quick_indications) {
        if (Array.isArray(order.value.quick_indications)) return order.value.quick_indications;
        return order.value.quick_indications.trim().split(",").map((s) => s.trim()).filter(Boolean);
      }
      return [];
    });

    const handleIndications = (indication, quick) => {
      const index = indication.quick_indications.findIndex(
        (ind) => ind === quick
      );
      if (index >= 0) {
        indication.quick_indications.splice(index, 1);
      } else {
        indication.quick_indications.push(quick);
      }
    };

    const handleItemClick = (index) => {
      if (isItemSaved(index)) return;
      selectIndication(index);
    };

    watch(show, (val) => {
      if (!val) return;

      const qty = Number(order.value?.quantity) || 1;
      const current = cloneDeep(order.value?.indication || []);

      indications.value = Array.from({ length: qty }, (_, i) => ({
        takeAway: current[i]?.takeAway || false,
        description: current[i]?.description || "",
        quick_indications: Array.isArray(current[i]?.quick_indications)
          ? current[i].quick_indications
          : [],
      }));

      // Si hay items nuevos, auto-seleccionar el primer item nuevo para facilitar la edición
      if (savedQuantity.value > 0 && qty > savedQuantity.value) {
        selectedIndication.value = savedQuantity.value;
      } else if (savedQuantity.value === 0) {
        selectedIndication.value = 0;
      } else {
        selectedIndication.value = null;
      }
    });

    const selectIndication = (index) => {
      if (selectedIndication.value === index) {
        selectedIndication.value = null;
      } else {
        selectedIndication.value = index;
      }
    };

    const saveIndications = () => {
      order.value.indication = cloneDeep(indications.value);
      emit("success");
      emit("update:show", false);
    };

    return {
      genericsStore,
      indications,
      saveIndications,
      selectIndication,
      selectedIndication,
      quickIndications,
      handleIndications,
      savedQuantity,
      isItemSaved,
      handleItemClick,
    };
  },
});
</script>

<style lang="scss" scoped>
.bg-selected {
  background-color: #f0f7ff !important;
  border-left: 4px solid #1890ff !important;
}

.item-saved {
  background-color: #f5f5f5 !important;
  border-left: 4px solid #b0b0b0 !important;
  opacity: 0.75;
  cursor: not-allowed !important;
}

.item-new {
  border-left: 4px solid #18a058;
}
</style>
