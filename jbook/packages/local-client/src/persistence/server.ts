import axios from 'axios';
import type { FetchCellsResponse, SaveCellsRequest } from '@my-scrapbook/types';
import type { Cell } from '../state/cell';

// The CLI build persists through @my-scrapbook/local-api, which reads and
// writes the notebook file the server was started with.
export const loadCells = async (): Promise<Cell[]> => {
  const { data }: { data: FetchCellsResponse } = await axios.get('/cells');
  return data;
};

export const saveCells = async (cells: Cell[]): Promise<void> => {
  const body: SaveCellsRequest = { cells };
  await axios.post('/cells', body);
};
