import './action-bar.css';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { useActions } from '../hooks/use-actions';

interface ActionBarProps {
  id: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ id }) => {
  const { moveCell, deleteCell } = useActions();

  return (
    <div className="action-bar">
      <button
        className="btn btn-icon cell-action"
        aria-label="Move cell up"
        onClick={() => moveCell(id, 'up')}
      >
        <ArrowUp size={15} />
      </button>
      <button
        className="btn btn-icon cell-action"
        aria-label="Move cell down"
        onClick={() => moveCell(id, 'down')}
      >
        <ArrowDown size={15} />
      </button>
      <button
        className="btn btn-icon cell-action"
        aria-label="Delete cell"
        onClick={() => deleteCell(id)}
      >
        <X size={15} />
      </button>
    </div>
  );
};

export default ActionBar;
