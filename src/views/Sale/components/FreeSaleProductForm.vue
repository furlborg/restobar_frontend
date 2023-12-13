<template>
  <n-form ref="form" :model="product" :rules="rules">
    <n-grid responsive="screen" cols="12" :x-gap="6">
      <n-form-item-gi span="9" label="Producto" path="product_name">
        <n-input v-model:value="product.product_name" placeholder="" />
      </n-form-item-gi>
      <n-form-item-gi span="3" label="Precio" path="price_sale">
        <n-input-number
          v-model:value="product.price_sale"
          :show-button="false"
          :min="0"
          placeholder=""
        />
      </n-form-item-gi>
      <n-form-item-gi label="Afectación" :span="9">
        <n-select
          v-model:value="product.product_affectation"
          placeholder="Seleccione"
          :options="productStore.affectationsOptions"
          :disabled="!settingsStore.businessSettings.sale.manage_affectations"
        />
      </n-form-item-gi>
      <!-- <n-form-item-gi :span="3">
        <n-checkbox v-model:checked="product.icbper">ICBPER</n-checkbox>
      </n-form-item-gi> -->
    </n-grid>
    <n-space justify="end">
      <n-button type="success" secondary @click.prevent="saveProduct">
        Agregar
      </n-button>
    </n-space>
  </n-form>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useProductStore } from "@/store/modules/product";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
  name: "FreeSaleProductForm",
  emits: ["success"],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const settingsStore = useSettingsStore();

    const form = ref(null);

    const product = ref({
      product_name: "",
      price_sale: 0,
      product_affectation: 20,
    });

    const rules = {
      product_name: {
        required: true,
        trigger: ["blur", "input"],
        message: "Nombre requeridos",
      },
      price_sale: {
        type: "number",
        required: true,
        trigger: ["blur", "input"],
        message: "Precio requerido",
      },
    };

    const saveProduct = () => {
      form.value.validate((errors) => {
        if (!errors) {
          emit("success", {
            product_name: product.value.product_name,
            product_affectation: product.value.product_affectation,
            product_igv: 0,
            price_base: product.value.price_sale,
            igv_tax: 0,
            discount: 0,
            price_sale: product.value.price_sale,
            quantity: 1,
            icbper: 0,
          });
        }
      });
    };
    return {
      productStore,
      settingsStore,
      form,
      rules,
      product,
      saveProduct,
    };
  },
});
</script>

<style lang="scss" scoped></style>
