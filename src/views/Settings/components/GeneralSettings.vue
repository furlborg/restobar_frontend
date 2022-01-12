<template>
  <div id="GeneralSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración General</n-text>
      </template>
    </n-page-header>
    <n-card class="vh-82">
      <n-tabs type="card">
        <n-tab-pane name="areas-tables" tab="Areas y Mesas">
          <n-card :bordered="false" embedded>
            <n-grid responsive="screen" cols="1 s:1 m:2 l:2 xl:2 2xl:2">
              <n-gi>
                <n-text class="fs-4">Editar Areas</n-text>
                <n-form>
                  <n-grid responsive="screen" cols="12" :x-gap="12">
                    <n-form-item-gi :span="4" label="Area">
                      <n-input-group>
                        <n-select
                          class="mb-2"
                          v-model:value="currentArea"
                          :consistent-menu-width="true"
                          :options="areaOptions"
                        />
                        <n-button
                          type="warning"
                          secondary
                          :disabled="!!area.id"
                          @click="editArea"
                        >
                          <v-icon name="ri-edit-fill"></v-icon>
                        </n-button>
                      </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="area.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-space>
                        <n-button
                          :type="!area.id ? 'info' : 'warning'"
                          :disabled="!area.description"
                          secondary
                          @click="
                            !area.id
                              ? performCreateArea($event)
                              : performUpdateArea($event)
                          "
                          >{{ !area.id ? "Agregar" : "Guardar" }}</n-button
                        >
                        <n-button
                          type="error"
                          :disabled="!area.description"
                          secondary
                          @click="cleanArea"
                          >Cancelar</n-button
                        >
                      </n-space>
                    </n-form-item-gi>
                  </n-grid>
                </n-form>
              </n-gi>
              <n-gi>
                <n-text class="fs-4">Editar Mesas</n-text>
                <n-form>
                  <n-grid responsive="screen" cols="12" :x-gap="12">
                    <n-form-item-gi :span="4" label="Código">
                      <n-input v-model:value="table.code" placeholder="" />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="table.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-space>
                        <n-button
                          type="info"
                          :disabled="!(table.code && table.description)"
                          secondary
                          @click="performCreateTable"
                          >Agregar</n-button
                        >
                        <n-button
                          type="error"
                          :disabled="!(table.code && table.description)"
                          secondary
                          @click="cleanTable"
                          >Cancelar</n-button
                        >
                      </n-space>
                    </n-form-item-gi>
                  </n-grid>
                </n-form>
              </n-gi>
            </n-grid>
            <n-spin :show="isLoadingData">
              <n-grid
                responsive="screen"
                cols="2 s:6 m:10 l:20 xl:24 2xl:24"
                :x-gap="12"
                :y-gap="12"
              >
                <n-gi v-for="table in tables" :key="table.id" :span="2">
                  <n-card :bordered="false" hoverable>
                    <n-space align="center" vertical>
                      <n-button class="position-absolute top-0 end-0 m-1" text>
                        <v-icon name="bi-three-dots" scale="1.25" />
                      </n-button>
                      <v-icon name="gi-table" scale="3" />
                      <n-text>{{ table.id }}</n-text>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-spin>
          </n-card>
        </n-tab-pane>
        <n-tab-pane name="PreparationPlaces" tab="Lugares de Preparación">
          <n-card
            title="Editar Lugares de Preparación"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Lugares</n-text></template
                  >
                  <n-list-item
                    v-for="place in preparationPlaces"
                    :class="{ 'bg-selected': selectedPlace === place.id }"
                    :key="place.id"
                    @click="selectPlace(place)"
                  >
                    <!-- <template #suffix v-if="selectedPlace === place.id">
                      <n-button type="error" text>
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </template> -->
                    {{ place.description }}
                  </n-list-item>
                </n-list>
              </n-gi>
              <n-gi :span="9">
                <n-form class="mt-2">
                  <n-grid responsive="screen" cols="24" :x-gap="12">
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="preparationPlace"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-button
                        class="me-2"
                        :type="!selectedPlace ? 'info' : 'warning'"
                        :disabled="!preparationPlace"
                        @click="
                          !selectedPlace
                            ? performCreatePreparationPlace()
                            : performUpdatePreparationPlace()
                        "
                        secondary
                        >{{ !selectedPlace ? "Agregar" : "Guardar" }}</n-button
                      >
                      <n-button
                        type="error"
                        secondary
                        :disabled="!preparationPlace"
                        @click="
                          selectedPlace = null;
                          preparationPlace = null;
                        "
                        >Cancelar</n-button
                      >
                    </n-form-item-gi>
                  </n-grid>
                </n-form>
              </n-gi>
            </n-grid>
          </n-card>
        </n-tab-pane>
        <n-tab-pane name="ProductCategories" tab="Categorías de Producto">
          <n-card
            title="Editar Categorías de Productos"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Categorías</n-text></template
                  >
                  <n-list-item
                    v-for="category in productCategories"
                    :class="{ 'bg-selected': selectedCategory === category.id }"
                    :key="category.id"
                    @click="selectCategory(category)"
                  >
                    <!-- <template #suffix v-if="selectedCategory === category.id">
                      <n-button type="error" text>
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </template> -->
                    {{ category.description }}
                  </n-list-item>
                </n-list>
              </n-gi>
              <n-gi :span="9">
                <n-form class="mt-2">
                  <n-grid responsive="screen" cols="24" :x-gap="12">
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input v-model:value="productCategory" placeholder="" />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-button
                        class="me-2"
                        :type="!selectedCategory ? 'info' : 'warning'"
                        :disabled="!productCategory"
                        @click="
                          !selectedCategory
                            ? performCreateProductCategory()
                            : performUpdateProductCategory()
                        "
                        secondary
                        >{{
                          !selectedCategory ? "Agregar" : "Guardar"
                        }}</n-button
                      >
                      <n-button
                        type="error"
                        secondary
                        :disabled="!productCategory"
                        @click="
                          selectedCategory = null;
                          productCategory = null;
                        "
                        >Cancelar</n-button
                      >
                    </n-form-item-gi>
                  </n-grid>
                </n-form>
              </n-gi>
            </n-grid>
          </n-card>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { cloneDeep } from "@/utils";
