import localForage from 'localforage';

// Every npm module fetched from unpkg during bundling is cached here
// (IndexedDB), keyed by URL. Cache hits skip the network entirely, which is
// what makes bundling previously-used packages work offline. Entries are
// pinned until cleared: 'react' resolves to whatever version unpkg served
// when it was first fetched. Version-pinned imports ('lodash@4') are
// distinct keys, so they never collide with a bare import of the same
// package — pinning is the explicit way to control a version, clearing the
// cache is the way to float bare imports forward.
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
