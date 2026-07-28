/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCell from './add-cell';
import { makeStore, renderWithStore } from '../test-utils';
import { Cell } from '../state/cell';

const seed: Cell[] = [{ id: 'a', type: 'code', content: '' }];

describe('AddCell', () => {
  it('inserts a code cell after the given cell', async () => {
    const user = userEvent.setup();
    const store = makeStore(seed);
    renderWithStore(<AddCell previousCellId="a" />, store);

    await user.click(screen.getByRole('button', { name: /code/i }));

    const { order, data } = store.getState().cells;
    expect(order).toHaveLength(2);
    expect(order[0]).toBe('a');
    expect(data[order[1]].type).toBe('code');
  });

  it('inserts a text cell at the top when previousCellId is null', async () => {
    const user = userEvent.setup();
    const store = makeStore(seed);
    renderWithStore(<AddCell previousCellId={null} />, store);

    await user.click(screen.getByRole('button', { name: /text/i }));

    const { order, data } = store.getState().cells;
    expect(order).toHaveLength(2);
    expect(order[1]).toBe('a');
    expect(data[order[0]].type).toBe('text');
  });
});
