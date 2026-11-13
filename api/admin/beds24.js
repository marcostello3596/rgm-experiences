/**
 * /api/admin/beds24 — puente autenticado entre el panel y Beds24.
 *
 * POST { method, path, query?, body?, all? }
 * Sólo deja pasar las operaciones de la lista de abajo. Requiere sesión iniciada.
 */
import { checkWriteRequest, fail, json, readJson } from '../../server/http.js';
import { hasValidSession } from '../../server/session.js';
import { beds24, beds24Configured, Beds24Error } from '../../server/beds24.js';

const ALLOWED = {
  GET: ['/properties', '/bookings', '/bookings/messages', '/inventory/rooms/calendar', '/inventory/rooms/availability'],
  POST: ['/properties', '/bookings', '/bookings/messages', '/inventory/rooms/calendar'],
  DELETE: ['/bookings'],
};

export async function POST(request) {
  const bad = checkWriteRequest(request);
  if (bad) return fail(400, bad);
  if (!(await hasValidSession(request))) return fail(401, 'Tu sesión venció. Volvé a ingresar.');
  if (!beds24Configured()) return fail(503, 'El servidor no tiene configurada la conexión con Beds24 (variable BEDS24_REFRESH_TOKEN).');

  let req;
  try { req = await readJson(request); } catch { return fail(400, 'Pedido inválido.'); }
  const method = String(req && req.method || '').toUpperCase();
  const path = String(req && req.path || '');
  if (!ALLOWED[method] || !ALLOWED[method].includes(path)) return fail(403, `Operación no permitida: ${method} ${path}`);
  if (method !== 'GET' && method !== 'DELETE' && !Array.isArray(req.body)) return fail(400, 'Beds24 espera una lista en el cuerpo del pedido.');
  if (method === 'DELETE' && !(req.query && req.query.id)) return fail(400, 'Falta el id a borrar.');

  try {
    const { data, remaining } = await beds24(method, path, { query: req.query, body: method === 'POST' ? req.body : undefined, all: Boolean(req.all) });
    return json({ ok: true, data, remaining });
  } catch (e) {
    if (e instanceof Beds24Error) return fail(e.status || 502, e.message, { details: e.details });
    console.error('[beds24]', e);
    return fail(502, 'No se pudo conectar con Beds24.');
  }
}
