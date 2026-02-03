<template>
  <n-modal
    preset="card"
    title="Reporte de ventas por productos"
    :show="showModal"
    style="width: 1200px; max-width: 90vw"
    :on-close="closeModal"
  >
    <!-- Filtros -->
    <n-space vertical>
      <n-grid cols="12" :x-gap="12">
        <n-grid-item span="4">
          <n-form-item label="Producto">
            <n-select
              v-model:value="filters.product"
              placeholder="Buscar..."
              filterable
              @search="debouncedProductSearch"
              :options="optionsProduct"
              clearable
              @update:value="onFilterChange"
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item span="4">
          <n-form-item label="Fecha desde">
            <n-date-picker
              v-model:value="filters.dateFrom"
              type="date"
              placeholder="Seleccionar fecha"
              @update:value="onFilterChange"
              clearable
            />
          </n-form-item>
        </n-grid-item>
        <n-grid-item span="4">
          <n-form-item label="Fecha hasta">
            <n-date-picker
              v-model:value="filters.dateTo"
              type="date"
              placeholder="Seleccionar fecha"
              @update:value="onFilterChange"
              clearable
            />
          </n-form-item>
        </n-grid-item>
      </n-grid>

      <!-- Tabla de resultados -->
      <div>
        <n-space justify="space-between" class="mb-3">
          <n-text>Resultados de ventas</n-text>
          <n-button
            :disabled="salesData.length === 0"
            class="ms-2"
            size="small"
            @click="exportToExcel"
            :loading="isExporting"
          >
            <template #icon>
              <v-icon name="vi-file-type-excel" />
            </template>
          </n-button>
        </n-space>
        <n-data-table
          :columns="columns"
          :data="salesData"
          :loading="isLoading"
          :pagination="false"
          :max-height="400"
          :scroll-x="1000"
        />
      </div>
    </n-space>

    <template #action>
      <n-space>
        <n-button @click="closeModal">Cerrar</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script>
import { defineComponent, ref, watch } from "vue";
import { useDebounce } from "@/composables/useDebounce";
import { useMessage } from "naive-ui";
import { searchProduct } from "@/api/modules/products";
import { getSaleDetails, getSalesReportByProduct } from "@/api/modules/sales";
import format from "date-fns/format";

export default defineComponent({
  name: "SalesReportModal",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:show"],
  setup(props, { emit }) {
    const showModal = ref(false);
    const message = useMessage();
    const isLoading = ref(false);
    const isExporting = ref(false);
    
    // Filtros
    const filters = ref({
      product: null,
      dateFrom: null,
      dateTo: null,
    });

    // Opciones para el combobox de productos
    const optionsProduct = ref([]);

    // Datos de la tabla (vacía por el momento)
    const salesData = ref([]);

    // Columnas de la tabla
    const columns = [
      {
        title: "Fecha",
        key: "fecha",
        width: 120,
      },
      {
        title: "Comprobante",
        key: "comprobante",
        width: 150,
      },
      {
        title: "Cliente",
        key: "cliente",
        width: 200,
      },
      {
        title: "Cantidad",
        key: "cantidad",
        width: 100,
        align: "right",
      },
      {
        title: "Precio de Venta",
        key: "precioVenta",
        width: 130,
        align: "right",
        render(row) {
          return `S/. ${Number(row.precioVenta || 0).toFixed(2)}`;
        },
      },
      {
        title: "Total",
        key: "total",
        width: 120,
        align: "right",
        render(row) {
          return `S/. ${Number(row.total || 0).toFixed(2)}`;
        },
      },
    ];

    // Función para buscar productos
    const productSearch = async (search) => {
      try {
        const response = await searchProduct(search, null, false, 50, 0);
        optionsProduct.value = response.data.results.map((v) => ({
          label: v.name,
          value: v.id,
        }));
      } catch (error) {
        console.error(error);
        message.error("Algo salió mal...");
      }
    };

    const { debounced: debouncedProductSearch } = useDebounce(productSearch, 300);

    // Cargar productos iniciales al montar el componente
    productSearch("");

    // Función para obtener datos de ventas
    const fetchSalesData = async () => {
      if (!filters.value.product) {
        salesData.value = [];
        return;
      }

      isLoading.value = true;
      try {
        // Formatear fechas para el API (YYYY-MM-DD)
        let dateFrom = null;
        let dateTo = null;
        
        if (filters.value.dateFrom) {
          const fromDate = new Date(filters.value.dateFrom);
          dateFrom = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        
        if (filters.value.dateTo) {
          const toDate = new Date(filters.value.dateTo);
          dateTo = toDate.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        const response = await getSaleDetails(filters.value.product, dateFrom, dateTo);
        
        // Mapear los datos del response a la estructura de la tabla
        salesData.value = response.data.results.map((item) => ({
          fecha: item.sale_date,
          comprobante: item.sale_document,
          cliente: item.customer_name,
          cantidad: item.quantity,
          precioVenta: item.price_sale,
          total: item.total,
        }));
        
      } catch (error) {
        console.error(error);
        message.error("Error al obtener los datos de ventas");
        salesData.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    // Función que se ejecuta cuando cambian los filtros
    const onFilterChange = () => {
      console.log("Filtros cambiados:", filters.value);
      // Ejecutar fetch de datos solo si hay un producto seleccionado
      fetchSalesData();
    };

    // Función para descargar el archivo
    const downloadReport = (data, filename) => {
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // Función para exportar a Excel
    const exportToExcel = async () => {
      if (!filters.value.product || salesData.value.length === 0) {
        message.warning("No hay datos para exportar");
        return;
      }

      isExporting.value = true;
      try {
        // Formatear fechas para el API (YYYY-MM-DD)
        let dateFrom = null;
        let dateTo = null;
        
        if (filters.value.dateFrom) {
          const fromDate = new Date(filters.value.dateFrom);
          dateFrom = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        
        if (filters.value.dateTo) {
          const toDate = new Date(filters.value.dateTo);
          dateTo = toDate.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        // Obtener el nombre del producto para el archivo
        const selectedProduct = optionsProduct.value.find(p => p.value === filters.value.product);
        const productName = selectedProduct ? selectedProduct.label : 'Producto';

        const response = await getSalesReportByProduct(filters.value.product, dateFrom, dateTo);
        
        if (response.status === 200) {
          downloadReport(
            response.data,
            `Reporte Ventas ${productName} ${format(
              new Date(Date.now()),
              "yyyy-MM-dd"
            )}.xlsx`
          );
          message.success("Reporte exportado correctamente");
        }
        
      } catch (error) {
        console.error(error);
        message.error("Error al exportar el reporte");
      } finally {
        isExporting.value = false;
      }
    };

    const closeModal = () => {
      emit("update:show", false);
    };

    watch(
      () => props.show,
      (newVal) => {
        showModal.value = newVal;
        if (newVal) {
          // Resetear filtros cuando se abre el modal
          filters.value = {
            product: null,
            dateFrom: null,
            dateTo: null,
          };
          salesData.value = [];
        }
      },
      { immediate: true }
    );

    watch(showModal, (newVal) => {
      if (!newVal) {
        closeModal();
      }
    });

    return {
      showModal,
      filters,
      optionsProduct,
      salesData,
      columns,
      isLoading,
      isExporting,
      closeModal,
      productSearch,
      debouncedProductSearch,
      onFilterChange,
      fetchSalesData,
      exportToExcel,
    };
  },
});
</script>
