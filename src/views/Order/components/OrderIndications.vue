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
        class="p-2"
        :class="{ 'bg-selected': selectedIndication === index }"
        :key="index"
        @click="selectIndication(index)"
      >
        <!-- <template #prefix>
          <v-icon
            :name="!indication.takeAway ? 'io-bag' : 'io-bag-check'"
            @click="
              indication.takeAway
                ? (indication.takeAway = false)
                : (indication.takeAway = true)
            "
            :fill="!indication.takeAway ? null : 'green'"
            @click.stop
          ></v-icon>
        </template> -->
        <n-thing
          :title="order.product_name"
          :title-extra="`S/. ${order.price}`"
        ></n-thing>
        <n-collapse-transition :show="selectedIndication === index">
          <n-tag
            v-for="(quick, index) in quickIndications"
            :key="index"
            class="mx-1"
            checkable
            :checked="indication.quick_indications.some((ind) => ind === quick)"
            @update:checked="() => handleIndications(indication, quick)"
          >
            {{ quick }}
          </n-tag>
          <n-form>
            <n-form-item
              v-if="selectedIndication !== null"
              :span="12"
              label="Indicaciones"
            >
              <n-input
                @click.stop
                type="textarea"
                v-model:value="indication.description"
              />
            </n-form-item>
          </n-form>
        </n-collapse-transition>
      </n-list-item>
    </n-list>
    <template #action>
      <n-space justify="end"
        ><n-button type="info" @click="saveIndications"
          >Guardar</n-button
        ></n-space
      >
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, computed, ref, toRefs, watch } from "vue";
import { cloneDeep } from "@/utils";
import { useGenericsStore } from "@/store/modules/generics";

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
    const indications = ref([]);

    const quickIndications = computed(() => {
      if (order.value.quick_indications) {
        return order.value.quick_indications.trim().split(",");
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

    watch(show, () => {
      if (show.value === true && order.value.indication.length === 0) {
        indications.value = Array.apply(null, Array(order.value.quantity)).map(
          () => ({ takeAway: true, description: "", quick_indications: [] })
        );
      } else if (
        show.value === true &&
        order.value.indication.length === order.value.quantity
      ) {
        indications.value = cloneDeep(order.value.indication);
      } else if (
        show.value === true &&
        order.value.indication.length < order.value.quantity
      ) {
        indications.value = cloneDeep(order.value.indication);
        for (
          let i = 0;
          i < order.value.quantity - order.value.indication.length;
          i++
        ) {
          indications.value.push({
            takeAway: true,
            description: "",
            quick_indications: [],
          });
        }
      } else if (
        show.value === true &&
        order.value.indication.length > order.value.quantity
      ) {
        indications.value = cloneDeep(order.value.indication);
        for (
          let i = 0;
          i < order.value.indication.length - order.value.quantity;
          i++
        ) {
          indications.value.pop();
        }
      }
    });

    const selectedIndication = ref(null);

    const selectIndication = (indication) => {
      if (!selectedIndication.value) {
        selectedIndication.value = indication;
      } else {
        if (selectedIndication.value === indication) {
          selectedIndication.value = null;
        } else {
          selectedIndication.value = indication;
        }
      }
    };

    const saveIndications = () => {
      order.value.indication = cloneDeep(indications.value);
      indications.value = [];
      emit("success");
    };

    return {
      genericsStore,
      indications,
      saveIndications,
      selectIndication,
      selectedIndication,
      quickIndications,
      handleIndications,
    };
  },
});
</script>

<style lang="scss">
.bg-selected {
  background-color: AliceBlue;
}
</style>