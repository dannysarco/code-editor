import { Cell } from './cell';

// GET /cells responds with the raw cell array.
export type FetchCellsResponse = Cell[];

// POST /cells request body.
export interface SaveCellsRequest {
  cells: Cell[];
}

// POST /cells response body.
export interface SaveCellsResponse {
  status: 'ok';
}
