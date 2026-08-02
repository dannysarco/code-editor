import { isAnyOf, Middleware } from '@reduxjs/toolkit';
import { ActionTypes as UndoActionTypes } from 'redux-undo';
import {
  deleteCell,
  insertCellAfter,
  moveCell,
  reorderCell,
  saveCells,
  updateCell,
} from '../cells-slice';
import type { AppDispatch } from '../store';
import { PERSIST_SAVE_DEBOUNCE_MS } from '../../constants';

const isCellEdit = isAnyOf(
  updateCell,
  deleteCell,
  moveCell,
  reorderCell,
  insertCellAfter
);

// Undo/redo restore a different notebook state and must be persisted too.
const isPersistTrigger = (action: unknown): boolean =>
  isCellEdit(action) ||
  (action as { type?: string }).type === UndoActionTypes.UNDO ||
  (action as { type?: string }).type === UndoActionTypes.REDO;

// Debounces a saveCells dispatch after any action that changes cell content
// or ordering.
export const persistMiddleware: Middleware = ({ dispatch }) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (next) => (action) => {
    const result = next(action);

    if (isPersistTrigger(action)) {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        (dispatch as AppDispatch)(saveCells());
      }, PERSIST_SAVE_DEBOUNCE_MS);
    }

    return result;
  };
};
