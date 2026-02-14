import { computed, ref } from "vue";
import { useTillStore } from "@/store/modules/till";
import { useSaleStore } from "@/store/modules/sale";
import {
  retrieveTillDetail,
  createTillDetails,
  updateTillDetails,
  createConcept,
  updateConcept,
} from "@/api/modules/tills";
import { createPaymentMethod, updatePaymentMethod } from "@/api/modules/sales";
import { useMessage } from "naive-ui";
import { movementRules } from "@/utils/constants";
import { validateGeneralPass } from "@/api/modules/business";

export function useTillDetail() {
  const message = useMessage();
  const tillStore = useTillStore();
  const saleStore = useSaleStore();

  const detailId = ref(null);
  const detailRef = ref(null);
  const isLoading = ref(false);
  const conceptForm = ref(false);

  const concept = ref({
    id: null,
    description: null,
    concept_type: null,
  });

  const paymentForm = ref(false);

  const payment = ref({
    id: null,
    description: null,
  });

  const detail = ref({
    till: tillStore.currentTillID,
    document: "",
    description: "",
    payment_method: null,
    amount: 0.0,
    concept: null,
    operation: "",
  });

  const extendedMovementRules = computed(() => ({
    ...movementRules,
    operation:
      detail.value.payment_method !== 1
        ? {
            required: true,
            message: "Número de operación es requerido",
            trigger: ["blur", "input"],
          }
        : {},
  }));

  const cleanDetail = () => {
    detail.value = {
      till: tillStore.currentTillID,
      document: "",
      description: "",
      payment_method: null,
      amount: 0.0,
      concept: null,
      operation: "",
    };
  };

  const performCreateDetail = (onSuccess) => {
    if (!detailRef.value) return;
    detailRef.value.validate(async (errors) => {
      if (!errors) {
        isLoading.value = true;
        await createTillDetails(detail.value)
          .then((response) => {
            if (response.status === 201) {
              cleanDetail();
              onSuccess();
            }
          })
          .catch((error) => {
            console.error(error.response.data);
          })
          .finally(() => {
            isLoading.value = false;
          });
      } else {
        message.error("Datos incorrectos");
      }
    });
  };

  const performUpdateDetail = async (onSuccess, showModal) => {
    if (!detailRef.value) return;

    let intentosLocales = 2; // <-- variable local en la función

    const preguntarClave = async () => {
      const clave = window.prompt("Ingrese la clave de autorización:");

      if (clave === null) {
        return;
      }

      try {
        await validateGeneralPass(clave);
        detailRef.value.validate(async (errors) => {
          if (!errors) {
            isLoading.value = true;
            await updateTillDetails(detailId.value, detail.value)
              .then((response) => {
                if (response.status === 200 || response.status === 202) {
                  cleanDetail();
                  detailId.value = null;
                  onSuccess();
                }
              })
              .catch((error) => {
                console.error(error.response?.data || error);
                message.error("Error al actualizar");
              })
              .finally(() => {
                isLoading.value = false;
              });
          } else {
            message.error("Datos incorrectos");
          }
        });
      } catch {
        intentosLocales -= 1;
        if (intentosLocales > 0) {
          await preguntarClave();
        } else {
          message.error("Demasiados intentos fallidos");
          detailId.value = null;
          cleanDetail();
          showModal();
        }
      }
    };

    await preguntarClave();
  };

  const performCreateConcept = async (movementType) => {
    concept.value.concept_type = parseInt(movementType);
    await createConcept(concept.value)
      .then((response) => {
        if (response.status === 201) {
          tillStore.refreshConcepts().then(() => {
            detail.value.concept = tillStore.getConceptID(
              concept.value.description,
            );
          });
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        conceptForm.value = false;
      });
  };

  const performUpdateConcept = async () => {
    await updateConcept(concept.value.id, concept.value)
      .then((response) => {
        if (response.status === 202) {
          tillStore.refreshConcepts();
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        conceptForm.value = false;
      });
  };

  const performCreatePayment = async () => {
    await createPaymentMethod(payment.value)
      .then((response) => {
        if (response.status === 201) {
          saleStore.refreshPaymentMethods().then(() => {
            detail.value.payment_method = saleStore.getPaymentMethodID(
              payment.value.description,
            );
          });
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        paymentForm.value = false;
      });
  };

  const performUpdatePayment = async () => {
    await updatePaymentMethod(payment.value.id, payment.value)
      .then((response) => {
        if (response.status === 202) {
          saleStore.refreshPaymentMethods();
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        paymentForm.value = false;
      });
  };

  const performFindDetailById = async (id) => {
    detailId.value = id;
    const detailResponse = await retrieveTillDetail(id);
    console.info(detailResponse.data);
    detail.value = {
      till: detailResponse.data.till,
      document: detailResponse.data.document,
      description: detailResponse.data.description,
      payment_method: detailResponse.data.payment_method,
      amount: parseFloat(detailResponse.data.amount),
      concept: detailResponse.data.concept,
      operation: detailResponse.data.operation,
    };
  };

  return {
    //state
    detailId,
    detail,
    isLoading,
    detailRef,
    concept,
    conceptForm,
    payment,
    paymentForm,
    message,
    //methods
    cleanDetail,
    performCreateDetail,
    extendedMovementRules,
    performCreateConcept,
    performUpdateConcept,
    performCreatePayment,
    performUpdatePayment,
    performUpdateDetail,
    performFindDetailById,
    //stores
    tillStore,
    saleStore,
  };
}
