import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import cellsReducer, { fetchCells } from './state/cells-slice';
import bundlesReducer from './state/bundles-slice';
import { Cell } from './state/cell';

// A real store built from the real slices (no persist middleware, so tests
// don't fire network saves), optionally pre-seeded with cells.
export const makeStore = (cells: Cell[] = []) => {
  const store = configureStore({
    reducer: { cells: cellsReducer, bundles: bundlesReducer },
  });
  if (cells.length > 0) {
    store.dispatch({ type: fetchCells.fulfilled.type, payload: cells });
  }
  return store;
};

export type TestStore = ReturnType<typeof makeStore>;

export const renderWithStore = (
  ui: ReactElement,
  store: TestStore = makeStore()
) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return { store, ...render(ui, { wrapper }) };
};
