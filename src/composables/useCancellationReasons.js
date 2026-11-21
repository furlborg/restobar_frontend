import { ref } from "vue";
import { listCancellationReasons } from "@/api/modules/orders";

// Caché a nivel de módulo: el catálogo casi no cambia y se usa en varios modales.
const reasons = ref([]);
let pending = null;

/** Catálogo de motivos de anulación, cargado una vez por sesión. */
export function useCancellationReasons() {
  const load = async (force = false) => {
    if (!force && reasons.value.length) return reasons.value;
    if (!pending) {
      pending = listCancellationReasons()
        .then((response) => {
          reasons.value = response.data || [];
          return reasons.value;
        })
        .finally(() => {
          pending = null;
        });
    }
    return pending;
  };

  const options = () =>
    reasons.value.map((reason) => ({ label: reason.description, value: reason.code }));

  return { reasons, load, options };
}
