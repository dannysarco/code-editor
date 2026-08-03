import type { BundleResult } from '@my-scrapbook/types';
import bundler from './index';
import { getCachedBundle, setCachedBundle } from './bundle-cache';

// Cache-aware entry point shared by the bundles slice and the HTML export:
// serves the stored output when this input was bundled before, and stores
// the result otherwise. Lives apart from the bundler itself so callers (and
// tests) can treat "run esbuild" and "consult the cache" as separate seams.
export const bundleWithCache = async (
  cellId: string,
  input: string
): Promise<BundleResult & { durationMs?: number; cached: boolean }> => {
  const cached = await getCachedBundle(cellId, input);
  if (cached) {
    return { ...cached, cached: true };
  }

  const started = performance.now();
  const result = await bundler(input);
  await setCachedBundle(cellId, input, result);
  return { ...result, durationMs: performance.now() - started, cached: false };
};
