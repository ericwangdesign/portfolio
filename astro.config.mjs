// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
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
  // Canonical origin. `www` is canonical and the apex 308-redirects to it, so
  // every absolute URL the site emits — canonicals, og:image, the sitemap —
  // has to be built on this exact host or it points at a redirect.
  site: 'https://www.ericwangdesign.com',
  integrations: [
    sitemap({
      // The pieces that live in public/ are copied verbatim, so Astro never
      // sees them as routes and can't discover them. Listed by hand — adding a
      // piece under public/ means adding it here too.
      customPages: [
        'https://www.ericwangdesign.com/cities/',
        'https://www.ericwangdesign.com/water/',
      ],
      // The journal is an unfinished placeholder carrying `noindex`; keeping it
      // out of the sitemap keeps the two signals from contradicting each other.
      filter: (page) => !page.includes('/journal'),
    }),
  ],
  vite: {
    plugins: [publicDirectoryIndex()],
  },
});
