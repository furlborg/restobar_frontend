// src/composables/useTableLockPolling.js
/**
 * Composable para gestión de bloqueos de mesas con Polling
 * Sistema simple basado en REST API sin WebSockets
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store/modules/user'
import { 
  lockTable as apiLockTable,
  unlockTable as apiUnlockTable,
  checkTableLock as apiCheckTableLock,
  listLockedTables as apiListLockedTables
} from '@/api/modules/tableLock'

// Estado global compartido (reactivo)
const lockedTablesMap = ref(new Map()) // Map<tableId, lockInfo>
const pollingInterval = ref(null)
const isPolling = ref(false)

export function useTableLockPolling() {
  const message = useMessage()
  const userStore = useUserStore()

  // Computed
  const lockedTables = computed(() => Array.from(lockedTablesMap.value.values()))
  const myLockedTables = computed(() => {
    return lockedTables.value.filter(lock => lock.locked_by_me)
  })

  /**
   * Bloquear una mesa
   */
  const lockTable = async (tableId, durationMinutes = 15) => {
    try {
      const response = await apiLockTable(tableId, durationMinutes)
      
      if (response.success) {
        // Actualizar estado local
        lockedTablesMap.value.set(tableId, response.lock)
        
        if (response.renewed) {
          message.success('Bloqueo renovado correctamente')
        } else {
          message.success('Mesa bloqueada correctamente')
        }
        
        return response.lock
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al bloquear mesa'
      message.error(errorMsg)
      throw error
    }
  }

  /**
   * Desbloquear una mesa
   */
  const unlockTable = async (tableId) => {
    try {
      const response = await apiUnlockTable(tableId)
      
      if (response.success) {
        // Remover del estado local
        lockedTablesMap.value.delete(tableId)
        message.success('Mesa liberada correctamente')
        return true
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al liberar mesa'
      message.error(errorMsg)
      throw error
    }
  }

  /**
   * Verificar si una mesa está bloqueada
   */
  const checkTableLock = async (tableId) => {
    try {
      const response = await apiCheckTableLock(tableId)
      
      // Actualizar estado local
      if (response.is_locked) {
        lockedTablesMap.value.set(tableId, {
          ...response.lock,
          table_id: response.table_id,
          locked_by_me: response.locked_by_me
        })
      } else {
        lockedTablesMap.value.delete(tableId)
      }
      
      return response
    } catch (error) {
      console.error('[TableLockPolling] Error checking lock:', error)
      return { is_locked: false, locked_by_me: false }
    }
  }

  /**
   * Actualizar lista de mesas bloqueadas (polling)
   */
  const refreshLockedTables = async (branchId = null) => {
    try {
      const response = await apiListLockedTables(branchId)
      
      // Limpiar Map
      lockedTablesMap.value.clear()
      
      // Poblar con nuevos datos
      response.locks.forEach(lock => {
        lockedTablesMap.value.set(lock.table_id, lock)
      })
      
      return response.locks
    } catch (error) {
      console.error('[TableLockPolling] Error refreshing locks:', error)
      return []
    }
  }

  /**
   * Iniciar polling automático
   */
  const startPolling = (intervalSeconds = 10, branchId = null) => {
    if (isPolling.value) {
      console.warn('[TableLockPolling] Polling already running')
      return
    }

    console.log(`[TableLockPolling] Starting polling every ${intervalSeconds}s`)
    isPolling.value = true

    // Primera actualización inmediata
    refreshLockedTables(branchId)

    // Configurar intervalo
    pollingInterval.value = setInterval(() => {
      refreshLockedTables(branchId)
    }, intervalSeconds * 1000)
  }

  /**
   * Detener polling
   */
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
      isPolling.value = false
      console.log('[TableLockPolling] Polling stopped')
    }
  }

  /**
   * Verificar si una mesa está bloqueada (desde el estado local)
   */
  const isTableLocked = (tableId) => {
    return lockedTablesMap.value.has(tableId)
  }

  /**
   * Verificar si una mesa está bloqueada por el usuario actual
   */
  const isTableLockedByMe = (tableId) => {
    const lock = lockedTablesMap.value.get(tableId)
    return lock && lock.locked_by_me
  }

  /**
   * Verificar si una mesa está bloqueada por otro usuario
   */
  const isTableLockedByOther = (tableId) => {
    const lock = lockedTablesMap.value.get(tableId)
    return lock && !lock.locked_by_me
  }

  /**
   * Obtener información del bloqueo de una mesa
   */
  const getTableLockInfo = (tableId) => {
    return lockedTablesMap.value.get(tableId) || null
  }

  /**
   * Limpiar todos mis bloqueos al salir
   */
  const releaseAllMyLocks = async () => {
    const myLocks = myLockedTables.value
    const promises = []

    for (const lock of myLocks) {
      promises.push(
        unlockTable(lock.table_id).catch(err => {
          console.error(`Error releasing table ${lock.table_id}:`, err)
        })
      )
    }

    await Promise.all(promises)
  }

  // Cleanup al desmontar
  onUnmounted(() => {
    stopPolling()
  })

  return {
    // Estado
    lockedTables,
    myLockedTables,
    isPolling,

    // Métodos de bloqueo
    lockTable,
    unlockTable,
    checkTableLock,
    releaseAllMyLocks,

    // Polling
    startPolling,
    stopPolling,
    refreshLockedTables,

    // Consultas
    isTableLocked,
    isTableLockedByMe,
    isTableLockedByOther,
    getTableLockInfo
  }
}