import { useTableStore } from "@/store/modules/table";
import { createArea, updateArea, createTable } from "@/api/modules/tables";
import {
  getProductPlaces,
  createProductPlace,
  updateProductPlace,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
} from "@/api/modules/products";

export default defineComponent({
  name: "GeneralSettings",
  setup() {
    const message = useMessage();
    const router = useRouter();
    const tableStore = useTableStore();
    const isLoadingData = ref(false);
    const currentArea = ref(1);
    const area = ref({
      id: null,
      description: "",
    });
    const table = ref({
      id: null,
      code: "",
      description: "",
    });
    const areaOptions = computed(() => {
      return tableStore.getAreasOptions;
    });
    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id == currentArea.value);
      if (a) {
        return a.tables;
      }
      return [];
    });
    const preparationPlaces = ref([]);
    const preparationPlace = ref(null);
    const selectedPlace = ref(null);
    const productCategories = ref([]);
    const productCategory = ref(null);
    const selectedCategory = ref(null);

    const performCreateTable = (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      createTable(currentArea.value, table.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore.refreshData().then(() => {
              cleanTable();
            });
          }
        })
        .catch((error) => {
          console.error(error.response.data);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const cleanTable = () => {
      table.value = {
        id: null,
        code: "",
        description: "",
      };
    };

    const performCreateArea = (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      createArea(area.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore
              .refreshData()
              .then(() => {
                cleanArea();
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const performUpdateArea = (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      updateArea(area.value.id, area.value)
        .then((response) => {
          if (response.status === 202) {
            tableStore
              .refreshData()
              .then(() => {
                cleanArea();
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isLoadingData.value = false;
        });
    };

    const editArea = () => {
      area.value.id = cloneDeep(currentArea.value);
      area.value.description = cloneDeep(
        tableStore.getAreaByID(currentArea.value)
      );
    };

    const cleanArea = () => {
      area.value = {
        id: null,
        description: "",
      };
    };

    const selectPlace = (place) => {
      if (!selectedPlace) {
        selectedPlace.value = place.id;
        preparationPlace.value = cloneDeep(place.description);
      } else {
        if (selectedPlace.value === place.id) {
          selectedPlace.value = null;
          preparationPlace.value = null;
        } else {
          selectedPlace.value = place.id;
          preparationPlace.value = cloneDeep(place.description);
        }
      }
    };

    const loadPreparationPlaces = () => {
      getProductPlaces()
        .then((response) => {
          if (response.status === 200) {
            preparationPlaces.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreatePreparationPlace = () => {
      createProductPlace(preparationPlace.value)
        .then((response) => {
          if (response.status === 201) {
            loadPreparationPlaces();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          preparationPlace.value = null;
        });
    };

    const performUpdatePreparationPlace = () => {
      updateProductPlace(selectedPlace.value, preparationPlace.value)
        .then((response) => {
          if (response.status === 202) {
            loadPreparationPlaces();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedPlace.value = null;
          preparationPlace.value = null;
        });
    };

    const selectCategory = (category) => {
      if (!selectedCategory) {
        selectedCategory.value = category.id;
        productCategory.value = cloneDeep(category.description);
      } else {
        if (selectedCategory.value === category.id) {
          selectedCategory.value = null;
          productCategory.value = null;
        } else {
          selectedCategory.value = category.id;
          productCategory.value = cloneDeep(category.description);
        }
      }
    };

    const loadProductCategories = () => {
      getProductCategories()
        .then((response) => {
          if (response.status === 200) {
            productCategories.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreateProductCategory = () => {
      createProductCategory(productCategory.value)
        .then((response) => {
          if (response.status === 201) {
            loadProductCategories();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          productCategory.value = null;
        });
    };

    const performUpdateProductCategory = () => {
      updateProductCategory(selectedCategory.value, productCategory.value)
        .then((response) => {
          if (response.status === 202) {
            loadProductCategories();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedCategory.value = null;
          productCategory.value = null;
        });
    };

    onMounted(() => {
      tableStore.refreshData();
      loadPreparationPlaces();
      loadProductCategories();
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      handleBack,
      isLoadingData,
      areaOptions,
      currentArea,
      area,
      cleanArea,
      editArea,
      performCreateArea,
      performUpdateArea,
      cleanTable,
      table,
      tables,
      performCreateTable,
      preparationPlaces,
      preparationPlace,
      selectedPlace,
      selectPlace,
      performCreatePreparationPlace,
      performUpdatePreparationPlace,
      productCategories,
      productCategory,
      selectedCategory,
      selectCategory,
      performCreateProductCategory,
      performUpdateProductCategory,
    };
  },
});
</script>

<style lang="scss">
.vh-82 {
  height: 82vh !important;
}
.bg-selected {
  background-color: AliceBlue;
}
</style>