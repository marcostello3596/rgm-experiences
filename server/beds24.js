/**
 * Cliente de Beds24 API V2 (sólo del lado del servidor).
 * Credencial: BEDS24_REFRESH_TOKEN (variable de entorno). Con ella se pide un token de acceso de 24 h,
 * que se guarda en memoria mientras la función siga activa. El navegador nunca ve ninguno de los dos.
 * Referencia: https://beds24.com/api/v2 (especificación oficial apiV2.yaml).
 */
const BASE = 'https://beds24.com/api/v2';
let cached = null; // { token, exp }

export const beds24Configured = () => Boolean(process.env.BEDS24_REFRESH_TOKEN);

export class Beds24Error extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function accessToken(force = false) {
  if (!force && cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch(`${BASE}/authentication/token`, { headers: { refreshToken: process.env.BEDS24_REFRESH_TOKEN || '', accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    cached = null;
    throw new Beds24Error('Beds24 rechazó la credencial. Revisá BEDS24_REFRESH_TOKEN en las variables de entorno.', 502, { code: body.code, error: body.error });
  }
  if (body.refreshToken && body.refreshToken !== process.env.BEDS24_REFRESH_TOKEN) {
    console.warn('[beds24] Beds24 devolvió un refresh token nuevo: actualizá BEDS24_REFRESH_TOKEN.');
  }
  cached = { token: body.token, exp: Date.now() + (Number(body.expiresIn) || 3600) * 1000 };
  return cached.token;
}

function buildQuery(query) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === '') continue;
    for (const item of Array.isArray(v) ? v : [v]) qs.append(k, String(item));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function raw(method, url, body, retried = false) {
  const res = await fetch(url, {
    method,
    headers: { token: await accessToken(), accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !retried) {
    await accessToken(true);
    return raw(method, url, body, true);
  }
  const remaining = res.headers.get('x-five-min-limit-remaining');
  if (process.env.BEDS24_DEBUG) console.log(`[beds24] ${method} ${url.replace(BASE, '').slice(0, 80)} → ${res.status} · costo ${res.headers.get('x-request-cost')} · quedan ${remaining}`);
  const data = await res.json().catch(() => null);
  if (res.status === 429) throw new Beds24Error('Beds24 está limitando la cantidad de pedidos. Esperá un par de minutos y volvé a intentar.', 429, { remaining });
  if (!res.ok) throw new Beds24Error((data && (data.error || data.message)) || `Beds24 respondió ${res.status}.`, res.status >= 500 ? 502 : res.status, data);
  return { data, remaining: remaining === null ? null : Number(remaining) };
}

/**
 * Llama a Beds24. Con `all`, sigue las páginas de un listado y devuelve todos los elementos juntos.
 */
export async function beds24(method, path, { query, body, all = false } = {}) {
  let { data, remaining } = await raw(method, `${BASE}${path}${buildQuery(query)}`, body);
  if (all && method === 'GET' && data && Array.isArray(data.data)) {
    const items = [...data.data];
    let next = data.pages && data.pages.nextPageExists ? data.pages.nextPageLink : null;
    for (let i = 0; next && i < 30; i++) {
      if (!String(next).startsWith(BASE)) break;
      const page = await raw('GET', next);
      items.push(...((page.data && page.data.data) || []));
      remaining = page.remaining;
      next = page.data && page.data.pages && page.data.pages.nextPageExists ? page.data.pages.nextPageLink : null;
    }
    data = { ...data, data: items, count: items.length, pages: { nextPageExists: false, nextPageLink: null } };
  }
  return { data, remaining };
}
