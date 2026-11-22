import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import routerInstance from '@/router';
import axios from 'axios';
import { addPending, isStalePending, lockHasExpired, normalizeLock } from '@/utils/tableLock';

const API_BASE = import.meta.env.VITE_APP_URL;

let lockSocket = null;
let lockSocketConnected = ref(false);
let reconnectTimeout = null;
let pendingMessages = [];
let expiryCheckInterval = null;

// Mensajes encolados mientras el socket está caído (utils/tableLock.js: los que crean o renuevan un
// bloqueo caducan, un mensaje nuevo reemplaza al anterior igual, y un unlock cancela los pendientes de esa mesa).
const queuePending = (message) => {
  pendingMessages = addPending(pendingMessages, message);
};
// Solo se reconecta por visibilidad/cierre si alguna pantalla pidió conectar (connectLockWebSocket)
let shouldReconnect = false;
let reconnectAttempts = 0;

import { useBusinessStore } from '@/store/modules/business';
import { useUserStore } from '@/store/modules/user';
import { useTableStore } from '@/store/modules/table';
import useCookie from "vue-cookies";
const getBusinessStore = () => useBusinessStore();
const getUserStore = () => useUserStore();
const getTableStore = () => useTableStore();

const lockedTables = ref(new Map());
const myLocks = ref([]);

// El vencimiento se calcula con los segundos restantes que informa el servidor (localExpiry) y no con
// el reloj del PC cliente: un reloj adelantado descartaría bloqueos vigentes y mostraría la mesa libre
// mientras el servidor sí la bloquea. Ver utils/tableLock.js.
const purgeExpiredLocks = () => {
  let changed = false;
  const currentMap = new Map(lockedTables.value);
  for (const [id, lock] of currentMap.entries()) {
    if (lockHasExpired(lock)) {
      currentMap.delete(id);
      changed = true;
      const t = getTableStore().getTableByID(id);
      if (t && t.lock_info) {
        t.lock_info.is_active = false;
      }
    }
  }
  if (changed) {
    lockedTables.value = currentMap;
    getTableStore().lockedTables = Object.fromEntries(currentMap);
  }
};

// Quita un bloqueo del estado local: Map del composable, store y lock_info de la mesa
const removeLocalLock = (tableId) => {
  const idNum = Number(tableId);

  const newMap = new Map(lockedTables.value);
  newMap.delete(idNum);
  lockedTables.value = newMap;

  const currentLocked = { ...getTableStore().lockedTables };
  delete currentLocked[idNum];
  getTableStore().lockedTables = currentLocked;

  const table = getTableStore().getTableByID(idNum);
  if (table && table.lock_info) {
    table.lock_info.is_active = false;
  }
};

const startExpiryWatcher = () => {
  if (expiryCheckInterval) return;
  expiryCheckInterval = setInterval(purgeExpiredLocks, 10000);
};

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      purgeExpiredLocks();
      // Solo reconecta si una pantalla de mesas pidió conectar (evita abrir el socket en login, KDS, etc.)
      if (shouldReconnect && (!lockSocket || lockSocket.readyState === WebSocket.CLOSED)) {
        connectLockWebSocket();
      }
    }
  });
}

// Misma prioridad que el interceptor HTTP (src/api/index.js): store -> localStorage -> cookie.
// Si el WebSocket y el HTTP leyeran el token de fuentes distintas podrían representar usuarios distintos.
const getSessionToken = () => getUserStore().token || localStorage.getItem("token") || useCookie.get("token");

const getAuthConfig = () => {
  const token = getSessionToken();
  const config = { withCredentials: true };
  if (token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }
  return config;
};

