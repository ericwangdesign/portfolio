// @ts-check
import { defineConfig } from 'astro/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Astro's dev server serves files out of public/ but won't resolve a directory
 * to its index.html, so /cities and /water 404 locally while working fine once
 * built and on Vercel. Rewrite those in dev only — checking the file actually
 * exists first, so this can never shadow a real Astro route.
 */
function publicDirectoryIndex() {
  const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
  return {
    name: 'public-directory-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const [path, query] = req.url.split('?');
          const suffix = query ? `?${query}` : '';
          if (path.endsWith('/') && path !== '/') {
            req.url = `${path}index.html${suffix}`;
          } else if (/^\/[^.]+$/.test(path)) {
            const candidate = `${publicDir}${path.slice(1)}/index.html`;
            if (existsSync(candidate)) req.url = `${path}/index.html${suffix}`;
          }
        }
        next();
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [publicDirectoryIndex()],
  },
});
