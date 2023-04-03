<template>
  <div id="Supplies">
    <n-card title="Kardex" :segmented="{ content: 'hard' }">
      <template #header-extra>
        <n-button
          class="me-2"
          type="info"
          tertiary
          @click="
            $route.name === 'KardexHome'
              ? $router.push({
                  name: 'KardexList',
                  params: { list: 'products' },
                })
              : $router.push({ name: 'KardexHome' })
          "
        >
          <v-icon name="md-viewcarousel-twotone" />
        </n-button>
        <n-dropdown
          trigger="click"
          :options="reportOptions"
          @select="selectReport"
        >
          <n-button type="info" tertiary>
            <!-- <v-icon name="si-simpleanalytics" /> -->
            Reportes
          </n-button>
        </n-dropdown>
      </template>
      <router-view />
    </n-card>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { useMessage } from "naive-ui";
import { useUserStore } from "@/store/modules/user";
import { getTicketReport, getExcelReport } from "@/api/modules/tills";
import format from "date-fns/format";
import jspdf from "jspdf";

export default defineComponent({
  name: "Supplies",
  setup() {
    const userStore = useUserStore();
    const message = useMessage();

    const reportOptions = [
      {
        label: "Productos",
        key: "products",
        children: [
          {
            label: "Imprimir",
            key: 1,
            children: [
              {
                key: 11,
                label: "Con stock",
              },
              {
                key: 12,
                label: "Sin stock",
              },
            ],
          },
          {
            label: "Excel",
            key: 2,
            children: [
              {
                key: 21,
                label: "Con stock",
              },
              {
                key: 22,
                label: "Sin stock",
              },
            ],
          },
        ],
      },
      {
        label: "Insumos",
        key: "supplies",
        children: [
          {
            label: "Imprimir",
            key: 3,
            children: [
              {
                key: 31,
                label: "Con stock",
              },
              {
                key: 32,
                label: "Sin stock",
              },
            ],
          },
          {
            label: "Excel",
            key: 4,
            children: [
              {
                key: 41,
                label: "Con stock",
              },
              {
                key: 42,
                label: "Sin stock",
              },
            ],
          },
        ],
      },
    ];

    const selectReport = (key) => {
      switch (key) {
        case 11:
          requestTicket("products_kardex_ticket", { has_stock: true });
          break;
        case 12:
          requestTicket("products_kardex_ticket", { has_stock: false });
          break;
        case 21:
          requestExcel("products_kardex", "Kardex Productos", {
            has_stock: true,
          });
          break;
        case 22:
          requestExcel("products_kardex", "Kardex Productos", {
            has_stock: false,
          });
          break;
        case 31:
          requestTicket("products_kardex_ticket", { has_stock: true });
          break;
        case 32:
          requestTicket("products_kardex_ticket", { has_stock: false });
          break;
        case 41:
          requestExcel("supplies_kardex", "Kardex Insumos", {
            has_stock: true,
          });
          break;
        case 42:
          requestExcel("supplies_kardex", "Kardex Insumos", {
            has_stock: false,
          });
          break;
        default:
          console.error("Algo salió mal...");
          break;
      }
    };

    const requestTicket = async (report, queryParams = null) => {
      await getTicketReport(null, report, queryParams)
        .then((response) => {
          if (response.status === 200) {
            const doc = new jspdf({
              format: [80, 297],
            });
            doc.html(response.data, {
              html2canvas: { scale: "0.25" },
              margin: [0, 2, 0, 2],
              callback: function (doc) {
                /* doc.save(); */
                doc.autoPrint();
                const hiddFrame = document.createElement("iframe");
                hiddFrame.style.position = "fixed";
                hiddFrame.style.width = "1px";
                hiddFrame.style.height = "1px";
                hiddFrame.style.opacity = "0.01";
                hiddFrame.src = doc.output("bloburl");
                document.body.appendChild(hiddFrame);
              },
            });
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal");
        });
    };

    const downloadReport = (data, filename) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
    };

    const requestExcel = async (report, filename, queryParams = null) => {
      await getExcelReport(null, report, queryParams)
        .then((response) => {
          if (response.status === 200) {
            downloadReport(
              response.data,
              `Reporte ${filename} ${format(
                new Date(Date.now()),
                "yyyy-MM-dd"
              )}.xlsx`
            );
          }
        })
        .catch((error) => {
          console.error(error);
          message.error("Algo salió mal");
        });
    };

    return {
      reportOptions,
      selectReport,
    };
  },
});
</script>

<style></style>
