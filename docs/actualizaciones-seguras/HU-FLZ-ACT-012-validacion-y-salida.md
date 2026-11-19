# HU-FLZ-ACT-012 — Validación, publicación y salida

Fecha: 2026-11-14. Este documento planifica la salida. **No autoriza publicar en producción**: se ejecuta con el proceso de release del equipo.

## 1. Matriz de pruebas

Estados posibles:
- **Local**: probado en esta Mac con builds reales.
- **Auto**: cubierto por pruebas automáticas.
- **Por diseño**: garantizado por cómo está hecho el código, sin una prueba que lo ejecute.
- **Demo**: falta ejecutarlo en `demo` con sesión real.
- **No aplica**: el caso no existe en Flizzy.

### Entrada

| Escenario | Esperado | Estado |
|---|---|---|
| Navegador nuevo | Carga la versión publicada | Local |
| Caché caliente / ruta profunda (`/table/15/...`) | Carga y mantiene la ruta | Local |
| Archivo principal con 404 | Aviso de respaldo con código, 1 recarga automática, después manual, sin bucle | Local |
| Archivo principal arreglado + «Reintentar» | Arranca y el aviso desaparece | Local |

### Sesión

| Escenario | Esperado | Estado |
|---|---|---|
| Pestaña abierta mientras se publica | Aparece «Hay una actualización disponible» (≤ 60 s o al volver a la pestaña) | Local |
| Pestaña oculta | No consulta; al volver, consulta | Auto |
| Varias pestañas | Cada una decide sola; actualizar una no recarga las otras | Por diseño (solo se recarga la pestaña propia); **Demo** |
| Sesión vencida al arrancar la versión nueva | Pide login como siempre | **Demo** |
| Pestaña abierta por horas | Sin consultas duplicadas ni consumo creciente | **Demo** |

### Operación

| Escenario | Esperado | Estado |
|---|---|---|
| Mesa con producto sin enviar → Actualizar | Bloquea, el producto sigue | Local (sesión real) |
| Mesa sin productos → Actualizar | Recarga en la misma ruta, «Flizzy se actualizó» | Local (sesión real) |
| Para llevar con producto sin procesar | Aviso no aparece encima; desde el ícono, bloquea | Local (sesión real) |
| Modo mozo con producto sin enviar | Bloquea | **Demo** (requiere usuario MOZO) |
| Cobro de mesa abierto | Bloquea; aviso no aparece encima | **Demo** (requiere pedido enviado) |
| Venta libre con productos | Bloquea | **Demo** |
| Escritura esperando respuesta | Bloquea («Espera a que termine…») | Auto (axios real) |
| Cobro sin respuesta (red caída a la mitad) | Queda incierto; bloquea hasta «Ya lo revisé»; no se reenvía | Auto (axios real); **Demo** con red cortada |
| Cobro confirmado y luego actualizar | Recarga sin reenviar nada | **Demo** |
| Impresión | Actualizar no reenvía tickets | No aplica (kuzeta fuera de alcance) |

### Red

| Escenario | Esperado | Estado |
|---|---|---|
| Sin conexión | No inventa versión nueva; «Necesitas conexión…» | Auto |
| Backend caído con la web disponible | La web sigue operando; los eventos se descartan | Local |
| Pantalla que no carga por red | «No se pudo abrir la pantalla», sin recargar | Local |

### Publicación

| Escenario | Esperado | Estado |
|---|---|---|
| A → B | Una recarga, URL conservada, versión confirmada | Local |
| El servidor sigue entregando A | «El servidor todavía entrega la versión anterior», sin bucle; corta al 3.er intento | Local |
| B → C durante el intento | Solo confirma si el manifiesto dice que C es la publicada | Auto |
| Rollback (volver a publicar un commit anterior) | Se reconoce como cambio; el aviso de la versión retirada desaparece | Auto |
| Pantalla que no carga y hay versión nueva | 1 recuperación automática hacia la pantalla pedida | Local |
| Archivos de la versión anterior retirados al publicar | Hoy: *Not Found* posible en el momento de publicar | **Depende de HU 3 (servidor)** |
| Contrato mínimo en 2 | «Debes actualizar Flizzy para continuar»; lecturas siguen | Local (sesión real) |

### Persistencia

| Escenario | Estado |
|---|---|
| Borradores, colas offline, migración local | No aplica (no existen; se bloquea en lugar de guardar) |
| Almacenamiento del navegador bloqueado | Por diseño (lecturas y escrituras con try/catch): la posposición dura hasta recargar; actualizar funciona sin anunciar resultado. Sin prueba automática |

## 2. Orden de publicación

La web y el backend **se pueden publicar en cualquier orden**:
- **Backend nuevo con web vieja:** el backend agrega un header y acepta webs sin contrato. No cambia nada.
- **Web nueva con backend viejo:** la web no envía su contrato hasta que el backend lo anuncie. Los eventos fallan en silencio y se descartan. No cambia nada para el usuario.

Pasos:
1. Merge del backend a `demo` (despliega por CI). Dejar `FLIZZY_MIN_CLIENT_CONTRACT` sin definir (0).
2. Merge de la web a `demo`.
3. Verificar (sección 3).
4. Recién después, publicar en las empresas, una por una, con el procedimiento habitual del panel.

**No subir `FLIZZY_MIN_CLIENT_CONTRACT`** hasta que todas las instalaciones tengan la web con este mecanismo. Si se sube antes, las webs viejas no lo entienden y solo verían el error genérico al guardar.

## 3. Verificación después de publicar

