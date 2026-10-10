import { defineConfig } from 'vite';
import { DOWNLOAD_NAME, DOWNLOAD_URL } from './scripts/package-download.mjs';

function downloadHeaders(server) {
  server.middlewares.use((req, res, next) => {
    if (req.url?.split('?')[0] === DOWNLOAD_URL) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${DOWNLOAD_NAME}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    next();
  });
}

export default defineConfig({
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  plugins: [{ name: 'source-download', configureServer: downloadHeaders, configurePreviewServer: downloadHeaders }],
});
