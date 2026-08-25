// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Astro's dev server serves files out of public/ but won't resolve a directory
 * to its index.html, so /cities/ and /water/ 404 locally while working fine
 * once built. Rewrite those in dev only, so the homepage's card previews and
 * the experiment viewer show the real pages while developing.
 */
function publicDirectoryIndex() {
  return {
    name: 'public-directory-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const [path, query] = req.url.split('?');
          if (path.endsWith('/') && path !== '/') {
            req.url = `${path}index.html${query ? `?${query}` : ''}`;
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
