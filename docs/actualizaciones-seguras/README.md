# Actualizaciones seguras — Flizzy

Implementación del paquete de HU `FLIZZY_HU_Actualizaciones_Seguras` (HU-FLZ-ACT-001 a 012).

Objetivo: que Flizzy detecte versiones nuevas, avise, se actualice con un botón sin Ctrl+F5 y se recupere de fallos de carga **sin perder pedidos ni cobros**. Es un mecanismo a futuro: no pretende arreglar un incidente puntual.

## Documentos

- [HU-FLZ-ACT-001 — Diagnóstico y condiciones](HU-FLZ-ACT-001-diagnostico.md)
- [HU-FLZ-ACT-012 — Validación, publicación y salida](HU-FLZ-ACT-012-validacion-y-salida.md)

## Estado por HU

| HU | Qué hace | Dónde | Estado |
|---|---|---|---|
| 001 | Diagnóstico, matriz de flujos y decisiones | este documento | Hecho |
| 002 | `dist/app-version.json` + `<meta name="flizzy-release">` en cada build | web: `vite-plugins/version-manifest.mjs`, `src/utils/appVersion.js` | Hecho |
| 003 | No borrar archivos de la versión anterior al publicar; caché por tipo de archivo | **servidor (Dany)** | **Pendiente del servidor** |
| 004 | Detector: consulta el manifiesto cada 60 s con la pestaña visible | web: `src/utils/versionDetector.js` | Hecho |
| 005 | Aviso «Actualizar ahora / Más tarde» e ícono en cabecera | web: `src/components/Update/` | Hecho |
| 006 | Barrera: no actualizar con pedido sin enviar, cobro abierto o escritura sin respuesta | web: `src/utils/updateBarrier.js` | Hecho |
| 007 | Aplicar, recargar en la misma ruta y confirmar la versión que arrancó | web: `src/version/applyUpdate.js` | Hecho |
| 008 | Pantalla que no carga: recuperación limitada, sin bucles; aviso de respaldo en `index.html` | web: `src/version/loadRecovery.js`, `index.html` | Hecho |
| 009 | Service worker / offline | — | **No aplica** (la web no tiene PWA) |
| 010 | Contrato web/API: el backend puede retirar webs incompatibles | backend: `core/client_contract.py`; web: `src/version/clientContract.js` | Hecho (apagado por defecto) |
| 011 | Eventos de actualización al log del servidor | backend: `core/client_events.py`; web: `src/version/updateTelemetry.js` | Hecho |
| 012 | Matriz de pruebas, runbook, piloto | este documento | Plan listo; **falta ejecutar en demo** |

## Ramas

- Web: `actualizaciones_seguras` (desde `demo`).
- Backend: `actualizaciones_seguras` (desde `demo`).

Ambas locales hasta abrir los merge requests. Se pueden publicar en cualquier orden (ver HU-012, «Orden de publicación»).

## Configuración

| Variable | Dónde | Por defecto | Para qué |
|---|---|---|---|
| `FLIZZY_MIN_CLIENT_CONTRACT` | `.env` del backend | `0` (apagado) | Contrato mínimo que puede escribir. Subirlo solo para retirar webs incompatibles |
| `CLIENT_CONTRACT_VERSION` / `MIN_SUPPORTED_CLIENT_CONTRACT` | `src/version/contract.js` | `1` / `1` | Contrato de esta web. Se suben a mano cuando cambie la API de forma incompatible |

## Pruebas automáticas

- Web: `npm run test:logic` → 212 pruebas.
- Backend: `python manage.py test core.tests_client_contract core.tests_client_events` → 34 pruebas. Suite completa del backend: 444 OK.