```bash
# 1. Manifiesto publicado y sin caché (la caché la configura el servidor, HU 3)
curl -sI https://DOMINIO/app-version.json      # 200; ideal: Cache-Control: no-store
curl -s  https://DOMINIO/app-version.json      # release_id y deployment_id nuevos

# 2. La página trae la marca de versión
curl -s https://DOMINIO/ | grep flizzy-release

# 3. El backend anuncia el contrato (0 = apagado)
curl -sI https://DOMINIOAPI/api/v1/sales/ | grep -i x-flizzy-min-client-contract

# 4. Recurso inexistente: debería ser 404, no la página de inicio (HU 3)
curl -sI https://DOMINIO/assets/no-existe.js
```

En el navegador, en la consola: `window.__FLIZZY_VERSION__` muestra la versión cargada.

## 4. Primera instalación (clientes sin el mecanismo)

La web que hoy tienen abierta los clientes **no tiene detector**: no se va a enterar sola de la primera versión con el mecanismo.

- Esa primera vez hace falta **una recarga manual** (F5 o cerrar y abrir) por cada dispositivo. Se acordó como aceptable.
- Hacerlo **fuera de horario de atención** o pedirlo al cliente al empezar el turno. Confirmar antes que no haya pedidos sin enviar en las tablets.
- Desde esa recarga, las siguientes actualizaciones ya se avisan solas.
- Para verificar que un dispositivo ya tiene el mecanismo: en la consola, `window.__FLIZZY_VERSION__` existe. En el log, llegan eventos con su `release`.

## 5. Piloto

No hay canary ni enrutamiento por grupos: todos los dispositivos de un dominio ven la misma versión. Por eso el piloto es por **entorno y por empresa**, no por porcentaje de usuarios.

1. **`demo`**, con la matriz de la sección 1 completa, incluidas las filas marcadas **Demo**.
2. **Una empresa piloto**, con ventana controlada (fuera de la hora punta) y alguien del equipo disponible.
3. Observar al menos una jornada completa, con 2 o 3 publicaciones de prueba durante el día.
4. Decidir si ampliar al resto, empresa por empresa.

### Qué observar en el log del backend

Cada evento es una línea `client_event type=... attempt=... release=... to_release=... reason=...`:

```bash
grep "client_event" LOG | grep -c "type=update_started"     # intentos
grep "client_event" LOG | grep -c "type=update_confirmed"   # confirmados (mismo attempt que started)
grep "client_event" LOG | grep "type=update_failed"         # fallos con motivo
grep "client_event" LOG | grep "type=update_blocked"        # bloqueos (esperado: no son errores)
grep "client_event" LOG | grep "type=boot_failed"           # la app no arrancó (código = el de pantalla)
grep "client_event" LOG | grep "type=load_error"            # pantallas que no cargaron
```

Para calcular tasas, se usan los conteos de arriba como denominador; no se inventan porcentajes con pocas muestras.

### Criterios para detener la ampliación

Cualquiera de estos, **una sola vez**, detiene el piloto e inicia investigación:
- Un pedido o cobro perdido o duplicado.
- Una recarga durante una operación crítica (debería ser imposible por la barrera).
- Un bucle de recargas.
- `boot_failed` repetido después de una publicación.
- `update_started` sin `update_confirmed` ni `update_failed` del mismo `attempt` de forma repetida (intento colgado).

`update_blocked` **no** es un error: es la barrera funcionando.

## 6. Volver atrás

| Qué | Cómo | Cuidado |
|---|---|---|
| Web | Volver a publicar el commit anterior por el procedimiento habitual | Se reconoce como versión distinta y se ofrece igual que una nueva |
| Backend | Volver al commit anterior | Si `FLIZZY_MIN_CLIENT_CONTRACT` estaba subido, bajarlo antes. Una web abierta deja de enviar su contrato apenas una respuesta llega sin el anuncio |
| Base de datos | Esta iniciativa **no tiene migraciones**: volver atrás no toca datos | — |
| Apagar la versión obligatoria | `FLIZZY_MIN_CLIENT_CONTRACT=0` (o quitarla) y reiniciar el backend | — |

## 7. Limitaciones conocidas

- **Hasta que se haga la HU 3**, en el momento exacto de publicar, quien tenga Flizzy abierto puede ver *Not Found* al abrir una pantalla nueva. La HU 8 lo reduce (recuperación sin bucle), pero no lo elimina.
- **Si el servidor entero está caído** o no entrega el HTML, la web no puede mostrar nada ni reportar. Requiere monitoreo externo.
- Los tiempos de arranque (20 s y 30 s) son estimados. Hay que medirlos en las terminales reales.
- Los eventos se pierden si el backend no responde (por diseño: nunca bloquean una venta).
- Esta iniciativa **no elimina toda pantalla blanca posible**. Un error de CSS o de código, como el de las tablets, sigue siendo posible y se corrige como siempre.

## 8. Responsables

| Rol | Persona | Qué hace |
|---|---|---|
| Desarrollo (web y backend) | equipo Flizzy | Merge, matriz en `demo`, piloto |
| Servidor | Dany | HU 3, caché, monitoreo externo, acceso al log |
| Decisión de ampliar | jefe de proyecto | Revisa este documento y el log del piloto |

## 9. Criterio de cierre

- Matriz de la sección 1 sin filas **Demo** pendientes.
- HU 3 aplicada por el servidor y verificada con los comandos de la sección 3.
- Piloto de una jornada sin ningún criterio de detención.
- Este documento actualizado con los resultados reales (fechas, versiones y conteos del log).
