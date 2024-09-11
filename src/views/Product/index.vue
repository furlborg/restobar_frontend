<template>
  <div id="Product">
    <n-card title="Productos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <!-- <n-button type="info" @click="showModal = true" secondary
          >Agregar</n-button
        > -->
        <n-space justify="space-around">
          <n-button
            v-if="userStore.hasPermission('add_stock')"
            type="success"
            @click="newMovement(0), (showModalMovement = true)"
            secondary
          >
            <template #icon
              ><n-icon><v-icon name="hi-solid-arrow-sm-up" /></n-icon
            ></template>
            Entrada
          </n-button>
          <n-button
            v-if="userStore.hasPermission('remove_stock')"
            type="error"
            secondary
            @click="newMovement(1), (showModalMovement = true)"
          >
            <template #icon
              ><n-icon><v-icon name="hi-solid-arrow-sm-down" /></n-icon
            ></template>
            Salida
          </n-button>
          <n-button
            v-if="userStore.hasPermission('add_product')"
            type="primary"
            @click="showModal = true"
            secondary
          >
            <template #icon
              ><n-icon><v-icon name="la-user-plus-solid" /></n-icon
            ></template>
            Crear
          </n-button>
        </n-space>
      </template>
      <n-space align="center">
        <n-input-group>
          <n-input
            v-model:value="search"
            placeholder="Buscar..."
            clearable
            @clear="()=>{(search = ''); (show_disabled = false); performSearch()}"
            @keyup.enter="performSearch"
          />
          <n-button type="primary" @click="performSearch" secondary>
            <v-icon name="md-search-round" />
          </n-button>
        </n-input-group>
          <n-select v-model:value="category" :options="categoriesOptions" placeholder="Seleccione una categoria" @update:value="performSearch" filterable style="min-width: 200px"/>
          <n-checkbox v-model:checked="show_disabled">Mostrar deshabilitados</n-checkbox>
      </n-space>
      <!-- <n-radio-group v-model:value="listType" name="listType" size="small">
          <n-radio-button class="p-0" value="list" key="list">
            <v-icon class="m-1" name="md-list-round" />
          </n-radio-button>
          <n-radio-button class="p-0" value="grid" key="grid">
            <v-icon class="m-1" name="md-gridview-round" />
          </n-radio-button>
        </n-radio-group> -->
      <n-spin class="mt-2" :show="isLoadingData">
        <n-scrollbar style="height: 70vh; min-height: 650px">
          <!-- Products List -->
          <n-list v-if="listType === 'list'" class="px-3">
            <n-list-item
              v-for="product in products"
              :key="product.id"
              @mouseover="product.showButtons = true"
              @mouseleave="product.showButtons = false"
            >
              <template #prefix>
                <img
                  src="~@/assets/images/default-food-image.jpg"
                  alt
                  width="90"
                  height="90"
                />
              </template>
              <n-thing>
                <template #header>
                  <n-text
                    class="fs-4"
                    :type="product.is_disabled ? 'error' : 'default'"
                    >{{ product.name }}</n-text
                  >
                </template>
                <template #description>
                  <n-space vertical item-style="margin-top: -10px;">
                    <n-text class="fs-6" type="success"
                      >S/. {{ Number(product.prices).toFixed(2) }}</n-text
                    >
                    <n-space>
                      <n-tag>{{
                        productStore.getCategorieDescription(product.category)
                      }}</n-tag>
                    </n-space>
                    <div v-if="product.amount.length > 0">
                      <div v-if="product.amount.length === 1">
                        <n-text class="fs-6"
                          >Stock: {{ product.amount[0].amount }}</n-text
                        >
                      </div>
                      <div
                        v-else
                        v-for="item in product.amount"
                        :key="item.key"
                      >
                        <n-text class="fs-6">Stock: {{ item.amount }}</n-text>
                      </div>
                    </div>
                  </n-space>
                </template>
              </n-thing>
              <template #suffix>
                <transition name="fade">
                  <n-button-group v-if="product.showButtons">
                    <n-button
                      v-if="userStore.hasPermission('change_product')"
                      class="p-4"
                      type="warning"
                      tertiary
                      @click="editProduct(product.id)"
                    >
                      <v-icon name="ri-edit-fill" scale="1.5" />
                    </n-button>
                    <n-button
                      v-if="userStore.hasPermission('delete_product')"
                      class="p-4"
                      :type="product.is_disabled ? 'success' : 'error'"
                      tertiary
                      @click="
                        performDisableProduct(product.id, product.is_disabled)
                      "
                    >
                      <v-icon
                        :name="
                          product.is_disabled
                            ? 'md-publishedwithchanges-round'
                            : 'ri-delete-bin-2-fill'
                        "
                        scale="1.5"
                      />
                    </n-button>
                  </n-button-group>
                </transition>
              </template>
            </n-list-item>
          </n-list>
          <!-- Products Grid -->
          <n-grid
            v-if="listType === 'grid'"
            class="mt-2"
            responsive="screen"
            cols="4 s:4 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
            :y-gap="12"
          >
            <n-gi :span="4" v-for="product in products" :key="product.id">
              <n-card>
                <template #header>
                  <n-h2 class="mb-0">{{ product.name }}</n-h2>
                  <n-text type="success"
                    >S/. {{ Number(product.prices).toFixed(2) }}</n-text
                  >
                </template>
                <template #header-extra>
                  <n-dropdown
                    :options="productOptions"
                    placement="left-start"
                    size="small"
                  >
                    <n-button text size="small">
                      <v-icon name="bi-three-dots-vertical" />
                    </n-button>
                  </n-dropdown>
                </template>
                <template #cover>
                  <img src="~@/assets/images/default-food-image.jpg" alt />
                </template>
                <n-text>{{ product.description }}</n-text>
              </n-card>
            </n-gi>
          </n-grid>
        </n-scrollbar>
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <!-- Products Paginator -->
          <n-pagination
            :page="pagination.page"
            :page-count="pagination.pageCount"
            :page-size="pagination.pageSize"
            :page-sizes="pagination.pageSizes"
            :on-update:page="pagination.onChange"
            :on-update:page-size="pagination.onPageSizeChange"
            show-size-picker
          />
        </n-space>
      </template>
    </n-card>
    <!-- Product Modal -->
    <product-modal
      v-model:show="showModal"
      :id-product="idProduct"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />

    <move-modal
      v-model:show="showModalMovement"
      @on-success="loadProductsData"
      :items="itemsMovement"
      :type="type"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, reactive, computed } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { renderIcon } from "@/utils";
