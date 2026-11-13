import { create } from 'zustand';
import type { Dataset, ID, Settings } from '@/types';
import { fetchAll, services } from '@/services';
import { DEFAULT_SETTINGS } from '@/services/mock/seed';
import { DomainError } from '@/domain/reservations';
import type { Session } from '@/auth/session';
import { authProvider } from '@/auth/session';
import { AuthError } from '@/services/live/api';

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
  /** Vuelve a leer todo de la fuente (Beds24). */
  syncNow: (opts?: { quiet?: boolean }) => Promise<void>;
  syncing: boolean;
  signIn: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
    set({ loadError: null });
    try {
      const session = await authProvider.getSession();
      if (!session) { set({ session: null, ready: true }); return; }
      const data = await fetchAll();
      set({ ...data, session, ready: true, loadError: null });
    } catch (e) {
      if (e instanceof AuthError) { set({ session: null, ready: true }); return; }
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
      if (e instanceof AuthError) { set({ session: null }); get().toast(e.message, 'error'); return null; }
      // Aunque falle, se vuelve a leer: puede que parte del cambio se haya guardado en la fuente.
      try { set(await fetchAll()); } catch { /* se informa el error original */ }
      if (opts?.rethrow && e instanceof DomainError) throw e;
      get().toast(e instanceof Error ? e.message : 'Ocurrió un error inesperado.', 'error');
      return null;
    }
  },

  syncing: false,
  syncNow: async (opts) => {
    if (get().syncing) return;
    set({ syncing: true });
    try {
      await services.refresh?.();
      set(await fetchAll());
      if (!opts?.quiet) get().toast(`Datos actualizados desde ${services.policy.sourceName}.`, 'success');
    } catch (e) {
      if (e instanceof AuthError) set({ session: null });
      if (!opts?.quiet || !(e instanceof AuthError)) get().toast(e instanceof Error ? e.message : 'No se pudo sincronizar.', 'error');
    } finally {
      set({ syncing: false });
    }
  },

  signIn: async (password) => {
    if (!authProvider.signIn) return;
    const session = await authProvider.signIn(password);
    set({ session, ready: false });
    await get().load();
  },
  signOut: async () => {
    await authProvider.signOut();
    services.clearCache?.();
    set({ session: null });
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
