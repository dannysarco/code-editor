import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import {
  fetchCells,
  updateCell,
  deleteCell,
  reorderCell,
} from '../cells-slice';
import { undoableCellsReducer } from '../store';
import bundlesReducer from '../bundles-slice';
import { persistMiddleware } from './persist-middleware';
import { PERSIST_SAVE_DEBOUNCE_MS } from '../../constants';

vi.mock('axios');
vi.mock('../../bundler', () => ({ default: vi.fn() }));

const makeStore = () => {
  const store = configureStore({
    reducer: { cells: undoableCellsReducer, bundles: bundlesReducer },
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

  it('saves after a cell-changing action, debounced', async () => {
    const store = makeStore();

    store.dispatch(updateCell('a', 'show(1);'));
    expect(axios.post).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('saves after a drag reorder', async () => {
    const store = makeStore();

    store.dispatch(reorderCell('a', 1));
    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('collapses rapid changes into one save', async () => {
    const store = makeStore();

    store.dispatch(updateCell('a', 's'));
    await vi.advanceTimersByTimeAsync(100);
    store.dispatch(updateCell('a', 'sh'));
    await vi.advanceTimersByTimeAsync(100);
    store.dispatch(deleteCell('a'));
    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('saves after undo and redo', async () => {
    const { ActionCreators } = await import('redux-undo');
    const store = makeStore();

    store.dispatch(updateCell('a', 'show(1);'));
    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);
    expect(axios.post).toHaveBeenCalledTimes(1);

    store.dispatch(ActionCreators.undo());
    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);
    expect(axios.post).toHaveBeenCalledTimes(2);

    store.dispatch(ActionCreators.redo());
    await vi.advanceTimersByTimeAsync(PERSIST_SAVE_DEBOUNCE_MS);
    expect(axios.post).toHaveBeenCalledTimes(3);
  });

  it('does not save on non-cell actions', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    const store = makeStore();

    await store.dispatch(fetchCells());
    await vi.advanceTimersByTimeAsync(1000);

    expect(axios.post).not.toHaveBeenCalled();
  });
});
