# My Scrapbook - Prioritized Refactor Roadmap

> Generated from architecture analysis on 2025-10-29
>
> **Status as of 3.11.0 (2026-08-02):** items 1–11 and 14 are complete, item 12
> is closed (memoization done, the rest obsolete or not planned), item 13 is
> parked, and item 15 (collaborative editing) is the one big open item. For
> ideas beyond the original fifteen, see Future Considerations at the bottom —
> that list is kept current.

## 🔴 CRITICAL - Do Immediately (Blocking Issues)

### 1. Fix Production Dependency Declaration ⚠️ BLOCKER
**Priority:** P0 - Prevents npm install
**Effort:** 5 minutes
**Impact:** Product literally doesn't work

- [x] Move `@my-scrapbook/local-api` from devDependencies to dependencies in `jbook/packages/cli/package.json` (PR #5)
- [x] Test: Run `npm pack` and verify package contents (CI pack-and-install smoke test, 3.8.0)
- [x] Test: Clean install in fresh directory (same smoke test — installs the packed cli into a scratch project and runs `--version` and `serve` against it, on every CI run)
- [x] Publish patch version — superseded: 3.x publishes from CI on release tags since v3.7.1 (see `publish.yml`)

**Files:**
- `jbook/packages/cli/package.json:23-24`

---

### 2. Replace Random ID Generation with UUIDs
**Priority:** P0 - Data safety risk
**Effort:** 30 minutes
**Impact:** Prevents potential data loss from ID collisions

- [x] Install `uuid` package in local-client (PR #10)
- [x] Replace `Math.random().toString(36).substr(2, 5)` with `uuidv4()` (PR #10)
- [x] Add unit test for unique ID generation (landed with the cellsReducer suite in PR #14, which covers UUID uniqueness)
- [x] Migration note: Existing 5-char IDs still work (IDs are opaque keys)

**Files:**
- `jbook/packages/local-client/src/state/reducers/cellsReducer.ts:95-97`

---

### 3. Add React Error Boundaries
**Priority:** P1 - UX stability
**Effort:** 2 hours
**Impact:** Prevents user code crashes from breaking entire app

- [x] Create `ErrorBoundary` component (PR #10)
- [x] Wrap each cell with an error boundary (broader than just `<Preview>`; one crashed cell can't take down the notebook) (PR #10)
- [x] Add fallback UI with error message + "Reset" button (PR #10)
- [x] Log errors to console (componentDidCatch) (PR #10)

**Files:**
- `jbook/packages/local-client/src/components/preview.tsx`
- Create: `jbook/packages/local-client/src/components/error-boundary.tsx`

---

## 🟡 HIGH PRIORITY - This Sprint (Week 1-2)

### 4. Extract Magic Numbers to Constants
**Priority:** P1 - Code maintainability
**Effort:** 1 hour
**Impact:** Improves readability and configurability

- [x] Create `jbook/packages/local-client/src/constants.ts` (PR #15)
- [x] Extract `BUNDLE_DEBOUNCE_MS = 750` (PR #15)
- [x] Extract `PERSIST_SAVE_DEBOUNCE_MS = 250` (plus the JSX-highlight and preview-execute delays found along the way) (PR #15)
- [x] ~~Extract `RANDOM_ID_LENGTH = 5`~~ obsolete — cell IDs are UUIDs since PR #10
- [x] Document why each value was chosen (PR #15)

**Files:**
- `jbook/packages/local-client/src/components/code-cell.tsx:27`
- `jbook/packages/local-client/src/state/middlewares/persist-middlware.ts:31`

---

### 5. Improve Error Handling & Logging
**Priority:** P1 - Production debuggability
**Effort:** 2 hours
**Impact:** Better error messages, easier debugging

- [x] Fix the serve error output (typo gone; message now carries file + port context) (PR #15)
- [x] Add structured error messages (EADDRINUSE handled by code with an actionable hint; other failures report file, port, and cause) (PR #15)
- [x] Considered winston/pino and decided against: the CLI emits two messages total; a logging framework adds a runtime dependency for no benefit at this size (PR #15)
- [x] Add error context (file, port, suggested command) (PR #15)

**Files:**
- `jbook/packages/cli/src/commands/serve.ts:27`

---

### 6. Create Shared Types Package
**Priority:** P1 - Type safety
**Effort:** 4 hours
**Impact:** Single source of truth, prevents API drift

- [x] Create `jbook/packages/types/` directory (PR #12)
- [x] Extract `Cell` interface from both locations (PR #12)
- [x] Extract API request/response types (PR #12)
- [x] Extract Bundle result types (PR #12)
- [x] Update package.json with proper exports (PR #12)
- [x] Update imports in local-api and local-client (the cli uses no shared types) (PR #12)
- [x] Add to workspaces (covered by the existing `packages/*` glob) (PR #12)

**New Files:**
- `jbook/packages/types/package.json`
- `jbook/packages/types/src/cell.ts`
- `jbook/packages/types/src/api.ts`
- `jbook/packages/types/src/bundle.ts`

**Update:**
- `jbook/packages/local-api/src/routes/cells.ts:5-9`
- `jbook/packages/local-client/src/state/cell.ts`

---

## 🟢 MEDIUM PRIORITY - This Month (Weeks 2-4)

### 7. Migrate to Redux Toolkit (RTK)
**Priority:** P2 - Developer velocity
**Effort:** 2 days
**Impact:** 60% less boilerplate, faster feature development

- [x] Install `@reduxjs/toolkit` (PR #11)
- [x] Convert cellsReducer to `createSlice` (PR #11)
- [x] Convert bundlesReducer to `createSlice` (PR #11)
- [x] Replace action creators with RTK auto-generated actions (prepare callbacks keep the original signatures) (PR #11)
- [x] Use `createAsyncThunk` for fetchCells, saveCells, createBundle (PR #11)
- [x] Update middleware to work with RTK actions (`isAnyOf` matchers) (PR #11)
- [x] Update component imports (none needed; public state API preserved) (PR #11)
- [x] Remove old action-types, actions, action-creators directories (PR #11)
- [x] Update hooks to use RTK patterns (PR #11)

**Files to Refactor:**
- Entire `jbook/packages/local-client/src/state/` directory
- `jbook/packages/local-client/src/state/store.ts`

**Reference:** https://redux-toolkit.js.org/tutorials/quick-start

---

### 8. Add API Input Validation
**Priority:** P2 - Security & data integrity
**Effort:** 4 hours
**Impact:** Prevents bad data, better error messages

- [x] Install `zod` in local-api (PR #13)
- [x] Create Cell schema validation, annotated with the shared wire types so it cannot drift (PR #13)
- [x] Validate POST /cells request body (PR #13)
- [x] Return 400 with validation errors (PR #13)
- [x] Add request body size limits (5mb explicit; express default was 100kb) (PR #13)
- [x] Add tests for invalid inputs (landed with the API route tests in PR #14: validation rejections and corrupted-file cases)

**Files:**
- `jbook/packages/local-api/src/routes/cells.ts:33-42`

---

### 9. Fix Hardcoded unpkg URLs
**Priority:** P2 - Offline support
**Effort:** 4 hours
**Impact:** Works offline, version flexibility

- [x] Ship esbuild.wasm locally — bundled from the installed package via Vite `?url` import (PR #7)
- [x] Update bundler to use the local WASM file (PR #7)
- [x] Fallback to unpkg if local fails (pinned to the installed version; 3.11)
- [x] Version always matches the installed esbuild-wasm package (PR #7)
- [x] Update README with offline capabilities ("Works offline" section; 3.11)

**Files:**
- `jbook/packages/local-client/src/bundler/index.ts:10`

---

### 10. Add Basic Test Coverage
**Priority:** P2 - Code quality
**Effort:** 3 days
**Impact:** Prevents regressions, enables confident refactoring

#### Phase 1: Setup
- [x] Configure Vitest per package with a root `npm test` orchestrator (Vitest, not Jest — the repo is on Vite now) (PR #14)
- [x] Add test scripts to local-client and local-api (`test`, `test:coverage`); cli and types have nothing meaningful to unit test yet (PR #14)
- [x] Set up code coverage reporting (@vitest/coverage-v8, scoped to src) (PR #14)

#### Phase 2: Unit Tests
- [x] Test cellsReducer (all actions, boundaries, UUID uniqueness) (PR #14)
- [x] Test bundlesReducer (pending/fulfilled/rejected lifecycle) (PR #14)
- [x] Test thunks (saveCells, fetchCells) with mocked axios (PR #14)
- [x] Test bundler plugins (fetch-plugin, unpkg-path-plugin) at 100% coverage (PR #14)
- [x] Test API routes (/cells GET, POST) with supertest, incl. validation and corrupted-file cases (PR #14)
- [x] Test CLI command parsing (serve/export: defaults, flags, nested paths, error paths, excess-argument rejection)

#### Phase 3: Integration Tests
- [ ] Test Express server setup (partially covered via the router tests; the proxy path was verified manually in PR #9)
- [x] Test full Redux store with middleware (persist debounce integration) (PR #14)
- [x] Test cumulative code hook (PR #19)

**Target:** 60% coverage minimum — reached: local-client at 78% statements after the component tests (PR #19)

---

## 🔵 LOWER PRIORITY - This Quarter (Months 2-3)

### 11. Implement Service Worker for Offline Mode
**Priority:** P3 - Feature enhancement
**Effort:** 1 week
**Impact:** Full offline capability

- [x] ~~Service worker~~ Implemented without one (PR #21): the app shell is served locally, npm module responses were already cached in IndexedDB by the bundler, and the real offline blocker was Monaco loading from a CDN — now self-hosted (with the theme font, the app makes zero external requests)
- [x] Cache frequently used packages — every fetched module is cached on first use and served from IndexedDB after (PR #21)
- [x] Add "Offline Mode" indicator in UI (PR #21)
- [x] Handle cache invalidation strategy — entries pin the first-fetched version until cleared; clearing refetches and picks up new versions (PR #21)
- [x] Add a Clear-module-cache button with cleared-count feedback (PR #21)

---

### 12. Add Cell Result Memoization
**Priority:** P3 - Performance
**Effort:** 2 days
**Impact:** Faster re-renders, less bundling

- [x] Memoize `useCumulativeCode` hook — done via a per-instance `createSelector` (the join only recomputes when the cells slice changes)
- [x] ~~Track cell dependencies~~ / ~~Only rebundle cells affected by changes~~ obsolete — unchanged cells already skip rebundling: cumulative code is a string, so an edit to cell N leaves the selector output for cells above it `===`-equal and their debounced rebundle never fires
- [ ] Add performance monitoring (not planned; no observed need at notebook sizes)

**Files:**
- `jbook/packages/local-client/src/hooks/use-cumulative-code.ts`

---

### 13. Decouple Bundler from UI
**Priority:** P3 - Architectural improvement
**Effort:** 3 days
**Impact:** Pluggable bundler system

> **Parked (3.11 reassessment):** the bundler already lives in its own module
> behind a one-function API (`bundle(code)` in
> `jbook/packages/local-client/src/bundler/`), with caching layered on
> separately. An interface + dependency injection buys nothing until a second
> bundler implementation actually exists; revisit only if one does.

- [ ] Create `BundlerService` interface
- [ ] Implement `EsbuildBundlerService`
- [ ] Add dependency injection for bundler
- [ ] Allow configuration of bundler in settings
- [ ] Document bundler plugin API

---

### 14. Implement Undo/Redo
**Priority:** P3 - UX enhancement
**Effort:** 1 week
**Impact:** Professional editor experience

- [x] Install `redux-undo` (PR #20)
- [x] Add undo/redo to cell updates, deletes, moves, and inserts (PR #20)
- [x] Add keyboard shortcuts (Ctrl/Cmd+Z, Ctrl+Y, Ctrl/Cmd+Shift+Z), deferring to Monaco/markdown editors when focus is inside them (PR #20)
- [x] Add undo/redo buttons in UI with disabled states (PR #20)
- [x] Limit history depth (50 states) (PR #20)
- [x] Don't track every keystroke (consecutive edits to a cell group into one history entry) (PR #20)

---

### 15. Add Collaborative Editing
**Priority:** P3 - Major feature
**Effort:** 3-4 weeks
**Impact:** Competitive differentiation

> The last open roadmap item. Big enough to change the product's character
> (server becomes stateful, notebook file stops being the single source of
> truth) — decide deliberately before starting, not as a default next task.

- [ ] Research CRDT libraries (Yjs, Automerge)
- [ ] Add WebSocket server to local-api
- [ ] Implement real-time cell sync
- [ ] Add user cursors and presence
- [ ] Handle conflict resolution
- [ ] Add "Share" functionality
- [ ] Consider paid feature for hosted collaboration

---

## 📊 Quick Reference

### By Effort
| Task | Effort | Priority |
|------|--------|----------|
| Fix dependencies | 5 min | P0 |
| UUID IDs | 30 min | P0 |
| Magic numbers | 1 hour | P1 |
| Error handling | 2 hours | P1 |
| Error boundaries | 2 hours | P0 |
| Shared types | 4 hours | P1 |
| API validation | 4 hours | P2 |
| Offline unpkg | 4 hours | P2 |
| Redux Toolkit | 2 days | P2 |
| Memoization | 2 days | P3 |
| Tests | 3 days | P2 |
| Bundler abstraction | 3 days | P3 |
| Undo/redo | 1 week | P3 |
| Service worker | 1 week | P3 |
| Collaboration | 3-4 weeks | P3 |

### By Business Impact
1. **Fix dependencies** - Product works vs. broken
2. **UUID IDs** - Prevent data loss
3. **Error boundaries** - UX stability
4. **Shared types** - Prevent API bugs
5. **Redux Toolkit** - 2x developer velocity

---

## 🎯 Sprint Planning Suggestion

**Sprint 1 (Week 1):**
- Items 1-5 (Critical + High Priority)
- **Deliverable:** Stable, installable product with good DX

**Sprint 2 (Week 2):**
- Item 6 (Shared types)
- Item 7 (Redux Toolkit) - Start
- **Deliverable:** Type-safe architecture

**Sprint 3-4 (Weeks 3-4):**
- Item 7 (Redux Toolkit) - Complete
- Items 8-10 (Validation, Offline, Tests)
- **Deliverable:** Production-ready with tests

**Post-MVP:**
- Items 11-15 as feature work

---

## 📝 Notes

### Architecture Decisions to Document
- Why monorepo structure was chosen
- Why in-browser bundling vs. server-side
- Why Redux vs. other state management
- Why file-based storage vs. database

### Future Considerations

Shipped from the original list: ~~dark mode~~ (3.10), ~~export to static
HTML~~ (3.9). Markdown export (3.3) and import (3.11) also cover moving
notebooks in and out as plain files.

Still open, roughly by value-for-effort:
- **CLI update notice** — print a one-liner when a newer version is on npm; small, standard for CLIs
- **Version pinning in imports** (e.g. `import x from 'lodash@4'`) — pairs naturally with the IndexedDB module cache, which currently pins whatever version was fetched first; a package version management UI would build on this
- Import from GitHub gists (export already works via markdown/HTML)
- Mobile responsive design
- Syntax themes
- Multi-file notebooks (import from other notebooks)
- Custom bundler configurations per notebook

---

## 🔗 Related Documents
- See `CHANGELOG.md` for what shipped in each release
- See individual package READMEs for package-specific details

---

**Last Updated:** 2026-08-02 (post-3.11.0)
**Next Review:** before committing to collaborative editing (item 15) or the next feature batch
