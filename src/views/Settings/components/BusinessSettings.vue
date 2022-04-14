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
            <n-form
              :disabled="!editBusiness"
              :rules="businessRules"
              :model="business"
              ref="businessForm"
            >
              <n-grid
                responsive="screen"
                cols="6 s:6 m:12 l:12 xl:18 2xl:18"
                :x-gap="12"
                :y-gap="12"
              >
                <n-form-item-gi :span="6" label="RUC" path="ruc">
                  <n-input
                    v-model:value="business.ruc"
                    placeholder=""
                    :maxlength="11"
                    show-count
                  />
                </n-form-item-gi>
                <n-form-item-gi :span="6" label="Nombre" path="name">
                  <n-input v-model:value="business.name" placeholder="" />
                </n-form-item-gi>
                <n-form-item-gi
                  :span="6"
                  label="Nombre Comercial"
                  path="commercial_name"
                >
                  <n-input
                    v-model:value="business.commercial_name"
                    placeholder=""
                  />
                </n-form-item-gi>
                <n-form-item-gi
                  :span="6"
                  label="Dirección"
                  path="fiscal_address"
                >
                  <n-input
                    v-model:value="business.fiscal_address"
                    placeholder=""
                  />
                </n-form-item-gi>
                <n-form-item-gi
                  :span="6"
                  label="Representante legal"
                  path="legal_representative"
                >
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
                <n-form-item-gi
                  :span="6"
                  label="Clave de seguridad"
                  path="general_pass"
                >
                  <n-input
                    type="password"
                    v-model:value="business.general_pass"
                    placeholder=""
                  />
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
          <n-spin :show="refreshing">
            <n-collapse
              :default-expanded-names="[1]"
              @update:expanded-names="changeCurrentBranch"
              accordion
            >
              <n-collapse-item
                v-for="(branch, index) in business.branchs"
                :key="branch.id"
                :title="`Sucursal ${index + 1}`"
                :name="branch.id"
              >
                <BranchForm
                  :branch="branch"
                  @success="branchSuccess"
                  @cancel="branchCancel"
                ></BranchForm>
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
                        currentBranch.id === branch.id &&
                        currentBranch.showSeries
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
                                >{{
                                  !serie.id ? "Agregar" : "Guardar"
                                }}</n-button
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
          </n-spin>
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
import { businessRules, branchOfficeRules } from "@/utils/constants";
import { cloneDeep } from "@/utils";
import {
  getSaleDocumentByNumber,
  saleDocumentOptions,
} from "@/utils/constants";
import { useBusinessStore } from "@/store/modules/business";
import { useCustomerStore } from "@/store/modules/customer";
import {
  updateBusiness,
  createDocumentSerie,
  updateDocumentSerie,
} from "@/api/modules/business";
import BranchModal from "./BranchModal";
import BranchForm from "./BranchForm";

export default defineComponent({
  name: "BusinessSettings",
  components: {
    BranchModal,
    BranchForm,
  },
  setup() {
    const router = useRouter();
    const message = useMessage();
    const customerStore = useCustomerStore();
    const loadingBusiness = ref(false);
    const refreshing = ref(false);
    const showModal = ref(false);
    const businessStore = useBusinessStore();
    const businessForm = ref(null);
    const business = ref({});
    const editBusiness = ref(false);
    const currentBranch = ref({
      id: 1,
      showSeries: false,
    });

    const performUpdateBusiness = async () => {
      businessForm.value.validate(async (errors) => {
        if (!errors) {
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
        } else {
          console.error(errors);
          message.error("Datos incorrectos");
        }
      });
    };

    const cancelBusinessEdit = () => {
      editBusiness.value = false;
      businessForm.value.restoreValidation();
      business.value = cloneDeep(businessStore.business);
    };

    const changeCurrentBranch = (openBranchs) => {
      if (openBranchs.length > 0) {
        currentBranch.value.id = openBranchs[0];
      } else {
        currentBranch.value.id = null;
      }
      currentBranch.value.showSeries = false;
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
      refreshing.value = true;
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
          refreshing.value = false;
        });
    };

    const branchSuccess = async () => {
      business.value = cloneDeep(businessStore.business);
    };

    const branchCancel = async () => {
      business.value = cloneDeep(businessStore.business);
    };

    return {
      customerStore,
      handleBack,
      showModal,
      onCloseModal,
      onSuccess,
      loadingBusiness,
      businessRules,
      businessForm,
      business,
      editBusiness,
      performUpdateBusiness,
      cancelBusinessEdit,
      currentBranch,
      branchOfficeRules,
      changeCurrentBranch,
      saleDocumentOptions,
      getSaleDocumentByNumber,
      loadingSeries,
      cleanSerie,
      serie,
      selectSerie,
      performCreateDocumentSerie,
      performUpdateDocumentSerie,
      branchSuccess,
      branchCancel,
      refreshing,
    };
  },
});
</script>

<style lang="scss">
.bg-selected {
  background-color: AliceBlue;
}
</style>