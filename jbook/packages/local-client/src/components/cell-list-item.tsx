import './cell-list-item.css';
import { Cell } from '../state';
import { useTypedSelector } from '../hooks/use-typed-selector';
import CodeCell from './code-cell';
import TextEditor from './text-editor';
import ActionBar from './action-bar';
import ErrorBoundary from './error-boundary';

interface CellListItemProps {
  cell: Cell;
  index: number;
}

const CellListItem: React.FC<CellListItemProps> = ({ cell, index }) => {
  const bundle = useTypedSelector((state) => state.bundles[cell.id]);

  let status: string | null = null;
  if (cell.type === 'code') {
    if (!bundle || bundle.loading) {
      status = 'Bundling…';
    } else if (bundle.cached) {
      status = 'Bundled from cache';
    } else if (bundle.durationMs !== undefined) {
      status = `Bundled in ${Math.max(1, Math.round(bundle.durationMs))} ms`;
    }
  }

  return (
    <section className="cell-list-item ms-cell">
      <header className="cell-header">
        <span className="cell-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="label">{cell.type === 'code' ? 'Code' : 'Text'}</span>
        {status && <span className="cell-status label">{status}</span>}
        <span className="cell-header-spacer" />
        <ActionBar id={cell.id} />
      </header>
      {/* The boundary wraps only the body so the header (number, type,
          actions) stays usable when a cell crashes. */}
      <ErrorBoundary>
        {cell.type === 'code' ? (
          <CodeCell cell={cell} />
        ) : (
          <TextEditor cell={cell} />
        )}
      </ErrorBoundary>
    </section>
  );
};

export default CellListItem;
