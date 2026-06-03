import { toRaw } from "vue";
import cloneDeep from "clone-deep";
import { useMessage } from "naive-ui";
import { takeAwayOrder } from "@/api/modules/orders";
import { useOrderStore } from "@/store/modules/order";
import { useSaleStore } from "@/store/modules/sale";
import { useSettingsStore } from "@/store/modules/settings";

/**
 * Composable para manejar la lógica de procesamiento de pedidos
 * Separa la lógica de negocio de la UI
 */
export function useOrderProcessing() {
  const message = useMessage();
  //const dialog = useDialog();
  const orderStore = useOrderStore();
  const saleStore = useSaleStore();
  const settingsStore = useSettingsStore();
  //const userStore = useUserStore();

  /**
   * Procesa un pedido para llevar
   * @param {Object} sale - El objeto de venta
   * @param {Object} ui - Estado UI reactivo
   * @param {Function} showAndGenerateTicket - Función para mostrar ticket
   * @param {Function} cleanupOrderStore - Función para limpiar store
   */
  const processTakeAwayOrder = async (
    sale,
    ui,
    showAndGenerateTicket,
    cleanupOrderStore,
  ) => {
    ui.loading = true;
    try {
      // Preparar detalles de venta
      sale.value.sale_details = saleStore.toSale.map((detail) => ({
        ...detail,
        igv_tax:
          typeof detail.igv_tax === "number"
            ? detail.igv_tax.toFixed(2)
            : detail.igv_tax,
        price_base:
          typeof detail.price_base === "number"
            ? detail.price_base.toFixed(2)
            : detail.price_base,
      }));

      // Calcular IGV
      const igvValue = parseFloat(
        sale.value.total_igv || sale.value.igv_amount || 0,
      );
      sale.value.total_igv = igvValue.toFixed(2);

      // Clonar venta (optimizado) a partir del dato no reactivo
      const saleClone = cloneDeep(toRaw(sale.value));

      // Obtener payload completo con menús
      const salePayload = saleStore.salePayload;
      console.log(
        "Procesando orden con menús:",
        salePayload.sale_product_sets?.length || 0,
      );

      const response = await takeAwayOrder(
        orderStore.orderList,
        saleClone,
        ui.userConfirm,
        salePayload,
      );

      if (response.status === 201) {
        if (sale.value.delivery_info) {
          message.success("¡Delivery realizado!");
        } else {
          message.success("¡Pago realizado!");
        }
        cleanupOrderStore();
        if (settingsStore.businessSettings.printer.print_html) {
          await showAndGenerateTicket(response.data.sale, true);
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error("Error procesando pedido:", error);
      message.error("Ha ocurrido un error al procesar la venta");
      return { success: false, error };
    } finally {
      ui.loading = false;
    }
  };

  /**
   * Procesa la creación de un pedido (para mozos)
   * @param {Object} sale - El objeto de venta
   * @param {Object} ui - Estado UI reactivo
   * @param {Function} showAndGenerateTicket - Función para mostrar ticket
   * @param {Function} cleanupOrderStore - Función para limpiar store
   */
  const processCreateOrder = async (
    sale,
    ui,
    showAndGenerateTicket,
    cleanupOrderStore,
  ) => {
    ui.loading = true;
    try {
      // Preparar detalles
      sale.value.sale_details = saleStore.toSale.map((detail) => ({
        ...detail,
        igv_tax: detail.igv_tax.toFixed(2),
        price_base: detail.price_base.toFixed(2),
      }));

      // Aplicar descuento
      const totalDSCT = saleStore.toSale.some(
        (detail) => Number(detail.discount) > 0,
      )
        ? saleStore.toSale.reduce(
            (acc, curVal) => acc + Number(curVal.discount),
            0,
          )
        : Number(sale.value.discount);
      sale.value.discount = totalDSCT;

      const response = await takeAwayOrder(
        orderStore.orderList,
        cloneDeep(toRaw(sale.value)),
        ui.userConfirm,
      );

      if (response.status === 201) {
        message.success("Venta realizada correctamente!");
        cleanupOrderStore();
        if (settingsStore.businessSettings.printer.print_html) {
          await showAndGenerateTicket(response.data.sale, true);
        }
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error("Error creando pedido:", error);
      message.error("Algo salió mal...");
      return { success: false, error };
    } finally {
      ui.loading = false;
      ui.showConfirm = false;
      ui.userConfirm = "";
    }
  };

  return {
    processTakeAwayOrder,
    processCreateOrder,
  };
}
