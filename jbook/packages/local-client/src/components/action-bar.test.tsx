/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionBar from './action-bar';
import { makeStore, renderWithStore } from '../test-utils';
import { Cell } from '../state/cell';

const cells: Cell[] = [
  { id: 'a', type: 'code', content: '' },
  { id: 'b', type: 'code', content: '' },
];

describe('ActionBar', () => {
  it('moves the cell up and down through the store', async () => {
    const user = userEvent.setup();
    const store = makeStore(cells);
    renderWithStore(<ActionBar id="b" />, store);

    const [up, down] = screen.getAllByRole('button');

    await user.click(up);
    expect(store.getState().cells.present.order).toEqual(['b', 'a']);

    await user.click(down);
    expect(store.getState().cells.present.order).toEqual(['a', 'b']);
  });

  it('deletes the cell through the store', async () => {
    const user = userEvent.setup();
    const store = makeStore(cells);
    renderWithStore(<ActionBar id="a" />, store);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[2]);

    expect(store.getState().cells.present.order).toEqual(['b']);
    expect(store.getState().cells.present.data['a']).toBeUndefined();
  });
});
