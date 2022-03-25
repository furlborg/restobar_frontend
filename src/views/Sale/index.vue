<template>
  <div id="Sale">
    <n-card title="Ventas" :segmented="{ content: 'hard' }">
      <n-space justify="space-between">
        <n-button
          type="info"
          text
          @click="
            showFilters === false ? (showFilters = true) : (showFilters = false)
          "
        >
          <v-icon name="md-filteralt-round" />
          {{ showFilters ? "Ocultar Filtros" : "Mostrar filtros" }}
        </n-button>
        <div class="d-flex">
          <n-button type="info" text @click="refreshTable">
            <v-icon name="hi-solid-refresh" />
            Recargar
          </n-button>
          <n-select
            v-if="!userStore.user.branchoffice"
            class="ps-2"
            v-model:value="filterParams.branch"
            :options="businessStore.branchSelectOptions"
            @update:value="refreshTable"
          ></n-select>
        </div>
      </n-space>
      <n-collapse-transition class="mt-2" :show="showFilters">
        <n-form>
          <n-grid
            responsive="screen"
            cols="6 s:6 m:12 l:12 xl:24 2xl:24"
            :x-gap="12"
          >
            <n-form-item-gi label="Cliente" :span="4">
              <n-input
                v-model:value="filterParams.customer"
                placeholder=""
                @keypress="isLetter($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Serie" :span="2">
              <n-select
                v-model:value="filterParams.serie"
                :options="saleStore.getSeriesOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Número" :span="2">
              <n-input
                v-model:value="filterParams.number"
                placeholder=""
                @keypress="isNumber($event)"
              />
            </n-form-item-gi>
            <n-form-item-gi label="Método Pago" :span="3">
              <n-select
                v-model:value="filterParams.payment_method"
                :options="saleStore.getPaymentMethodsOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Estado" :span="2">
              <n-select
                v-model:value="filterParams.status"
                :options="statusOptions"
                placeholder=""
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi label="Fecha" :span="6">
              <n-date-picker
                type="daterange"
                v-model:formatted-value="filterParams.date_sale"
                format="dd/MM/yyyy"
                clearable
              />
            </n-form-item-gi>
            <n-form-item-gi :span="5">
              <n-button type="info" secondary @click="performFilter"
                >Buscar</n-button
              >
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-collapse-transition>
      <n-data-table
        class="mt-2"
        :columns="tableColumns"
        :data="sales"
        :loading="isTableLoading"
        :pagination="pagination"
        remote
      />
    </n-card>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { useMessage, useDialog } from "naive-ui";
import { createSaleColumns } from "@/utils/constants";
import {
  listSales,
  listSalesByPage,
  searchSales,
  sendSale,
  nullSale,
} from "@/api/modules/sales";
import { useSaleStore } from "@/store/modules/sale";
import { useBusinessStore } from "@/store/modules/business";
import { useUserStore } from "@/store/modules/user";
import { isNumber, isLetter } from "@/utils";
import { generatePrint } from "./Prints/prints";

