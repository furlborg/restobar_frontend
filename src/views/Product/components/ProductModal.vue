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
            <n-input
              v-model:value="product.name"
              @input="product.name = $event.toUpperCase()"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Precio Compra" path="purchase_price" :span="5">
            <n-input
              type="number"
              v-model:value="product.purchase_price"
              placeholder=""
              @input="
                product.purchase_price = restrictDecimal(product.purchase_price)
              "
            />
          </n-form-item-gi>
          <n-form-item-gi label="Precio venta" path="prices" :span="5">
            <n-input
              v-model:value="product.prices"
              placeholder=""
              @input="product.prices = restrictDecimal(product.prices)"
            />
          </n-form-item-gi>
          <n-gi :span="12">
            <transition name="mode-fade" mode="out-in">
              <n-form-item
                v-if="categoryForm"
                :label="!categorie.id ? 'Crear Categoría' : 'Editar Categoría'"
              >
                <n-input-group>
                  <n-input
                    v-model:value="categorie.description"
                    placeholder=""
                  />
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
                      !categorie.id
                        ? performCreateProductCategory()
                        : performUpdateProductCategory()
                    "
                  >
                    <v-icon name="md-save-round" />
                  </n-button>
                  <n-button type="error" tertiary @click="categoryForm = false">
                    <v-icon name="md-close-round" />
                  </n-button>
                </n-input-group>
              </n-form-item>
              <n-form-item v-else label="Categoría" path="category">
                <n-input-group>
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
                    v-model:value="product.category"
                    :options="categoriesOptions"
                    placeholder=""
                    filterable
                    clearable
                  />
                  <n-button
                    v-if="product.category"
                    type="warning"
                    tertiary
                    @click="
                      categoryForm = true;
                      categorie.id = product.category;
                      categorie.description =
                        productStore.getCategorieDescription(product.category);
                    "
                  >
                    <v-icon name="ri-edit-fill" />
                  </n-button>
                </n-input-group>
              </n-form-item>
            </transition>
          </n-gi>
          <n-form-item-gi
            label="Lugar Preparación"
            path="preparation_place"
            :span="7"
          >
            <n-select
              v-model:value="product.preparation_place"
              :options="placesOptions"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Unidad de medida" :span="5">
            <n-select
              v-model:value="product.measure_unit"
              placeholder="Seleccione"
              :options="optionsUND"
            />
          </n-form-item-gi>
          <n-form-item-gi path="control_stock" :span="5">
            <n-checkbox
              v-model:checked="product.control_stock"
              @update:checked="product.stock = null"
              >Controlar Stock</n-checkbox
            >
          </n-form-item-gi>
          <n-form-item-gi
            v-if="!product.id"
            label="Stock Inicial"
            path="stock"
            :span="4"
          >
            <n-input
              type="number"
              v-model:value="product.stock"
              @input="product.stock = restrictDecimal(product.stock)"
              placeholder="0.0"
              :disabled="!product.control_stock ? true : false"
            />
          </n-form-item-gi>
          <n-form-item-gi label="Nº Puntos" path="number_points" :span="4">
            <n-input-number
              v-model:value="product.number_points"
              placeholder=""
              :min="0"
              :show-button="false"
              @keypress="isNumber($event)"
            />
          </n-form-item-gi>
          <n-form-item-gi label="Puntos canje" path="redeem_points" :span="4">
            <n-input-number
              v-model:value="product.redeem_points"
              placeholder=""
              :min="0"
              :show-button="false"
              @keypress="isNumber($event)"
            />
          </n-form-item-gi>
          <n-form-item-gi path="icbper" :span="3">
            <n-checkbox v-model:checked="product.icbper">ICBPER</n-checkbox>
          </n-form-item-gi>
          <n-form-item-gi :span="3">
            <n-checkbox
              v-model:checked="product.control_supplie"
              @update:checked="
                (key) => {
                  product.supplies = key ? product.supplies : [];
                }
              "
              >Insumos</n-checkbox
            >
          </n-form-item-gi>
          <n-form-item-gi label="Descripción" path="description" :span="12">
            <n-input
              v-model:value="product.description"
              type="textarea"
              placeholder=""
            />
          </n-form-item-gi>
          <n-form-item-gi label="Almacen" :span="12">
            <n-select
              v-model:value="product.branchoffice"
              :disabled="product.id ? true : false"
              placeholder="Seleccione"
              :options="optionsEstablishment"
            />
          </n-form-item-gi>
          <!-- <n-form-item-gi label="Imagen" :span="4">
            <n-upload list-type="image" ref="uploadRef">
              <n-button>Seleccionar Imagen</n-button>
            </n-upload>
          </n-form-item-gi> -->
          <n-form-item-gi
            v-if="product.control_supplie"
            label="Lista de Insumos"
            :span="12"
          >
            <n-input-group>
              <n-select
                v-model:value="supplieItem.supplie"
                placeholder="Buscar..."
                filterable
                clearable
                @search="supplieSearch"
                :options="optionsSupplie"
              />
              <n-button type="success" secondary @click="newSupplies()"
                >Nuevo
              </n-button>
            </n-input-group>
          </n-form-item-gi>
          <n-form-item-gi
            v-if="product.control_supplie"
            label="Cantidad"
            :span="4"
          >
            <n-input-number
              placeholder=""
              v-model:value="supplieItem.stock"
              :min="0"
              :show-button="false"
              @keypress="isNumber($event)"
            />
          </n-form-item-gi>
          <n-form-item-gi v-if="product.control_supplie" :span="4">
            <n-button
              type="primary"
              @click="addSupplie(supplieItem)"
              secondary
              :disabled="
                supplieItem.supplie && supplieItem.stock ? false : true
              "
              >+ Agregar</n-button
            >
          </n-form-item-gi>
          <n-form-item-gi
            v-if="product.control_supplie"
            span="24"
            style="margin-top: -30px"
          >
            <n-data-table
              :columns="columnsSupplie"
              :data="product.supplies"
              size="small"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-spin>
    <!-- <pre>{{ JSON.stringify(product, 0, 2) }}</pre> -->
    <template #action>
      <n-space justify="end">
        <n-button
          v-if="idProduct === 0"
          type="primary"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performCreate"
          secondary
          >Registrar</n-button
        >
        <n-button
          v-else
          type="warning"
          :loading="isLoadingData"
          :disabled="isLoadingData"
          @click="performUpdate"
          secondary
          >Modificar</n-button
        >
      </n-space>
    </template>
    <supplies-modal
      v-model:show="showModal"
      @on-success="refreshSupplie"
      :items="items"
    />
  </n-modal>
