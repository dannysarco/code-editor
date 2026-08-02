import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Cell } from '../state';
import CellListItem from './cell-list-item';
import AddCell from './add-cell';

interface SortableCellProps {
  cell: Cell;
  index: number;
}

// One sortable unit is a cell plus its trailing add-cell rail, so the rail
// travels with its cell while items shift around during a drag.
const SortableCell: React.FC<SortableCellProps> = ({ cell, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id });

  return (
    <div
      ref={setNodeRef}
      className={`sortable-cell${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <CellListItem
        cell={cell}
        index={index}
        dragHandle={{ ref: setActivatorNodeRef, attributes, listeners }}
      />
      <AddCell previousCellId={cell.id} />
    </div>
  );
};

export default SortableCell;
