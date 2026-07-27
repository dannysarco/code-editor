import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import cellsReducer, { fetchCells, updateCell, deleteCell } from '../cells-slice';
import bundlesReducer from '../bundles-slice';
import { persistMiddleware } from './persist-middleware';

vi.mock('axios');
vi.mock('../../bundler', () => ({ default: vi.fn() }));

const makeStore = () => {
  const store = configureStore({
    reducer: { cells: cellsReducer, bundles: bundlesReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(persistMiddleware),
  });
  // seed one cell so updateCell/deleteCell have something to act on
  store.dispatch({
    type: fetchCells.fulfilled.type,
    payload: [{ id: 'a', type: 'code', content: '' }],
  });
  return store;
};

describe('persist middleware', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(axios.post).mockReset().mockResolvedValue({
      data: { status: 'ok' },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves after a cell-changing action, debounced at 250ms', async () => {
    const store = makeStore();

    store.dispatch(updateCell('a', 'show(1);'));
    expect(axios.post).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('collapses rapid changes into one save', async () => {
    const store = makeStore();

    store.dispatch(updateCell('a', 's'));
    await vi.advanceTimersByTimeAsync(100);
    store.dispatch(updateCell('a', 'sh'));
    await vi.advanceTimersByTimeAsync(100);
    store.dispatch(deleteCell('a'));
    await vi.advanceTimersByTimeAsync(250);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('does not save on non-cell actions', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    const store = makeStore();

    await store.dispatch(fetchCells());
    await vi.advanceTimersByTimeAsync(1000);

    expect(axios.post).not.toHaveBeenCalled();
  });
});
