/**
 * /api/admin/session
 *   GET    → { authenticated, configured }
 *   POST   { password } → inicia sesión (cookie HttpOnly)
 *   DELETE → cierra la sesión
 */
import { checkWriteRequest, fail, json, readJson } from '../../server/http.js';
import { clearSessionCookie, createSessionCookie, hasValidSession, passwordConfigured, passwordMatches } from '../../server/session.js';
import { beds24Configured } from '../../server/beds24.js';

// Freno simple contra intentos repetidos (por instancia del servidor; se reinicia con cada despliegue).
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clientIp = (request) => (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';

export async function GET(request) {
  return json({ ok: true, authenticated: await hasValidSession(request), configured: { password: passwordConfigured(), beds24: beds24Configured() } });
}

export async function POST(request) {
  const bad = checkWriteRequest(request);
  if (bad) return fail(400, bad);
  if (!passwordConfigured()) return fail(503, 'El servidor no tiene configurada la contraseña del panel (variable ADMIN_PASSWORD, mínimo 10 caracteres).');
  const ip = clientIp(request);
  const now = Date.now();
  const entry = attempts.get(ip);
  const recent = entry && now - entry.first < WINDOW_MS ? entry : { first: now, count: 0 };
  if (recent.count >= MAX_ATTEMPTS) return fail(429, 'Demasiados intentos. Probá de nuevo en 15 minutos.');
  let body;
  try { body = await readJson(request, 4096); } catch { return fail(400, 'Pedido inválido.'); }
  if (!(await passwordMatches(body && body.password))) {
    attempts.set(ip, { first: recent.first, count: recent.count + 1 });
    await sleep(600);
    return fail(401, 'Contraseña incorrecta.');
  }
  attempts.delete(ip);
  return json({ ok: true, authenticated: true }, 200, { 'set-cookie': await createSessionCookie(request) });
}

export async function DELETE(request) {
  return json({ ok: true, authenticated: false }, 200, { 'set-cookie': clearSessionCookie(request) });
}
