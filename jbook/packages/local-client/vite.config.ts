import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Port 3000 is load-bearing: in development, @my-scrapbook/local-api
    // proxies unmatched requests (including the HMR websocket) to
    // http://localhost:3000.
    port: 3000,
    strictPort: true,
  },
  build: {
    // local-api serves the production app via
    // require.resolve('@my-scrapbook/local-client/build/index.html').
    outDir: 'build',
  },
});
