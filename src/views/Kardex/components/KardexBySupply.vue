<template>
  <n-grid responsive="screen" cols="10 s:10 m:10 l:10 xl:10 2xl:10" :x-gap="12">
    <n-gi :span="3">
      <n-card :bordered="false" embedded>
        <n-space class="mb-2">
          <n-radio
            key="1"
            value="product"
            :checked="checkedValue == 'product'"
            @change="
              () => {
                checkedValue = 'product';
              }
            "
            @update:checked="listProducts()"
            >Productos</n-radio
          >
          <n-radio
            key="2"
            value="supplie"
            :checked="checkedValue == 'supplie'"
            @change="
              () => {
                checkedValue = 'supplie';
              }
            "
            @update:checked="listSupplies()"
            >Insumos</n-radio
          >
        </n-space>
        <n-form>
          <n-input-group>
            <n-input
              placeholder="Buscar..."
              v-model:value="textSearch"
              @keydown.enter="searchItem(textSearch)"
            >
              <template #prefix>
                <n-icon style="margin-top: -4px">
                  <v-icon name="md-search-round"
                /></n-icon>
              </template>
            </n-input>
            <!-- <n-button type="info">
              <v-icon name="md-search-round" @click="searchItem(textSearch)" />
            </n-button> -->
          </n-input-group>
        </n-form>
        <n-spin size="small" :show="loadingList">
          <n-scrollbar class="mt-2 pe-3 listItems" style="height: 625px">
            <n-list class="mt-0">
              <n-list-item
                v-for="(item, index) in dataList"
                :key="index"
                @click="selectKardex(item.id, item.name)"
              >
                <template #prefix>
                  <n-text>{{ index + 1 }}</n-text>
                </template>
                <n-text>{{ item.name }} </n-text>
              </n-list-item>
            </n-list>
          </n-scrollbar>
        </n-spin>
      </n-card>
    </n-gi>
    <n-gi :span="7">
      <n-card :title="ProductInstance.product">
        <template #header-extra>
          <n-date-picker
            type="datetimerange"
            size="small"
            value-format="yyyy-MM-dd HH:mm:ss"
            v-model:formatted-value="dateSearch"
            clearable
          />
          <n-button
            :disabled="ProductInstance.id ? false : true"
            class="ms-2"
            type="info"
            size="small"
            @click="
              selectKardex(
                ProductInstance.id,
                ProductInstance.product,
                dateSearch
              )
            "
          >
            <v-icon name="md-search-round" />
            Buscar
          </n-button>

          <n-button
            :disabled="ProductInstance.id ? false : true"
            class="ms-2"
            size="small"
            @click="generateReport"
          >
            <v-icon name="vi-file-type-excel" />
          </n-button>
          <!-- <n-dropdown trigger="click" :options="options" placement="bottom-end" :show-arrow="true">
            <n-button class="ms-2" type="info" size="small">
              <v-icon name="md-download-round" />
            </n-button>
          </n-dropdown> -->
        </template>
        <n-grid responsive="screen" cols="3" :x-gap="6">
          <n-gi>
            <div class="px-2" style="background-color: HoneyDew">
              <n-space justify="space-around" align="center">
                <n-text>Entradas</n-text>
                <div class="fs-4">{{ total.ingress }}</div>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="px-2" style="background-color: LavenderBlush">
              <n-space justify="space-around" align="center">
                <n-text>Salidas</n-text>
                <div class="fs-4">{{ total.egress }}</div>
              </n-space>
            </div>
          </n-gi>
          <n-gi>
            <div class="px-2" style="background-color: LightCyan">
              <n-space justify="space-around" align="center">
                <n-text>Stock</n-text>
                <div class="fs-4">{{ total.total.toFixed(3) }}</div>
              </n-space>
            </div>
          </n-gi>
        </n-grid>
        <n-data-table
          class="mt-2"
          style="height: 618px"
          size="tiny"
          :columns="columns"
          :data="dataKardex"
          :loading="loadingData"
          flex-height
        />
      </n-card>
    </n-gi>
  </n-grid>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import { createKardexBySupplyColumns } from "@/utils/constants";
import { renderIcon } from "@/utils";
import { getSupplies } from "@/api/modules/supplies";
import { getSuplieKardex, getProductKardex } from "@/api/modules/kardex";
import { getProducts, searchProduct } from "@/api/modules/products";
import { useMessage } from "naive-ui";
import { getExcelReport } from "@/api/modules/tills";
import format from "date-fns/format";

