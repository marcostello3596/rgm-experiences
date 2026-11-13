import type { Expense, Guest, ID, MessageTemplate, Settings, SyncLogEntry, Task } from '@/types';
import { DEFAULT_SETTINGS } from '@/services/mock/seed';
import type { PropertyProfile } from './mapping';

/**
 * Datos que Beds24 no guarda y que, por ahora, viven sólo en este navegador (localStorage).
 * Para compartirlos entre dispositivos hace falta una base de datos propia (próxima etapa).
 */
export interface GuestProfile { notes: string; preferences: string[]; document?: string }

export interface LocalState {
  version: 1;
  expenses: Expense[];
  tasks: Task[];
  settings: Settings;
  templates: MessageTemplate[];
  propertyProfiles: Record<ID, PropertyProfile>;
  guestProfiles: Record<ID, GuestProfile>;
  /** Huéspedes cargados en el panel que todavía no tienen una reserva en Beds24. */
  pendingGuests: Guest[];
  syncLog: SyncLogEntry[];
  lastSyncAt?: string;
}

const KEY = 'rgm-pms-beds24-v1';

const defaults = (): LocalState => ({
  version: 1,
  expenses: [],
  tasks: [],
  settings: {
    ...structuredClone(DEFAULT_SETTINGS),
    // Sin comisiones inventadas: con Beds24 la comisión viene en cada reserva.
    demoChannelFees: { airbnb: 0, booking: 0, web: 0, manual: 0 },
    users: [{ id: 'usr_admin', name: 'Administrador', email: '', role: 'admin', active: true }],
    staff: [],
  },
  templates: [
    { id: 'tpl_bienvenida', name: 'Bienvenida', text: 'Hola {huesped}, ¡gracias por tu reserva en {departamento}! Te esperamos el {checkin}. Cualquier consulta, escribinos por acá.' },
    { id: 'tpl_checkin', name: 'Instrucciones de check-in', text: 'Hola {huesped}. El check-in es desde las 14 h en {direccion}. Avisanos tu horario de llegada así coordinamos la entrega de llaves.' },
    { id: 'tpl_checkout', name: 'Recordatorio de check-out', text: 'Hola {huesped}. Te recordamos que el check-out es mañana {checkout} hasta las 10 h. ¡Esperamos que hayas disfrutado la estadía!' },
  ],
  propertyProfiles: {},
  guestProfiles: {},
  pendingGuests: [],
  syncLog: [],
});

let state: LocalState | null = null;

export function local(): LocalState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalState;
      state = { ...defaults(), ...parsed, settings: { ...defaults().settings, ...parsed.settings } };
      return state;
    }
  } catch {
    // almacenamiento no disponible: se usa memoria
  }
  state = defaults();
  return state;
}

export function saveLocal(): void {
  try {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sin almacenamiento: los cambios locales duran mientras la pestaña esté abierta
  }
}

export function logSync(entry: Omit<SyncLogEntry, 'id' | 'at'>): void {
  const s = local();
  const at = new Date().toISOString();
  s.syncLog = [{ ...entry, id: `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, at }, ...s.syncLog].slice(0, 60);
  if (entry.result === 'ok') s.lastSyncAt = at;
  saveLocal();
}
