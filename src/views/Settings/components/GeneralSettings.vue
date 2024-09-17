<template>
  <div id="GeneralSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración General</n-text>
      </template>
    </n-page-header>
    <n-card>
      <n-tabs type="card">
        <n-tab-pane
          :disabled="
            !userStore.hasPermission('view_area') ||
            !userStore.hasPermission('view_table')
          "
          name="areas-tables"
          tab="Areas y Mesas"
        >
          <n-card
            v-if="
              userStore.hasPermission('view_area') ||
              userStore.hasPermission('view_table')
            "
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="1 s:1 m:1 l:1 xl:2 2xl:2">
              <n-gi>
                <n-text class="fs-4">Editar Areas</n-text>
                <n-form>
                  <n-grid responsive="screen" cols="4 xs:4 s:12" :x-gap="12">
                    <n-form-item-gi :span="4" label="Area">
                      <n-input-group>
                        <n-select
                          class="mb-2"
                          v-model:value="currentArea"
                          :consistent-menu-width="true"
                          :options="areaOptions"
                          clearable
                        />
                        <n-button
                          v-if="userStore.hasPermission('change_area')"
                          type="warning"
                          secondary
                          :disabled="!currentArea || !!area.id"
                          @click="editArea"
                        >
                          <v-icon name="ri-edit-fill"></v-icon>
                        </n-button>
                      </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi
                      v-if="userStore.hasPermission('add_area') || !!area.id"
                      :span="4"
                      label="Descripción"
                    >
                      <n-input
                        v-model:value="area.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi
                      v-if="userStore.hasPermission('add_area') || !!area.id"
                      :span="4"
                    >
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
                <n-form
                  v-if="
                    userStore.hasPermission('add_table') || selectedTable.id
                  "
                >
                  <n-grid responsive="screen" cols="4 xs:4 s:12" :x-gap="12">
                    <n-form-item-gi :span="4" label="Código">
                      <n-input
                        v-model:value="selectedTable.code"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="selectedTable.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-space>
                        <n-button
                          :type="selectedTable.id ? 'warning' : 'info'"
                          :disabled="
                            !(selectedTable.code && selectedTable.description)
                          "
                          secondary
                          @click.prevent="
                            selectedTable.id
                              ? performUpdateTable()
                              : performCreateTable()
                          "
                          >{{
                            selectedTable.id ? "Guardar" : "Agregar"
                          }}</n-button
                        >
                        <n-button
                          type="error"
                          :disabled="
                            !(selectedTable.code && selectedTable.description)
                          "
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
                cols="2 s:6 m:10 l:16 xl:24 2xl:24"
                :x-gap="12"
                :y-gap="12"
              >
                <n-gi v-for="table in tables" :key="table.id" :span="2">
                  <n-card
                    :class="{ 'bg-selected': table.id === selectedTable.id }"
                    :bordered="false"
                    hoverable
                    @click="
                      userStore.hasPermission('change_table') &&
                        selectTable(table)
                    "
                  >
                    <n-space align="center" vertical>
                      <!-- <n-button class="position-absolute top-0 end-0 m-1" text>
                        <v-icon name="bi-three-dots" scale="1.25" />
                      </n-button> -->
                      <v-icon name="gi-table" scale="3" />
                      <n-text>{{ table.code }}</n-text>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
            </n-spin>
          </n-card>
        </n-tab-pane>
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_preparationplace')"
          name="PreparationPlaces"
          tab="Lugares de Preparación"
        >
          <n-card
            v-if="userStore.hasPermission('view_preparationplace')"
            title="Editar Lugares de Preparación"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="3 xs:3 s:12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Lugares</n-text></template
                  >
                  <n-list-item
                    v-for="place in preparationPlaces"
                    :class="{ 'bg-selected': selectedPlace === place.id }"
                    :key="place.id"
                    @click="
                      userStore.hasPermission('change_preparationplace') &&
                        selectPlace(place)
                    "
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
                <n-form
                  v-if="
                    userStore.hasPermission('add_preparationplace') ||
                    selectedPlace
                  "
                  class="mt-2"
                >
                  <n-grid
                    responsive="screen"
                    cols="4 xs:4 s:8 m:12 l:24"
                    :x-gap="12"
                  >
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="preparationPlace"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Nombre de impresora">
                      <n-select
                        v-model:value="printerName"
                        :options="optionsPrinters"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Formato de impresora">
                      <n-select
                        v-model:value="printerFormat"
                        :options="printerFormatOptions"
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
                          printerName = null;
                          printerFormat = null;
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
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_productcategory')"
          name="ProductCategories"
          tab="Categorías de Producto"
        >
          <n-card
            v-if="userStore.hasPermission('view_productcategory')"
            title="Editar Categorías de Productos"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="3 xs:3 s:12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Categorías</n-text></template
                  >
                  <n-list-item
                    v-for="category in productCategories"
                    :class="{ 'bg-selected': selectedCategory === category.id }"
                    :key="category.id"
                    @click="
                      userStore.hasPermission('change_productcategory') &&
                        selectCategory(category)
                    "
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
                <n-form
                  v-if="
                    userStore.hasPermission('add_productcategory') ||
                    selectedCategory
                  "
                  class="mt-2"
                >
                  <n-grid
                    responsive="screen"
                    cols="4 xs:4 s:8 m:12 l:24"
                    :x-gap="12"
                  >
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
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_paymentmethodtype')"
          name="PaymentMethods"
          tab="Métodos de Pago"
        >
          <n-card
            v-if="userStore.hasPermission('view_paymentmethodtype')"
            title="Editar Métodos de Pago"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="3 xs:3 s:12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5"
                      >Lista de Métodos de Pago</n-text
                    ></template
                  >
                  <n-list-item
                    v-for="payment in paymentMethods"
                    :class="{ 'bg-selected': selectedPayment === payment.id }"
                    :key="payment.id"
                    @click="
                      userStore.hasPermission('change_paymentmethodtype') &&
                        selectPaymentMethod(payment)
                    "
                  >
                    <!-- <template #suffix v-if="selectedCategory === category.id">
                      <n-button type="error" text>
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </template> -->
                    {{ payment.description }}
                  </n-list-item>
                </n-list>
              </n-gi>
              <n-gi :span="9">
                <n-form
                  v-if="
                    userStore.hasPermission('add_paymentmethodtype') ||
                    selectedPayment
                  "
                  class="mt-2"
                >
                  <n-grid
                    responsive="screen"
                    cols="4 xs:4 s:8 m:12 l:24"
                    :x-gap="12"
                  >
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input v-model:value="paymentMethod" placeholder="" />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-button
                        class="me-2"
                        :type="!selectedPayment ? 'info' : 'warning'"
                        :disabled="!paymentMethod"
                        @click="
                          !selectedPayment
                            ? performCreatePaymentMethod()
                            : performUpdatePaymentMethod()
                        "
                        secondary
                        >{{
                          !selectedPayment ? "Agregar" : "Guardar"
                        }}</n-button
                      >
                      <n-button
                        type="error"
                        secondary
                        :disabled="!paymentMethod"
                        @click="
                          selectedPayment = null;
                          paymentMethod = null;
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
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_concept')"
          name="Concepts"
          tab="Conceptos"
        >
          <n-card
            v-if="userStore.hasPermission('view_concept')"
            title="Editar Conceptos"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="3 xs:3 s:12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Conceptos</n-text></template
                  >
                  <n-list-item
                    v-for="single_concept in concepts"
                    :class="{
                      'bg-selected': selectedConcept === single_concept.id,
                    }"
                    :key="single_concept.id"
                    @click="
                      userStore.hasPermission('change_concept') &&
                        selectConcept(single_concept)
                    "
                  >
                    <!-- <template #suffix v-if="selectedCategory === category.id">
                      <n-button type="error" text>
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </template> -->
                    <n-space justify="space-between">
                      {{ single_concept.description }}
                      <n-tag
                        :type="
                          single_concept.concept_type === '0'
                            ? 'success'
                            : 'error'
                        "
                        size="small"
                        round
                        >{{
                          single_concept.concept_type === "0"
                            ? "Ingreso"
                            : "Egreso"
                        }}</n-tag
                      >
                    </n-space>
                  </n-list-item>
                </n-list>
              </n-gi>
              <n-gi :span="9">
                <n-form
                  v-if="
                    userStore.hasPermission('add_concept') || selectedConcept
                  "
                  class="mt-2"
                >
                  <n-grid
                    responsive="screen"
                    cols="4 xs:4 s:8 m:12 l:24"
                    :x-gap="12"
                  >
                    <n-form-item-gi :span="4" label="Tipo">
                      <n-select
                        :options="conceptTypeOptions"
                        v-model:value="concept.concept_type"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="concept.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-button
                        class="me-2"
                        :type="!selectedConcept ? 'info' : 'warning'"
                        :disabled="
                          !concept.description || !concept.concept_type
                        "
                        @click="
                          !selectedConcept
                            ? performCreateConcept()
                            : performUpdateConcept()
                        "
                        secondary
                        >{{
                          !selectedConcept ? "Agregar" : "Guardar"
                        }}</n-button
                      >
                      <n-button
                        type="error"
                        secondary
                        :disabled="
                          !concept.description || !concept.concept_type
                        "
                        @click="
                          selectedConcept = null;
                          concept = { description: '', concept_type: null };
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
        <n-tab-pane
          :disabled="!userStore.hasPermission('view_inventoryconcept')"
          name="Kardex"
          tab="Kardex"
        >
          <n-card
            v-if="userStore.hasPermission('view_inventoryconcept')"
            title="Editar Conceptos de Inventario"
            :bordered="false"
            embedded
          >
            <n-grid responsive="screen" cols="3 xs:3 s:12" :x-gap="12">
              <n-gi :span="3">
                <n-list class="bg-white m-0" bordered>
                  <template #header
                    ><n-text class="fs-5">Lista de Conceptos</n-text></template
                  >
                  <n-list-item
                    v-for="inventory_concept in inventory_concepts"
                    :class="{
                      'bg-selected':
                        selectedInventoryConcept === inventory_concept.id,
                    }"
                    :key="inventory_concept.id"
                    @click="
                      userStore.hasPermission('change_inventoryconcept') &&
                        selectInventoryConcept(inventory_concept)
                    "
                  >
                    <!-- <template #suffix v-if="selectedCategory === category.id">
                      <n-button type="error" text>
                        <v-icon name="md-disabledbydefault-round" />
                      </n-button>
                    </template> -->
                    <n-space justify="space-between">
                      {{ inventory_concept.concept }}
                      <n-tag
                        :type="
                          inventory_concept.concept_type === '0'
                            ? 'success'
                            : 'error'
                        "
                        size="small"
                        round
                        >{{
                          inventory_concept.concept_type === "0"
                            ? "Ingreso"
                            : "Egreso"
                        }}</n-tag
                      >
                    </n-space>
                  </n-list-item>
                </n-list>
              </n-gi>
              <n-gi :span="9">
                <n-form
                  v-if="
                    userStore.hasPermission('add_inventoryconcept') ||
                    selectedInventoryConcept
                  "
                  class="mt-2"
                >
                  <n-grid
                    responsive="screen"
                    cols="4 xs:4 s:8 m:12 l:24"
                    :x-gap="12"
                  >
                    <n-form-item-gi :span="4" label="Tipo">
                      <n-select
                        :options="conceptTypeOptions"
                        v-model:value="inventory_concept.concept_type"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4" label="Descripción">
                      <n-input
                        v-model:value="inventory_concept.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="4">
                      <n-button
                        class="me-2"
                        :type="!selectedInventoryConcept ? 'info' : 'warning'"
                        :disabled="
                          !inventory_concept.description ||
                          !inventory_concept.concept_type
                        "
                        @click="
                          !selectedInventoryConcept
                            ? performCreateInventoryConcept()
                            : performUpdateInventoryConcept()
                        "
                        secondary
                        >{{
                          !selectedInventoryConcept ? "Agregar" : "Guardar"
                        }}</n-button
                      >
                      <n-button
                        type="error"
                        secondary
                        :disabled="
                          !inventory_concept.description ||
                          !inventory_concept.concept_type
                        "
                        @click="
                          selectedInventoryConcept = null;
                          inventory_concept = {
                            description: '',
                            concept_type: null,
                          };
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
import { useUserStore } from "@/store/modules/user";
import { usePrinterStore } from "@/store/modules/printer";
import { useProductStore } from "@/store/modules/product";
import {
  createArea,
  updateArea,
  createTable,
  updateTable,
} from "@/api/modules/tables";
import {
  getPaymentMethods,
  createPaymentMethodDesc,
  updatePaymentMethodDesc,
} from "@/api/modules/sales";
import {
  getProductPlaces,
  createProductPlace,
  updateProductPlace,
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  getInventoryConcepts,
  createInventoryConcept,
  updateInventoryConcept,
} from "@/api/modules/products";
import { getConcepts, createConcept, updateConcept } from "@/api/modules/tills";
import { useSettingsStore } from "@/store/modules/settings";

