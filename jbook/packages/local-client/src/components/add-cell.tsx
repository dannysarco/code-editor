import './add-cell.css';
import { Plus } from 'lucide-react';
import { useActions } from '../hooks/use-actions';

interface AddCellProps {
  previousCellId: string | null;
}

const AddCell: React.FC<AddCellProps> = ({ previousCellId }) => {
  const { insertCellAfter } = useActions();

  return (
    <div className="add-cell">
      <button
        className="btn rail-btn"
        onClick={() => insertCellAfter(previousCellId, 'code')}
      >
        <Plus size={12} strokeWidth={2.5} />
        <span>Code</span>
      </button>
      <button
        className="btn rail-btn"
        onClick={() => insertCellAfter(previousCellId, 'text')}
      >
        <Plus size={12} strokeWidth={2.5} />
        <span>Text</span>
      </button>
    </div>
  );
};

export default AddCell;
