# Integración con Beds24 (pendiente)

Esta carpeta está vacía a propósito. Todavía **no hay ninguna llamada a Beds24, Airbnb ni Booking.com**, y no se
inventaron endpoints ni formatos de respuesta: la implementación se escribe cuando se revise la documentación
oficial de Beds24 API V2.

## Criterios ya decididos

- **Beds24 será la fuente de verdad** de reservas y disponibilidad. El panel no debe mantener un inventario
  vendible paralelo: cuando la integración esté activa, crear/editar/cancelar una reserva o un bloqueo es una
  operación contra Beds24, y el panel muestra lo que Beds24 devuelve.
- **Las credenciales nunca van al navegador.** El panel llama a un backend propio (por ejemplo funciones
  serverless en Vercel) y ese backend habla con Beds24 guardando las claves como variables de entorno.
- **Los `id` internos no cambian.** Los identificadores de Beds24, Airbnb y Booking.com se guardan en el campo
  `external` de `Property`, `Unit`, `Reservation` y `Guest` (ver `src/types.ts`), y se editan desde
  Departamentos → Integraciones y Canales → Beds24.

## Qué hay que escribir

Una implementación de `Services` (`src/services/contracts.ts`) y cambiar una línea en `src/services/index.ts`.
Las pantallas no se tocan.

| Proveedor | Hoy (demo) | Con Beds24 |
|---|---|---|
| `ReservationProvider` | localStorage | Reservas de Beds24 (todos los canales) |
| `AvailabilityProvider` | localStorage | Bloqueos / disponibilidad en Beds24 |
| `PricingProvider` | localStorage | Precios y estadías mínimas en Beds24 |
| `PropertyProvider` | localStorage | Ficha propia + mapeo con propiedades/unidades de Beds24 |
| `GuestProvider` | localStorage | Derivado de las reservas + datos propios |
| `MessagingProvider` | localStorage | Mensajería de Beds24, si la API lo permite |
| `PaymentProvider`, `ExpenseProvider`, `TaskProvider`, `SettingsProvider` | localStorage | Base de datos propia (no dependen de Beds24) |
| `ChannelProvider` | estados fijos "pendiente" | Estado real de la conexión y registro de sincronizaciones |

Poner `mode: 'live'` en esa implementación oculta el cartel de "Modo demostración".

## Antes de publicar

- Autenticación real en `/admin` (ver `src/auth/session.ts`).
- Mover las validaciones de `services/mock/index.ts` (fechas, superposición) al backend.
