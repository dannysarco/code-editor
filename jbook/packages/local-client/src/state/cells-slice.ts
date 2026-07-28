import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { StateWithHistory } from 'redux-undo';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { FetchCellsResponse, SaveCellsRequest } from '@my-scrapbook/types';
import { Cell, CellTypes } from './cell';

export type Direction = 'up' | 'down';

export interface CellsState {
  loading: boolean;
  error: string | null;
  order: string[];
  data: {
    [key: string]: Cell;
  };
}

const initialState: CellsState = {
  loading: false,
  error: null,
  order: [],
  data: {},
};

export const fetchCells = createAsyncThunk('cells/fetchCells', async () => {
  const { data }: { data: FetchCellsResponse } = await axios.get('/cells');
  return data;
});

// The state type is declared structurally instead of importing RootState from
// the store, which would create an import cycle (store -> slice -> store).
// The cells slice is wrapped in redux-undo history at the store level, so the
// current notebook lives under `present`.
export const saveCells = createAsyncThunk<
  void,
  void,
  { state: { cells: StateWithHistory<CellsState> } }
>('cells/saveCells', async (_, { getState }) => {
  const {
    cells: {
      present: { data, order },
    },
  } = getState();

  const cells = order.map((id) => data[id]);

  const body: SaveCellsRequest = { cells };
  await axios.post('/cells', body);
});

const cellsSlice = createSlice({
  name: 'cells',
  initialState,
  reducers: {
    // prepare callbacks keep the original multi-argument action creator
    // signatures, e.g. updateCell(id, content), so call sites are unchanged.
    updateCell: {
      reducer(state, action: PayloadAction<{ id: string; content: string }>) {
        const { id, content } = action.payload;
        state.data[id].content = content;
      },
      prepare(id: string, content: string) {
        return { payload: { id, content } };
      },
    },
    deleteCell(state, action: PayloadAction<string>) {
      delete state.data[action.payload];
      state.order = state.order.filter((id) => id !== action.payload);
    },
    moveCell: {
      reducer(
        state,
        action: PayloadAction<{ id: string; direction: Direction }>
      ) {
        const { id, direction } = action.payload;
        const index = state.order.findIndex((cellId) => cellId === id);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex > state.order.length - 1) {
          return;
        }

        state.order[index] = state.order[targetIndex];
        state.order[targetIndex] = id;
      },
      prepare(id: string, direction: Direction) {
        return { payload: { id, direction } };
      },
    },
    insertCellAfter: {
      reducer(
        state,
        action: PayloadAction<{ id: string | null; type: CellTypes }>
      ) {
        // Cell IDs are UUIDs; older notebooks with 5-char Math.random() IDs
        // keep working since IDs are only used as opaque keys.
        const cell: Cell = {
          content: '',
          type: action.payload.type,
          id: uuidv4(),
        };

        state.data[cell.id] = cell;

        const foundIndex = state.order.findIndex(
          (id) => id === action.payload.id
        );

        if (foundIndex < 0) {
          state.order.unshift(cell.id);
        } else {
          state.order.splice(foundIndex + 1, 0, cell.id);
        }
      },
      prepare(id: string | null, cellType: CellTypes) {
        return { payload: { id, type: cellType } };
      },
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCells.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCells.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload.map((cell) => cell.id);
        state.data = action.payload.reduce((acc, cell) => {
          acc[cell.id] = cell;
          return acc;
        }, {} as CellsState['data']);
      })
      .addCase(fetchCells.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch cells';
      })
      .addCase(saveCells.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to save cells';
      });
  },
});

export const { updateCell, deleteCell, moveCell, insertCellAfter } =
  cellsSlice.actions;

export default cellsSlice.reducer;
