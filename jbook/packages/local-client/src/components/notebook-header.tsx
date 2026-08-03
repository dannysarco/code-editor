import './notebook-header.css';
import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme-context';
import { useTypedSelector } from '../hooks/use-typed-selector';
import { useActions } from '../hooks/use-actions';
import { selectCells } from '../state';
import { cumulativeCodeFor } from '../hooks/use-cumulative-code';
import { PERSIST_SAVE_DEBOUNCE_MS, NOTEBOOK_FILENAME } from '../constants';
import { exportNotebookHtml } from '../export/export-notebook';
import OfflineStatus from './offline-status';
import UndoRedoBar from './undo-redo-bar';

const EXPORT_FILENAME = NOTEBOOK_FILENAME.replace(/\.[^.]*$/, '') + '.html';

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const NotebookHeader: React.FC = () => {
  const { createBundle } = useActions();
  const { theme, toggleTheme } = useTheme();
  // `present` is referentially stable across non-cell actions (bundles,
  // undo bookkeeping), so the save-state effect only fires on real edits.
  const present = useTypedSelector(selectCells);

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isFirstChange = useRef(true);

  useEffect(() => {
    // The first change is the initial fetch — the notebook is in sync on
    // load, not being saved.
    if (isFirstChange.current) {
      isFirstChange.current = false;
      setSavedAt(new Date());
      return;
    }
    setSaving(true);
    // The persist middleware debounces the POST; mirror its window (plus a
    // little slack for the request itself) rather than tracking the request.
    const timer = setTimeout(() => {
      setSaving(false);
      setSavedAt(new Date());
    }, PERSIST_SAVE_DEBOUNCE_MS + 250);
    return () => clearTimeout(timer);
  }, [present]);

  const onRunAll = () => {
    const cells = present.order.map((id) => present.data[id]);
    for (const cell of cells) {
      if (cell.type === 'code') {
        createBundle(cell.id, cumulativeCodeFor(cells, cell.id));
      }
    }
  };

  const [exportState, setExportState] = useState<
    'idle' | 'exporting' | 'failed'
  >('idle');

  const onExportHtml = async () => {
    setExportState('exporting');
    try {
      await exportNotebookHtml(
        present.order.map((id) => present.data[id]),
        EXPORT_FILENAME
      );
      setExportState('idle');
    } catch (err) {
      // Bundler errors come back through the result, so reaching here is
      // unexpected (e.g. esbuild failed to initialize while offline on a
      // first visit). Keep the notebook usable and say the export failed.
      console.error('HTML export failed:', err);
      setExportState('failed');
      setTimeout(() => setExportState('idle'), 3000);
    }
  };

  return (
    <header className="notebook-header">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-name">MY SCRAPBOOK</span>
      <span className="header-divider" aria-hidden="true" />
      <span className="file-meta">
        <span className="file-name">{NOTEBOOK_FILENAME}</span>
        <span className="save-state label">
          {saving ? 'Saving…' : savedAt ? `Saved · ${formatTime(savedAt)}` : ''}
        </span>
      </span>
      <span className="header-spacer" />
      <OfflineStatus />
      <UndoRedoBar />
      <button
        className="btn btn-secondary theme-toggle"
        onClick={toggleTheme}
        aria-label={
          theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
        }
        title={
          theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
        }
      >
        {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
      </button>
      <button
        className="btn btn-secondary export-html"
        onClick={onExportHtml}
        disabled={exportState === 'exporting'}
      >
        {exportState === 'exporting'
          ? 'Exporting…'
          : exportState === 'failed'
          ? 'Export failed'
          : 'Export HTML'}
      </button>
      <button className="btn btn-primary run-all" onClick={onRunAll}>
        Run all
      </button>
    </header>
  );
};

export default NotebookHeader;