</template>

<script>
import { defineComponent, ref, toRefs, computed, watch, reactive } from "vue";
import { useGenericsStore } from "@/store/modules/generics";
import {
  createProduct,
  updateProduct,
  retrieveProduct,
  createProductCategory,
  updateProductCategory,
} from "@/api/modules/products";
import { getSupplies, getMeasureUnit } from "@/api/modules/supplies";
import { useProductStore } from "@/store/modules/product";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { useMessage } from "naive-ui";
import { productRules } from "@/utils/constants";
import { isNumber } from "@/utils";
import { getBranchs } from "@/api/modules/business";
import SuppliesModal from "../../Supplies/components/SuppliesModal.vue";

export default defineComponent({
  name: "ProductModal",
  components: {
    SuppliesModal,
  },
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
    const showModal = ref(false);
    const isLoadingData = ref(false);
    const genericsStore = useGenericsStore();
    const productStore = useProductStore();
    const userStore = useUserStore();
    const businessStore = useBusinessStore();
    const { idProduct, show } = toRefs(props);
    const uploadRef = ref(null);
    const modalTitle = ref("Registrar Producto");
    const productRef = ref(null);
    const items = reactive({});
    const optionsSupplie = ref([]);
    const optionsEstablishment = ref([]);
    const optionsUND = ref([]);
    const supplieItem = ref({
      supplie: null,
      stock: null,
      supplie_des: null,
    });
    const product = ref({
      name: null,
      description: null,
      prices: null,
      purchase_price: null,
      measure_unit: 1,
      control_stock: false,
      stock: "",
      icbper: false,
      number_points: null,
      redeem_points: null,
      category: null,
      preparation_place: null,
      control_supplie: false,
      branchoffice: null,
      supplies: [],
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

    const supplieSearch = async (search) => {
      getSupplies(`supplies/search/?search=${search}`)
        .then((response) => {
          optionsSupplie.value = response.data.map((v) => ({
            label: v.name,
            value: v.id,
          }));
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });
    };
    supplieSearch("");

    const getEstablishment = async () => {
      getBranchs()
        .then((response) => {
          optionsEstablishment.value = [];
          response.data.map((v) => {
            if (
              userStore.user.branchoffice == null ||
              userStore.user.profile_des == "ADMINISTRADOR"
            ) {
              optionsEstablishment.value.push({
                label: v.description,
                value: v.id,
              });
            } else {
              if (userStore.user.branchoffice == v.id) {
                optionsEstablishment.value.push({
                  label: v.description,
                  value: v.id,
                });
              }
            }
          });
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });
    };
    getEstablishment();

    const getUND = async () => {
      getMeasureUnit()
        .then((response) => {
          optionsUND.value = response.data.map((v) => ({
            label: v.description,
            value: v.id,
          }));
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        });
    };
    getUND();

    watch(show, () => {
      if (show.value === true && idProduct.value !== 0) {
        document.title = "Modificar Producto | App";
        modalTitle.value = "Modificar Producto";
        isLoadingData.value = true;
        retrieveProduct(idProduct.value)
          .then((response) => {
            product.value = response.data;
            product.value.branchoffice = optionsEstablishment.value[0].value;
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
          purchase_price: null,
          measure_unit: 1,
          control_stock: false,
          stock: "",
          icbper: false,
          number_points: null,
          redeem_points: null,
          category: null,
          preparation_place: null,
          control_supplie: false,
          branchoffice: optionsEstablishment.value[0].value,
          supplies: [],
        };
      }
    });

    const performCreate = (e) => {
      e.preventDefault();
      productRef.value.validate((errors) => {
        if (!errors) {
          if (
            product.value.control_supplie &&
            product.value.supplies.length < 1
          ) {
            message.warning("Necesitas agregar insumos.");
          } else if (
            (product.value.control_stock && product.value.stock == "") ||
            parseInt(product.value.stock) <= 0
          ) {
            message.warning("La cantidad debe ser mayor a 0.");
          } else {
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
          }
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const performUpdate = (e) => {
      e.preventDefault();
      productRef.value.validate((errors) => {
        if (!errors) {
          if (
            product.value.control_supplie &&
            product.value.supplies.length < 1
          ) {
            message.warning("Necesitas agregar insumos.");
          } else {
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
          }
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
      createProductCategory(categorie.value.description)
        .then((response) => {
          if (response.status === 201) {
            productStore.refreshCategories().then(() => {
              product.value.category = productStore.getCategorieID(
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
          if (response.status === 202) {
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

    const addSupplie = (data) => {
      let verify = false;
      product.value.supplies.map((v) => {
        if (v.supplie == data.supplie) {
          verify = true;
        }
      });
      if (verify) {
        message.warning("El insumo ya fue agregado.");
      } else {
        let name = "";
        optionsSupplie.value.map((v) => {
          if (v.value == data.supplie) {
            name = v.label;
          }
        });

        product.value.supplies.push({
          supplie: data.supplie,
          amount: data.stock,
          supplie_des: name,
        });
        supplieItem.value.supplie = null;
        supplieItem.value.stock = null;
        supplieItem.value.supplie_des = null;
      }
    };

    const deleteSupplie = (value) => {
      let data = [];
      product.value.supplies.map((v) => {
        if (value !== v.supplie) {
          data.push(v);
        }
      });
      product.value.supplies = data;
    };

    const newSupplies = () => {
      (showModal.value = true),
        (items.id = undefined),
        (items.name = undefined),
        (items.purchase_price = undefined),
        (items.measureunit = 1),
        (items.branchoffice = undefined),
        (items.amount = undefined);
    };

    const refreshSupplie = (value) => {
      supplieSearch("");
      supplieItem.value.supplie = value.id;
    };

    //Crear columnas
    const columnsSupplie = ref([
      {
        title: "",
        width: 5,
        render(row, index) {
          return index + 1;
        },
      },
      {
        title: "Insumo",
        key: "supplie_des",
        width: 150,
      },
      {
        title: "Cantidad",
        key: "amount",
        width: 50,
      },
      {
        title: "",
        width: 5,
        render(row, i) {
          return (
            <NButton
              type="error"
              size="small"
              onClick={() => {
                deleteSupplie(row.supplie);
              }}
            >
              Quitar
            </NButton>
          );
        },
      },
    ]);

    return {
      genericsStore,
      isLoadingData,
      categoryForm,
      uploadRef,
      modalTitle,
      categoriesOptions,
      placesOptions,
      productStore,
      userStore,
      product,
      productRef,
      productRules,
      categorie,
      performCreate,
      performUpdate,
      performUpdateProductCategory,
      performCreateProductCategory,
      isNumber,
      optionsSupplie,
      supplieSearch,
      addSupplie,
      supplieItem,
      columnsSupplie,
      deleteSupplie,
      optionsEstablishment,
      optionsUND,
      showModal,
      newSupplies,
      items,
      refreshSupplie,
      restrictDecimal(value) {
        let data = value.match(/^\d+\.?\d{0,3}/);
        if (data) {
          return data[0];
        } else {
          return null;
        }
      },
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