const connectLockWebSocket = () => {
  shouldReconnect = true;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  const branchId = getUserStore().user.branchoffice || getBusinessStore().currentBranch || 1;
  const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, '');
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const currentToken = getSessionToken();
  
  // Si no hay token (sesión expirada), no intentar conectar para evitar bucle 403
  if (!currentToken) {
    lockSocketConnected.value = false;
    return;
  }

  const tokenQuery = `?token=${currentToken}`;
  const wsUrl = `${wsProtocol}://${apiUrl}/ws/tables/${branchId}/${tokenQuery}`;

  // La purga de bloqueos vencidos corre mientras haya conexión pedida (disconnectLockWebSocket la detiene)
  startExpiryWatcher();

    if (lockSocket && lockSocket.readyState !== WebSocket.CLOSED) {
      return;
    }

    lockSocket = new WebSocket(wsUrl);

  lockSocket.onopen = () => {
    lockSocketConnected.value = true;
    reconnectAttempts = 0;
    if (pendingMessages.length > 0) {
      const now = Date.now();
      pendingMessages.forEach((item) => {
        if (!isStalePending(item, now)) lockSocket.send(JSON.stringify(item.message));
      });
      pendingMessages = [];
    }
  };

  lockSocket.onclose = () => {
    lockSocketConnected.value = false;
    if (!shouldReconnect) return;
    reconnectAttempts++;
    const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
    const jitter = Math.random() * 1000;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(connectLockWebSocket, baseDelay + jitter);
  };

  lockSocket.onerror = () => {
    lockSocket.close();
  };

  lockSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'initial_locks_sync': {
          if (data.locks) {
            const newMap = new Map();
            Object.entries(data.locks).forEach(([tblId, lock]) => {
              const entry = normalizeLock({ table_id: tblId, ...lock });
              if (!lockHasExpired(entry)) {
                newMap.set(entry.table_id, entry);
              }
            });
            lockedTables.value = newMap;
            getTableStore().lockedTables = Object.fromEntries(newMap);

            // Sincronizar todas las mesas de todas las áreas para limpiar locks inactivos
            (getTableStore().areas || []).forEach(area => {
              (area.tables || []).forEach(table => {
                const activeLock = newMap.get(table.id) || newMap.get(Number(table.id));
                if (!table.lock_info) table.lock_info = {};
                if (activeLock) {
                  table.lock_info.is_active = true;
                  table.lock_info.username = activeLock.username;
                  table.lock_info.user_id = activeLock.user_id;
                } else {
                  table.lock_info.is_active = false;
                }
              });
            });
          }
          break;
        }
        case 'table_locked': {
          const lock = data.lock_data || data;
          if (lock && (lock.table_id || lock.table)) {
            const entry = normalizeLock(lock);
            const newMap = new Map(lockedTables.value);
            newMap.set(entry.table_id, entry);
            lockedTables.value = newMap;
            getTableStore().lockedTables = Object.fromEntries(newMap);

            const table = getTableStore().getTableByID(entry.table_id);
            if (table) {
              if (!table.lock_info) table.lock_info = {};
              table.lock_info.is_active = true;
              table.lock_info.username = entry.username;
              table.lock_info.user_id = entry.user_id;
            }
          }
          break;
        }
        case 'table_unlocked': {
          const unlock = data.unlock_data || data;
          const targetId = unlock?.table_id || unlock?.table;
          if (targetId) removeLocalLock(targetId);
          break;
        }
        case 'lock_renewed': {
          const renewData = data.lock_data || data;
          if (renewData && (renewData.table_id || renewData.table)) {
            const entry = normalizeLock(renewData);
            const newMap = new Map(lockedTables.value);
            newMap.set(entry.table_id, entry);
            lockedTables.value = newMap;
            getTableStore().lockedTables = Object.fromEntries(newMap);
          }
          break;
        }
        case 'lock_error': {
          break;
        }
        case 'unlock_error': {
          break;
        }
        case 'heartbeat_ack': {
          break;
        }
      }
    } catch (err) {
      console.warn("WebSocket message parse error:", err);
    }
  };
};

export const disconnectLockWebSocket = () => {
    shouldReconnect = false;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (lockSocket) {
      lockSocket.close();
      lockSocket = null;
      lockSocketConnected.value = false;
    }
    lockedTables.value = new Map();
    getTableStore().lockedTables = {};
    pendingMessages = [];
    if (expiryCheckInterval) {
      clearInterval(expiryCheckInterval);
      expiryCheckInterval = null;
    }
  };

