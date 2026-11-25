// Contrato entre esta web y la API de Flizzy (HU-FLZ-ACT-002 y HU-FLZ-ACT-010).
// No es la versión comercial: son enteros que se suben a mano.
//
// CLIENT_CONTRACT_VERSION
//   Súbelo en 1 cuando esta web empiece a depender de un cambio de la API
//   que las versiones anteriores de la web no conocen.
//
// MIN_SUPPORTED_CLIENT_CONTRACT
//   El contrato más antiguo que sigue funcionando con la API publicada.
//   Súbelo solo cuando la API deje de aceptar a las webs anteriores:
//   las webs con un contrato menor tendrán que actualizarse (HU-FLZ-ACT-010).
//   Nunca puede ser mayor que CLIENT_CONTRACT_VERSION; el build falla si lo es.

// 2: anulaciones con motivo obligatorio (mermas). La API ya no acepta el formato
//    anterior (clave general sin motivo); en el servidor: FLIZZY_MIN_CLIENT_CONTRACT=2.
export const CLIENT_CONTRACT_VERSION = 2;
export const MIN_SUPPORTED_CLIENT_CONTRACT = 2;
