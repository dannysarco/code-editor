import { configureStore, Reducer } from '@reduxjs/toolkit';
import undoable, { includeAction, StateWithHistory } from 'redux-undo';
import cellsReducer, {
  CellsState,
  deleteCell,
  insertCellAfter,
  moveCell,
  updateCell,
} from './cells-slice';
import bundlesReducer from './bundles-slice';
import { persistMiddleware } from './middlewares/persist-middleware';
import { UNDO_HISTORY_LIMIT } from '../constants';

// Exported so tests can build stores with the exact same history behavior.
// The cast bridges redux-undo's redux-4-era Reducer typing to redux 5.
export const undoableCellsReducer = undoable(cellsReducer, {
  limit: UNDO_HISTORY_LIMIT,
  // Only user edits are undoable; fetch/save lifecycle actions update the
  // present state without creating history entries, so undo can never
  // rewind past the initially loaded notebook.
  filter: includeAction([
    updateCell.type,
    deleteCell.type,
    moveCell.type,
    insertCellAfter.type,
  ]),
  // Keep the internal snapshot in sync when filtered actions (like the
  // initial fetch) change the present state; without this, the first undo
  // would rewind to the pre-fetch empty notebook.
  syncFilter: true,
  // Consecutive keystrokes produce a stream of updateCell actions; group
  // them per cell into a single history entry so undo reverts the typing
  // burst in that cell, not one character — and switching to a different
  // cell starts a new entry.
  groupBy: (action) =>
    updateCell.match(action) ? `${action.type}:${action.payload.id}` : null,
}) as Reducer<StateWithHistory<CellsState>>;

export const store = configureStore({
  reducer: {
    cells: undoableCellsReducer,
    bundles: bundlesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// The cells slice is wrapped in redux-undo history; consumers read the
// current notebook through this selector rather than state.cells directly.
export const selectCells = (state: RootState) => state.cells.present;
export const selectCanUndo = (state: RootState) => state.cells.past.length > 0;
export const selectCanRedo = (state: RootState) =>
  state.cells.future.length > 0;
