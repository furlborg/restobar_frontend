# HU-FLZ-ACT-001 — Diagnóstico y condiciones de actualización

Fecha: 2026-11-14. Todo lo marcado como **verificado** se comprobó en el código, en los commits o en pruebas ejecutadas. Lo demás figura como **pendiente** o **informado por** quien lo dijo.

## 1. La incidencia original

**Verificado en commits.** La pantalla blanca del video fue un problema de responsividad en tablets, no de caché ni de publicación:

| Commit | Fecha | Qué corrigió |
|---|---|---|
| `e566ce2` | 2026-11-08 | Mesa en blanco en tablets (769–1023 px): las pestañas se mostraban hasta 1023 px, pero sus estilos de alto solo valían hasta 768 px |
| `c9272a5` | 2026-11-09 | Delivery / para llevar en blanco en tablets (769–991 px), misma causa |

Se resolvió con una actualización nueva, no volviendo atrás. **Esta iniciativa no arregla ese caso** (ya está arreglado). Lo que cubre es el problema general de publicar sin romper a quien tiene Flizzy abierto.

**Informado por el encargado del servidor (Dany).** Al publicar se borra la carpeta `dist/` y la web queda en blanco hasta que termina el build. Un usuario con Flizzy abierto que entra a una pantalla que no había cargado recibe *Not Found*. Esto pasa en cada publicación y es lo que cubren las HU 3 y 8.

## 2. Inventario técnico

| Tema | Estado | Detalle |
|---|---|---|
| Web | Verificado | Vue 3, Vite 6, vue-router 4, Pinia, naive-ui, axios. 54 rutas con carga diferida |
| Backend | Verificado | Django 5.1.1, DRF, simplejwt, Channels (Redis). API bajo `/api/v1/` |
| Dominios | Verificado | La API está en otro dominio que la web (ej. `demoapi.flizzy.pe` y `demo.flizzy.pe`): toda llamada es *cross-origin* (CORS) |
| CORS | Verificado | `core/settings/local.py`: `CORS_ALLOW_ALL_ORIGINS=True`. Antes de esta iniciativa, la lista de headers permitidos era la de fábrica: un header nuevo rompía las llamadas |
| Settings en producción | Verificado | `manage.py` y `asgi.py` usan `core.settings.local` por defecto |
| Publicación | Verificado (parcial) | GitLab CI: push a `demo` ejecuta `/home/tsi/ci/update_demo_flizzy_front` y `_back` en el runner `flizzy`. **El contenido de esos scripts no se pudo ver** |
| Instalaciones | Informado por el usuario | Cada empresa tiene su propia instalación de web y backend con su base de datos. Se actualiza eligiendo la rama en un panel |
| Servidor web | Informado por Dany | nginx |
| Monitoreo | Verificado | No hay herramienta de monitoreo en la web ni en el backend |
| PWA / service worker | Verificado: **ausente** | Sin plugin PWA, sin `serviceWorker`, sin manifest ni `sw.js` en `public/` ni `dist/` |
| Operación offline | Verificado: **ausente** | No hay colas offline en la web |
| Kiosko Flutter, kuzeta | Fuera de alcance | Apps instaladas, se actualizan de otra forma. No envían contrato y no se ven afectados |

**HU-009 (service worker / offline): No aplica.** La HU pide no agregar un service worker solo para avisar versiones, y la web no lo tiene.

## 3. Matriz de flujos: qué se protege al actualizar

«Bloquea» significa que «Actualizar ahora» no recarga y explica el motivo. «Sensible» significa que el aviso no aparece solo encima de esa pantalla (queda el ícono de la cabecera).

| Flujo | Dato en riesgo | Cómo se sabe si hay algo sin guardar | Al actualizar | Probado |
|---|---|---|---|---|
| Mesa (`TableOrderLayout`) | Productos agregados sin enviar | `hasUnsavedChanges` (el mismo de «Cambios sin guardar») | Bloquea | Sí, sesión real |
| Para llevar / delivery (`TakeOrderLayout`) | Pedido sin procesar y datos del cobro | `hasUnsavedChanges` | Bloquea + sensible | Sí, sesión real |
| Modo mozo (`WaiterOrder`) | Productos sin enviar | `orderStore.orders` con productos (mismo criterio que su guardia) | Bloquea | Pruebas automáticas; **falta sesión real** |
| Cobro de mesa (`TablePayment`) | Montos y métodos de pago en pantalla | Mientras la pantalla está abierta | Bloquea + sensible | Pruebas automáticas; **falta sesión real** |
| Venta libre (`FreeSale`) | Productos cargados | `saleStore.sale_details` con productos | Bloquea + sensible | Pruebas automáticas; **falta sesión real** |
| Cualquier escritura esperando respuesta | Venta, pedido, configuración | Interceptores de axios | Bloquea («Espera a que termine…») | Sí, axios real con respuestas simuladas |
| Escritura sin respuesta (red caída) | Pudo registrarse o no | Interceptores de axios: queda «incierta» | Bloquea hasta que el usuario confirma «Ya lo revisé» | Sí, axios real |
| Consultar si una venta quedó registrada | — | `GET /api/v1/sales/?serie=&number=&status=` (`SaleFilter`) | Siempre permitido, incluso con versión incompatible | Verificado en código |
| Impresión (kuzeta) | Tickets | WebSocket aparte | Actualizar no reenvía impresiones | Fuera de alcance |

