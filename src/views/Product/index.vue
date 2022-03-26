<template>
  <div id="Product">
    <n-card title="Productos" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <!-- <n-button type="info" @click="showModal = true" secondary
          >Agregar</n-button
        > -->
        <n-space justify="space-around">
          <n-button
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
            type="error"
            secondary
            @click="newMovement(1), (showModalMovement = true)"
          >
            <template #icon
              ><n-icon><v-icon name="hi-solid-arrow-sm-down" /></n-icon
            ></template>
            Salida
          </n-button>
          <n-button type="primary" @click="showModal = true" secondary>
            <template #icon
              ><n-icon><v-icon name="la-user-plus-solid" /></n-icon
            ></template>
            Crear
          </n-button>
        </n-space>
      </template>
      <n-input-group>
        <n-input
          class="w-25"
          v-model:value="search"
          @keypress.enter="performSearch"
          placeholder="Buscar..."
          clearable
        />
        <n-button type="primary" @click="performSearch" secondary>
          <v-icon name="md-search-round" />
        </n-button>
      </n-input-group>
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
                  <n-text class="fs-4">{{ product.name }}</n-text>
                </template>
                <template #description>
                  <n-space vertical item-style="margin-top: -10px;">
                    <n-text class="fs-6" type="success"
                      >S/. {{ Number(product.prices).toFixed(2) }}</n-text
                    >
                    <div v-if="product.amount.length > 0">
                      <div v-if="product.amount.length == 1">
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
                      class="p-4"
                      type="warning"
                      tertiary
                      @click="editProduct(product.id)"
                    >
                      <v-icon name="ri-edit-fill" scale="1.5" />
                    </n-button>
                    <n-button class="p-4" type="error" tertiary>
                      <v-icon name="ri-delete-bin-2-fill" scale="1.5" />
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
import { defineComponent, ref, onMounted, reactive } from "vue";
import { useMessage } from "naive-ui";
import { renderIcon } from "@/utils";
import ProductModal from "./components/ProductModal";
import { getProducts, searchProduct } from "@/api/modules/products";
import MoveModal from "./components/MoveModal.vue";

export default defineComponent({
  name: "Product",
  components: {
    ProductModal,
    MoveModal,
  },
  setup() {
    const isLoadingData = ref(false);
    const message = useMessage();
    const listType = ref("list");
    const showModal = ref(false);
    const showModalMovement = ref(false);
    const showButtons = ref(false);
    const search = ref(null);
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
    const newMovement = (value) => {
      (type.value = value),
        (itemsMovement.product = undefined),
        (itemsMovement.type = value),
        (itemsMovement.branchoffice = null),
        (itemsMovement.concept = undefined),
        (itemsMovement.amount = undefined);
    };
    const pagination = ref({
      search: null,
      total: 0,
      offset: 0,
      page: 1,
      pageCount: 1,
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 25, 50, 100],
      onChange: (page) => {
        isLoadingData.value = true;
        pagination.value.page = page;
        pagination.value.offset = --page * pagination.value.pageSize;
        searchProduct(
          pagination.value.search,
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
      onPageSizeChange: (pageSize) => {
        isLoadingData.value = true;
        pagination.value.offset = 0;
        pagination.value.page = 1;
        pagination.value.pageSize = pageSize;
        searchProduct(
          pagination.value.search,
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

    const loadProductsData = () => {
      isLoadingData.value = true;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      getProducts()
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

    const performSearch = () => {
      isLoadingData.value = true;
      pagination.value.search = search.value;
      pagination.value.offset = 0;
      pagination.value.page = 1;
      searchProduct(
        pagination.value.search,
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
    const refreshProducts = () => {
      pagination.value.search = null;
      loadProductsData();
    };

    onMounted(() => {
      document.title = "Productos | App";
      loadProductsData();
    });

    const onCloseModal = () => {
      document.title = "Productos | App";
      idProduct.value = 0;
    };

    const onSuccess = () => {
      showModal.value = false;
      onCloseModal();
      loadProductsData();
    };

    onMounted(() => {
      document.title = "Productos | App";
    });

    return {
      isLoadingData,
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
      products,
      idProduct,
      refreshProducts,
      editProduct,
      performSearch,
      itemsMovement,
      newMovement,
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