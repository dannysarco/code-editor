/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import CodeCell from './code-cell';
import bundler from '../bundler';
import { makeStore, renderWithStore } from '../test-utils';
import { updateCell } from '../state/cells-slice';
import { Cell } from '../state/cell';
import { BUNDLE_DEBOUNCE_MS } from '../constants';

// Monaco loads from a CDN and cannot run in jsdom; CodeCell's own concern is
// the bundle lifecycle, not the editor internals.
vi.mock('./code-editor', () => ({
  default: ({ initialValue }: { initialValue: string }) => (
    <div data-testid="editor">{initialValue}</div>
  ),
}));
vi.mock('../bundler', () => ({ default: vi.fn() }));

const cell: Cell = { id: 'a', type: 'code', content: "show('one');" };

describe('CodeCell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(bundler)
      .mockReset()
      .mockResolvedValue({ code: 'bundled-js', err: '' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bundles the cumulative code on mount and swaps progress for the preview', async () => {
    const store = makeStore([cell]);
    const { container } = renderWithStore(<CodeCell cell={cell} />, store);

    // before the bundle resolves: progress bar, no preview. (Queried directly
    // rather than by role: react-resizable's Infinity inline widths crash
    // jsdom's computed-style walk during accessibility-tree checks.)
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(bundler).toHaveBeenCalledTimes(1);
    expect(vi.mocked(bundler).mock.calls[0][0]).toContain("show('one');");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(screen.getByTitle('preview')).toBeInTheDocument();
  });

  it('re-bundles after the debounce when the cell content changes', async () => {
    const store = makeStore([cell]);
    renderWithStore(<CodeCell cell={cell} />, store);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(bundler).toHaveBeenCalledTimes(1);

    act(() => {
      store.dispatch(updateCell('a', "show('two');"));
    });

    // not yet — debounced
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BUNDLE_DEBOUNCE_MS - 100);
    });
    expect(bundler).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(bundler).toHaveBeenCalledTimes(2);
    expect(vi.mocked(bundler).mock.calls[1][0]).toContain("show('two');");
  });

  it('shows the bundler-reported error alongside the preview', async () => {
    vi.mocked(bundler).mockResolvedValue({ code: '', err: 'Unexpected token' });
    const store = makeStore([cell]);
    renderWithStore(<CodeCell cell={cell} />, store);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Unexpected token')).toBeInTheDocument();
  });
});
