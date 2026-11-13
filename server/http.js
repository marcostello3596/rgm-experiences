/** Utilidades HTTP para las funciones de servidor (formato Web: Request → Response). */

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...headers },
  });

export const fail = (status, error, extra = {}) => json({ ok: false, error, ...extra }, status);

export function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/** Pedidos que cambian algo: JSON y un encabezado propio (un formulario de otro sitio no puede mandarlo). */
export function checkWriteRequest(request) {
  if (request.headers.get('x-rgm-admin') !== '1') return 'Pedido rechazado.';
  if (!(request.headers.get('content-type') || '').includes('application/json')) return 'Se esperaba JSON.';
  return null;
}

export async function readJson(request, maxBytes = 512 * 1024) {
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('El pedido es demasiado grande.');
  return text ? JSON.parse(text) : null;
}

export const isLocalHttp = (request) => {
  const u = new URL(request.url);
  return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
};
