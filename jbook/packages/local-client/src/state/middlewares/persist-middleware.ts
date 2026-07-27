import { isAnyOf, Middleware } from '@reduxjs/toolkit';
import {
  deleteCell,
  insertCellAfter,
  moveCell,
  saveCells,
  updateCell,
} from '../cells-slice';
import type { AppDispatch } from '../store';

const isPersistTrigger = isAnyOf(
  updateCell,
  deleteCell,
  moveCell,
  insertCellAfter
);

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
      }, 250);
    }

    return result;
  };
};
