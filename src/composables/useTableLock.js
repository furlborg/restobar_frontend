/**
 * useTableLock - Composable para gestión de bloqueos de mesa
 * 
 * Funcionalidades:
 * - Polling cada 30 segundos para actualizar estado de locks
 * - Validación antes de navegar a una mesa
 * - Lock/unlock de mesas
 * - Información de locks activos
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Estado global compartido entre todas las instancias
const lockedTables = ref(new Map()); // Map<tableId, lockData>
const myLocks = ref([]);
const pollingInterval = ref(null);

export function useTableLock() {
  const router = useRouter();
  const isRefreshing = ref(false);

  /**
   * Obtiene el estado de bloqueo de una mesa específica
   */
  const checkLock = async (tableId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/table-locks/check/${tableId}/`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('[useTableLock] Error checking lock:', error);
      return { is_locked: false, lock: null };
    }
  };

  /**
   * Bloquea una mesa por X minutos
   */
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
      
      // Actualizar cache local
      if (response.data.lock) {
        lockedTables.value.set(tableId, response.data.lock);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error) {
        // Mesa bloqueada por otro usuario
        const errorData = error.response.data;
        
        // El error contiene información del lock existente
        if (errorData.error.includes('bloqueada')) {
          return {
            success: false,
            locked: true,
            message: errorData.error,
            lockData: errorData
          };
        }
      }
      
      console.error('[useTableLock] Error locking table:', error);
      return {
        success: false,
        locked: false,
        message: 'Error al bloquear mesa'
      };
    }
  };

  /**
   * Libera el bloqueo de una mesa
   */
  const unlockTable = async (tableId) => {
    try {
      await axios.post(
        `${API_BASE}/api/v1/table-locks/unlock/`,
        { table_id: tableId },
        { withCredentials: true }
      );
      
      // Remover del cache local
      lockedTables.value.delete(tableId);
      
      return { success: true };
    } catch (error) {
      console.error('[useTableLock] Error unlocking table:', error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error al liberar mesa'
      };
    }
  };

  /**
   * Obtiene todos los locks del usuario actual
   */
  const getMyLocks = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/table-locks/my_locks/`,
        { withCredentials: true }
      );
      
      // La respuesta tiene formato { count, locks }
      const locks = response.data.locks || [];
      myLocks.value = locks;
      
      // Actualizar cache de locked tables
      locks.forEach(lock => {
        if (lock.table) {
          lockedTables.value.set(lock.table.id, lock);
        }
      });
      
      return locks;
    } catch (error) {
      console.error('[useTableLock] Error getting my locks:', error);
      return [];
    }
  };

  /**
   * Refresca el estado de todas las mesas bloqueadas
   */
  const refreshLocks = async () => {
    if (isRefreshing.value) return;
    
    isRefreshing.value = true;
    
    try {
      // Obtener mis locks activos
      await getMyLocks();
      
      // Aquí podríamos obtener también todos los locks si necesitamos
      // mostrar todas las mesas bloqueadas en el listado
    } catch (error) {
      console.error('[useTableLock] Error refreshing locks:', error);
    } finally {
      isRefreshing.value = false;
    }
  };

  /**
   * Verifica si una mesa está bloqueada
   */
  const isTableLocked = (tableId) => {
    return lockedTables.value.has(tableId);
  };

  /**
   * Verifica si una mesa está bloqueada por el usuario actual
   */
  const isTableLockedByMe = (tableId) => {
    const lock = lockedTables.value.get(tableId);
    if (!lock) return false;
    
    // Aquí asumimos que el lock tiene info del usuario
    return myLocks.value.some(myLock => myLock.table.id === tableId);
  };

  /**
   * Verifica si una mesa está bloqueada por otro usuario
   */
  const isTableLockedByOther = (tableId) => {
    return isTableLocked(tableId) && !isTableLockedByMe(tableId);
  };

  /**
   * Obtiene la información del lock de una mesa
   */
  const getLockInfo = (tableId) => {
    return lockedTables.value.get(tableId) || null;
  };

  /**
   * Inicia el polling automático
   */
  const startPolling = (intervalSeconds = 30) => {
    if (pollingInterval.value) return; // Ya está corriendo
    
    // Primera carga inmediata
    refreshLocks();
    
    // Configurar polling
    pollingInterval.value = setInterval(() => {
      refreshLocks();
    }, intervalSeconds * 1000);
    
    console.log(`[useTableLock] Polling iniciado (cada ${intervalSeconds}s)`);
  };

  /**
   * Detiene el polling automático
   */
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
      console.log('[useTableLock] Polling detenido');
    }
  };

  /**
   * Valida si se puede navegar a una mesa
   * Retorna { canNavigate: boolean, reason: string, lockData: object }
   */
  const validateNavigation = async (tableId) => {
    // Primero verificar estado actual en servidor
    const lockStatus = await checkLock(tableId);
    
    if (!lockStatus.is_locked) {
      // Mesa libre, se puede navegar
      return {
        canNavigate: true,
        reason: 'Mesa disponible'
      };
    }
    
    // Mesa bloqueada, verificar si es por el usuario actual
    const lockData = lockStatus.lock_data;
    
    // Aquí necesitamos comparar con el usuario actual
    // Asumiendo que lockData tiene user_id o username
    const isMyLock = myLocks.value.some(
      lock => lock.table.id === tableId
    );
    
    if (isMyLock) {
      // Es mi propio lock, puedo navegar
      return {
        canNavigate: true,
        reason: 'Mesa bloqueada por ti'
      };
    }
    
    // Bloqueada por otro usuario
    return {
      canNavigate: false,
      reason: 'Mesa bloqueada por otro usuario',
      lockData: lockData
    };
  };

  /**
   * Intenta bloquear y navegar a una mesa
   */
  const lockAndNavigate = async (tableId, routeName, routeParams = {}) => {
    // 1. Validar si se puede navegar
    const validation = await validateNavigation(tableId);
    
    if (!validation.canNavigate) {
      // Retornar info del lock para que el componente muestre modal
      return {
        success: false,
        blocked: true,
        lockData: validation.lockData
      };
    }
    
    // 2. Si no está bloqueada, intentar bloquear
    const lockResult = await lockTable(tableId);
    
    if (!lockResult.success) {
      // Falló al bloquear (probablemente otro usuario la bloqueó justo ahora)
      return {
        success: false,
        blocked: lockResult.locked,
        message: lockResult.message,
        lockData: lockResult.lockData
      };
    }
    
    // 3. Navegar a la ruta
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
      // Si falla la navegación, liberar el lock
      await unlockTable(tableId);
      
      return {
        success: false,
        message: 'Error al navegar a la mesa'
      };
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    //startPolling();
  });

  onUnmounted(() => {
    //stopPolling();
  });

  // Computeds
  const myActiveLocksCount = computed(() => myLocks.value.length);
  const hasActiveLocks = computed(() => myLocks.value.length > 0);

  return {
    // Estado
    lockedTables: computed(() => lockedTables.value),
    myLocks: computed(() => myLocks.value),
    myActiveLocksCount,
    hasActiveLocks,
    isRefreshing: computed(() => isRefreshing.value),
    
    // Métodos
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
    
    // Polling
    startPolling,
    stopPolling
  };
}
