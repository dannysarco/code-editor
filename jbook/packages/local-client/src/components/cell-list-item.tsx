import './cell-list-item.css';
import { GripVertical } from 'lucide-react';
import type { DraggableAttributes } from '@dnd-kit/core';
import { Cell } from '../state';
import { useTypedSelector } from '../hooks/use-typed-selector';
import CodeCell from './code-cell';
import TextEditor from './text-editor';
import ActionBar from './action-bar';
import ErrorBoundary from './error-boundary';

// Activator props from useSortable: the whole cell is the sortable node, but
// only the header grip starts a drag, so Monaco and the preview stay
// interactive.
export interface DragHandleProps {
  ref: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners?: Record<string, unknown>;
}

interface CellListItemProps {
  cell: Cell;
  index: number;
  dragHandle?: DragHandleProps;
}

const CellListItem: React.FC<CellListItemProps> = ({
  cell,
  index,
  dragHandle,
}) => {
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
        {dragHandle && (
          <button
            type="button"
            className="drag-handle"
            aria-label="Drag to reorder cell"
            title="Drag to reorder (or use the arrow buttons)"
            ref={dragHandle.ref}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
          >
            <GripVertical size={14} />
          </button>
        )}
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
