import localForage from 'localforage';
import type { Cell } from '../state/cell';
import { demoSeedCells } from './demo-seed';

// The demo build persists the notebook in the browser, using the same
// IndexedDB mechanism as the module and bundle caches. The notebook is
// stored whole under a single key — it is small JSON, and whole-notebook
// writes mirror what the local API does with notebook.js.
const notebookStore = localForage.createInstance({
  name: 'notebook',
});

const CELLS_KEY = 'cells';

export const loadCells = async (): Promise<Cell[]> => {
  const stored = await notebookStore.getItem<Cell[]>(CELLS_KEY);
  if (stored !== null) {
    return stored;
  }
  // First visit: open on the sample notebook rather than an empty page. The
  // seed is persisted immediately so that deleting every cell stays deleted
  // instead of resurrecting the samples on reload.
  await notebookStore.setItem(CELLS_KEY, demoSeedCells);
  return demoSeedCells;
};

export const saveCells = async (cells: Cell[]): Promise<void> => {
  await notebookStore.setItem(CELLS_KEY, cells);
};
