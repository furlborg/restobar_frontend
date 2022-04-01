<template>
  <div id="BusinessSettings">
    <n-page-header class="mb-2" @back="handleBack">
      <template #title>
        <n-text class="fs-2">Configuración de Empresa</n-text>
      </template>
    </n-page-header>
    <n-grid
      responsive="screen"
      cols="12 s:12 m:12 l:12 xl:24 2xl:24"
      :x-gap="12"
      :y-gap="12"
    >
      <n-gi :span="12">
        <n-card
          title="Información de la empresa"
          :segmented="{ content: 'hard' }"
        >
          <n-spin :show="loadingBusiness">
            <n-form :disabled="!editBusiness">
              <n-grid
                responsive="screen"
                cols="6 s:6 m:12 l:12 xl:18 2xl:18"
                :x-gap="12"
                :y-gap="12"
              >
                <n-form-item-gi :span="6" label="RUC">
                  <n-input
                    v-model:value="business.ruc"
                    placeholder=""
                    :maxlength="11"
                    show-count
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Nombre">
                  <n-input v-model:value="business.name" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Nombre Comercial">
                  <n-input
                    v-model:value="business.commercial_name"
                    placeholder=""
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Dirección">
                  <n-input
                    v-model:value="business.fiscal_address"
                    placeholder=""
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Representante legal">
                  <n-input
                    v-model:value="business.legal_representative"
                    placeholder=""
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Celular">
                  <n-input v-model:value="business.phone" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Email">
                  <n-input v-model:value="business.email" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Sitio web">
                  <n-input v-model:value="business.website" placeholder="" />
                </n-form-item-gi>
                <!-- <n-form-item-gi :span="6" label="URL CPE">
                <n-input />
              </n-form-item-gi> -->
              </n-grid>
            </n-form>
          </n-spin>
          <template #action>
            <n-space v-if="!editBusiness" justify="end">
              <n-button type="warning" secondary @click="editBusiness = true"
                >Editar</n-button
              >
            </n-space>
            <n-space v-else justify="end">
              <n-button
                type="success"
                :loading="loadingBusiness"
                :disabled="loadingBusiness"
                secondary
                @click="performUpdateBusiness"
                >Guardar</n-button
              >
              <n-button
                type="error"
                :disabled="loadingBusiness"
                secondary
                @click="cancelBusinessEdit"
                >Cancelar</n-button
              >
            </n-space>
          </template>
        </n-card>
      </n-gi>
      <n-gi :span="12">
        <n-card title="Sucursales" :segmented="{ content: 'hard' }">
          <template #header-extra>
            <n-button type="info" secondary @click="showModal = true"
              >Agregar</n-button
            >
          </template>
          <n-collapse
            :default-expanded-names="[1]"
            @update:expanded-names="changeCurrentBranch"
            accordion
          >
            <n-collapse-item
              v-for="branch in business.branchs"
              :key="branch.id"
              title="Sucursal 1"
              :name="branch.id"
            >
              <n-spin :show="loadingBranch">
                <n-form
                  :disabled="
                    currentBranch.id === branch.id && !currentBranch.editBranch
                  "
                >
                  <n-grid
                    responsive="screen"
                    cols="12 s:12 m:12 l:12 xl:24 2xl:24"
                    :x-gap="12"
                  >
                    <n-form-item-gi :span="12" label="Descripción">
                      <n-input
                        v-model:value="branch.description"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Celular">
                      <n-input v-model:value="branch.phone" placeholder="" />
                    </n-form-item-gi>
                    <n-form-item-gi :span="6" label="Email">
                      <n-input v-model:value="branch.email" placeholder="" />
                    </n-form-item-gi>
                    <!-- <n-form-item-gi :span="12" label="Dirección fiscal">
                    <n-input v-model:value="branch.fiscal_address" placeholder="" />
                  </n-form-item-gi> -->
                    <n-form-item-gi :span="12" label="Ubigeo">
                      <n-input-group>
                        <n-input-group-label>PE</n-input-group-label>
                        <n-cascader
                          separator=" ⏵ "
                          :options="customerStore.ubigee"
                          v-model:value="branch.ubigeo"
                          check-strategy="child"
                        />
                      </n-input-group>
                    </n-form-item-gi>
                    <n-form-item-gi :span="12" label="Dirección comercial">
                      <n-input
                        v-model:value="branch.commercial_address"
                        placeholder=""
                      />
                    </n-form-item-gi>
                    <!-- <n-form-item-gi :span="12" label="Sitio web">
                    <n-input v-model:value="branch.website" placeholder="" />
                  </n-form-item-gi> -->
                    <n-form-item-gi :span="12" label="Información adicional">
                      <n-input
                        type="textarea"
                        v-model:value="branch.extra_info"
                        placeholder=""
                      />
                    </n-form-item-gi>
                  </n-grid>
                  <n-space v-if="!currentBranch.editBranch" justify="end">
                    <n-button
                      type="warning"
                      secondary
                      @click="currentBranch.editBranch = true"
                      >Editar</n-button
                    >
                  </n-space>
                  <n-space v-else justify="end">
                    <n-button
                      type="success"
                      :loading="loadingBranch"
                      :disabled="loadingBranch"
                      secondary
                      @click="performUpdateBranch"
                      >Guardar</n-button
                    >
                    <n-button
                      type="error"
                      :disabled="loadingBranch"
                      secondary
                      @click="cancelBranchEdit"
                      >Cancelar</n-button
                    >
                  </n-space>
                </n-form>
              </n-spin>
              <n-card class="mt-2" :bordered="false" embedded>
                <n-spin :show="loadingSeries">
                  <n-space align="center">
                    <n-text class="fs-5">Series Documentos</n-text>
                    <n-button
                      class="text-decoration-underline"
                      type="info"
                      text
                      @click="
                        currentBranch.showSeries === false
                          ? (cleanSerie(), (currentBranch.showSeries = true))
                          : (currentBranch.showSeries = false)
                      "
                      >{{
                        currentBranch.id === branch.id &&
                        !currentBranch.showSeries
                          ? "Mostrar"
                          : "Ocultar"
                      }}</n-button
                    >
                  </n-space>
                  <n-collapse-transition
                    :show="
                      currentBranch.id === branch.id && currentBranch.showSeries
                    "
                  >
                    <n-table class="mt-2">
                      <thead>
                        <tr>
                          <th>Serie</th>
                          <th>Tipo de Documento</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="series in branch.document_series"
                          :key="series.id"
                          @click="selectSerie(series)"
                        >
                          <td
                            :style="{
                              backgroundColor:
                                series.id === serie.id ? 'AliceBlue' : null,
                            }"
                          >
                            {{ series.description }}
                          </td>
                          <td
                            :style="{
                              backgroundColor:
                                series.id === serie.id ? 'AliceBlue' : null,
                            }"
                          >
                            {{ getSaleDocumentByNumber(series.doc_type) }}
                          </td>
                          <td
                            :style="{
                              backgroundColor:
                                series.id === serie.id ? 'AliceBlue' : null,
                            }"
                          >
                            <n-button class="float-end" type="error" text>
                              <v-icon
                                name="md-disabledbydefault-round"
                                scale="1.25"
                              />
                            </n-button>
                          </td>
                        </tr>
                      </tbody>
                    </n-table>
                    <n-form class="mt-2">
                      <n-grid
                        responsive="screen"
                        cols="6 s:6 m:12 l:12 xl:18 2xl:18"
                        :x-gap="12"
                      >
                        <n-form-item-gi label="Tipo Documento" :span="6">
                          <n-select
                            :options="saleDocumentOptions"
                            v-model:value="serie.doc_type"
                          />
                        </n-form-item-gi>
                        <n-form-item-gi label="Serie" :span="6">
                          <n-input v-model:value="serie.description" />
                        </n-form-item-gi>
                        <n-form-item-gi :span="6">
                          <n-space>
                            <n-button
                              :type="!serie.id ? 'info' : 'warning'"
                              :disabled="!serie.description || loadingSeries"
                              :loading="loadingSeries"
                              secondary
                              @click="
                                !serie.id
                                  ? performCreateDocumentSerie()
                                  : performUpdateDocumentSerie()
                              "
                              >{{ !serie.id ? "Agregar" : "Guardar" }}</n-button
                            >
                            <n-button
                              type="error"
                              :disabled="!serie.description || loadingSeries"
                              secondary
                              @click="cleanSerie"
                              >Cancelar</n-button
                            >
                          </n-space>
                        </n-form-item-gi>
                      </n-grid>
                    </n-form>
                  </n-collapse-transition>
                </n-spin>
              </n-card>
            </n-collapse-item>
          </n-collapse>
        </n-card>
      </n-gi>
    </n-grid>
    <BranchModal
      v-model:show="showModal"
      @update:show="onCloseModal"
      @on-success="onSuccess"
    />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import { cloneDeep } from "@/utils";
