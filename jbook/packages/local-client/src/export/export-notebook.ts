import { Cell } from '../state';
import { cumulativeCodeFor } from '../hooks/use-cumulative-code';
import { bundleWithCache } from '../bundler/bundle-with-cache';
import { renderMarkdownToHtml } from './render-markdown';
import { buildExportHtml, ExportCell } from './export-html';

const downloadHtml = (html: string, filename: string): void => {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

// Assembles a self-contained HTML file from the notebook and hands it to the
// browser as a download. Code cells are bundled exactly as the app bundles
// them (same cumulative input, same cache), so an unchanged notebook exports
// without re-running esbuild.
export const exportNotebookHtml = async (
  orderedCells: Cell[],
  filename: string
): Promise<void> => {
  const items: ExportCell[] = [];

  for (const cell of orderedCells) {
    if (cell.type === 'text') {
      items.push({ type: 'text', html: renderMarkdownToHtml(cell.content) });
    } else {
      const result = await bundleWithCache(
        cell.id,
        cumulativeCodeFor(orderedCells, cell.id)
      );
      items.push({
        type: 'code',
        id: cell.id,
        source: cell.content,
        bundledCode: result.code,
        bundleErr: result.err,
      });
    }
  }

  downloadHtml(buildExportHtml(items, new Date()), filename);
};
