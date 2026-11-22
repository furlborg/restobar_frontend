// Barrera de seguridad para actualizar (HU-FLZ-ACT-006).
// Puro, para probarlo con `node --test`. La conexión con Vue y axios está en src/version/updateBarrier.js.
//
// Responde una sola pregunta: ¿se puede recargar ESTA pestaña sin perder trabajo?
// Bloquea si:
//   - hay un cobro o venta esperando respuesta del servidor          → "payment"
//   - hay otra escritura (pedido, configuración…) esperando respuesta → "saving"
//   - una escritura se quedó sin respuesta y nadie la revisó          → "uncertain"
//   - una pantalla registrada tiene trabajo sin guardar               → "unsaved"
// Un estado desconocido bloquea: nunca se asume éxito por tiempo ni por falta de actividad.
// La barrera no reintenta ni repite ninguna escritura.

export const BARRIER_REASON = Object.freeze({
  PAYMENT: "payment",
  SAVING: "saving",
  UNCERTAIN: "uncertain",
  UNSAVED: "unsaved",
});

export const WRITE_KIND = Object.freeze({
  PAYMENT: "payment",
  ORDER: "order",
  OTHER: "other",
});

export const OUTCOME = Object.freeze({
  CONFIRMED: "confirmed", // el servidor respondió 2xx
  FAILED: "failed", // el servidor respondió con error: el resultado se conoce
  UNKNOWN: "unknown", // sin respuesta: pudo haberse aplicado o no
});

const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);

// No se vigilan:
// - sesión y bloqueos de mesa (se liberan solos al salir);
// - POST que solo leen (verificado en el backend): caja actual, número de serie, validar clave o código de mozo.
const IGNORED_PATHS = [
  /^login\//,
  /^logout\//,
  /^table-locks\//,
  /^tills\/current\/?$/,
  /^sales\/serie_number\/?$/,
  /^business\/validate_pass\/?$/,
  /^users\/verify_waiter\/?$/,
];
// Cobros, ventas, créditos y caja.
const PAYMENT_PATHS = [/^sales(\/|$)/, /^credits(\/|$)/, /^customers\/[^/]+\/pay_credits/, /^till_details(\/|$)/, /^tills(\/|$)/];
// Pedidos, cambios de mesa y cocina.
const ORDER_PATHS = [/^orders(\/|$)/, /^tables\/[^/]+\/change_order/, /^product-preparation(\/|$)/];

/** Quita dominio, prefijo /api/vN/ y barras iniciales: "https://x/api/v1/sales/" → "sales/". */
export const normalizeApiPath = (url = "") =>
  String(url)
    .replace(/^[a-z]+:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .replace(/^api\/v\d+\//, "")
    .replace(/[?#].*$/, "");

/** Tipo de escritura, o null si la petición no se vigila (lecturas, sesión, bloqueos de mesa). */
export const classifyWrite = (method, url) => {
  if (!WRITE_METHODS.has(String(method || "get").toLowerCase())) return null;
  const path = normalizeApiPath(url);
  if (IGNORED_PATHS.some((re) => re.test(path))) return null;
  if (PAYMENT_PATHS.some((re) => re.test(path))) return WRITE_KIND.PAYMENT;
  if (ORDER_PATHS.some((re) => re.test(path))) return WRITE_KIND.ORDER;
  return WRITE_KIND.OTHER;
};

export const createUpdateBarrier = () => {
  let nextId = 1;
  const blockers = new Map(); // id -> () => reason | null
  const inFlight = new Map(); // token -> { kind }
  const uncertain = new Map(); // token -> { kind }
  const listeners = new Set();

  const notify = () => {
    for (const fn of listeners) {
      try {
        fn();
      } catch {
        // un oyente con error no debe afectar a la barrera
      }
    }
  };

  const countKind = (map, kind) => [...map.values()].filter((op) => op.kind === kind).length;

  return {
    /** Pantalla con trabajo propio. `getReason()` devuelve "unsaved" (u otro motivo) o null. */
    registerBlocker(getReason) {
      const id = nextId++;
      blockers.set(id, getReason);
      return () => blockers.delete(id);
    },

    /** Empieza una escritura vigilada; devuelve el token para cerrarla. */
    beginOperation(kind) {
      const token = nextId++;
      inFlight.set(token, { kind });
      notify();
      return token;
    },

    /** Cierra una escritura. Sin respuesta (UNKNOWN) queda como incierta hasta que alguien la revise. */
    endOperation(token, outcome) {
      const op = inFlight.get(token);
      if (!op) return;
      inFlight.delete(token);
      if (outcome === OUTCOME.UNKNOWN) uncertain.set(token, op);
      notify();
    },

    /** El usuario confirmó que revisó las operaciones sin respuesta por el flujo normal. */
    acknowledgeUncertain() {
      if (uncertain.size === 0) return;
      uncertain.clear();
      notify();
    },

    /** ¿Se puede recargar ahora? Se evalúa en el momento: no guarda autorizaciones viejas. */
    evaluate() {
      if (countKind(inFlight, WRITE_KIND.PAYMENT) > 0) return { ok: false, reason: BARRIER_REASON.PAYMENT };
      if (inFlight.size > 0) return { ok: false, reason: BARRIER_REASON.SAVING };
      if (uncertain.size > 0) return { ok: false, reason: BARRIER_REASON.UNCERTAIN };
      for (const getReason of blockers.values()) {
        let reason;
        try {
          reason = getReason();
        } catch {
          reason = BARRIER_REASON.UNSAVED; // si no se puede saber, no es seguro
        }
        if (reason) return { ok: false, reason };
      }
      return { ok: true };
    },

    hasPaymentInFlight: () => countKind(inFlight, WRITE_KIND.PAYMENT) > 0,
    snapshot: () => ({ inFlight: inFlight.size, uncertain: uncertain.size, blockers: blockers.size }),

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
};

/**
 * Interceptores para axios (o cualquier cliente con config/response/error parecidos).
 * Abre una operación por cada escritura vigilada y la cierra según la respuesta:
 *   2xx → CONFIRMED; error con respuesta → FAILED; sin respuesta o cancelada → UNKNOWN.
 * Nunca impide ni modifica la petición.
 */
export const createHttpWriteTracker = (barrier) => {
  const TOKEN_KEY = "__flizzyUpdateOp";
  const fullUrl = (config) => `${config?.baseURL || ""}${config?.url || ""}`;
  const close = (config, outcome) => {
    const token = config?.[TOKEN_KEY];
    if (!token) return;
    delete config[TOKEN_KEY];
    barrier.endOperation(token, outcome);
  };
  return {
    onRequest(config) {
      try {
        const kind = classifyWrite(config?.method, fullUrl(config));
        if (kind && config) config[TOKEN_KEY] = barrier.beginOperation(kind);
      } catch {
        // la vigilancia nunca debe impedir una petición
      }
      return config;
    },
    onResponse(response) {
      close(response?.config, OUTCOME.CONFIRMED);
      return response;
    },
    onError(error) {
      close(error?.config, error?.response ? OUTCOME.FAILED : OUTCOME.UNKNOWN);
    },
  };
};
