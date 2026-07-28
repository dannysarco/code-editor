import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { configureStore } from '@reduxjs/toolkit';
import reducer, {
  deleteCell,
  fetchCells,
  insertCellAfter,
  moveCell,
  saveCells,
  updateCell,
} from './cells-slice';
import { Cell } from './cell';
import { undoableCellsReducer } from './store';

vi.mock('axios');

const cellA: Cell = { id: 'a', type: 'code', content: 'show(1);' };
const cellB: Cell = { id: 'b', type: 'text', content: '# hi' };

const stateWith = (...cells: Cell[]) =>
  reducer(reducer(undefined, { type: 'init' }), {
    type: fetchCells.fulfilled.type,
    payload: cells,
  } as ReturnType<typeof fetchCells.fulfilled>);

describe('cells reducers', () => {
  it('updateCell replaces a cell content', () => {
    const state = stateWith(cellA, cellB);
    const next = reducer(state, updateCell('a', 'show(2);'));
    expect(next.data['a'].content).toBe('show(2);');
    expect(next.data['b'].content).toBe(cellB.content);
  });

  it('deleteCell removes the cell from data and order', () => {
    const state = stateWith(cellA, cellB);
    const next = reducer(state, deleteCell('a'));
    expect(next.order).toEqual(['b']);
    expect(next.data['a']).toBeUndefined();
  });

  it('moveCell swaps neighbors', () => {
    const state = stateWith(cellA, cellB);
    const next = reducer(state, moveCell('b', 'up'));
    expect(next.order).toEqual(['b', 'a']);
  });

  it('moveCell is a no-op at the boundaries', () => {
    const state = stateWith(cellA, cellB);
    expect(reducer(state, moveCell('a', 'up')).order).toEqual(['a', 'b']);
    expect(reducer(state, moveCell('b', 'down')).order).toEqual(['a', 'b']);
  });

  it('insertCellAfter inserts after the given id', () => {
    const state = stateWith(cellA, cellB);
    const next = reducer(state, insertCellAfter('a', 'text'));
    expect(next.order).toHaveLength(3);
    expect(next.order[1]).not.toBe('b');
    expect(next.data[next.order[1]].type).toBe('text');
  });

  it('insertCellAfter with null id prepends', () => {
    const state = stateWith(cellA, cellB);
    const next = reducer(state, insertCellAfter(null, 'code'));
    expect(next.order).toHaveLength(3);
    expect(next.order.slice(1)).toEqual(['a', 'b']);
  });

  it('generates unique v4 UUID cell ids', () => {
    let state = reducer(undefined, { type: 'init' });
    for (let i = 0; i < 1000; i++) {
      state = reducer(state, insertCellAfter(null, 'code'));
    }
    const ids = new Set(state.order);
    expect(ids.size).toBe(1000);
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });
});

describe('fetch/save thunks', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.post).mockReset();
  });

  const makeStore = () =>
    configureStore({ reducer: { cells: undoableCellsReducer } });

  it('fetchCells loads cells into state', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [cellA, cellB] });
    const store = makeStore();

    await store.dispatch(fetchCells());

    const { present: cells } = store.getState().cells;
    expect(cells.loading).toBe(false);
    expect(cells.order).toEqual(['a', 'b']);
    expect(cells.data['b']).toEqual(cellB);
  });

  it('fetchCells failure records the error', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('nope'));
    const store = makeStore();

    await store.dispatch(fetchCells());

    const { present: cells } = store.getState().cells;
    expect(cells.loading).toBe(false);
    expect(cells.error).toBe('nope');
  });

  it('saveCells posts cells in order', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [cellA, cellB] });
    vi.mocked(axios.post).mockResolvedValue({ data: { status: 'ok' } });
    const store = makeStore();
    await store.dispatch(fetchCells());

    await store.dispatch(saveCells());

    expect(axios.post).toHaveBeenCalledWith('/cells', {
      cells: [cellA, cellB],
    });
  });

  it('saveCells failure records the error', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('disk full'));
    const store = makeStore();

    await store.dispatch(saveCells());

    expect(store.getState().cells.present.error).toBe('disk full');
  });
});
