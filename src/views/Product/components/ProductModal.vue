<template>
  <n-modal
    :class="{
      'w-100': genericsStore.device === 'mobile',
      'w-75': genericsStore.device === 'tablet',
      'w-50': genericsStore.device === 'desktop',
    }"
    preset="card"
    :title="modalTitle"
    :show="show"
    :on-close="() => $emit('update:show')"
  >
    <n-spin :show="isLoadingData">
      <n-form :model="product" :rules="productRules" ref="productRef">
        <n-grid
          responsive="screen"
          cols="6 s:6 m:12 l:24 xl:24 2xl:24"
          :x-gap="12"
        >
          <n-form-item-gi label="Nombre" path="name" :span="12">
            <n-input v-model:value="product.name" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Description" path="description" :span="12">
            <n-input v-model:value="product.description" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Categoría" path="category_product" :span="12">
            <transition name="mode-fade" mode="out-in">
              <n-input-group v-if="categoryForm">
                <n-input v-model:value="categorie.description" placeholder="" />
                <n-button
                  type="info"
                  tertiary
                  :disabled="
                    categorie.description ===
                      productStore.getCategorieDescription(categorie.id) ||
                    !categorie.description
                      ? true
                      : false
                  "
                  @click="
                    categorie.id
                      ? performUpdateProductCategory()
                      : performCreateProductCategory()
                  "
                >
                  <v-icon name="md-save-round" />
                </n-button>
                <n-button type="error" tertiary @click="categoryForm = false">
                  <v-icon name="md-close-round" />
                </n-button>
              </n-input-group>
              <n-input-group v-else>
                <n-button
                  type="info"
                  tertiary
                  @click="
                    categoryForm = true;
                    categorie.id = null;
                    categorie.description = null;
                  "
                >
                  <v-icon name="md-add-round" />
                </n-button>
                <n-select
                  v-model:value="product.category_product"
                  :options="categoriesOptions"
                  placeholder=""
                  clearable
                />
                <n-button
                  v-if="product.category_product"
                  type="warning"
                  tertiary
                  @click="
                    categoryForm = true;
                    categorie.id = product.category_product;
                    categorie.description =
                      productStore.getCategorieDescription(
                        product.category_product
                      );
                  "
                >
                  <v-icon name="ri-edit-fill" />
                </n-button>
              </n-input-group>
            </transition>
          </n-form-item-gi>
          <n-form-item-gi label="Precio" path="prices" :span="3">
            <n-input v-model:value="product.prices" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi label="Stock" path="stock" :span="3">
            <n-input v-model:value="product.stock" placeholder="" />
          </n-form-item-gi>
          <n-form-item-gi path="control_stock" :span="3">
            <n-checkbox v-model:checked="product.control_stock"
              >Controlar</n-checkbox
            >
          </n-form-item-gi>
          <n-form-item-gi path="icbper" :span="3">
            <n-checkbox v-model:checked="product.icbper">ICBPER</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi
            label="Lugar Preparación"
            path="preparation_place"
            :span="12"
          >
            <n-select
              v-model:value="product.preparation_place"
              :options="placesOptions"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Nº Puntos" path="number_points" :span="3">
            <n-input-number
              v-model:value="product.number_points"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Puntos canje" path="redeem_points" :span="3">
            <n-input-number
              v-model:value="product.redeem_points"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Imagen" :span="6">
            <n-upload list-type="image" ref="uploadRef">
              <n-button>Seleccionar Imagen</n-button>
            </n-upload>
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-spin>
    <template #action>
      <n-space justify="end">
        <n-button
          v-if="idProduct === 0"
          type="primary"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performCreate"
          >Registrar</n-button
        >
        <n-button
          v-else
          type="warning"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performUpdate"
          >Modificar</n-button
        >
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, computed, watch } from "vue";
import { useGenericsStore } from "@/store/modules/generics";
import {
  createProduct,
  updateProduct,
  retrieveProduct,
  createProductCategory,
  updateProductCategory,
} from "@/api/modules/products";
import { useProductStore } from "@/store/modules/product";
import { useMessage } from "naive-ui";
import { productRules } from "@/utils/constants";

