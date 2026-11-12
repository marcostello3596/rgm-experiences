import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

/** En desarrollo sirve las fotos y tipografías del sitio público (../img, ../fonts) para que /img/... funcione igual que en producción. */
function siteImages(): Plugin {
  const root = path.resolve(import.meta.dirname, '..');
  return {
    name: 'rgm-site-images',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (!url.startsWith('/img/') && !url.startsWith('/fonts/')) return next();
        const file = path.join(root, decodeURIComponent(url));
        if (!file.startsWith(root) || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

// El PMS se compila como sitio estático dentro de /admin del sitio público.
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss(), siteImages()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: { outDir: '../admin', emptyOutDir: true, chunkSizeWarningLimit: 900 },
  test: { environment: 'node' },
});
