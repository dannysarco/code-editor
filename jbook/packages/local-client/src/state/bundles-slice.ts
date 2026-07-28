import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import bundler from '../bundler';

interface BundlesState {
  [key: string]:
    | {
        loading: boolean;
        code: string;
        err: string;
        // How long the bundle took, for the cell header's "Bundled in N ms"
        // label. Absent while loading and after unexpected failures.
        durationMs?: number;
      }
    | undefined;
}

const initialState: BundlesState = {};

const createBundleThunk = createAsyncThunk(
  'bundles/createBundle',
  async ({ input }: { cellId: string; input: string }) => {
    const started = performance.now();
    const result = await bundler(input);
    return { ...result, durationMs: performance.now() - started };
  }
);

// Keeps the original two-argument call signature, createBundle(cellId, input).
export const createBundle = (cellId: string, input: string) =>
  createBundleThunk({ cellId, input });

const bundlesSlice = createSlice({
  name: 'bundles',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(createBundleThunk.pending, (state, action) => {
        state[action.meta.arg.cellId] = {
          loading: true,
          code: '',
          err: '',
        };
      })
      .addCase(createBundleThunk.fulfilled, (state, action) => {
        state[action.meta.arg.cellId] = {
          loading: false,
          code: action.payload.code,
          err: action.payload.err,
          durationMs: action.payload.durationMs,
        };
      })
      // bundler() reports errors through its result rather than throwing, so
      // this only fires on unexpected failures; without it the cell would
      // show a progress bar forever.
      .addCase(createBundleThunk.rejected, (state, action) => {
        state[action.meta.arg.cellId] = {
          loading: false,
          code: '',
          err: action.error.message ?? 'Bundling failed',
        };
      });
  },
});

export default bundlesSlice.reducer;
