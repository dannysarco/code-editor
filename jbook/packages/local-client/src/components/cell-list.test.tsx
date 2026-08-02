/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import axios from 'axios';
import CellList from './cell-list';
import { makeStore, renderWithStore } from '../test-utils';
import { Cell } from '../state/cell';

// Stub the two leaves that can't run in jsdom (Monaco loads from a CDN, the
// markdown editor is browser-tested); everything between CellList and them is
// real: cell-list-item, code-cell, text-editor, error boundaries, add-cells.
vi.mock('./code-editor', () => ({
  default: ({ initialValue }: { initialValue: string }) => {
    if (initialValue === 'CRASH') {
      throw new Error('editor exploded');
    }
    return <div data-testid="editor">{initialValue}</div>;
  },
}));
vi.mock('@uiw/react-md-editor', () => {
  const MDEditor = () => <textarea aria-label="markdown editor" />;
  MDEditor.Markdown = ({ source }: { source?: string }) => (
    <div data-testid="markdown-view">{source}</div>
  );
  return { default: MDEditor };
});
vi.mock('../bundler', () => ({ default: vi.fn() }));
vi.mock('axios');

import bundler from '../bundler';

const cells: Cell[] = [
  { id: 'code-1', type: 'code', content: "show('first');" },
  { id: 'text-1', type: 'text', content: '## Notes' },
];

describe('CellList', () => {
  beforeEach(() => {
    vi.mocked(bundler).mockResolvedValue({ code: '', err: '' });
    vi.mocked(axios.get).mockResolvedValue({ data: cells });
  });

  it('fetches cells on mount and renders them in order', async () => {
    renderWithStore(<CellList />);

    expect(await screen.findByTestId('editor')).toHaveTextContent(
      "show('first');"
    );
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('## Notes');
    expect(vi.mocked(axios.get)).toHaveBeenCalledWith('/cells');

    // code cell before text cell, matching the fetched order
    const items = document.querySelectorAll('.cell-list-item');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('[data-testid="editor"]')).not.toBeNull();
    expect(
      items[1].querySelector('[data-testid="markdown-view"]')
    ).not.toBeNull();
  });

  it('renders an add-cell divider before each cell and one lead divider', async () => {
    renderWithStore(<CellList />);
    await screen.findByTestId('editor');

    // one leading divider + one after each of the two cells
    expect(document.querySelectorAll('.add-cell')).toHaveLength(3);
  });

  it('renders a drag handle on every cell', async () => {
    renderWithStore(<CellList />);
    await screen.findByTestId('editor');

    expect(
      screen.getAllByRole('button', { name: /drag to reorder/i })
    ).toHaveLength(2);
  });

  it('isolates a crashing cell without unmounting its siblings', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 'bad', type: 'code', content: 'CRASH' }, ...cells],
    });

    renderWithStore(<CellList />);

    // the crashed cell shows the boundary fallback...
    expect(
      await screen.findByText('Something went wrong in this cell')
    ).toBeInTheDocument();
    expect(screen.getByText('editor exploded')).toBeInTheDocument();

    // ...while its siblings render normally
    expect(screen.getByTestId('editor')).toHaveTextContent("show('first');");
    expect(screen.getByTestId('markdown-view')).toHaveTextContent('## Notes');
    spy.mockRestore();
  });
});
