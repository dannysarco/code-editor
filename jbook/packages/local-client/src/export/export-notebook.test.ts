/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportNotebookHtml } from './export-notebook';
import { bundleWithCache } from '../bundler/bundle-with-cache';
import { Cell } from '../state';

vi.mock('../bundler/bundle-with-cache', () => ({
  bundleWithCache: vi.fn(async (cellId: string, input: string) => ({
    code: `/* bundled:${cellId} */`,
    err: input.includes('broken') ? 'Bundle failed' : '',
    cached: false,
  })),
}));

vi.mock('./render-markdown', () => ({
  renderMarkdownToHtml: (source: string) => `<p>md:${source}</p>`,
}));

const cells: Cell[] = [
  { id: 't1', type: 'text', content: '# Hello' },
  { id: 'c1', type: 'code', content: 'const a = 1;' },
  { id: 'c2', type: 'code', content: 'show(a)' },
];

describe('exportNotebookHtml', () => {
  let downloaded: { name: string; html: string } | null;

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
        downloaded = { name: this.download, html: await blob.text() };
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bundles each code cell with its cumulative code and downloads the page', async () => {
    await exportNotebookHtml(cells, 'notebook.html');
    // click() capture is async (blob.text()); let it settle.
    await vi.waitFor(() => expect(downloaded).not.toBeNull());

    expect(downloaded!.name).toBe('notebook.html');
    expect(downloaded!.html).toContain('<p>md:# Hello</p>');
    expect(downloaded!.html).toContain('/* bundled:c1 */');
    expect(downloaded!.html).toContain('/* bundled:c2 */');

    const bundleMock = vi.mocked(bundleWithCache);
    expect(bundleMock).toHaveBeenCalledTimes(2);
    // The second cell's input accumulates the first cell's code, with the
    // real show() only in its own segment — same rule the app bundles with.
    const [, c2Input] = bundleMock.mock.calls[1];
    expect(c2Input).toContain('const a = 1;');
    expect(c2Input).toContain('show(a)');
    expect(bundleMock.mock.calls[1][0]).toBe('c2');
  });

  it('exports a failed bundle as an error section', async () => {
    await exportNotebookHtml(
      [{ id: 'c1', type: 'code', content: 'broken(' }],
      'notebook.html'
    );
    await vi.waitFor(() => expect(downloaded).not.toBeNull());

    expect(downloaded!.html).toContain('Bundle failed');
    expect(downloaded!.html).not.toContain('<iframe');
  });
});
