/**
 * Sesión del panel con una contraseña compartida.
 *
 * - La contraseña vive sólo en el servidor (variable de entorno ADMIN_PASSWORD).
 * - Al entrar se entrega una cookie HttpOnly firmada con HMAC-SHA256; el navegador no puede leerla ni falsificarla.
 * - La clave de firma sale de ADMIN_PASSWORD + BEDS24_REFRESH_TOKEN (+ SESSION_SECRET si existe): cambiar la contraseña
 *   cierra todas las sesiones abiertas.
 */
import { getCookie, isLocalHttp } from './http.js';

export const COOKIE = 'rgm_admin';
const TTL_SECONDS = 12 * 60 * 60;
const enc = new TextEncoder();

const b64url = (buf) => Buffer.from(buf).toString('base64url');

async function key() {
  const material = [process.env.ADMIN_PASSWORD || '', process.env.BEDS24_REFRESH_TOKEN || '', process.env.SESSION_SECRET || ''].join('\u0000');
  const digest = await crypto.subtle.digest('SHA-256', enc.encode('rgm-admin-session|' + material));
  return crypto.subtle.importKey('raw', digest, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export function passwordConfigured() {
  return (process.env.ADMIN_PASSWORD || '').length >= 10;
}

/** Comparación en tiempo constante (se comparan los hashes para no filtrar el largo). */
export async function passwordMatches(candidate) {
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(String(candidate ?? ''))));
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(process.env.ADMIN_PASSWORD || '')));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 && passwordConfigured();
}

export async function createSessionCookie(request) {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL_SECONDS, v: 1 }));
  const sig = b64url(await crypto.subtle.sign('HMAC', await key(), enc.encode(payload)));
  return cookieHeader(request, `${payload}.${sig}`, TTL_SECONDS);
}

export const clearSessionCookie = (request) => cookieHeader(request, '', 0);

function cookieHeader(request, value, maxAge) {
  const secure = isLocalHttp(request) ? '' : '; Secure';
  return `${COOKIE}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

/** true si la cookie existe, está bien firmada y no venció. */
export async function hasValidSession(request) {
  if (!passwordConfigured()) return false;
  const raw = getCookie(request, COOKIE);
  if (!raw || !raw.includes('.')) return false;
  const [payload, sig] = raw.split('.');
  try {
    const ok = await crypto.subtle.verify('HMAC', await key(), Buffer.from(sig, 'base64url'), enc.encode(payload));
    if (!ok) return false;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
