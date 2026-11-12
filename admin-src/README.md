# RGM PMS — panel de administración (`/admin`)

Aplicación aparte del sitio público. Se escribe acá (`admin-src/`) y se compila como archivos estáticos
en `../admin/`, que es lo que publica Vercel junto con el resto del sitio. El sitio público no se toca.

**Estado: demo de desarrollo.** Todos los datos son ficticios y se guardan en el navegador (localStorage).
No hay conexión con Beds24, Airbnb ni Booking.com, y **no hay inicio de sesión** (ver "Antes de publicar").

## Uso

```bash
cd admin-src
npm install
npm run dev        # desarrollo: http://localhost:5173/admin/
npm run build      # typecheck + compila a ../admin  (hay que commitear ../admin)
npm run preview    # sirve el sitio completo como Vercel: http://localhost:4173/admin
npm run typecheck && npm run lint && npm test
```

Después de cambiar algo: `npm run build` y commitear también la carpeta `admin/`.
`vercel.json` (raíz) manda `/admin/*` a `admin/index.html` para que las rutas internas abran directo.

## Stack

Vite · React 19 · TypeScript estricto · Tailwind CSS 4 · React Router · Zustand · Recharts · Lucide.
(El sitio público es HTML/JS sin framework, por eso el panel es un proyecto separado.)

## Estructura

```
src/
  types.ts                 Modelos (Property, Unit, Reservation, Guest, Payment, Expense, CalendarBlock, Rate, Task, Channel, SyncStatus…)
  services/contracts.ts    Interfaces de los proveedores (ReservationProvider, PropertyProvider, AvailabilityProvider, PricingProvider, GuestProvider, MessagingProvider…)
  services/index.ts        ÚNICO lugar donde se elige la implementación (hoy: mock)
  services/mock/           Implementación simulada: seed.ts (datos), db.ts (localStorage), index.ts (proveedores), tasks.ts (limpiezas)
  services/beds24/         README con los criterios de la integración futura (sin código inventado)
  auth/session.ts          Contrato de autenticación y permisos por rol (hoy: sesión demo, sin protección)
  domain/                  Reglas puras y testeadas: superposición, precios, monedas, indicadores (fórmulas documentadas en metrics.ts)
  store/                   Estado compartido: toda mutación pasa por un servicio y vuelve a leer el estado
  ui/                      Componentes reutilizables (tabla, modal, panel lateral, gráficos, formularios, badges…)
  layout/                  Sidebar, barra superior, buscador global, notificaciones
  features/                Formularios y paneles que se abren desde varias pantallas
  pages/                   Una por ruta
```

## Conectar Beds24 (más adelante)

1. Backend propio con las credenciales (nunca en el navegador).
2. Escribir una implementación de `Services` que llame a ese backend.
3. Devolverla en `services/index.ts` con `mode: 'live'`. Las pantallas no cambian.

Detalle en `src/services/beds24/README.md`.

## Antes de publicar con datos reales

- Proteger `/admin` del lado del servidor (contraseña de Vercel o sesión con un proveedor de identidad) e implementar `AuthProvider`.
- Validar sesión, rol y reglas de negocio en el backend.
