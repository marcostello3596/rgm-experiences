import { create } from 'zustand';
import type { Dataset, ID, Settings } from '@/types';
import { fetchAll, services } from '@/services';
import { DEFAULT_SETTINGS } from '@/services/mock/seed';
import { DomainError } from '@/domain/reservations';
import type { Session } from '@/auth/session';
import { authProvider } from '@/auth/session';

export type ToastTone = 'success' | 'error' | 'info';
export interface Toast { id: number; tone: ToastTone; text: string }

interface State extends Dataset {
  ready: boolean;
  loadError: string | null;
  session: Session | null;
  /** Filtro global de departamento (barra superior). */
  propertyFilter: ID | 'all';
  toasts: Toast[];
  load: () => Promise<void>;
  /**
   * Ejecuta una operación contra los servicios y vuelve a leer el estado completo, así todas las pantallas
   * se actualizan juntas. Devuelve el resultado, o null si hubo un error (que se muestra como aviso).
   * Con `rethrow`, los errores de validación se devuelven al formulario para mostrarlos junto al campo.
   */
  run: <T>(op: () => Promise<T>, opts?: { success?: string; rethrow?: boolean }) => Promise<T | null>;
  setPropertyFilter: (id: ID | 'all') => void;
  toast: (text: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  resetDemo: () => Promise<void>;
}

const EMPTY: Dataset = {
  properties: [], guests: [], reservations: [], payments: [], expenses: [], blocks: [], rates: [], seasons: [], tasks: [], conversations: [], templates: [], channels: [], sync: [],
  settings: DEFAULT_SETTINGS as Settings,
};

let toastId = 0;

export const useStore = create<State>((set, get) => ({
  ...EMPTY,
  ready: false,
  loadError: null,
  session: null,
  propertyFilter: 'all',
  toasts: [],

  load: async () => {
    try {
      const [data, session] = await Promise.all([fetchAll(), authProvider.getSession()]);
      set({ ...data, session, ready: true, loadError: null });
    } catch (e) {
      set({ loadError: e instanceof Error ? e.message : 'No se pudieron cargar los datos.', ready: true });
    }
  },

  run: async (op, opts) => {
    try {
      const out = await op();
      set(await fetchAll());
      if (opts?.success) get().toast(opts.success, 'success');
      return out;
    } catch (e) {
      if (opts?.rethrow && e instanceof DomainError) throw e;
      get().toast(e instanceof Error ? e.message : 'Ocurrió un error inesperado.', 'error');
      return null;
    }
  },

  setPropertyFilter: (propertyFilter) => set({ propertyFilter }),

  toast: (text, tone = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, tone, text }] }));
    setTimeout(() => get().dismissToast(id), tone === 'error' ? 6000 : 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  resetDemo: async () => {
    await services.resetDemo?.();
    set({ ...(await fetchAll()), propertyFilter: 'all' });
    get().toast('Se restablecieron los datos de demostración.', 'success');
  },
}));

/** Hoy según la zona horaria configurada. */
export { today } from '@/lib/dates';
