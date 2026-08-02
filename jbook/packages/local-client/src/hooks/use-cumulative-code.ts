import { useMemo } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { useTypedSelector } from './use-typed-selector';
import { selectCells } from '../state';
import { Cell } from '../state';

const showFunc = `
    import _React from 'react';
    import _ReactDOMClient from 'react-dom/client';
    var _reactRoot;
    var show = (value) => {
      const root = document.querySelector('#root');

      if (typeof value === 'object') {
        if (value.$$typeof && value.props) {
          // unpkg serves the latest React, where ReactDOM.render no longer
          // exists; reuse a single createRoot per preview execution.
          if (!_reactRoot) {
            _reactRoot = _ReactDOMClient.createRoot(root);
          }
          _reactRoot.render(value);
        } else {
          root.innerHTML = JSON.stringify(value);
        }
      } else {
        root.innerHTML = value;
      }
    };
  `;
const showFuncNoop = 'var show = () => {}';

// The code a cell executes is every code cell above it plus itself, with the
// real show() only in the target cell. Shared with the header's "Run all".
export const cumulativeCodeFor = (
  orderedCells: Cell[],
  cellId: string
): string => {
  const cumulativeCode = [];
  for (let c of orderedCells) {
    if (c.type === 'code') {
      if (c.id === cellId) {
        cumulativeCode.push(showFunc);
      } else {
        cumulativeCode.push(showFuncNoop);
      }
      cumulativeCode.push(c.content);
    }
    if (c.id === cellId) {
      break;
    }
  }
  return cumulativeCode.join('\n');
};

export const useCumulativeCode = (cellId: string) => {
  // Memoized per hook instance: the join only recomputes when the cells
  // slice actually changes, not on every store dispatch (bundle lifecycle
  // actions fire constantly while typing).
  const selectCumulativeCode = useMemo(
    () =>
      createSelector([selectCells], ({ data, order }) =>
        cumulativeCodeFor(
          order.map((id) => data[id]),
          cellId
        )
      ),
    [cellId]
  );
  return useTypedSelector(selectCumulativeCode);
};
