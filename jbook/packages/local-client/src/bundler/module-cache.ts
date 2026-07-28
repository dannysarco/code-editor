import localForage from 'localforage';

// Every npm module fetched from unpkg during bundling is cached here
// (IndexedDB), keyed by URL. Cache hits skip the network entirely, which is
// what makes bundling previously-used packages work offline. Entries are
// pinned until cleared: 'react' resolves to whatever version unpkg served
// when it was first fetched.
export const moduleCache = localForage.createInstance({
  name: 'filecache',
});

export const moduleCacheSize = () => moduleCache.length();

// Returns the number of entries cleared. The next bundle refetches modules
// from unpkg, picking up new package versions.
export const clearModuleCache = async (): Promise<number> => {
  const count = await moduleCache.length();
  await moduleCache.clear();
  return count;
};
