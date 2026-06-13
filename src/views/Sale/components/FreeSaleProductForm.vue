<template>
  <n-form ref="form" :model="product" :rules="rules">
    <n-grid responsive="screen" cols="12" :x-gap="6">
      <n-form-item-gi span="9" label="Producto" path="product_name">
        <n-auto-complete
          v-model:value="product.product_name"
          :options="productOptions"
          :loading="searchingProducts"
          placeholder=""
          clearable
          @update:value="handleProductInput"
          @select="handleProductSelect"
        />
      </n-form-item-gi>
      <n-form-item-gi span="3" label="Precio" path="price_sale">
        <n-input-number v-model:value="product.price_sale" :show-button="false" :min="0" placeholder="" />
      </n-form-item-gi>
      <n-form-item-gi label="Afectación" :span="9">
        <n-select
          v-model:value="product.product_affectation"
          placeholder="Seleccione"
          :options="productStore.affectationsOptions"
          :disabled="!settingsStore.businessSettings.sale.manage_affectations"
        />
      </n-form-item-gi>
      <n-form-item-gi v-if="selectedProduct" :span="3">
        <n-checkbox v-model:checked="product.deduct_stock">Descontar stock</n-checkbox>
      </n-form-item-gi>
    </n-grid>
    <n-space justify="end">
      <n-button type="success" secondary @click.prevent="saveProduct">Agregar</n-button>
    </n-space>
  </n-form>
</template>

<script>
import { computed, defineComponent, ref } from "vue";
import { searchProductByName } from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
  name: "FreeSaleProductForm",
  props: {
    initialDeductStock: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["success"],
  setup(props, { emit }) {
    const productStore = useProductStore();
    const saleStore = useSaleStore();
    const settingsStore = useSettingsStore();

    const form = ref(null);
    const selectedProduct = ref(null);
    const productOptions = ref([]);
    const searchingProducts = ref(false);
    const initialDeductStock = computed(() => !!props.initialDeductStock);

    const createDefaultProduct = () => ({
      product: null,
      product_name: "",
      price_sale: 0,
      product_affectation: settingsStore.businessSettings.sale.default_affectation,
      deduct_stock: initialDeductStock.value,
    });

    const product = ref(createDefaultProduct());

    const productOptionLabel = (item) => `${item.code || item.id} - ${item.name}`;

    const findProductOption = (value, option = null) => {
      if (option?.product) return option;
      const text = String(value || "");
      return productOptions.value.find((item) => {
        return String(item.value) === text
          || item.label === text
          || item.product?.name === text
          || productOptionLabel(item.product) === text;
      });
    };

    const isSelectedProductText = (value) => {
      if (!selectedProduct.value) return false;
      const text = String(value || "");
      return text === selectedProduct.value.name
        || text === productOptionLabel(selectedProduct.value);
    };

    const rules = {
      product_name: {
        required: true,
        trigger: ["blur", "input"],
        message: "Nombre requeridos",
      },
      price_sale: [
        {
          type: "number",
          required: true,
          trigger: ["blur", "input"],
          message: "Precio requerido",
        },
        {
          type: "number",
          trigger: ["blur", "input"],
          message: "Precio requerido",
          validator(rule, value) {
            return value > 0;
          },
        },
      ],
    };

    const resetSelectedProduct = () => {
      selectedProduct.value = null;
      product.value.product = null;
      product.value.deduct_stock = false;
    };

    const handleProductInput = async (value) => {
      if (!value) {
        productOptions.value = [];
        resetSelectedProduct();
        return;
      }

      if (selectedProduct.value) {
        if (isSelectedProductText(value)) {
          productOptions.value = [];
          product.value.product_name = selectedProduct.value.name;
          return;
        }
        resetSelectedProduct();
      }

      if (value.length < 2) {
        productOptions.value = [];
        return;
      }

      searchingProducts.value = true;
      try {
        const response = await searchProductByName(value);
        productOptions.value = (response.data || []).map((item) => ({
          label: productOptionLabel(item),
          value: item.name,
          product: item,
        }));
      } catch (error) {
        console.error(error);
        productOptions.value = [];
      } finally {
        searchingProducts.value = false;
      }
    };

    const handleProductSelect = (value, option) => {
      const selectedOption = findProductOption(value, option);
      if (!selectedOption?.product) return;

      const item = selectedOption.product;
      selectedProduct.value = item;
      product.value.product = item.id;
      product.value.product_name = item.name;
      product.value.price_sale = Number(item.prices || 0);
      product.value.product_affectation = Number(
        item.affectation || settingsStore.businessSettings.sale.default_affectation,
      );
      product.value.deduct_stock = initialDeductStock.value;
    };

    const buildSaleDetail = () => {
      const item = selectedProduct.value;
      const icbperUnit = item?.icbper ? Number(settingsStore.businessSettings.sale.icbper_tax || 0) : 0;
      const detail = {
        product: item ? item.id : null,
        product_name: product.value.product_name,
        product_affectation: Number(product.value.product_affectation),
        product_igv: item ? Number(item.igv_tax || 0) : 0,
        igv_tax: 0,
        price_sale: Number(product.value.price_sale || 0),
        discount: 0,
        price_base: Number(product.value.price_sale || 0),
        quantity: 1,
        icbper: icbperUnit,
        icbper_unit: icbperUnit,
        applies_icbper: !!item?.icbper,
        deduct_stock: !!item && !!product.value.deduct_stock,
      };
      saleStore.updateDetail(detail);
      return detail;
    };

    const saveProduct = () => {
      form.value.validate((errors) => {
        if (!errors) {
          emit("success", buildSaleDetail());
          product.value = createDefaultProduct();
          selectedProduct.value = null;
          productOptions.value = [];
        }
      });
    };

    return {
      productStore,
      settingsStore,
      form,
      rules,
      product,
      selectedProduct,
      productOptions,
      searchingProducts,
      handleProductInput,
      handleProductSelect,
      saveProduct,
    };
  },
});
</script>

<style lang="scss" scoped></style>
