# Integración con Beds24 (activa)

El panel en producción usa Beds24 API V2 como fuente de verdad. Implementación en `src/services/live/`.

## Cómo está armado

```
navegador (admin/)  ──►  /api/admin/session   contraseña → cookie HttpOnly firmada
                    ──►  /api/admin/beds24    puente con lista de operaciones permitidas
                                │
                                ▼
                       server/beds24.js  ──►  https://beds24.com/api/v2
                       (BEDS24_REFRESH_TOKEN → token de 24 h en memoria)
```

- Las credenciales sólo existen en el servidor (variables de entorno). El navegador nunca las ve.
- Sin sesión, `/api/admin/beds24` responde 401: el código del panel es público, los datos no.
- Operaciones permitidas: leer/escribir alojamientos, reservas, mensajes y calendario; borrar reservas.

## Qué vive dónde

| Dato | Dónde |
|---|---|
| Departamentos (nombre, dirección, capacidad, horarios, estadía, limpieza) | Beds24: una habitación = un departamento del panel |
| Reservas, huéspedes de cada reserva, observaciones | Beds24 (`/bookings`) |
| Bloqueos | Beds24: reserva con estado `black`, más fechas cerradas (`override: blackout`) del calendario |
| Precio por noche y estadía mínima por fecha | Beds24 (`/inventory/rooms/calendar`, `price1`, `minStay`) |
| Cargos (alojamiento, limpieza, descuento, impuestos) y cobros | Beds24: ítems de factura `charge` y `payment` |
| Notas internas | Beds24: info items con código `NOTA` |
| Mensajes | Beds24 (`/bookings/messages`): **se envían de verdad** |
| Gastos, tareas, configuración, plantillas, notas/preferencias de huéspedes, fotos y comodidades | Este navegador (localStorage) — pendiente pasar a una base de datos |

## Reglas que se respetan

- Las reservas de Airbnb y Booking.com no se editan, cancelan ni borran desde el panel (se cambian en el canal).
- Al crear o mover una reserva se pide `checkAvailability`: si un canal ocupó las fechas, Beds24 la rechaza.
- Beds24 no borra reservas activas: el panel cancela y después borra.
- Fechas: `departure` es el día de salida (exclusivo). En el calendario, `from` y `to` son inclusivos. Verificado contra la cuenta.
- Límite de Beds24: unos 100 pedidos cada 5 minutos (cada pedido cuesta ~1). El panel lee 4 cosas al entrar, guarda la lectura 2 minutos en la pestaña, actualiza cada 5 minutos y después de cada cambio vuelve a leer sólo lo que cambió.

## Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Qué es |
|---|---|
| `BEDS24_REFRESH_TOKEN` | Refresh token de Beds24 (Settings → Account → API) |
| `ADMIN_PASSWORD` | Contraseña del panel, 10 caracteres o más |
| `SESSION_SECRET` | Opcional. Cambiarla cierra todas las sesiones |
| `BEDS24_DEBUG` | Opcional. `1` registra cada pedido y su costo en los logs |

En local van en `../.env.local` (ignorado por git).

## Pendiente

- Base de datos propia para lo que hoy queda en el navegador.
- Usuarios individuales con roles (hoy: una contraseña compartida = administrador).
- Webhook de Beds24 para enterarse de reservas nuevas al instante (hoy: lectura cada 5 minutos).
- Motor de reservas en el sitio (canal "Página web").