No se implementaron borradores persistentes: **se decidió bloquear en lugar de guardar y restaurar**. Por eso los criterios de borradores de la HU 6 (CA03, CA05) son **No aplica**.

## 4. Decisiones tomadas

El jefe indicó que las HU dicen *cómo* construirlo y que los huecos los decide el equipo. Estas son las decisiones:

| # | Tema | Decisión |
|---|---|---|
| 1 | Pedido sin enviar | Bloquear, sin borradores |
| 2 | Cobro dudoso | Bloquear mientras haya respuesta pendiente; sin respuesta, el usuario confirma que revisó. «Cobro» = registrar la venta en Flizzy; SUNAT queda fuera |
| 3 | Canal | Uno por dominio. Sin canary |
| 4 | Retención de archivos | La define el servidor (HU 3) |
| 5 | Versión obligatoria | `FLIZZY_MIN_CLIENT_CONTRACT` en el backend, subido a mano |
| 6 | Base de datos | Solo hacia adelante, con cambios compatibles |
| 7 | Kiosko e impresión | Fuera de alcance; HU 9 No aplica |
| 8 | Monitoreo | Log del servidor (`flizzy.client_events`), sin herramienta nueva |
| 9 | Roles | El equipo hace front, back y pruebas; las pruebas con sesión se hacen en `demo` |
| 10 | Primera instalación | Se acepta una recarga manual al pasar a la versión con el mecanismo |
| 11 | Alcance HU 1 | Este documento |

## 5. Parámetros usados

| Parámetro | Valor | Dónde se cambia |
|---|---|---|
| Primera consulta | 5 s | `src/utils/versionDetector.js` |
| Intervalo con pestaña visible | 60 s ±10 % (≈250 bytes, archivo estático) | ídem |
| Separación mínima en foco/red | 30 s | ídem |
| Corte de cada consulta | 5 s | ídem |
| Esperas tras fallas seguidas | 60 / 120 / 300 s | ídem |
| Recordatorio tras «Más tarde» | 30 min, nunca encima de un cobro | `src/utils/updateNotice.js` |
| Intentos de actualización por versión | 3 | `src/utils/updateAttempt.js` |
| Recuperación automática por fallo de carga | 1 por versión | `src/utils/loadRecovery.js` |
| Espera de arranque | 20 s | `src/version/applyUpdate.js` |
| Recarga automática del aviso de respaldo | 1 cada 5 min | `index.html` |
| Aviso de respaldo «tardando» | 30 s | `index.html` |

**Pendiente:** los tiempos de arranque (20 s y 30 s) son estimados. Hay que medirlos en las terminales reales (tablets de mozo, PC de caja) durante el piloto y ajustarlos.

## 6. Cómo se distingue cada tipo de error

| Caso | Cómo se reconoce | Qué ve el usuario |
|---|---|---|
| Archivo de una pantalla que no carga | Mensaje de carga de módulo (`Failed to fetch dynamically imported module`, etc.) | Recuperación limitada o «No se pudo abrir la pantalla» |
| Error funcional de JavaScript | Cualquier otro error | Nada nuevo: no se confunde con una actualización |
| Sin red | El manifiesto no responde (`offline`, `network`, `timeout`) | «Necesitas conexión…» / «Revisa la conexión…» |
| Sesión vencida | 401 de la API | Flujo de siempre (login); no se confunde con versión |
| Versión incompatible | 409 con `code=CLIENT_VERSION_UNSUPPORTED` o mínimo anunciado mayor | «Debes actualizar Flizzy para continuar» |
| Archivo principal no carga | Error del `<script>` principal antes del arranque | Aviso de respaldo de `index.html` con código |
| Servidor entero caído | No llega ni el HTML | **La web no puede hacer nada**: requiere monitoreo externo |

## 7. Brechas y dependencias

| Brecha | Responsable | Criterio de resolución |
|---|---|---|
| Al publicar se borran los archivos de la versión anterior (HU 3) | Dany (servidor) | Tras publicar, un `.js` de la versión anterior sigue respondiendo 200 |
| Caché del manifiesto e `index.html` | Dany | `curl -I .../app-version.json` → `Cache-Control: no-store`; `index.html` → `no-cache` |
| Scripts de publicación no visibles | Dany | Confirmar que `dist/app-version.json` se publica junto con la web |
| Monitoreo externo (servidor caído) | Dany / infraestructura | Un chequeo externo del HTML y del manifiesto |
| Pruebas con sesión de mozo, cobro de mesa y venta libre | Equipo | Ejecutar la matriz de la HU 12 en `demo` |
