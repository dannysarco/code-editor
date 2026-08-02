import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistent = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('localforage', () => ({
  default: {
    createInstance: () => persistent,
  },
}));

import {
  clearBundleCache,
  getCachedBundle,
  setCachedBundle,
} from './bundle-cache';

describe('bundle cache', () => {
  beforeEach(async () => {
    persistent.getItem.mockReset().mockResolvedValue(null);
    persistent.setItem.mockReset().mockResolvedValue(undefined);
    persistent.clear.mockReset().mockResolvedValue(undefined);
    // The in-memory layer is module state; empty it between tests.
    await clearBundleCache();
    persistent.clear.mockClear();
  });

  it('returns same-session results from memory without touching storage', async () => {
    await setCachedBundle('cell-1', 'input-a', { code: 'out-a', err: '' });

    const result = await getCachedBundle('cell-1', 'input-a');
    expect(result).toEqual({ code: 'out-a', err: '' });
    expect(persistent.getItem).not.toHaveBeenCalled();
  });

  it('shares memory entries across cells with identical input', async () => {
    await setCachedBundle('cell-1', 'same-input', { code: 'out', err: '' });

    expect(await getCachedBundle('cell-2', 'same-input')).toEqual({
      code: 'out',
      err: '',
    });
  });

  it('falls back to the persisted per-cell entry on matching input', async () => {
    persistent.getItem.mockResolvedValue({ input: 'input-a', code: 'stored' });

    expect(await getCachedBundle('cell-1', 'input-a')).toEqual({
      code: 'stored',
      err: '',
    });
    expect(persistent.getItem).toHaveBeenCalledWith('cell-1');
  });

  it('promotes persistent hits into memory so undo works after an edit overwrites the per-cell entry', async () => {
    // Reload: served from the persistent layer.
    persistent.getItem.mockResolvedValue({ input: 'original', code: 'out-a' });
    await getCachedBundle('cell-1', 'original');

    // Edit: the cell's persistent entry now holds the new input.
    persistent.getItem.mockResolvedValue({ input: 'edited', code: 'out-b' });

    // Undo: only the promoted memory entry can serve the original input.
    persistent.getItem.mockClear();
    expect(await getCachedBundle('cell-1', 'original')).toEqual({
      code: 'out-a',
      err: '',
    });
    expect(persistent.getItem).not.toHaveBeenCalled();
  });

  it('misses when the persisted entry is for different input', async () => {
    persistent.getItem.mockResolvedValue({ input: 'old-input', code: 'stale' });

    expect(await getCachedBundle('cell-1', 'new-input')).toBeNull();
  });

  it('does not cache failed bundles', async () => {
    await setCachedBundle('cell-1', 'bad-input', {
      code: '',
      err: 'syntax error',
    });

    expect(persistent.setItem).not.toHaveBeenCalled();
    expect(await getCachedBundle('cell-1', 'bad-input')).toBeNull();
  });

  it('evicts the least recently used memory entry beyond the cap', async () => {
    for (let i = 0; i < 11; i++) {
      await setCachedBundle('cell-1', `input-${i}`, {
        code: `out-${i}`,
        err: '',
      });
    }

    // input-0 was evicted (memory miss falls through to storage, which has
    // only the latest entry for the cell); input-10 is still in memory.
    persistent.getItem.mockResolvedValue(null);
    expect(await getCachedBundle('cell-1', 'input-0')).toBeNull();
    persistent.getItem.mockClear();
    expect(await getCachedBundle('cell-1', 'input-10')).toEqual({
      code: 'out-10',
      err: '',
    });
    expect(persistent.getItem).not.toHaveBeenCalled();
  });

  it('clear empties both layers', async () => {
    await setCachedBundle('cell-1', 'input-a', { code: 'out-a', err: '' });

    await clearBundleCache();

    expect(persistent.clear).toHaveBeenCalledTimes(1);
    persistent.getItem.mockResolvedValue(null);
    expect(await getCachedBundle('cell-1', 'input-a')).toBeNull();
  });
});
