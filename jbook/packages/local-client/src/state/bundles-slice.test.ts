import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { createBundle } from './bundles-slice';
import bundler from '../bundler';
import { getCachedBundle, setCachedBundle } from '../bundler/bundle-cache';

vi.mock('../bundler', () => ({
  default: vi.fn(),
}));

vi.mock('../bundler/bundle-cache', () => ({
  getCachedBundle: vi.fn(),
  setCachedBundle: vi.fn(),
}));

const makeStore = () => configureStore({ reducer: { bundles: reducer } });

describe('bundles slice', () => {
  beforeEach(() => {
    vi.mocked(bundler).mockReset();
    vi.mocked(getCachedBundle).mockReset().mockResolvedValue(null);
    vi.mocked(setCachedBundle).mockReset().mockResolvedValue(undefined);
  });

  it('marks the cell as loading while bundling', async () => {
    let resolveBundle!: (value: { code: string; err: string }) => void;
    vi.mocked(bundler).mockReturnValue(
      new Promise((resolve) => {
        resolveBundle = resolve;
      })
    );
    const store = makeStore();

    const pending = store.dispatch(createBundle('cell-1', 'show(1);'));
    expect(store.getState().bundles['cell-1']).toEqual({
      loading: true,
      code: '',
      err: '',
    });

    resolveBundle({ code: 'bundled!', err: '' });
    await pending;
    expect(store.getState().bundles['cell-1']).toEqual({
      loading: false,
      code: 'bundled!',
      err: '',
      durationMs: expect.any(Number),
      cached: false,
    });
  });

  it('serves a cached bundle without running the bundler', async () => {
    vi.mocked(getCachedBundle).mockResolvedValue({ code: 'cached!', err: '' });
    const store = makeStore();

    await store.dispatch(createBundle('cell-1', 'show(1);'));

    expect(bundler).not.toHaveBeenCalled();
    expect(setCachedBundle).not.toHaveBeenCalled();
    expect(store.getState().bundles['cell-1']).toEqual({
      loading: false,
      code: 'cached!',
      err: '',
      durationMs: undefined,
      cached: true,
    });
  });

  it('caches results after bundling', async () => {
    vi.mocked(bundler).mockResolvedValue({ code: 'fresh', err: '' });
    const store = makeStore();

    await store.dispatch(createBundle('cell-1', 'show(1);'));

    expect(setCachedBundle).toHaveBeenCalledWith('cell-1', 'show(1);', {
      code: 'fresh',
      err: '',
    });
  });

  it('stores bundler-reported errors', async () => {
    vi.mocked(bundler).mockResolvedValue({ code: '', err: 'syntax error' });
    const store = makeStore();

    await store.dispatch(createBundle('cell-1', 'show(;'));

    expect(store.getState().bundles['cell-1']).toEqual({
      loading: false,
      code: '',
      err: 'syntax error',
      durationMs: expect.any(Number),
      cached: false,
    });
  });

  it('recovers when the bundler throws unexpectedly', async () => {
    vi.mocked(bundler).mockRejectedValue(new Error('wasm exploded'));
    const store = makeStore();

    await store.dispatch(createBundle('cell-1', 'show(1);'));

    const bundle = store.getState().bundles['cell-1'];
    expect(bundle?.loading).toBe(false);
    expect(bundle?.err).toBe('wasm exploded');
  });

  it('tracks bundles per cell', async () => {
    vi.mocked(bundler)
      .mockResolvedValueOnce({ code: 'one', err: '' })
      .mockResolvedValueOnce({ code: 'two', err: '' });
    const store = makeStore();

    await store.dispatch(createBundle('cell-1', 'show(1);'));
    await store.dispatch(createBundle('cell-2', 'show(2);'));

    expect(store.getState().bundles['cell-1']?.code).toBe('one');
    expect(store.getState().bundles['cell-2']?.code).toBe('two');
  });
});
