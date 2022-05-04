<template>
  <div id="Sale">
    <n-card title="Ventas" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-select
          v-if="!userStore.user.branchoffice"
          class="ps-2"
          v-model:value="filterParams.branch"
          :options="businessStore.branchSelectOptions"
          @update:value="refreshTable"
        ></n-select>
      </template>
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
        :scroll-x="900"
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
import { numeroALetras } from "./Prints/numberText.js";
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
    const dateNow = ref(null);
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
      onChange: async (page) => {
        isTableLoading.value = true;
        pagination.value.page = page;
        await listSalesByPage(
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
      onPageSizeChange: async (pageSize) => {
        isTableLoading.value = true;
        pagination.value.pageSize = pageSize;
        await listSalesByPage(
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

    const loadSales = async () => {
      isTableLoading.value = true;
      // pagination.value.pageSize = 20;
      await listSales(filterParams.value.branch)
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

    const performFilter = async () => {
      isTableLoading.value = true;
      pagination.value.pageSearchParams = filterParams.value;
      pagination.value.page = 1;
      await searchSales(
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

    const refreshTable = async () => {
      filterParams.value.customer = "";
      filterParams.value.serie = null;
      filterParams.value.number = "";
      filterParams.value.payment_method = null;
      filterParams.value.date_sale = null;
      filterParams.value.status = null;
      pagination.value.pageSearchParams = null;
      pagination.value.page = 1;
      await loadSales();
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

    onMounted(async () => {
      document.title = "Ventas | App";
      await loadSales();

      const fetch = new Date();
      const dd = fetch.getDate();
      const mm = fetch.getMonth();
      const yy = fetch.getFullYear();
      const hh = fetch.getHours();
      const msms = fetch.getMinutes();

      dateNow.value = `${dd}/${mm + 1}/${yy} ${hh}:${msms}`;
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
          let height = 0;
          let dataForPrint = JSON.parse(val.json_sale);

          let typeDoc = dataForPrint.serie_documento.split("");

          let data = `${businessStore.business.ruc}|${dataForPrint.serie_documento}|${dataForPrint.totales.total_igv}|${dataForPrint.hora_de_EMISIÓN}|${dataForPrint.datos_del_cliente_o_receptor.numero_documento}|${dataForPrint.numero_documento}|${dataForPrint.totales.total_venta}|${dataForPrint.datos_del_cliente_o_receptor.codigo_tipo_documento_identidad}|`;

          let NoNoteSale = false;

          if (typeDoc[0] === "F") {
            typeDoc = "FACTURA ELECTRONICA";
            NoNoteSale = true;
          }

          if (typeDoc[0] === "B") {
            typeDoc = "BOLETA ELECTRONICA";
            NoNoteSale = true;
          }

          if (typeDoc[0] === "N") {
            typeDoc = "NOTA DE VENTA";
            NoNoteSale = false;
          }

          let datTotals = [];

          let subtotal = 0;

          dataForPrint.items.map((val) => {
            subtotal += val.cantidad * parseFloat(val.precio_unitario);
          });

          let newTotal = NoNoteSale
            ? {
                SUBTOTAL: subtotal.toFixed("2"),
                EFECTIVO: val.given_amount,
                VUELTO: parseFloat(
                  val.given_amount - dataForPrint.totales.total_venta
                ).toFixed(2),
                "OP.GRAVADA":
                  dataForPrint.totales.total_operaciones_gravadas.toFixed("2"),
                "OP.EXONERADA":
                  dataForPrint.totales.total_operaciones_exoneradas.toFixed(
                    "2"
                  ),
                "OP.GRATUITAS":
                  dataForPrint.totales.total_operaciones_gratuitas.toFixed("2"),
                "IGV(18%)": dataForPrint.totales.total_igv.toFixed("2"),
                DESCUENTOS: !!val.discount
                  ? parseFloat(val.discount).toFixed("2")
                  : "0.00",
                "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
              }
            : {
                "IMPORTE TOTAL": dataForPrint.totales.total_venta.toFixed("2"),
              };
          for (let i in newTotal) {
            if (!!parseFloat(newTotal[i])) {
              height += 7;
              datTotals.push({
                tittle: i,
                twoPoints: ":",
                cont: newTotal[i],
              });
            }

            if (i === "IGV(18%)") {
              height += 7;
              datTotals.push({
                tittle: i,
                twoPoints: ":",
                cont: newTotal[i],
              });
            }
          }

          let structure = [
            {
              dat: [
                [
                  {
                    content: businessStore.business.commercial_name,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 10,
                    },
                  },
                ],
                [
                  {
                    content: businessStore.business.ruc,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 10,
                    },
                  },
                ],
                [
                  {
                    content: businessStore.business.fiscal_address,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                [
                  {
                    content: businessStore.business.phone,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 7,
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
                    content: `${dataForPrint.serie_documento}-${dataForPrint.numero_documento}`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 10,
                    },
                  },
                ],
              ],
            },

            {
              dat: [
                {
                  tittle: "CLIENTE",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor
                    .apellidos_y_nombres_o_razon_social,
                },

                {
                  tittle: typeDoc[0] === "F" ? "RUC" : "DOCUMENTO",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor
                    .numero_documento,
                },

                {
                  tittle: "DIRECCION",
                  twoPoints: ":",
                  cont: dataForPrint.datos_del_cliente_o_receptor.direccion,
                },

                {
                  tittle: "F.EMISIÓN",
                  twoPoints: ":",
                  cont: `${dataForPrint.fecha_de_emision} ${dataForPrint.hora_de_emision}`,
                },
              ],
              line: true,
            },
            {
              col: [
                {
                  header: "CANT.",
                  dataKey: "amount",
                },

                {
                  header: "DESCRIPCIÓN",
                  dataKey: "description",
                },
                !val.by_consumption && {
                  header: "P.U",
                  dataKey: "price",
                },

                {
                  header: "TOTAL",
                  dataKey: "total",
                },
              ],
              dat: !val.by_consumption
                ? dataForPrint.items.map((val) => {
                    height += 7;
                    return {
                      amount: val.cantidad,

                      description: val.descripcion,
                      price: parseFloat(val.precio_unitario).toFixed("2"),
                      total: parseFloat(val.total_item).toFixed("2"),
                    };
                  })
                : [
                    {
                      amount: 1,
                      description: "POR CONSUMO DE ALIMENTOS",
                      total: dataForPrint.totales.total_venta.toFixed("2"),
                    },
                  ],
              line: true,
            },
            {
              dat: datTotals,
              line: true,
            },

            NoNoteSale && {
              line: true,
              dat: [
                [
                  {
                    content:
                      "SON:" +
                      numeroALetras(
                        dataForPrint.totales.total_venta.toFixed("2"),
                        "SOLES"
                      ),
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                [
                  {
                    content:
                      "Representacion impresa del comprobante electronico",
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                !!businessStore.business.website && [
                  {
                    content: `Puede verificarla usando su clave sol o ingresando a la pagina web: ${businessStore.business.website}`,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                !!businessStore.business.email && [
                  {
                    content: businessStore.business.email,
                    styles: {
                      fontStyle: "bold",
                      halign: "center",
                      fontSize: 8,
                    },
                  },
                ],
                [
                  {
                    content:
                      "BIENES TRANSFERIDOS / SERVICIOS PRESTADOS EN LA AMAZONIA PARA SER CONSUMIDOS EN LA MISMA",
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
              line: true,
              dat: [
                {
                  tittle: "USUARIO",
                  twoPoints: ":",
                  cont: userStore.user.names,
                },
                {
                  tittle: "TIPO DE PAGO",
                  twoPoints: ":",
                  cont: val.payment_method,
                },
              ],
            },
          ];
          generatePrint(data, structure, NoNoteSale, height + 7 * 16);

          message.success("Imprimir");
        },
        miscSale() {
          message.success("Miscelaneo");
        },
        async sendSale(row) {
          isTableLoading.value = true;
          await sendSale(row.id)
            .then((response) => {
              if (response.status === 200) {
                message.success("Enviado");
              }
            })
            .catch((error) => {
              if (error.response.status === 400) {
                message.error(error.response.data.error);
              } else {
                console.error(error);
                message.error("Algo salió mal...");
              }
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
