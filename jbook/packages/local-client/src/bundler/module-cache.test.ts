import { beforeEach, describe, expect, it, vi } from 'vitest';

const cache = vi.hoisted(() => ({
  length: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('localforage', () => ({
  default: {
    createInstance: () => cache,
  },
}));

import { clearModuleCache, moduleCacheSize } from './module-cache';

describe('module cache', () => {
  beforeEach(() => {
    cache.length.mockReset();
    cache.clear.mockReset().mockResolvedValue(undefined);
  });

  it('reports its size', async () => {
    cache.length.mockResolvedValue(7);
    await expect(moduleCacheSize()).resolves.toBe(7);
  });

  it('clears all entries and reports how many were removed', async () => {
    cache.length.mockResolvedValue(3);

    await expect(clearModuleCache()).resolves.toBe(3);
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
});
