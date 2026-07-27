# @my-scrapbook/local-client

The browser app for My Scrapbook: the cell-based editor UI, the in-browser
esbuild-wasm bundler, and the preview pane. Built with [Vite](https://vitejs.dev/).

## Development

Install dependencies from the monorepo root (`jbook/`):

```
npm install
```

Then, in this directory:

### `npm start`

Runs the Vite dev server on [http://localhost:3000](http://localhost:3000).
Port 3000 is required: in development, `@my-scrapbook/local-api` proxies
unmatched requests (including the HMR websocket) to this port. To develop
against the real API, run the CLI's `serve` command in another terminal and
open http://localhost:4005.

### `npm run build`

Type-checks with `tsc`, then builds the production app into `build/`.
The `build/` directory is what gets published; `@my-scrapbook/local-api`
serves it in production via `require.resolve`.

### `npm run preview`

Serves the production build locally for a quick sanity check (without the
cells API).