export default defineComponent({
  name: "ProductModal",
  emits: ["update:show", "on-success"],
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    idProduct: {
      type: Number,
      default: 0,
    },
  },
  setup(props, { emit }) {
    const message = useMessage();
    const isLoadingData = ref(false);
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const { idProduct, show } = toRefs(props);
    const uploadRef = ref(null);
    const modalTitle = ref("Registrar Producto");
    const productRef = ref(null);
    const product = ref({
      name: null,
      description: null,
      prices: null,
      measure_unit: null,
      control_stock: false,
      stock: null,
      icbper: false,
      number_points: null,
      redeem_points: null,
      category_product: null,
      preparation_place: null,
    });
    const categoriesOptions = computed(() => {
      return productStore.categories.map((categorie) => ({
        label: categorie.description,
        value: categorie.id,
      }));
    });
    const placesOptions = computed(() => {
      return productStore.places.map((place) => ({
        label: place.description,
        value: place.id,
      }));
    });

    watch(show, () => {
      if (show.value === true && idProduct.value !== 0) {
        document.title = "Modificar Producto | App";
        modalTitle.value = "Modificar Producto";
        isLoadingData.value = true;
        retrieveProduct(idProduct.value)
          .then((response) => {
            product.value = response.data;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salio mal...");
          })
          .finally(() => {
            isLoadingData.value = false;
          });
      } else if (show.value === true && idProduct.value === 0) {
        document.title = "Registrar Producto | App";
        modalTitle.value = "Registrar Producto";
        product.value = {
          name: null,
          description: null,
          prices: null,
          measure_unit: null,
          control_stock: false,
          stock: null,
          icbper: false,
          number_points: null,
          redeem_points: null,
          category_product: null,
          preparation_place: null,
        };
      }
    });

    const performCreate = (e) => {
      e.preventDefault();
      productRef.value.validate((errors) => {
        if (!errors) {
          isLoadingData.value = true;
          createProduct(product.value)
            .then((response) => {
              if (response.status === 201) {
                message.success("Producto registrado!");
                emit("on-success");
              }
            })
            .catch((error) => {
              console.error(error.response.data);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              isLoadingData.value = false;
            });
        } else {
          console.log(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const performUpdate = (e) => {
      e.preventDefault();
      productRef.value.validate((errors) => {
        if (!errors) {
          isLoadingData.value = true;
          updateProduct(idProduct.value, product.value)
            .then((response) => {
              if (response.status === 202) {
                message.success("Producto actualizado!");
                emit("on-success");
              }
            })
            .catch((error) => {
              console.error(error.response.data);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              isLoadingData.value = false;
            });
        } else {
          console.error(errors);
          message.error("Datos Incorrectos");
        }
      });
    };

    const categoryForm = ref(false);
    const categorie = ref({
      id: null,
      description: null,
    });

    const performCreateProductCategory = () => {
      createProductCategory(categorie.value)
        .then((response) => {
          if (response.status === 201) {
            productStore.refreshCategories().then(() => {
              product.value.category_product = productStore.getCategorieID(
                categorie.value.description
              );
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          categoryForm.value = false;
        });
    };

    const performUpdateProductCategory = () => {
      updateProductCategory(categorie.value.id, categorie.value.description)
        .then((response) => {
          if (response.status === 200) {
            productStore.refreshCategories();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          categoryForm.value = false;
        });
    };

    return {
      genericsStore,
      isLoadingData,
      categoryForm,
      uploadRef,
      modalTitle,
      categoriesOptions,
      placesOptions,
      productStore,
      product,
      productRef,
      productRules,
      categorie,
      performCreate,
      performUpdate,
      performUpdateProductCategory,
      performCreateProductCategory,
    };
  },
});
</script>

<style lang="scss">
.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}
</style>