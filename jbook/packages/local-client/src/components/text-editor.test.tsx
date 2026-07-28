/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextEditor from './text-editor';
import { makeStore, renderWithStore } from '../test-utils';
import { Cell } from '../state/cell';

// The markdown editor library is exercised in the browser; here we test
// TextEditor's own behavior (view/edit modes, outside-click, store updates)
// against a minimal stand-in.
vi.mock('@uiw/react-md-editor', () => {
  const MDEditor = ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (v?: string) => void;
  }) => (
    <textarea
      aria-label="markdown editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
  MDEditor.Markdown = ({ source }: { source?: string }) => (
    <div data-testid="markdown-view">{source}</div>
  );
  return { default: MDEditor };
});

const cell: Cell = { id: 't1', type: 'text', content: '# Hello' };

describe('TextEditor', () => {
  it('renders the markdown view by default', () => {
    renderWithStore(<TextEditor cell={cell} />, makeStore([cell]));
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('# Hello');
    expect(screen.queryByLabelText('markdown editor')).not.toBeInTheDocument();
  });

  it('shows a placeholder for empty cells', () => {
    const empty: Cell = { ...cell, content: '' };
    renderWithStore(<TextEditor cell={empty} />, makeStore([empty]));
    expect(screen.getByTestId('markdown-view')).toHaveTextContent(
      'Click to edit'
    );
  });

  it('switches to the editor on click and saves edits to the store', async () => {
    const user = userEvent.setup();
    const store = makeStore([cell]);
    renderWithStore(<TextEditor cell={cell} />, store);

    await user.click(screen.getByTestId('markdown-view'));
    const editor = screen.getByLabelText('markdown editor');
    expect(editor).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: '# Hello world' } });
    expect(store.getState().cells.data['t1'].content).toBe('# Hello world');
  });

  it('closes the editor when clicking outside', async () => {
    const user = userEvent.setup();
    const store = makeStore([cell]);
    const { container } = renderWithStore(
      <div>
        <TextEditor cell={cell} />
        <button>outside</button>
      </div>,
      store
    );
    void container;

    await user.click(screen.getByTestId('markdown-view'));
    expect(screen.getByLabelText('markdown editor')).toBeInTheDocument();

    await user.click(screen.getByText('outside'));
    expect(screen.queryByLabelText('markdown editor')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown-view')).toBeInTheDocument();
  });
});
