/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UndoRedoBar from './undo-redo-bar';
import { makeStore, renderWithStore } from '../test-utils';
import { updateCell } from '../state/cells-slice';
import { Cell } from '../state/cell';

const cell: Cell = { id: 'a', type: 'code', content: 'original' };

describe('UndoRedoBar', () => {
  it('disables both buttons with no history', () => {
    renderWithStore(<UndoRedoBar />, makeStore([cell]));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
  });

  it('undoes and redoes edits via the buttons', async () => {
    const user = userEvent.setup();
    const store = makeStore([cell]);
    renderWithStore(<UndoRedoBar />, store);

    act(() => {
      store.dispatch(updateCell('a', 'edited'));
    });
    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toBeEnabled();

    await user.click(undo);
    expect(store.getState().cells.present.data['a'].content).toBe('original');

    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(redo).toBeEnabled();
    await user.click(redo);
    expect(store.getState().cells.present.data['a'].content).toBe('edited');
  });

  it('handles Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y shortcuts', () => {
    const store = makeStore([cell]);
    renderWithStore(<UndoRedoBar />, store);
    act(() => {
      store.dispatch(updateCell('a', 'edited'));
    });

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    expect(store.getState().cells.present.data['a'].content).toBe('original');

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(store.getState().cells.present.data['a'].content).toBe('edited');

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'y', ctrlKey: true });
    expect(store.getState().cells.present.data['a'].content).toBe('edited');
  });

  it('supports Cmd+Z on macOS', () => {
    const store = makeStore([cell]);
    renderWithStore(<UndoRedoBar />, store);
    act(() => {
      store.dispatch(updateCell('a', 'edited'));
    });

    fireEvent.keyDown(document.body, { key: 'z', metaKey: true });
    expect(store.getState().cells.present.data['a'].content).toBe('original');
  });

  it('does not hijack the shortcut while typing in a text input', () => {
    const store = makeStore([cell]);
    renderWithStore(
      <div>
        <UndoRedoBar />
        <textarea aria-label="editor stand-in" />
      </div>,
      store
    );
    act(() => {
      store.dispatch(updateCell('a', 'edited'));
    });

    fireEvent.keyDown(screen.getByLabelText('editor stand-in'), {
      key: 'z',
      ctrlKey: true,
    });

    // the notebook-level undo must not fire; the input owns its own undo
    expect(store.getState().cells.present.data['a'].content).toBe('edited');
  });
});
