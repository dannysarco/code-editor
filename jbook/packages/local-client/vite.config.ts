import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      // bulmaswatch's theme css @imports the Lato font from Google Fonts —
      // the one remaining external request. The font is self-hosted via
      // @fontsource/lato instead, so the app is fully offline-capable.
      name: 'strip-remote-font-import',
      enforce: 'pre',
      transform(code, id) {
        if (id.includes('bulmaswatch') && id.endsWith('.css')) {
          return code.replace(
            /@import url\([^)]*fonts\.googleapis[^)]*\);?/g,
            ''
          );
        }
      },
    },
  ],
  test: {
    // State/plugin tests run in node; component tests opt into jsdom with a
    // `@vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    alias: [
      // the real esbuild-wasm crashes at import time under jsdom
      {
        find: /^esbuild-wasm$/,
        replacement: new URL('./src/test-stubs/esbuild-wasm.ts', import.meta.url)
          .pathname,
      },
    ],
    coverage: {
      include: ['src/**'],
    },
  },
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
