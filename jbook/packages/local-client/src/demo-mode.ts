// The demo build (`vite build --mode demo`) is the hosted, zero-install
// version of the app: no local API, so the notebook persists to the browser
// (IndexedDB) instead of a notebook.js file. Everything else — the editor,
// bundler, and npm module fetching — already runs entirely in the browser.
export const IS_DEMO = import.meta.env.MODE === 'demo';