export default defineComponent({
  name: "GeneralSettings",
  setup() {
    const message = useMessage();
    const router = useRouter();
    const tableStore = useTableStore();
      const settingsStore = useSettingsStore();
    const printerStore = usePrinterStore();
    const productStore = useProductStore();
    const optionsPrinters = ref([]);
    const userStore = useUserStore();
    const isLoadingData = ref(false);
    const currentArea = ref(null);
    const area = ref({
      id: null,
      description: "",
    });
    const selectedTable = ref({
      id: null,
      code: "",
      description: "",
    });
    const areaOptions = computed(() => {
      return tableStore.getAreasOptions;
    });
    const tables = computed(() => {
      let a = tableStore.areas.find((a) => a.id === currentArea.value);
      if (a) {
        return a.tables;
      }
      return [];
    });

      const getPrinters = async () => {
          try {
              const response = await fetch(`${settingsStore.business_settings.qz_config.host}/printers`, {
                  method: 'GET'
              });

              if (!response.ok) {
                  throw new Error(`Error en la solicitud: ${response.status}`);
              }

              const data = await response.json();  // Si la respuesta es JSON
              console.log(data);
              optionsPrinters.value = data.printers.map(printer =>({
                  value: printer,
                  label: printer,
              }))
          } catch (error) {
              console.error('Error al hacer la solicitud:', error);
          }
      };

      getPrinters()

    const productCategories = ref([]);
    const productCategory = ref(null);
    const selectedCategory = ref(null);

    const selectTable = (table) => {
      if (!selectedTable.value.id) {
        selectedTable.value = cloneDeep(table);
      } else {
        if (selectedTable.value.id === table.id) {
          cleanTable();
        } else {
          selectedTable.value = cloneDeep(table);
        }
      }
    };

    const cleanTable = () => {
      selectedTable.value = {
        id: null,
        code: "",
        description: "",
      };
    };

    const performCreateTable = async () => {
      isLoadingData.value = true;
      await createTable(currentArea.value, selectedTable.value)
        .then((response) => {
          if (response.status === 201) {
            tableStore.refreshData().then(() => {
              cleanTable();
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

    const performUpdateTable = async () => {
      isLoadingData.value = true;
      await updateTable(currentArea.value, selectedTable.value)
        .then((response) => {
          if (response.status === 202) {
            tableStore.refreshData().then(() => {
              cleanTable();
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

    const performCreateArea = async (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      await createArea(area.value)
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

    const performUpdateArea = async (e) => {
      e.preventDefault();
      isLoadingData.value = true;
      await updateArea(area.value.id, area.value)
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

    const selectedPlace = ref(null);
    const preparationPlaces = ref([]);
    const preparationPlace = ref(null);
    const printerName = ref(null);
    const printerFormat = ref(null);
    const printerFormatOptions = [
      {
        value: 58,
        label: "58 mm",
      },
      {
        value: 80,
        label: "80 mm",
      },
    ];

    const selectPlace = (place) => {
      if (!selectedPlace.value) {
        selectedPlace.value = place.id;
        preparationPlace.value = cloneDeep(place.description);
        printerName.value = cloneDeep(place.printer_name);
        printerFormat.value = cloneDeep(place.printer_format);
      } else {
        if (selectedPlace.value === place.id) {
          selectedPlace.value = null;
          preparationPlace.value = null;
          printerName.value = null;
          printerFormat.value = null;
        } else {
          selectedPlace.value = place.id;
          preparationPlace.value = cloneDeep(place.description);
          printerName.value = cloneDeep(place.printer_name);
          printerFormat.value = cloneDeep(place.printer_format);
        }
      }
    };

    const loadPreparationPlaces = async () => {
      await getProductPlaces()
        .then((response) => {
          if (response.status === 200) {
            preparationPlaces.value = response.data;
            productStore.initializeStore();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreatePreparationPlace = async () => {
      await createProductPlace(
        preparationPlace.value,
        printerName.value,
        printerFormat.value
      )
        .then((response) => {
          if (response.status === 201) {
            loadPreparationPlaces();
            productStore.initializeStore();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          preparationPlace.value = null;
          printerName.value = null;
          printerFormat.value = null;
        });
    };

    const performUpdatePreparationPlace = async () => {
      await updateProductPlace(
        selectedPlace.value,
        preparationPlace.value,
        printerName.value,
        printerFormat.value
      )
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
          printerName.value = null;
          printerFormat.value = null;
        });
    };

    const selectCategory = (category) => {
      if (!selectedCategory.value) {
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

    const loadProductCategories = async () => {
      await getProductCategories()
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

    const performCreateProductCategory = async () => {
      await createProductCategory(productCategory.value)
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

    const performUpdateProductCategory = async () => {
      await updateProductCategory(selectedCategory.value, productCategory.value)
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

    const paymentMethods = ref([]);
    const paymentMethod = ref(null);
    const selectedPayment = ref(null);

    const selectPaymentMethod = (payment) => {
      if (!selectedPayment.value) {
        selectedPayment.value = payment.id;
        paymentMethod.value = cloneDeep(payment.description);
      } else {
        if (selectedPayment.value === payment.id) {
          selectedPayment.value = null;
          paymentMethod.value = null;
        } else {
          selectedPayment.value = payment.id;
          paymentMethod.value = cloneDeep(payment.description);
        }
      }
    };

    const loadPaymentMethods = async () => {
      await getPaymentMethods()
        .then((response) => {
          if (response.status === 200) {
            paymentMethods.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreatePaymentMethod = async () => {
      await createPaymentMethodDesc(paymentMethod.value)
        .then((response) => {
          if (response.status === 201) {
            loadPaymentMethods();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          paymentMethod.value = null;
        });
    };

    const performUpdatePaymentMethod = async () => {
      await updatePaymentMethodDesc(selectedPayment.value, paymentMethod.value)
        .then((response) => {
          if (response.status === 202) {
            loadPaymentMethods();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedPayment.value = null;
          paymentMethod.value = null;
        });
    };

    const concepts = ref([]);
    const concept = ref({
      description: "",
      concept_type: null,
    });
    const selectedConcept = ref(null);

    const conceptTypeOptions = [
      {
        label: "Ingreso",
        value: "0",
      },
      {
        label: "Egreso",
        value: "1",
      },
    ];

    const selectConcept = (single_concept) => {
      if (!selectedConcept.value) {
        selectedConcept.value = single_concept.id;
        concept.value.description = cloneDeep(single_concept.description);
        concept.value.concept_type = cloneDeep(single_concept.concept_type);
      } else {
        if (selectedConcept.value === single_concept.id) {
          selectedConcept.value = null;
          concept.value.description = null;
          concept.value.concept_type = null;
        } else {
          selectedConcept.value = single_concept.id;
          concept.value.description = cloneDeep(single_concept.description);
          concept.value.concept_type = cloneDeep(single_concept.concept_type);
        }
      }
    };

    const loadConcepts = async () => {
      await getConcepts()
        .then((response) => {
          if (response.status === 200) {
            concepts.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreateConcept = async () => {
      await createConcept(concept.value)
        .then((response) => {
          if (response.status === 201) {
            loadConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          concept.value = { description: "", concept_type: null };
        });
    };

    const performUpdateConcept = async () => {
      await updateConcept(selectedConcept.value, concept.value)
        .then((response) => {
          if (response.status === 202) {
            loadConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedConcept.value = null;
          concept.value = { description: "", concept_type: null };
        });
    };

    const inventory_concepts = ref([]);
    const inventory_concept = ref({
      description: "",
      concept_type: null,
    });
    const selectedInventoryConcept = ref(null);

    const selectInventoryConcept = (single_concept) => {
      if (!selectedInventoryConcept.value) {
        selectedInventoryConcept.value = single_concept.id;
        inventory_concept.value.description = cloneDeep(single_concept.concept);
        inventory_concept.value.concept_type = cloneDeep(
          single_concept.concept_type
        );
      } else {
        if (selectedInventoryConcept.value === single_concept.id) {
          selectedInventoryConcept.value = null;
          inventory_concept.value.description = null;
          inventory_concept.value.concept_type = null;
        } else {
          selectedConcept.value = single_concept.id;
          inventory_concept.value.description = cloneDeep(
            single_concept.concept
          );
          inventory_concept.value.concept_type = cloneDeep(
            single_concept.concept_type
          );
        }
      }
    };

    const loadInventoryConcepts = async () => {
      await getInventoryConcepts()
        .then((response) => {
          if (response.status === 200) {
            inventory_concepts.value = response.data;
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const performCreateInventoryConcept = async () => {
      await createInventoryConcept(inventory_concept.value)
        .then((response) => {
          if (response.status === 201) {
            loadInventoryConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          inventory_concept.value = { description: "", concept_type: null };
        });
    };

    const performUpdateInventoryConcept = async () => {
      await updateInventoryConcept(
        selectedInventoryConcept.value,
        inventory_concept.value
      )
        .then((response) => {
          if (response.status === 200) {
            loadInventoryConcepts();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          selectedInventoryConcept.value = null;
          inventory_concept.value = { description: "", concept_type: null };
        });
    };

    onMounted(() => {
      tableStore.refreshData();
      loadPreparationPlaces();
      loadProductCategories();
      loadPaymentMethods();
      loadConcepts();
      loadInventoryConcepts();
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    return {
      userStore,
      handleBack,
      isLoadingData,
      areaOptions,
      currentArea,
      area,
      cleanArea,
      editArea,
      performCreateArea,
      performUpdateArea,
      selectTable,
      cleanTable,
      selectedTable,
      tables,
      performCreateTable,
      performUpdateTable,
      preparationPlaces,
      preparationPlace,
      printerStore,
      printerName,
      printerFormat,
      printerFormatOptions,
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
      paymentMethods,
      paymentMethod,
      selectedPayment,
      selectPaymentMethod,
      performCreatePaymentMethod,
      performUpdatePaymentMethod,
      conceptTypeOptions,
      concepts,
      concept,
      optionsPrinters,
      selectedConcept,
      selectConcept,
      performCreateConcept,
      performUpdateConcept,
      inventory_concepts,
      inventory_concept,
      selectedInventoryConcept,
      selectInventoryConcept,
      performCreateInventoryConcept,
      performUpdateInventoryConcept,
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
