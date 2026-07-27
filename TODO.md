# My Scrapbook - Prioritized Refactor Roadmap

> Generated from architecture analysis on 2025-10-29

## 🔴 CRITICAL - Do Immediately (Blocking Issues)

### 1. Fix Production Dependency Declaration ⚠️ BLOCKER
**Priority:** P0 - Prevents npm install
**Effort:** 5 minutes
**Impact:** Product literally doesn't work

- [x] Move `@my-scrapbook/local-api` from devDependencies to dependencies in `jbook/packages/cli/package.json` (PR #5)
- [ ] Test: Run `npm pack` and verify package contents
- [ ] Test: Clean install in fresh directory
- [ ] Publish patch version (pending: v3.0.0 was never published to npm; latest on the registry is 2.0.3 with the same bug — needs an `npm publish` decision)

**Files:**
- `jbook/packages/cli/package.json:23-24`

---

### 2. Replace Random ID Generation with UUIDs
**Priority:** P0 - Data safety risk
**Effort:** 30 minutes
**Impact:** Prevents potential data loss from ID collisions

- [x] Install `uuid` package in local-client (PR #10)
- [x] Replace `Math.random().toString(36).substr(2, 5)` with `uuidv4()` (PR #10)
- [ ] Add unit test for unique ID generation (deferred to item 10 — no test infrastructure yet)
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
- [ ] Add tests for invalid inputs (deferred to item 10 — no test infrastructure yet; the cases were exercised manually against the running server)

**Files:**
- `jbook/packages/local-api/src/routes/cells.ts:33-42`

---

### 9. Fix Hardcoded unpkg URLs
**Priority:** P2 - Offline support
**Effort:** 4 hours
**Impact:** Works offline, version flexibility

- [x] Ship esbuild.wasm locally — bundled from the installed package via Vite `?url` import (PR #7)
- [x] Update bundler to use the local WASM file (PR #7)
- [ ] Fallback to unpkg if local fails
- [x] Version always matches the installed esbuild-wasm package (PR #7)
- [ ] Update README with offline capabilities

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
- [ ] Test CLI command parsing (deferred; the serve command is a thin commander wrapper)

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

- [ ] Create service worker for caching unpkg responses
- [ ] Cache frequently used packages (react, axios, etc.)
- [ ] Add "Offline Mode" indicator in UI
- [ ] Handle cache invalidation strategy
- [ ] Add settings to clear cache

---

### 12. Add Cell Result Memoization
**Priority:** P3 - Performance
**Effort:** 2 days
**Impact:** Faster re-renders, less bundling

- [ ] Memoize `useCumulativeCode` hook with `useMemo`
- [ ] Track cell dependencies
- [ ] Only rebundle cells affected by changes
- [ ] Add performance monitoring

**Files:**
- `jbook/packages/local-client/src/hooks/use-cumulative-code.ts`

---

### 13. Decouple Bundler from UI
**Priority:** P3 - Architectural improvement
**Effort:** 3 days
**Impact:** Pluggable bundler system

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

- [ ] Install `redux-undo` or implement custom middleware
- [ ] Add undo/redo to cell updates
- [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- [ ] Add undo/redo buttons in UI
- [ ] Limit history depth (e.g., 50 actions)
- [ ] Don't track every keystroke (debounce)

---

### 15. Add Collaborative Editing
**Priority:** P3 - Major feature
**Effort:** 3-4 weeks
**Impact:** Competitive differentiation

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
- Multi-file notebooks (import from other notebooks)
- Dark mode support
- Syntax themes
- Mobile responsive design
- Export to static HTML
- Import from GitHub gists
- Package version management UI
- Custom bundler configurations per notebook

---

## 🔗 Related Documents
- See `ARCHITECTURE.md` for detailed analysis
- See `CONTRIBUTING.md` for development setup
- See individual package READMEs for package-specific details

---

**Last Updated:** 2025-10-29
**Next Review:** After Sprint 1 completion
