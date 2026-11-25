import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

function precacheSwPlugin(): Plugin {
  return {
    name: 'precache-sw',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;
      const urls: string[] = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];
      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (
            !entry.name.endsWith('.map') &&
            entry.name !== 'sw.js' &&
            !entry.name.startsWith('_')
          ) {
            const rel = '/' + path.relative(distDir, full).split(path.sep).join('/');
            if (!urls.includes(rel)) urls.push(rel);
          }
        }
      }
      walk(distDir);
      const swContent = `const CACHE_NAME = 'ltps-night-v1-${Date.now()}';
const PRECACHE_URLS = ${JSON.stringify(urls)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) =>
        cached || fetch(event.request).catch(() => caches.match('/index.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
`;
      fs.writeFileSync(path.join(distDir, 'sw.js'), swContent, 'utf8');
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), precacheSwPlugin()],
});
