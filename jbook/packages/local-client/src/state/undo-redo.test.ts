import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { ActionCreators } from 'redux-undo';
import { undoableCellsReducer } from './store';
import {
  deleteCell,
  fetchCells,
  insertCellAfter,
  moveCell,
  reorderCell,
  updateCell,
} from './cells-slice';
import { Cell } from './cell';
import { UNDO_HISTORY_LIMIT } from '../constants';

const cells: Cell[] = [
  { id: 'a', type: 'code', content: 'show(1);' },
  { id: 'b', type: 'text', content: '# hi' },
];

const makeStore = () => {
  const store = configureStore({
    reducer: { cells: undoableCellsReducer },
  });
  store.dispatch({ type: fetchCells.fulfilled.type, payload: cells });
  return store;
};

const present = (store: ReturnType<typeof makeStore>) =>
  store.getState().cells.present;
const past = (store: ReturnType<typeof makeStore>) =>
  store.getState().cells.past;

describe('notebook undo/redo', () => {
  it('loading the notebook is not undoable', () => {
    const store = makeStore();
    expect(past(store)).toHaveLength(0);

    store.dispatch(ActionCreators.undo());
    expect(present(store).order).toEqual(['a', 'b']);
  });

  it('undoes and redoes a content edit', () => {
    const store = makeStore();
    store.dispatch(updateCell('a', 'show(2);'));

    store.dispatch(ActionCreators.undo());
    expect(present(store).data['a'].content).toBe('show(1);');

    store.dispatch(ActionCreators.redo());
    expect(present(store).data['a'].content).toBe('show(2);');
  });

  it('undo restores a deleted cell with its content and position', () => {
    const store = makeStore();
    store.dispatch(deleteCell('a'));
    expect(present(store).order).toEqual(['b']);

    store.dispatch(ActionCreators.undo());
    expect(present(store).order).toEqual(['a', 'b']);
    expect(present(store).data['a'].content).toBe('show(1);');
  });

  it('undo reverts a move', () => {
    const store = makeStore();
    store.dispatch(moveCell('b', 'up'));
    expect(present(store).order).toEqual(['b', 'a']);

    store.dispatch(ActionCreators.undo());
    expect(present(store).order).toEqual(['a', 'b']);
  });

  it('undo reverts a drag reorder', () => {
    const store = makeStore();
    store.dispatch(reorderCell('a', 1));
    expect(present(store).order).toEqual(['b', 'a']);

    store.dispatch(ActionCreators.undo());
    expect(present(store).order).toEqual(['a', 'b']);
  });

  it('groups a typing burst in one cell into a single history entry', () => {
    const store = makeStore();
    store.dispatch(updateCell('a', 's'));
    store.dispatch(updateCell('a', 'sh'));
    store.dispatch(updateCell('a', 'show(9);'));
    expect(past(store)).toHaveLength(1);

    store.dispatch(ActionCreators.undo());
    expect(present(store).data['a'].content).toBe('show(1);');
  });

  it('starts a new history entry when editing a different cell', () => {
    const store = makeStore();
    store.dispatch(updateCell('a', 'show(2);'));
    store.dispatch(updateCell('b', '# edited'));
    expect(past(store)).toHaveLength(2);

    store.dispatch(ActionCreators.undo());
    expect(present(store).data['b'].content).toBe('# hi');
    expect(present(store).data['a'].content).toBe('show(2);');

    store.dispatch(ActionCreators.undo());
    expect(present(store).data['a'].content).toBe('show(1);');
  });

  it('a new edit clears the redo future', () => {
    const store = makeStore();
    store.dispatch(updateCell('a', 'show(2);'));
    store.dispatch(ActionCreators.undo());
    expect(store.getState().cells.future).toHaveLength(1);

    store.dispatch(deleteCell('b'));
    expect(store.getState().cells.future).toHaveLength(0);
  });

  it('caps history at UNDO_HISTORY_LIMIT entries', () => {
    const store = makeStore();
    for (let i = 0; i < UNDO_HISTORY_LIMIT + 10; i++) {
      store.dispatch(insertCellAfter(null, 'code'));
    }
    // redux-undo's limit counts the present state as one of the history
    // states, so past holds limit - 1 entries.
    expect(past(store)).toHaveLength(UNDO_HISTORY_LIMIT - 1);
  });
});