export default defineComponent({
  name: "Sale",
  setup() {
    const message = useMessage();
    const dialog = useDialog();
    const businessStore = useBusinessStore();
    const userStore = useUserStore();
    const saleStore = useSaleStore();
    const isTableLoading = ref(false);
    const sales = ref([]);
    const showFilters = ref(false);
    const filterParams = ref({
      branch: !userStore.user.branchoffice
        ? businessStore.currentBranch
        : userStore.user.branchoffice,
      customer: "",
      serie: null,
      number: "",
      payment_method: null,
      date_sale: null,
      status: null,
    });

    const pagination = ref({
      pageSearchParams: null,
      total: 0,
      page: 1,
      pageCount: 1,
      pageSize: 20,
      showSizePicker: true,
      pageSizes: [20, 50, 100],
      onChange: (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        listSalesByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
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
            sales.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
      onPageSizeChange: (pageSize) => {
        isTableLoading.value = true;
        pagination.value.pageSize = pageSize;
        listSalesByPage(
          pagination.value.pageSearchParams,
          pagination.value.page,
          pagination.value.pageSize
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
            sales.value = response.data.results;
          })
          .catch((error) => {
            console.error(error);
            message.error("Algo salió mal...");
          })
          .finally(() => {
            isTableLoading.value = false;
          });
      },
    });

    const loadSales = () => {
      isTableLoading.value = true;
      // pagination.value.pageSize = 20;
      listSales(filterParams.value.branch)
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
          sales.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const performFilter = () => {
      isTableLoading.value = true;
      pagination.value.pageSearchParams = filterParams.value;
      pagination.value.page = 1;
      searchSales(
        pagination.value.pageSearchParams,
        pagination.value.page,
        pagination.value.pageSize
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
          sales.value = response.data.results;
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal...");
        })
        .finally(() => {
          isTableLoading.value = false;
        });
    };

    const refreshTable = () => {
      filterParams.value.customer = "";
      filterParams.value.serie = null;
      filterParams.value.number = "";
      filterParams.value.payment_method = null;
      filterParams.value.date_sale = null;
      filterParams.value.status = null;
      pagination.value.pageSearchParams = null;
      pagination.value.page = 1;
      loadSales();
    };

    const statusOptions = [
      {
        value: "N",
        label: "NUEVO",
      },
      {
        value: "E",
        label: "ENVIADO",
      },
      {
        value: "A",
        label: "ANULADO",
      },
    ];

    onMounted(() => {
      document.title = "Ventas | App";
      loadSales();
    });

    return {
      saleStore,
      isLetter,
      isNumber,
      isTableLoading,
      statusOptions,
      pagination,
      showFilters,
      filterParams,
      refreshTable,
      performFilter,
      sales,
      businessStore,
      userStore,
      tableColumns: createSaleColumns({
        printSale(val) {
          console.log(val);
          let dataForPrint = JSON.parse(val.json_sale);
          console.log(dataForPrint);

          let typeDoc = dataForPrint.serie_documento.split("");

          if (typeDoc[0] === "F") {
            typeDoc = "FACTURA ELECTRONICA";
          } else {
            typeDoc = "BOLETA ELECTRONICA";
          }

          let datTotals = [
            { img: "IMG", tittle: null, twoPoints: null, cont: null },
          ];

          let newTotal = {
            "OP.GRAVADA": dataForPrint.totales.total_operaciones_gravadas,
            "OP.EXONERADA": dataForPrint.totales.total_operaciones_exoneradas,
            "OP.GRATUITAS": dataForPrint.totales.total_operaciones_gratuitas,
            "IGV(18%)": dataForPrint.totales.total_igv,
            DESCUENTOS: "Este webon no poene descuentos",
            "IMPORTE TOTAL": dataForPrint.totales.total_venta,
          };

          for (let i in newTotal) {
            datTotals.push({
              tittle: i,
              twoPoints: ":",
              cont: newTotal[i],
            });
          }

          let structure = [
            {
              dat: [
                {
                  img: "ACA IRA UNA IMAGEN DE MRD",
                },
              ],
            },
            {
              dat: [
                [
                  {
                    content: "ACA IRA UN TITULO DE MIERDA",
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 10,
                    },
                  },
                ],
                [
                  {
                    content: "Jr. Chumape las bolas Av. de los Webones",
                    styles: {
                      halign: "center",
                      fontSize: 7.5,
                    },
                  },
                ],
                [
                  {
                    content: typeDoc,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                [
                  {
                    content: `RUC: 001CHUAPALA`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 10,
                    },
                  },
                ],
                [
                  {
                    content: `${dataForPrint.serie_documento} ${dataForPrint.codigo_tipo_operacion}`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
              ],
            },

            {
              dat: [
                {
                  tittle: "Cliente",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor
                    .apellidos_y_nombres_o_razon_social,
                },

                {
                  tittle: typeDoc[0] === "F" ? "RUC" : "Documento",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor
                    .numero_documento,
                },

                {
                  tittle: "Direccion",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor.direccion,
                },

                {
                  tittle: "F.Emicion",
                  twoPoints: ":",
                  cont: dataForPrint.fecha_de_emision,
                },
              ],
            },
            {
              col: [
                {
                  header: "Cant.",
                  dataKey: "amount",
                },
                {
                  header: "U.",
                  dataKey: "unit",
                },
                {
                  header: "M.",
                  dataKey: "M",
                },
                {
                  header: "Descripción",
                  dataKey: "description",
                },
                {
                  header: "P.",
                  dataKey: "price",
                },
                {
                  header: "UnitV.",
                  dataKey: "unitVal",
                },
                {
                  header: "Total",
                  dataKey: "total",
                },
              ],
              dat: dataForPrint.items.map((val) => {
                return {
                  amount: val.cantidad,
                  unit: val.unidad_de_medida,
                  description: val.descripcion,
                  price: val.precio_unitario,
                  total: val.total_item,
                };
              }),
            },
            {
              dat: datTotals,
            },

            {
              dat: [
                [
                  {
                    content: "Representacion impresa de la boleta electronica",
                    styles: {
                      halign: "center",
                      fontSize: 7.5,
                    },
                  },
                ],
                [
                  {
                    content:
                      "Puede verificarla usando su clave sol o ingresando a la pagina web:",
                    styles: {
                      halign: "center",
                      fontSize: 7.5,
                    },
                  },
                ],
                [
                  {
                    content: "Correo de la empresa",
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 7.5,
                    },
                  },
                ],
                [
                  {
                    content:
                      "BIENES CONSUMOS / SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER CONSUMIDAS EN LA MISMA",
                    styles: {
                      halign: "center",
                      fontSize: 7.5,
                    },
                  },
                ],
              ],
            },

            {
              dat: [
                {
                  tittle: "CONSULTOR/VENDEDOR",
                  twoPoints: ":",
                  cont: "PON EL NOMBRE DEL GIL QUE VENDE WEBADAS PS NO SEAS GIL",
                },
                {
                  tittle: "TIPO DE PAGO",
                  twoPoints: ":",
                  cont: "SERIO WEY MANDA LA INFO NECESARIA PARA ESTA MADRE YA MUCHA WEBADA CONTIGO SERIO GAAAAAAAA",
                },
              ],
            },
          ];

          generatePrint(structure);

          message.success("Imprimir");
        },
        miscSale() {
          message.success("Miscelaneo");
        },
        sendSale(row) {
          isTableLoading.value = true;
          sendSale(row.id)
            .then((response) => {
              if (response.status === 200) {
                message.success("Enviado");
              }
            })
            .catch((error) => {
              console.error(error);
              message.error("Algo salió mal...");
            })
            .finally(() => {
              loadSales();
            });
        },
        nullifySale(row) {
          dialog.error({
            title: "Anular venta",
            content: "¿Desea anular venta?",
            positiveText: "Si",
            negativeText: "No",
            onPositiveClick: async () => {
              isTableLoading.value = true;
              await nullSale(row.id)
                .then((response) => {
                  if (response.status === 204) {
                    message.success("Anulado");
                  }
                })
                .catch((error) => {
                  console.error(error);
                  message.error("Algo salió mal...");
                })
                .finally(() => {
                  loadSales();
                });
            },
            onNegativeClick: () => {},
          });
        },
      }),
    };
  },
});
</script>

<style></style>
