import axios from "axios";
import { useUserStore } from "@/store/modules/user";
import { sleep } from "@/utils";
import { createDiscreteApi } from "naive-ui";

const { message } = createDiscreteApi(["message"]);

// Instancia para la v1 de la api.
export const http = axios.create({
  baseURL: `${import.meta.env.VITE_APP_URL}/api/v1/`,
});

// Instancia para la v2 de la api.
export const httpV2 = axios.create({
  baseURL: `${import.meta.env.VITE_APP_URL}/api/v2/`,
});

// Función para configurar interceptores en una instancia.
export function setupInterceptors(instance) {
  // Interceptor de solicitud.
  instance.interceptors.request.use((request) => {
    const userStore = useUserStore();
    if (userStore.token) {
      request.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return request;
  });

  // Interceptor de respuesta.
  instance.interceptors.response.use(
    async (response) => {
      // eslint-disable-next-line no-undef
      if (import.meta.env.NODE_ENV === "development") {
        await sleep();
      }
      return response;
    },
    async function (error) {
      const userStore = useUserStore();
      const originalRequest = error.config;

      // Si no hay respuesta (Servidor caído o error de red)
      if (!error.response) {
        showToast("error", "No se pudo conectar con el servidor. Revise su conexión.");
        return Promise.reject(error);
      }

      if (
        error.response.status === 401 &&
        error.response.data?.code === "token_not_valid"
      ) {
        console.log(error.response);
        userStore.logout();

        return http(originalRequest);
      } else if (error.response.status === 500) {
        // Interceptor específico para Errores 500
        showToast(
          "error",
          "Error 500: Error interno del servidor. Por favor, contacte a soporte técnico."
        );
        return Promise.reject(error);
      } else {
        if (error.response.status !== 404 && error.response.status !== 423) {
          if (
            error.response?.data &&
            !error.response.headers["content-type"]?.includes("text/html")
          ) {
            await handleServerError(error.response?.data);
          }
        }

        return Promise.reject(error);
      }
    },
  );
}

// Configurar interceptores para ambas instancias.
setupInterceptors(http);
setupInterceptors(httpV2);

// Funciones auxiliares
/**
 * Handles various server-side error response formats
 * Supports: string, array of messages, nested error objects, etc.
 *
 * @param errorData - Error payload returned by the server
 */
async function handleServerError(errorData) {
  console.log(errorData);
  if (!errorData) {
    showToast("error", "Ocurrió un error inesperado.");
    return;
  }

  if (typeof errorData === "string") {
    showToast("error", errorData);
    return;
  }

  if (Array.isArray(errorData)) {
    errorData.forEach((err) => showToast("error", String(err)));
    return;
  }

  if (typeof errorData === "object") {
    const data = errorData;

    const extractMessages = (obj, keyPath = "") => {
      if (typeof obj === "string") {
        const prefix = keyPath ? `${keyPath}: ` : "";
        showToast("error", `${prefix}${obj}`);
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => extractMessages(item, keyPath));
      } else if (typeof obj === "object" && obj !== null) {
        Object.entries(obj).forEach(([key, val]) => {
          const nextKeyPath = keyPath ? `${keyPath}.${key}` : key;
          extractMessages(val, nextKeyPath);
        });
      }
    };

    if (data.errors) {
      extractMessages(data.errors);
    } else if (data.detail && Array.isArray(data.detail)) {
      data.detail.forEach((msg) => {
        showToast(
          "error",
          typeof msg === "string" ? msg : String(msg?.["msg"] || msg),
        );
      });
    } else {
      extractMessages(data);
    }
    return;
  }

  showToast("error", "Error desconocido.");
}

/**
 * Displays a toast notification using PrimeVue's toast event bus
 *
 * @param severity - Notification type: success, info, warn, error
 * @param detail - Main message to display
 */
function showToast(severity = "info", detail = "") {
  message.create(detail, { type: severity });
}
