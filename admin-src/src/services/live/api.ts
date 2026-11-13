import { DomainError } from '@/domain/reservations';

/**
 * Cliente del puente del servidor (/api/admin/*). El navegador nunca habla con Beds24 directamente
 * ni conoce sus credenciales: todo pasa por funciones del servidor que exigen sesión.
 */

/** La sesión venció o no existe: la interfaz vuelve a la pantalla de ingreso. */
export class AuthError extends Error {
  constructor(message = 'Tu sesión venció. Volvé a ingresar.') {
    super(message);
    this.name = 'AuthError';
  }
}

const API = '/api/admin';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, {
      credentials: 'same-origin',
      ...init,
      headers: { 'content-type': 'application/json', 'x-rgm-admin': '1', ...(init.headers ?? {}) },
    });
  } catch {
    throw new DomainError('No hay conexión con el servidor. Revisá tu internet y volvé a intentar.');
  }
  const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (res.status === 401) throw new AuthError(body?.error);
  if (!res.ok || !body?.ok) throw new DomainError(body?.error ?? `El servidor respondió ${res.status}.`);
  return body as T;
}

export interface SessionStatus { authenticated: boolean; configured: { password: boolean; beds24: boolean } }

export const sessionApi = {
  status: () => request<SessionStatus & { ok: true }>('/session', { method: 'GET' }),
  signIn: (password: string) => request<{ ok: true }>('/session', { method: 'POST', body: JSON.stringify({ password }) }),
  signOut: () => request<{ ok: true }>('/session', { method: 'DELETE' }),
};

type Query = Record<string, string | number | boolean | (string | number)[] | undefined>;

/** Resultado de una escritura en Beds24 (una entrada por elemento enviado). */
export interface WriteResult {
  success: boolean;
  new?: { id?: number; [k: string]: unknown };
  modified?: { id?: number; [k: string]: unknown };
  errors?: { action?: string; field?: string; message?: string }[];
  warnings?: { message?: string }[];
}

let lastRemaining: number | null = null;
/** Créditos restantes en la ventana de 5 minutos de Beds24 (último valor conocido). */
export const creditsRemaining = (): number | null => lastRemaining;

async function bridge<T>(method: 'GET' | 'POST' | 'DELETE', path: string, opts: { query?: Query; body?: unknown[]; all?: boolean } = {}): Promise<T> {
  const r = await request<{ ok: true; data: T; remaining: number | null }>('/beds24', { method: 'POST', body: JSON.stringify({ method, path, ...opts }) });
  if (r.remaining !== null && r.remaining !== undefined) lastRemaining = r.remaining;
  return r.data;
}

/** Mensajes frecuentes de Beds24, en castellano. */
const KNOWN: [RegExp, string][] = [
  [/cannot delete active bookings/i, 'Beds24 no permite borrar una reserva activa: primero hay que cancelarla.'],
  [/not available|no availability|unavailable/i, 'Beds24 no tiene disponibilidad en esas fechas (puede que un canal las haya ocupado o que estén cerradas en Beds24).'],
];
const translate = (m: string) => KNOWN.find(([re]) => re.test(m))?.[1] ?? m;

/** Convierte la respuesta de una escritura en un error legible si Beds24 rechazó algo. */
function checkWrite(results: unknown): WriteResult[] {
  const list = (Array.isArray(results) ? results : [results]) as WriteResult[];
  const problems = list.flatMap((r) => (r && r.success === false ? r.errors?.map((e) => translate([e.field, e.message].filter(Boolean).join(': '))) ?? ['Error sin detalle'] : []));
  if (problems.length) throw new DomainError(`Beds24 no aceptó el cambio: ${problems.join(' · ')}`);
  return list;
}

export const beds24 = {
  list: <T>(path: string, query?: Query) => bridge<{ data: T[] }>('GET', path, { query, all: true }).then((r) => r.data ?? []),
  write: async (path: string, body: unknown[]) => checkWrite(await bridge<unknown>('POST', path, { body })),
  remove: async (path: string, ids: number[]) => checkWrite(await bridge<unknown>('DELETE', path, { query: { id: ids } })),
};
