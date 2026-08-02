# Changelog

## 3.7.0 — 2026-08-02

### Added
- **Drag-to-reorder cells.** Every cell header has a grip handle — drag it to move the cell anywhere in the notebook (the one-step arrow buttons remain). The handle is keyboard-accessible (space to lift, arrows to move, space to drop), a drag counts as one undo step, and the new order saves to `notebook.js` like any other edit. Only the handle starts a drag, so selecting code or clicking in the preview is unaffected.

## 3.6.0 — 2026-08-02

### Changed
- **Unchanged cells no longer re-run esbuild.** Bundle outputs are cached two ways: an in-memory store for same-session repeats (undo/redo, moving a cell and moving it back, Run all over unchanged cells) and one persisted entry per cell in IndexedDB, which makes an unchanged notebook load instantly on reload instead of rebundling every cell. Cells served this way say "Bundled from cache" in their header. Only successful bundles are cached, and **Clear cache** empties the bundle cache along with the module cache (cached outputs pin the module versions they were built with). Cumulative cell code is also now memoized, so it only recomputes when cells actually change rather than on every store update.

## 3.5.0 — 2026-08-02

### Added
- **TypeScript in code cells.** Cell code is now bundled with esbuild's `tsx` loader, so interfaces, type annotations, generics, and `.tsx`-style JSX all work — types are stripped at bundle time (no type checking). The editor treats cells as TypeScript models: TS syntax highlights correctly (including through the JSX highlighter), syntax errors squiggle, and the **Format** button uses prettier's `babel-ts` parser. Semantic validation is intentionally off since unpkg imports have no type definitions to check against. Plain JavaScript cells work exactly as before.

## 3.4.0 — 2026-08-02

### Added
- **Console output in the preview.** `console.log`/`info`/`warn`/`error`/`debug` calls in cell code now show up in a console panel under the preview pane: objects are serialized (cycles become `[Circular]`), warnings and errors are tinted, the panel keeps the newest 200 entries, auto-scrolls, and has a **Clear** button. Runtime errors still render in the preview and now land in the console too.

### Fixed
- The preview could silently render nothing: the bundled code was posted into the iframe on a fixed 50 ms timer, so it was lost whenever the document hadn't installed its message listener yet — and the iframe loaded twice (JSX attribute plus effect), so a second load could wipe output that had already rendered. The iframe document now posts a `ready` signal once its listener is installed, and the parent posts the code exactly once, on that signal.

## 3.3.0 — 2026-08-02

### Added
- **Markdown export.** `npx my-scrapbook export` converts a notebook to a plain markdown file: text cells come through as-is and code cells become fenced ```` ```jsx ```` blocks (the fence grows automatically if a cell itself contains backtick runs). `-o` picks the output path, which defaults to the notebook's name with `.md`; refuses to overwrite the notebook itself.
- `my-scrapbook --version` reports the installed version, and the package declares `engines.node >= 18` so npm warns on unsupported Node versions at install time.

### Changed
- `serve` opens your browser automatically once the server is up. Pass `--no-open` to just print the URL like before.
- `serve` is now the default command: a bare `npx my-scrapbook` opens `notebook.js`.

## 3.2.0 — 2026-07-28

### Changed
- **Notebook UI redesigned on the Modernist design system.** Light ground, flat surfaces, zero corner radius, Archivo type, and a single red accent replace the dark Bulmaswatch "Superhero" theme. Functionally the app is unchanged; the chrome is new:
  - A sticky app header (brand, filename, save state, undo/redo, **Clear cache**, **Run all**) replaces the floating toolbar above the first cell.
  - The permanent explainer wall is now a collapsible "How this works" strip behind a meta-bar toggle (state persisted, open on first run), and an empty notebook shows a first-run screen with **Code cell** / **Text cell** buttons.
  - Add-cell rails and cell actions are always visible instead of appearing on hover; each cell has a numbered header (`01 / TEXT`) with a bundle status slot ("Bundled in 84 ms" / "Bundling…").
  - Code panes stay dark inside the light chrome with syntax colors from the design system's ramps; while re-bundling, the preview keeps the last good render under a slim progress track instead of being replaced by a progress bar.
  - Icons moved from Font Awesome to Lucide and the UI font from Lato to Archivo (still self-hosted/offline-first); `bulmaswatch` and `@fortawesome/fontawesome-free` are gone.

## 3.1.0 — 2026-07-28

### Added
- **Undo/redo for the notebook.** Cell edits, deletes, moves, and inserts can be undone and redone via toolbar buttons or keyboard shortcuts (Ctrl/Cmd+Z, Ctrl+Y, Ctrl/Cmd+Shift+Z). Typing bursts in a cell group into a single undo step, history is capped at 50 states, and the shortcuts stand down while you're typing inside the code or markdown editors, which keep their own text-level undo. Undone and redone states are saved to `notebook.js` like any other edit.
- **Full offline mode.** The editor (Monaco) and the Lato UI font are now bundled with the app instead of loading from CDNs — a warm page load makes zero external requests. npm modules fetched from unpkg were already cached in IndexedDB; an offline badge now tells you when you've lost network ("cached packages still work"), and a **Clear module cache** button empties the cache so the next run picks up fresh package versions.

### Fixed
- The preview pane no longer throws if a cell is removed in the brief window between rendering and executing its bundle (an uncancelled timer dereferenced a null iframe).

## 3.0.1 — 2026-07-27

- npm packaging metadata: current README on the npm page, repository/homepage/bugs links, description and keywords. No code changes.

## 3.0.0 — 2026-07-27

First release after the repository modernization; versions 2.x are deprecated (they can no longer render React components — they relied on `ReactDOM.render`, which current React, served from unpkg, has removed).

- Rebuilt on Vite, TypeScript 5, React 18, and Redux Toolkit (previously Create React App, TS 4.1, React 17, hand-written Redux).
- The in-browser bundler upgraded to current esbuild-wasm and ships its own wasm binary — bundling no longer fetches the compiler from a CDN.
- Editor stack upgraded: Monaco 0.56, markdown editor v4, Babel-based JSX highlighting.
- Each cell renders inside an error boundary: a crash shows an error message with a Reset button instead of taking down the whole notebook.
- Cell IDs are UUIDs (previously 5-character random strings with realistic collision odds).
- The save API validates its input (zod) and answers 400 with details for malformed payloads; a corrupted `notebook.js` returns a 500 instead of crashing the server, and the JSON body limit is an explicit 5 MB.
- Dependency security updates throughout (axios 1.x, immer 10, http-proxy-middleware 3, Express 4.22).
