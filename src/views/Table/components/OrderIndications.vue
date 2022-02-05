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
        :class="{ 'bg-selected': selectedIndication === indication }"
        :key="index"
        @click="selectIndication(indication)"
      >
        <template #prefix>
          <v-icon
            :name="indication.takeAway ? 'io-bag' : 'io-bag-check'"
            @click="
              indication.takeAway
                ? (indication.takeAway = false)
                : (indication.takeAway = true)
            "
            :fill="indication.takeAway ? null : 'green'"
          ></v-icon>
        </template>
        <n-thing
          :title="order.product_name"
          :title-extra="`S/. ${order.price}`"
          :description="indication.description"
        ></n-thing>
      </n-list-item>
    </n-list>
    <n-collapse-transition :show="!!selectedIndication">
      <n-form>
        <n-form-item
          v-if="selectedIndication !== null"
          :span="12"
          v-model:value="selectedIndication.description"
          label="Indicaciones"
        >
          <n-input type="textarea" />
        </n-form-item>
        <!-- <n-button type="info" block></n-button> -->
      </n-form>
    </n-collapse-transition>
    <template #action>
      <n-space justify="end"
        ><n-button type="info" @click="saveIndications"
          >Agregar</n-button
        ></n-space
      >
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, watch } from "vue";
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

    watch(show, () => {
      if (show.value === true && order.value.indication.length === 0) {
        indications.value = Array.apply(null, Array(order.value.quantity)).map(
          () => ({ takeAway: false, description: "" })
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
          indications.value.push({ takeAway: false, description: "" });
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
      if (!selectedIndication) {
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
      console.log(order.value);
      indications.value = [];
      emit("success");
    };

    return {
      genericsStore,
      indications,
      saveIndications,
      selectIndication,
      selectedIndication,
    };
  },
});
</script>

<style lang="scss">
.bg-selected {
  background-color: AliceBlue;
}
</style>