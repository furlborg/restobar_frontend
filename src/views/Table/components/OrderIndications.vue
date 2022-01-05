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
      <n-list-item v-for="(indication, index) in indications" :key="index">
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
          :title="product.title"
          title-extra="S/. 10.00"
          description="indicaciones"
        ></n-thing>
      </n-list-item>
    </n-list>
    <n-form>
      <n-grid responsive="screen" cols="12 s:12 m:12 l:12 xl:12 2xl:12">
        <n-form-item-gi :span="12" label="Indicaciones">
          <n-input type="textarea" />
        </n-form-item-gi>
      </n-grid>
    </n-form>
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
    product: {
      default: null,
    },
  },
  setup(props, { emit }) {
    const { show, product } = toRefs(props);
    const genericsStore = useGenericsStore();
    const indications = ref([]);

    watch(show, () => {
      if (show.value === true && product.value.indications.length === 0) {
        indications.value = Array.apply(
          null,
          Array(product.value.quantity)
        ).map(() => ({ takeAway: false, description: "" }));
      } else if (
        show.value === true &&
        product.value.indications.length === product.value.quantity
      ) {
        indications.value = cloneDeep(product.value.indications);
      } else if (
        show.value === true &&
        product.value.indications.length < product.value.quantity
      ) {
        indications.value = cloneDeep(product.value.indications);
        for (
          let i = 0;
          i < product.value.quantity - product.value.indications.length;
          i++
        ) {
          indications.value.push({ takeAway: false, description: "" });
        }
      } else if (
        show.value === true &&
        product.value.indications.length > product.value.quantity
      ) {
        indications.value = cloneDeep(product.value.indications);
        for (
          let i = 0;
          i < product.value.indications.length - product.value.quantity;
          i++
        ) {
          indications.value.pop();
        }
      }
    });

    const saveIndications = () => {
      product.value.indications = cloneDeep(indications.value);
      indications.value = [];
      emit("success");
    };

    return {
      genericsStore,
      indications,
      saveIndications,
    };
  },
});
</script>

<style>
</style>