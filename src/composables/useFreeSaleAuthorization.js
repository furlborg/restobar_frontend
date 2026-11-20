// Autorización de ventas con cortesías o consumo interno (FLZ-GRA-05 / D1).
// Abre el modal de credencial y devuelve el payload `free_authorization` para la venta.
import { computed, ref } from "vue";
import { useMessage } from "naive-ui";
import { isFreeAffectation } from "@/utils/freeOperations";

export function useFreeSaleAuthorization({ sale, details }) {
  const message = useMessage();
  const show = ref(false);
  const resolver = ref(null);

  const freeDetails = computed(() =>
    (details() || []).filter((detail) => detail.free_reason && isFreeAffectation(detail.product_affectation))
  );

  const request = () =>
    new Promise((resolve) => {
      resolver.value = resolve;
      show.value = true;
    });

  const finish = (payload) => {
    const resolve = resolver.value;
    resolver.value = null;
    show.value = false;
    resolve?.(payload);
  };

  const onAuthorized = (payload) => {
    sale.value.free_authorization = payload;
    finish(payload);
  };

  const onVisibility = (visible) => {
    if (!visible) finish(null);
  };

  /** true si se puede continuar (sin gratuitas, ya autorizada o autorización recibida). */
  const ensure = async () => {
    if (!freeDetails.value.length || sale.value.free_authorization) return true;
    const payload = await request();
    if (!payload) {
      message.warning("La operación gratuita requiere autorización para continuar.");
      return false;
    }
    sale.value.free_authorization = payload;
    return true;
  };

  return { show, freeDetails, ensure, onAuthorized, onVisibility };
}