export default defineComponent({
  name: "KardexBySupply",
  setup() {
    const checkedValue = ref("product");
    const message = useMessage();
    const dataList = ref([]);
    const dataKardex = ref([]);
    const textSearch = ref("");
    const dateSearch = ref(null);
    const loadingList = ref(false);
    const loadingData = ref(false);
    const ProductInstance = ref({
      product: "PRODUCTO",
      id: null,
    });
    const total = ref({
      ingress: 0,
      egress: 0,
      total: 0,
    });

    onMounted(() => {
      listProducts();
    });

    const listProducts = () => {
      loadingList.value = true;
      getProducts()
        .then((response) => {
          dataList.value = response.data.results;
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingList.value = false;
        });
    };

    const listSupplies = (search) => {
      loadingList.value = true;
      let filter = "supplies/";
      if (search) {
        filter = "supplies/" + search;
      }
      getSupplies(filter)
        .then((response) => {
          dataList.value = response.data.results;
        })
        .catch((error) => {
          message.error("Algo salió mal...");
        })
        .finally(() => {
          loadingList.value = false;
        });
    };

    const selectKardex = (id, prod, date) => {
      loadingData.value = true;
      total.value.ingress = 0;
      total.value.egress = 0;
      total.value.total = 0;
      ProductInstance.value.id = id;
      ProductInstance.value.product = prod;

      if (checkedValue.value == "product") {
        let filter = `?product=${id}`;
        if (date) {
          filter += `&dfrom=${date[0]}&dto=${date[1]}`;
        }
        getProductKardex(filter)
          .then((response) => {
            dataKardex.value = response.data;
            response.data.map(function (v) {
              total.value.ingress =
                v.type == "0" ? total.value.ingress + 1 : total.value.ingress;
              total.value.egress =
                v.type == "1" ? total.value.egress + 1 : total.value.egress;
              if (v.ingress !== null) {
                total.value.total =
                  v.type == "0"
                    ? total.value.total + parseFloat(v.ingress)
                    : total.value.total - parseFloat(v.egress);
              }
            });
          })
          .catch((error) => {
            message.error("Algo salió mal...");
          });
      } else {
        let filter = `?supplie=${id}`;
        if (date) {
          filter += `&dfrom=${date[0]}&dto=${date[1]}`;
        }
        getSuplieKardex(filter)
          .then((response) => {
            dataKardex.value = response.data;
            response.data.map(function (v) {
              total.value.ingress =
                v.type == "0" ? total.value.ingress + 1 : total.value.ingress;
              total.value.egress =
                v.type == "1" ? total.value.egress + 1 : total.value.egress;
              total.value.total =
                v.type == "0"
                  ? total.value.total + parseFloat(!v.ingress ? 0 : v.ingress)
                  : total.value.total - parseFloat(!v.egress ? 0 : v.egress);
            });
          })
          .catch((error) => {
            message.error("Algo salió mal...");
          });
      }
      setTimeout(() => (loadingData.value = false), 250);
    };

    const searchItem = (filter) => {
      if (checkedValue.value == "product") {
        loadingList.value = true;
        searchProduct(filter)
          .then((response) => {
            dataList.value = response.data.results;
          })
          .catch((error) => {
            message.error("Algo salió mal...");
          })
          .finally(() => {
            loadingList.value = false;
          });
      } else {
        let search = `?search=${filter}`;
        listSupplies(search);
      }
    };

    const options = ref([
      {
        label: "PDF",
        key: "PDF",
        icon: renderIcon("vi-file-type-pdf2"),
      },
      {
        label: "Excel",
        key: "Excel",
        icon: renderIcon("vi-file-type-excel"),
      },
    ]);

    const generateReport = async () => {
      await getExcelReport(ProductInstance.value.id, "product_movements", {
        date_range: dateSearch.value,
      })
        .then((response) => {
          if (response.status === 200) {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
              "download",
              `Reporte Kardex Producto ${format(
                new Date(Date.now()),
                "yyyy-MM-dd"
              )}.xlsx`
            );
            document.body.appendChild(link);
            link.click();
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal");
        });
    };

    return {
      options,
      dataList,
      dataKardex,
      checkedValue,
      searchItem,
      loadingData,
      total,
      textSearch,
      dateSearch,
      selectKardex,
      listProducts,
      ProductInstance,
      listSupplies,
      loadingList,
      columns: createKardexBySupplyColumns(),
      generateReport,
    };
  },
});
</script>

<style>
.listItems:hover {
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -ms-user-select: none;
}
</style>