import ProductModal from "./components/ProductModal";
import { useProductStore } from "@/store/modules/product";
import { useUserStore } from "@/store/modules/user";
import {
  getProducts,
  searchProduct,
  disableProduct,
} from "@/api/modules/products";
import MoveModal from "./components/MoveModal.vue";

export default defineComponent({
  name: "Product",
  components: {
    ProductModal,
    MoveModal,
  },
  setup() {
    const productStore = useProductStore();
    const userStore = useUserStore();
    const isLoadingData = ref(false);
    const message = useMessage();
    const dialog = useDialog();
    const listType = ref("list");
    const showModal = ref(false);
    const showModalMovement = ref(false);
    const showButtons = ref(false);
    const search = ref('');
    const category = ref();
    const show_disabled = ref(false);
    const idProduct = ref(0);
    const type = ref(0);
    const products = ref([]);
    const itemsMovement = reactive({});
    const productOptions = [
      {
        label: "Editar",
        key: "edit",
        icon: renderIcon("ri-edit-fill"),
      },
      {
        label: "Eliminar",
        key: "delete",
        icon: renderIcon("ri-delete-bin-2-fill"),
      },
    ];

      const categoriesOptions = computed(() => {
          return productStore.categories.map((categories) => ({
              label: categories.description,
              value: categories.id,
          }));
      });

    const newMovement = (value) => {
      (type.value = value),
        (itemsMovement.product = undefined),
        (itemsMovement.type = value),
        (itemsMovement.branchoffice = null),
        (itemsMovement.concept = undefined),
        (itemsMovement.amount = undefined);
    };
    const pagination = ref({
      search: '',
      category: null,
      show_disabled: false,
      total: 0,
      offset: 0,
      page: 1,
      pageCount: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 25, 50, 100],
      onChange: async (page) => {
        isLoadingData.value = true;
        pagination.value.page = page;
        pagination.value.offset = --page * pagination.value.pageSize;
        await searchProduct(
          pagination.value.search,
          pagination.value.category,
          pagination.value.show_disabled,
          pagination.value.pageSize,
          pagination.value.offset
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            products.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isLoadingData.value = false;
          });
      },
      onPageSizeChange: async (pageSize) => {
        isLoadingData.value = true;
        pagination.value.offset = 0;
        pagination.value.page = 1;
        pagination.value.pageSize = pageSize;
        await searchProduct(
          pagination.value.search,
          pagination.value.category,
          pagination.value.show_disabled,
          pageSize,
          pagination.value.offset
        )
          .then((response) => {
            pagination.value.total = response.data.count;
            pagination.value.pageCount = Math.trunc(
              Number(response.data.count) / pagination.value.pageSize
            );
            if (
              Number(response.data.count) % pagination.value.pageSize !== 0 ||
              pagination.value.pageCount === 0
            ) {
              ++pagination.value.pageCount;
            }
            products.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isLoadingData.value = false;
          });
      },
    });

    const loadProductsData = async () => {
      isLoadingData.value = true;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      pagination.value.pageSize = 10;
      await getProducts()
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
            ++pagination.value.pageCount;
          }
          products.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const editProduct = (id) => {
      showModal.value = true;
      idProduct.value = id;
    };

    const performSearch = async () => {
      isLoadingData.value = true;
      pagination.value.search = search.value;
      pagination.value.category = category.value;
      pagination.value.show_disabled = show_disabled.value;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      await searchProduct(
        pagination.value.search,
        pagination.value.category,
        pagination.value.show_disabled,
        pagination.value.pageSize,
        pagination.value.offset
      )
        .then((response) => {
          pagination.value.total = response.data.count;
          pagination.value.pageCount = Math.trunc(
            Number(response.data.count) / pagination.value.pageSize
          );
          if (
            Number(response.data.count) % pagination.value.pageSize !== 0 ||
            pagination.value.pageCount === 0
          ) {
            ++pagination.value.pageCount;
          }
          products.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const performDisableProduct = (id, disabled) => {
      dialog.error({
        title: disabled ? "Habilitar producto" : "Deshabilitar producto",
        content: `¿Desea ${disabled ? "habilitar" : "deshabilitar"} producto?`,
        positiveText: "Si",
        negativeText: "No",
        onPositiveClick: async () => {
          await disableProduct(id)
            .then((response) => {
              if (response.status === 202) {
                message.success(
                  `Producto ${
                    disabled ? "Habilitado" : "Deshabilitado"
                  } correctamente`
                );
                performSearch();
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            });
        },
        onNegativeClick: () => {},
      });
    };

    const refreshProducts = async () => {
      pagination.value.search = null;
      await loadProductsData();
    };

    onMounted(async () => {
      await loadProductsData();
    });

    const onCloseModal = () => {
      idProduct.value = 0;
    };

    const onSuccess = async () => {
      showModal.value = false;
      onCloseModal();
      await performSearch();
    };

    onMounted(() => {});

    return {
      isLoadingData,
      productStore,
      userStore,
      listType,
      type,
      showModal,
      showModalMovement,
      loadProductsData,
      showButtons,
      productOptions,
      onCloseModal,
      onSuccess,
      pagination,
      search,
      show_disabled,
      products,
      categoriesOptions,
      category,
      idProduct,
      refreshProducts,
      editProduct,
      performSearch,
      itemsMovement,
      newMovement,
      performDisableProduct,
    };
  },
});
</script>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
