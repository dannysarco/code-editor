/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore, makeStore } from '../test-utils';
import { ThemeProvider } from '../theme-context';
import type { Cell } from '../state/cell';

// Force the demo build's view of the header; the default-mode header is
// covered alongside the rest of the app's component tests.
vi.mock('../demo-mode', () => ({ IS_DEMO: true }));

import NotebookHeader from './notebook-header';

const cells: Cell[] = [
  { id: 't1', type: 'text', content: '# Hello' },
  { id: 'c1', type: 'code', content: 'show(1)' },
];

describe('notebook header in demo mode', () => {
  let downloaded: { name: string; body: string } | null;

  beforeEach(() => {
    downloaded = null;
    // jsdom implements neither object URLs nor navigation; capture the blob
    // at the point it would become a download.
    URL.createObjectURL = vi.fn(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      async function (this: HTMLAnchorElement) {
        const blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
          .calls[0][0] as Blob;
        downloaded = { name: this.download, body: await blob.text() };
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderHeader = () =>
    renderWithStore(
      <ThemeProvider>
        <NotebookHeader />
      </ThemeProvider>,
      makeStore(cells)
    );

  it('labels the notebook as the demo and links to the CLI on npm', () => {
    renderHeader();

    expect(screen.getByText('demo notebook')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get the CLI' })).toHaveAttribute(
      'href',
      'https://www.npmjs.com/package/my-scrapbook'
    );
  });

  it('downloads the notebook as CLI-compatible notebook.js JSON', async () => {
    renderHeader();

    await userEvent.click(
      screen.getByRole('button', { name: 'Download notebook.js' })
    );
    await vi.waitFor(() => expect(downloaded).not.toBeNull());

    expect(downloaded!.name).toBe('notebook.js');
    // The CLI's serve command reads exactly this shape from notebook.js.
    expect(JSON.parse(downloaded!.body)).toEqual(cells);
  });
});
