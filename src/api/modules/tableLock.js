// src/api/modules/tableLock.js
/**
 * API para gestión de bloqueos de mesas
 * Sistema basado en REST API + Polling (sin WebSockets)
 */

import httpClient from '../index'

/**
 * Bloquear una mesa
 * @param {number} tableId - ID de la mesa
 * @param {number} durationMinutes - Duración del bloqueo en minutos (default: 15)
 * @returns {Promise}
 */
export const lockTable = (tableId, durationMinutes = 15) => {
  return httpClient.post('/v1/table-locks/lock/', {
    table_id: tableId,
    duration_minutes: durationMinutes
  })
}

/**
 * Desbloquear una mesa
 * @param {number} tableId - ID de la mesa
 * @returns {Promise}
 */
export const unlockTable = (tableId) => {
  return httpClient.post('/v1/table-locks/unlock/', {
    table_id: tableId
  })
}

/**
 * Verificar estado de bloqueo de una mesa
 * @param {number} tableId - ID de la mesa
 * @returns {Promise}
 */
export const checkTableLock = (tableId) => {
  return httpClient.get(`/v1/table-locks/check/${tableId}/`)
}

/**
 * Listar todas las mesas bloqueadas
 * @param {number} branchId - ID de la sucursal (opcional)
 * @returns {Promise}
 */
export const listLockedTables = (branchId = null) => {
  const params = branchId ? { branch_id: branchId } : {}
  return httpClient.get('/v1/table-locks/list/', { params })
}

/**
 * Forzar desbloqueo de una mesa (solo admin)
 * @param {number} tableId - ID de la mesa
 * @returns {Promise}
 */
export const forceUnlockTable = (tableId) => {
  return httpClient.post('/v1/table-locks/force-unlock/', {
    table_id: tableId
  })
}
