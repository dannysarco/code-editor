import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { createBundle } from './bundles-slice';
import bundler from '../bundler';

vi.mock('../bundler', () => ({
  default: vi.fn(),
}));

const makeStore = () => configureStore({ reducer: { bundles: reducer } });

describe('bundles slice', () => {
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