import {
  getSaleDocumentByNumber,
  saleDocumentOptions,
} from "@/utils/constants";
import { useBusinessStore } from "@/store/modules/business";
import { useCustomerStore } from "@/store/modules/customer";
import {
  updateBusiness,
  updateBranch,
  createDocumentSerie,
  updateDocumentSerie,
} from "@/api/modules/business";
import BranchModal from "./BranchModal";

export default defineComponent({
  name: "BusinessSettings",
  components: {
    BranchModal,
  },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const customerStore = useCustomerStore();
    const loadingBusiness = ref(false);
    const loadingBranch = ref(false);
    const showModal = ref(false);
    const businessStore = useBusinessStore();
    const business = ref({});
    const editBusiness = ref(false);
    const currentBranch = ref({
      id: 1,
      editBranch: false,
      showSeries: false,
    });

    const performUpdateBusiness = async () => {
      loadingBusiness.value = true;
      await updateBusiness(business.value)
        .then((response) => {
          if (response.status === 202) {
            businessStore
              .refreshBusiness()
              .then(() => {
                editBusiness.value = false;
                business.value = cloneDeep(businessStore.business);
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                loadingBusiness.value = false;
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    const cancelBusinessEdit = () => {
      editBusiness.value = false;
      business.value = cloneDeep(businessStore.business);
    };

    const changeCurrentBranch = (openBranchs) => {
      if (openBranchs.length > 0) {
        currentBranch.value.id = openBranchs[0];
      } else {
        currentBranch.value.id = null;
      }
      currentBranch.value.editBranch = false;
      currentBranch.value.showSeries = false;
    };

    const performUpdateBranch = async () => {
      let branch = business.value.branchs.find(
        (branch) => branch.id === currentBranch.value.id
      );
      if (branch) {
        loadingBranch.value = true;
        await updateBranch(currentBranch.value.id, branch)
          .then((response) => {
            if (response.status === 202) {
              businessStore
                .refreshBusiness()
                .then(() => {
                  currentBranch.value.editBranch = false;
                  business.value = cloneDeep(businessStore.business);
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Algo salió mal...");
                })
                .finally(() => {
                  loadingBranch.value = false;
                });
            }
          })
          .catch((error) => {
            console.error(error.response.data);
            message.error("Algo salió mal...");
          });
      } else {
        console.error("Branch not found");
        message.error("Algo salió mal...");
      }
    };

    const cancelBranchEdit = () => {
      currentBranch.value.editBranch = false;
      business.value = cloneDeep(businessStore.business);
    };

    const loadingSeries = ref(false);
    const serie = ref({
      id: null,
      description: "",
      doc_type: null,
      sucursal: null,
    });

    const cleanSerie = () => {
      serie.value = {
        id: null,
        description: "",
        doc_type: null,
        sucursal: null,
      };
    };

    const selectSerie = (ser) => {
      if (!serie.value.id) {
        serie.value = cloneDeep(ser);
      } else {
        if (serie.value.id === ser.id) {
          cleanSerie();
        } else {
          serie.value = cloneDeep(ser);
        }
      }
    };

    const performCreateDocumentSerie = async () => {
      loadingSeries.value = true;
      serie.value.sucursal = currentBranch.value.id;
      await createDocumentSerie(serie.value)
        .then((response) => {
          if (response.status === 201) {
            cleanSerie();
            businessStore
              .refreshBusiness()
              .then(() => {
                business.value = cloneDeep(businessStore.business);
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                loadingSeries.value = false;
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingSeries.value = false;
        });
    };

    const performUpdateDocumentSerie = async () => {
      loadingSeries.value = true;
      await updateDocumentSerie(serie.value.id, serie.value)
        .then((response) => {
          if (response.status === 202) {
            cleanSerie();
            businessStore
              .refreshBusiness()
              .then(() => {
                business.value = cloneDeep(businessStore.business);
              })
              .catch((error) => {
                console.error(error);
                message.error("Algo salió mal...");
              })
              .finally(() => {
                loadingSeries.value = false;
              });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        });
    };

    onMounted(() => {
      document.title = "Configuración de Empresa | App";
      business.value = cloneDeep(businessStore.business);
    });

    const handleBack = () => {
      router.push({ name: "HomeSettings" });
    };

    const onCloseModal = () => {
      document.title = "Configuración de Empresa | App";
      // idProduct.value = 0
    };

    const onSuccess = async () => {
      showModal.value = false;
      onCloseModal();
      loadingBranch.value = true;
      await businessStore
        .refreshBusiness()
        .then(() => {
          business.value = cloneDeep(businessStore.business);
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingBranch.value = false;
        });
    };

    return {
      customerStore,
      handleBack,
      showModal,
      onCloseModal,
      onSuccess,
      loadingBusiness,
      loadingBranch,
      business,
      editBusiness,
      performUpdateBusiness,
      cancelBusinessEdit,
      currentBranch,
      changeCurrentBranch,
      cancelBranchEdit,
      performUpdateBranch,
      saleDocumentOptions,
      getSaleDocumentByNumber,
      loadingSeries,
      cleanSerie,
      serie,
      selectSerie,
      performCreateDocumentSerie,
      performUpdateDocumentSerie,
    };
  },
});
</script>

<style lang="scss">
.bg-selected {
  background-color: AliceBlue;
}
</style>