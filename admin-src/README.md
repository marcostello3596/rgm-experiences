# RGM PMS — panel de administración (`/admin`)

Aplicación aparte del sitio público. Se escribe acá (`admin-src/`) y se compila como archivos estáticos
en `../admin/`, que es lo que publica Vercel junto con el resto del sitio. El sitio público no se toca.

**Producción: conectado a Beds24** con contraseña (ver `src/services/beds24/README.md`).
`npm run dev` sigue abriendo la demostración con datos ficticios.

## Uso

```bash
cd admin-src
npm install
npm run dev        # demostración con datos ficticios: http://localhost:5173/admin/
npm run dev:live   # con Beds24 real (lee ../.env.local): http://localhost:5173/admin/
npm run build      # typecheck + compila a ../admin  (hay que commitear ../admin)
npm run preview    # sitio completo como Vercel, con las funciones de /api: http://localhost:4173/admin
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

## Servidor

- `../api/admin/session.js` y `../api/admin/beds24.js`: funciones de Vercel (formato Web: `export function GET/POST(request)`).
- `../server/`: código compartido de esas funciones (sesión, cliente de Beds24).
- Variables de entorno: `BEDS24_REFRESH_TOKEN`, `ADMIN_PASSWORD` (ver el README de Beds24).
