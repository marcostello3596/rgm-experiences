import type { UserRole } from '@/types';

/**
 * ACCESO AL PANEL
 *
 * El sitio público es estático y no tiene autenticación, así que hoy el panel corre como DEMO DE DESARROLLO:
 * no hay login, no hay credenciales y no se simula seguridad con una marca en localStorage.
 * Como todos los datos son ficticios y viven en el navegador de quien lo abre, no se expone nada real,
 * pero ESTO NO ALCANZA para trabajar con datos de huéspedes.
 *
 * Antes de cargar datos reales hay que:
 * 1. Proteger /admin del lado del servidor (por ejemplo: protección por contraseña de Vercel, o un middleware
 *    que valide una sesión de un proveedor de identidad como Supabase Auth).
 * 2. Implementar `AuthProvider` contra ese proveedor y devolverlo en `authProvider`.
 * 3. Hacer que el backend valide la sesión y el rol en cada pedido (ocultar un menú no es seguridad).
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
  signOut(): Promise<void>;
}

/** Sesión abierta de demostración: no protege nada. */
export const demoAuthProvider: AuthProvider = {
  getSession: async () => ({ userId: 'usr_demo', name: 'Administrador demo', email: 'admin@ejemplo.com', role: 'admin', secured: false }),
  signOut: async () => undefined,
};

export const authProvider: AuthProvider = demoAuthProvider;

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
