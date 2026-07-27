import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  // nodePolyfills shims the node builtins (assert, os, path, ...) that
  // jscodeshift/recast reach for; they run fine in the browser once shimmed.
  plugins: [react(), nodePolyfills()],
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
