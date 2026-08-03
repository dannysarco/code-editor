import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cell } from '../state/cell';

const store = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('localforage', () => ({
  default: {
    createInstance: () => store,
  },
}));

import { loadCells, saveCells } from './browser';
import { demoSeedCells } from './demo-seed';

describe('browser persistence', () => {
  beforeEach(() => {
    store.getItem.mockReset();
    store.setItem.mockReset().mockResolvedValue(undefined);
  });

  it('returns the stored notebook when one exists', async () => {
    const cells: Cell[] = [{ id: 'a', type: 'code', content: 'show(1)' }];
    store.getItem.mockResolvedValue(cells);

    await expect(loadCells()).resolves.toEqual(cells);
    expect(store.setItem).not.toHaveBeenCalled();
  });

  it('seeds and persists the sample notebook on first visit', async () => {
    store.getItem.mockResolvedValue(null);

    await expect(loadCells()).resolves.toEqual(demoSeedCells);
    // Persisted immediately: deleting every cell must stay deleted rather
    // than resurrecting the samples on the next load.
    expect(store.setItem).toHaveBeenCalledWith('cells', demoSeedCells);
  });

  it('does not re-seed an emptied notebook', async () => {
    store.getItem.mockResolvedValue([]);

    await expect(loadCells()).resolves.toEqual([]);
    expect(store.setItem).not.toHaveBeenCalled();
  });

  it('writes the whole notebook on save', async () => {
    const cells: Cell[] = [
      { id: 'a', type: 'text', content: '# hi' },
      { id: 'b', type: 'code', content: 'show(2)' },
    ];

    await saveCells(cells);
    expect(store.setItem).toHaveBeenCalledWith('cells', cells);
  });
});

describe('demo seed', () => {
  it('has unique ids and valid cell types', () => {
    const ids = demoSeedCells.map((cell) => cell.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cell of demoSeedCells) {
      expect(['code', 'text']).toContain(cell.type);
      expect(cell.content.length).toBeGreaterThan(0);
    }
  });
});
