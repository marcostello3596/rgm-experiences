// Sirve el sitio completo como Vercel: archivos estáticos, /admin/* → /admin/index.html y las funciones de /api.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiMiddleware, loadEnv } from './api-host.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.env.PORT ?? 4173);
loadEnv();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4' };

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (url.startsWith('/api/')) { void apiMiddleware(req, res); return; }
  let file = path.join(root, url);
  if (!file.startsWith(root) || url.startsWith('/api') || url.startsWith('/.env') || url.startsWith('/admin-src') || url.startsWith('/server')) { res.writeHead(404).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && (url === '/admin' || url.startsWith('/admin/'))) file = path.join(root, 'admin', 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end('No encontrado'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Sitio en http://localhost:${port}/  ·  PMS en http://localhost:${port}/admin`));
