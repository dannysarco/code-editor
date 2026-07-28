import './undo-redo-bar.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Undo2, Redo2 } from 'lucide-react';
import { ActionCreators } from 'redux-undo';
import { useTypedSelector } from '../hooks/use-typed-selector';
import { selectCanRedo, selectCanUndo } from '../state';

// Text inputs manage their own undo stacks (Monaco has a full one); the
// notebook-level shortcuts must not fire while the user is typing in one.
const isEditingText = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.closest('.monaco-editor, .w-md-editor') !== null ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLInputElement ||
    target.isContentEditable
  );
};

const UndoRedoBar: React.FC = () => {
  const dispatch = useDispatch();
  const canUndo = useTypedSelector(selectCanUndo);
  const canRedo = useTypedSelector(selectCanRedo);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }
      if (isEditingText(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        dispatch(ActionCreators.undo());
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        dispatch(ActionCreators.redo());
      }
    };

    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [dispatch]);

  return (
    <div className="undo-redo-bar">
      <button
        className="btn btn-secondary btn-icon undo-redo-btn"
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        onClick={() => dispatch(ActionCreators.undo())}
      >
        <Undo2 size={16} />
      </button>
      <button
        className="btn btn-secondary btn-icon undo-redo-btn"
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        onClick={() => dispatch(ActionCreators.redo())}
      >
        <Redo2 size={16} />
      </button>
    </div>
  );
};

export default UndoRedoBar;
