import type { UserRole } from '@/types';
import { sessionApi } from '@/services/live/api';

/**
 * ACCESO AL PANEL
 *
 * - Con Beds24 (producción): contraseña compartida verificada en el servidor (api/admin/session.js).
 *   La sesión es una cookie HttpOnly firmada; cada pedido de datos la valida en el servidor.
 *   El código del panel es público, pero sin sesión no puede leer ni escribir ningún dato.
 * - En la demostración (`npm run dev`) no hay inicio de sesión: los datos son ficticios y viven en el navegador.
 *
 * Hoy hay un solo usuario (rol administrador). Los roles de operador y limpieza quedan preparados para cuando
 * se pase a usuarios individuales.
 */

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  /** false mientras no exista autenticación real. La interfaz lo avisa. */
  secured: boolean;
}

export interface AuthProvider {
  getSession(): Promise<Session | null>;
  /** Inicia sesión. Lanza un error con el mensaje para mostrar si no se pudo. */
  signIn?(password: string): Promise<Session>;
  signOut(): Promise<void>;
}

/** Sesión abierta de demostración: no protege nada. */
export const demoAuthProvider: AuthProvider = {
  getSession: async () => ({ userId: 'usr_demo', name: 'Administrador demo', email: 'admin@ejemplo.com', role: 'admin', secured: false }),
  signOut: async () => undefined,
};

const LIVE_SESSION: Session = { userId: 'usr_admin', name: 'Administrador', email: '', role: 'admin', secured: true };

/** Sesión con contraseña compartida contra las funciones del servidor. */
export const passwordAuthProvider: AuthProvider = {
  getSession: async () => ((await sessionApi.status()).authenticated ? LIVE_SESSION : null),
  signIn: async (password: string) => {
    await sessionApi.signIn(password);
    return LIVE_SESSION;
  },
  signOut: async () => { await sessionApi.signOut(); },
};

export const authProvider: AuthProvider = import.meta.env.VITE_DATA_SOURCE === 'beds24' ? passwordAuthProvider : demoAuthProvider;

export type Section = 'dashboard' | 'calendario' | 'reservas' | 'departamentos' | 'huespedes' | 'tarifas' | 'finanzas' | 'tareas' | 'mensajes' | 'estadisticas' | 'canales' | 'configuracion';

/** Qué secciones ve cada rol. Preparado para cuando existan usuarios reales. */
const ACCESS: Record<UserRole, Section[] | 'all'> = {
  admin: 'all',
  operator: ['dashboard', 'calendario', 'reservas', 'departamentos', 'huespedes', 'tareas', 'mensajes'],
  cleaning: ['tareas'],
};

export const canAccess = (role: UserRole, section: Section): boolean => {
  const a = ACCESS[role];
  return a === 'all' || a.includes(section);
};
