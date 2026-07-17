import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_APP_URL;

let lockSocket = null;
let lockSocketConnected = ref(false);
let reconnectTimeout = null;
let pendingMessages = [];

import { useBusinessStore } from '@/store/modules/business';
import { useUserStore } from '@/store/modules/user';
import { useTableStore } from '@/store/modules/table';
import useCookie from "vue-cookies";
const businessStore = useBusinessStore();
const userStore = useUserStore();
const tableStore = useTableStore();

const connectLockWebSocket = () => {
  const branchId = userStore.user.branchoffice || businessStore.currentBranch || 1;
  const apiUrl = import.meta.env.VITE_APP_URL.replace(/^https?:\/\//, '');
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const currentToken = useCookie.get("token") || userStore.token;
  
  // Si no hay token (sesión expirada), no intentar conectar para evitar bucle 403
  if (!currentToken) {
    lockSocketConnected.value = false;
    return;
  }

  const tokenQuery = `?token=${currentToken}`;
  const wsUrl = `${wsProtocol}://${apiUrl}/ws/tables/${branchId}/${tokenQuery}`;

    if (lockSocket && lockSocket.readyState !== WebSocket.CLOSED) {
      return;
    }

    lockSocket = new WebSocket(wsUrl);

  lockSocket.onopen = () => {
    lockSocketConnected.value = true;
    if (pendingMessages.length > 0) {
      pendingMessages.forEach(msg => {
        lockSocket.send(JSON.stringify(msg));
      });
      pendingMessages = [];
    }
  };

  lockSocket.onclose = () => {
    lockSocketConnected.value = false;
    reconnectTimeout = setTimeout(connectLockWebSocket, 3000);
  };

  lockSocket.onerror = () => {
    lockSocket.close();
  };

  lockSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'table_locked': {
          const lock = data.lock_data || data;
          const tableId = lock.table_id || lock.table;
          const userId = lock.user_id || lock.user;
          if (lock && tableId) {
            const newMap = new Map(lockedTables.value);
            newMap.set(tableId, {
              table_id: tableId,
              user_id: userId,
              username: lock.username,
              locked_at: lock.locked_at,
              expires_at: lock.expires_at,
              remaining_seconds: lock.remaining_seconds
            });
            lockedTables.value = newMap;
            tableStore.lockedTables = Object.fromEntries(newMap);
          }
          break;
        }
        case 'table_unlocked': {
          const unlock = data.unlock_data || data;
          if (unlock && unlock.table_id) {
            const newMap = new Map(lockedTables.value);
            newMap.delete(unlock.table_id);
            lockedTables.value = newMap;
            tableStore.lockedTables = Object.fromEntries(newMap);
            
            // ELIMINAR EL LOCK FANTASMA CACHEADO DE LA API REST
            // Si no lo limpiamos, la UI usará los datos viejos de la última carga de página
            const table = tableStore.getTableByID(unlock.table_id);
            if (table && table.lock_info) {
                table.lock_info.is_active = false;
            }
          }
          break;
        }
        case 'lock_renewed': {
          const renewData = data.lock_data || data;
          const tableId = renewData.table_id || renewData.table;
          if (renewData && tableId) {
            const newMap = new Map(lockedTables.value);
            // Asegurarnos de mantener table_id y user_id con los nombres correctos
            const renewEntry = {
              ...renewData,
              table_id: tableId,
              user_id: renewData.user_id || renewData.user
            };
            newMap.set(tableId, renewEntry);
            lockedTables.value = newMap;
            tableStore.lockedTables = Object.fromEntries(newMap);
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

  const disconnectLockWebSocket = () => {
    if (lockSocket) {
      lockSocket.close();
      lockSocket = null;
      lockSocketConnected.value = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    }
  };

const wsLockTable = (tableId, durationMinutes = 15) => {
  const message = {
    type: 'lock_table',
    table_id: tableId,
    duration_minutes: durationMinutes
  };
  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else if (lockSocket && lockSocket.readyState === WebSocket.CONNECTING) {
    pendingMessages.push(message);
  } else {
    pendingMessages.push(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const wsUnlockTable = (tableId) => {
  const message = {
    type: 'unlock_table',
    table_id: tableId
  };
  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else if (lockSocket && lockSocket.readyState === WebSocket.CONNECTING) {
    pendingMessages.push(message);
  } else {
    pendingMessages.push(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const wsRenewLock = (tableId, durationMinutes = 15) => {
  const message = {
    type: 'renew_lock',
    table_id: tableId,
    duration_minutes: durationMinutes
  };

  if (lockSocket && lockSocket.readyState === WebSocket.OPEN) {
    lockSocket.send(JSON.stringify(message));
  } else {
    pendingMessages.push(message);
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
    pendingMessages.push(message);
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
    pendingMessages.push(message);
    if (!lockSocket || lockSocket.readyState === WebSocket.CLOSED) {
      connectLockWebSocket();
    }
  }
};

const lockedTables = ref(new Map());
const myLocks = ref([]);
const pollingInterval = ref(null);

const unlockTableHTTP = async (tableId) => {
  try {
    await axios.post(
      `${API_BASE}/api/v1/table-locks/unlock/`,
      { table_id: tableId },
      { withCredentials: true }
    );

    const rest = { ...tableStore.lockedTables };
    delete rest[tableId];
    tableStore.lockedTables = rest;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || 'Error al liberar mesa'
    };
  }
};

export function useTableLock() {
  const router = useRouter();
  const isRefreshing = ref(false);

  const checkLock = async (tableId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/table-locks/check/${tableId}/`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return { is_locked: false, lock: null };
    }
  };

  const lockTable = async (tableId, durationMinutes = 15) => {
    try {
      const response = await axios.post(
        `${API_BASE}/api/v1/table-locks/lock/`,
        {
          table_id: tableId,
          duration_minutes: durationMinutes
        },
        { withCredentials: true }
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
        { withCredentials: true }
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
    const lock = lockedTables.value.get(tableId);
    if (!lock) return false;

    return myLocks.value.some(myLock => myLock.table.id === tableId);
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

    const isMyLock = myLocks.value.some(
      lock => lock.table.id === tableId
    );

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
