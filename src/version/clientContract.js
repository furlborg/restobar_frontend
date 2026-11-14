// Conexión del contrato web/API con axios y con el aviso (HU-FLZ-ACT-010).
// La lógica está en src/utils/clientContract.js.
//
// - Envía `X-Flizzy-Client-Contract` solo cuando el backend ya lo anunció (seguro con CORS).
// - Lee el mínimo vigente de cada respuesta.
// - Un 409 CLIENT_VERSION_UNSUPPORTED no se muestra como error genérico: activa el aviso
//   obligatorio "Debes actualizar Flizzy para continuar". El servidor no escribió nada.

import { shallowRef } from "vue";
import { createContractState, isUnsupportedResponse } from "@/utils/clientContract";
import { CLIENT_CONTRACT_VERSION } from "@/version/contract";

const contract = createContractState(CLIENT_CONTRACT_VERSION);

/** { backendSupports, backendMin, rejected } reactivo, para el aviso. */
export const contractState = shallowRef(contract.snapshot());
contract.subscribe(() => {
  contractState.value = contract.snapshot();
});

/** Interceptor de petición: agrega el contrato si el backend lo admite. */
export const addContractHeader = (config) => {
  try {
    const headers = contract.requestHeaders();
    for (const [name, value] of Object.entries(headers)) {
      if (config.headers?.set) config.headers.set(name, value);
      else config.headers = { ...(config.headers || {}), [name]: value };
    }
  } catch {
    // nunca impedir una petición por esto
  }
  return config;
};

/** Interceptor de respuesta (correcta o con error). Devuelve true si fue un rechazo por versión. */
export const noteContractResponse = (response) => {
  try {
    contract.noteResponse(response);
  } catch {
    return false;
  }
  return isUnsupportedResponse(response);
};
