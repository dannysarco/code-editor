import localForage from 'localforage';
import type { BundleResult } from '@my-scrapbook/types';

// Bundling is deterministic given a cell's cumulative source and the pinned
// module cache, so a bundle's output can be reused whenever the same input
// comes back: page reload, undo/redo, moving a cell and moving it back, or
// Run all over unchanged cells. Two layers:
//
// - an in-memory LRU keyed by the input source, for same-session repeats
//   whose input is no longer any cell's latest (undo/redo, reorders);
// - one persistent entry per cell (IndexedDB) holding the latest input and
//   output, which is what makes an unchanged notebook load instantly on
//   reload while keeping storage bounded by notebook size. Entries for
//   deleted cells linger until Clear cache; they're never served because
//   lookups require an exact input match.
//
// Only successful bundles are cached, and the cache is cleared together with
// the module cache: outputs bake in whatever module versions were pinned
// when they were built.

const MAX_MEMORY_ENTRIES = 10;

const memoryCache = new Map<string, BundleResult>();

const persistentCache = localForage.createInstance({
  name: 'bundlecache',
});

interface PersistentEntry {
  input: string;
  code: string;
}

export const getCachedBundle = async (
  cellId: string,
  input: string
): Promise<BundleResult | null> => {
  const inMemory = memoryCache.get(input);
  if (inMemory) {
    // Re-insert so recently used entries survive eviction longest.
    memoryCache.delete(input);
    memoryCache.set(input, inMemory);
    return inMemory;
  }

  const stored = await persistentCache.getItem<PersistentEntry>(cellId);
  if (stored && stored.input === input) {
    const result: BundleResult = { code: stored.code, err: '' };
    // Promote into memory: the persistent layer only keeps a cell's latest
    // input, so once an edit overwrites it, undoing back to this input can
    // only be served from here (reload → edit → undo).
    memoryCache.set(input, result);
    return result;
  }

  return null;
};

export const setCachedBundle = async (
  cellId: string,
  input: string,
  result: BundleResult
): Promise<void> => {
  if (result.err) {
    return;
  }

  memoryCache.set(input, result);
  while (memoryCache.size > MAX_MEMORY_ENTRIES) {
    // Map iteration order is insertion order, so the first key is the least
    // recently used (gets refresh re-inserted on every hit).
    memoryCache.delete(memoryCache.keys().next().value as string);
  }

  await persistentCache.setItem<PersistentEntry>(cellId, {
    input,
    code: result.code,
  });
};

export const clearBundleCache = async (): Promise<void> => {
  memoryCache.clear();
  await persistentCache.clear();
};