const wsLockTable = (tableId, durationMinutes = null) => {
  const message = {
    type: 'lock_table',
    table_id: tableId,
    duration_minutes: durationMinutes
  };
  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else if (lockSocket && lockSocket.readyState === WebSocket.CONNECTING) {
    queuePending(message);
  } else {
    queuePending(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const wsUnlockTable = (tableId) => {
  if (!tableId) return;

  const idNum = Number(tableId);

  // 1. Limpieza INMEDIATA local para reactividad instantánea
  removeLocalLock(idNum);

  const message = {
    type: 'unlock_table',
    table_id: idNum
  };

  // 2. Si el socket está abierto, enviar por WebSocket
  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else if (lockSocket && lockSocket.readyState === WebSocket.CONNECTING) {
    queuePending(message);
  } else {
    // 3. Fallback HTTP SOLO si el WebSocket está cerrado/desconectado
    unlockTableHTTP(idNum).catch(() => {});
  }
};

const wsRenewLock = (tableId, durationMinutes = null) => {
  const message = {
    type: 'renew_lock',
    table_id: tableId,
    duration_minutes: durationMinutes
  };

  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else {
    queuePending(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const wsCheckLock = (tableId) => {
  const message = {
    type: 'check_lock',
    table_id: tableId
  };

  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else {
    queuePending(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const wsHeartbeat = (tableId = null) => {
  const message = { type: 'heartbeat' };
  if (tableId) message.table_id = tableId;

  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else {
    queuePending(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const pollingInterval = ref(null);

const unlockTableHTTP = async (tableId) => {
  try {
    await axios.post(
      `${API_BASE}/api/v1/table-locks/unlock/`,
      { table_id: tableId },
      getAuthConfig()
    );

    const rest = { ...getTableStore().lockedTables };
    delete rest[tableId];
    getTableStore().lockedTables = rest;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al liberar mesa'
    };
  }
};

export function useTableLock() {
  let router = null;
  try {
    router = useRouter();
  } catch (_) {
    // Contexto fuera de setup, usar routerInstance
  }
  if (!router) {
    router = routerInstance;
  }
  const isRefreshing = ref(false);

  const checkLock = async (tableId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/table-locks/check/${tableId}/`,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return { is_locked: false, lock: null };
    }
  };

  const lockTable = async (tableId, durationMinutes = null) => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/v1/table-locks/lock/`,
        {
          table_id: tableId,
          // La duración la fija el servidor (Configuración Avanzada); solo se envía si se quiere acortar
          ...(durationMinutes ? { duration_minutes: durationMinutes } : {})
        },
        getAuthConfig()
      );

      if (response.data.lock) {
        lockedTables.value.set(tableId, response.data.lock);
      }

      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorData = error.response.data;

        if (errorData.error.includes('bloqueada')) {
          return {
            success: false,
            locked: true,
            message: errorData.error,
            lockData: errorData
          };
        }
      }

      return {
        success: false,
        locked: false,
        message: 'Error al bloquear mesa'
      };
    }
  };

  const unlockTable = async (tableId) => {
    return await unlockTableHTTP(tableId);
  };

  const getMyLocks = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/table-locks/my_locks/`,
        getAuthConfig()
      );

      const locks = response.data.locks || [];
      myLocks.value = locks;

      locks.forEach(lock => {
        if (lock.table) {
          lockedTables.value.set(lock.table.id, lock);
        }
      });

      return locks;
    } catch (error) {
      return [];
    }
  };

  const refreshLocks = async () => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;

    try {
      await getMyLocks();
    } catch (error) {
      console.warn("Error refreshing locks:", error);
    } finally {
      isRefreshing.value = false;
    }
  };

  const isTableLocked = (tableId) => {
    return lockedTables.value.has(tableId);
  };

  const isTableLockedByMe = (tableId) => {
    const idNum = Number(tableId);
    const lock = lockedTables.value.get(idNum) || lockedTables.value.get(tableId);
    if (!lock) return false;

    const currentUserId = getUserStore().user?.id;
    if (currentUserId && (lock.user_id === currentUserId || lock.user === currentUserId)) {
      return true;
    }

    return myLocks.value.some(myLock => myLock.table?.id === idNum || myLock.table?.id === tableId);
  };

  const isTableLockedByOther = (tableId) => {
    return isTableLocked(tableId) && !isTableLockedByMe(tableId);
  };

  const getLockInfo = (tableId) => {
    const info = lockedTables.value.get(tableId) || null;
    return info;
  };

  const startPolling = (intervalSeconds = 30) => {
    if (pollingInterval.value) return;

    refreshLocks();

    pollingInterval.value = setInterval(() => {
      refreshLocks();
    }, intervalSeconds * 1000);
  };

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  };

  const validateNavigation = async (tableId) => {
    const lockStatus = await checkLock(tableId);

    if (!lockStatus.is_locked) {
      return {
        canNavigate: true,
        reason: 'Mesa disponible'
      };
    }

    const lockData = lockStatus.lock_data;
    const currentUserId = getUserStore().user?.id;
    const isMyLock = (currentUserId && (lockData?.user_id === currentUserId || lockData?.user === currentUserId)) ||
      myLocks.value.some(lock => lock.table?.id === Number(tableId) || lock.table?.id === tableId);

    if (isMyLock) {
      return {
        canNavigate: true,
        reason: 'Mesa bloqueada por ti'
      };
    }

    return {
      canNavigate: false,
      reason: 'Mesa bloqueada por otro usuario',
      lockData: lockData
    };
  };

  const lockAndNavigate = async (tableId, routeName, routeParams = {}) => {
    const validation = await validateNavigation(tableId);

    if (!validation.canNavigate) {
      return {
        success: false,
        blocked: true,
        lockData: validation.lockData
      };
    }

    const lockResult = await lockTable(tableId);

    if (!lockResult.success) {
      return {
        success: false,
        blocked: lockResult.locked,
        message: lockResult.message,
        lockData: lockResult.lockData
      };
    }

    try {
      await router.push({
        name: routeName,
        params: { ...routeParams, id: tableId }
      });

      return {
        success: true,
        message: 'Mesa bloqueada y navegación exitosa'
      };
    } catch (error) {
      await unlockTable(tableId);

      return {
        success: false,
        message: 'Error al navegar a la mesa'
      };
    }
  };

  const myActiveLocksCount = computed(() => myLocks.value.length);
  const hasActiveLocks = computed(() => myLocks.value.length > 0);

  return {
    lockedTables: computed(() => lockedTables.value),
    myLocks: computed(() => myLocks.value),
    myActiveLocksCount,
    hasActiveLocks,
    isRefreshing: computed(() => isRefreshing.value),
    lockSocketConnected,

    checkLock,
    lockTable,
    unlockTable,
    getMyLocks,
    refreshLocks,
    isTableLocked,
    isTableLockedByMe,
    isTableLockedByOther,
    getLockInfo,
    validateNavigation,
    lockAndNavigate,

    connectLockWebSocket,
    disconnectLockWebSocket,
    wsLockTable,
    wsUnlockTable,
    wsRenewLock,
    wsCheckLock,
    wsHeartbeat,

    startPolling,
    stopPolling
  };
}
