// Contrato entre esta web y la API (HU-FLZ-ACT-010). Puro, para `node --test`.
//
// El backend anuncia el mínimo vigente en cada respuesta (`X-Flizzy-Min-Client-Contract`).
// La web solo envía su contrato (`X-Flizzy-Client-Contract`) después de ver ese anuncio:
// un backend anterior a esta HU no permite el header en CORS y enviarlo rompería las llamadas.
// Si una respuesta llega sin el anuncio (p. ej., el backend volvió a una versión anterior),
// la web deja de enviarlo enseguida.

export const CLIENT_CONTRACT_HEADER = "X-Flizzy-Client-Contract";
export const MIN_CONTRACT_HEADER = "x-flizzy-min-client-contract";
export const UNSUPPORTED_CODE = "CLIENT_VERSION_UNSUPPORTED";

/** Entero ≥ 0 del header, o null si no vino o no es válido. */
export const parseMinContract = (raw) => {
  if (raw === undefined || raw === null) return null;
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
};

/** Lee un header de un objeto de axios (AxiosHeaders o plano), sin distinguir mayúsculas. */
const readHeader = (headers, name) => {
  if (!headers) return undefined;
  if (typeof headers.get === "function") {
    const value = headers.get(name);
    if (value !== undefined && value !== null) return value;
  }
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  return key ? headers[key] : undefined;
};

/** ¿La respuesta es el rechazo estructurado por versión incompatible? (no confundir con sesión vencida) */
export const isUnsupportedResponse = (response) =>
  response?.status === 409 && response?.data?.code === UNSUPPORTED_CODE;

/**
 * Esta web es incompatible si el backend exige un contrato mayor, o si la versión publicada
 * de la web declara que ya no soporta este contrato.
 */
export const isIncompatible = ({ clientContract, backendMin, manifestMin }) =>
  (Number.isInteger(backendMin) && backendMin > clientContract) ||
  (Number.isInteger(manifestMin) && manifestMin > clientContract);

export const createContractState = (clientContract) => {
  let backendSupports = false;
  let backendMin = null;
  let rejected = false;
  const listeners = new Set();

  const notify = () => {
    for (const fn of listeners) {
      try {
        fn();
      } catch {
        // un oyente con error no debe afectar al contrato
      }
    }
  };

  return {
    /** Toda respuesta de la API (correcta o con error) actualiza lo que se sabe del backend. */
    noteResponse(response) {
      if (!response) return; // sin respuesta (red): no se sabe nada nuevo
      const min = parseMinContract(readHeader(response.headers, MIN_CONTRACT_HEADER));
      const before = `${backendSupports}|${backendMin}|${rejected}`;
      if (min === null) {
        backendSupports = false;
        backendMin = null;
      } else {
        backendSupports = true;
        backendMin = min;
      }
      if (isUnsupportedResponse(response)) rejected = true;
      // Si el mínimo vuelve a ser compatible, se olvida el rechazo anterior.
      if (backendSupports && backendMin <= clientContract) rejected = false;
      if (before !== `${backendSupports}|${backendMin}|${rejected}`) notify();
    },

    /** Header a enviar en la próxima petición (vacío mientras el backend no lo anuncie). */
    requestHeaders() {
      return backendSupports ? { [CLIENT_CONTRACT_HEADER]: String(clientContract) } : {};
    },

    snapshot: () => ({ backendSupports, backendMin, rejected }),

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};
