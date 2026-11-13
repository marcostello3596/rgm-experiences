/**
 * Ejecuta localmente las funciones de servidor de /api (las mismas que publica Vercel).
 * Lo usan `npm run dev:live` (Vite) y `npm run preview`. Lee las variables de ../.env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadEnv(file = path.join(repo, '.env.local')) {
  if (!fs.existsSync(file)) return false;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return true;
}

/** Middleware estilo Connect: atiende /api/* con los módulos de ../api. */
export async function apiMiddleware(req, res, next) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (!url.pathname.startsWith('/api/')) return next ? next() : undefined;
  const file = path.join(repo, url.pathname.replace(/\/$/, '') + '.js');
  if (!file.startsWith(path.join(repo, 'api')) || path.basename(file).startsWith('_') || !fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': 'application/json' }).end('{"ok":false,"error":"No existe"}');
    return;
  }
  try {
    const mod = await import(pathToFileURL(file).href + `?t=${fs.statSync(file).mtimeMs}`);
    const handler = mod[req.method ?? 'GET'];
    if (!handler) { res.writeHead(405).end(); return; }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    const request = new Request(url, { method: req.method, headers, body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined });
    const response = await handler(request);
    const out = {};
    response.headers.forEach((v, k) => { out[k] = v; });
    res.writeHead(response.status, out).end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { 'content-type': 'application/json' }).end('{"ok":false,"error":"Error del servidor local"}');
  }
}
