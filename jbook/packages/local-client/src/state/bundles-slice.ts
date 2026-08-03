import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { bundleWithCache } from '../bundler/bundle-with-cache';

interface BundlesState {
  [key: string]:
    | {
        loading: boolean;
        code: string;
        err: string;
        // How long the bundle took, for the cell header's "Bundled in N ms"
        // label. Absent while loading and after unexpected failures.
        durationMs?: number;
        // True when the result was served from the bundle cache instead of
        // running esbuild; the cell header says so instead of a timing.
        cached?: boolean;
      }
    | undefined;
}

const initialState: BundlesState = {};

const createBundleThunk = createAsyncThunk(
  'bundles/createBundle',
  async ({
    cellId,
    input,
  }: {
    cellId: string;
    input: string;
  }): Promise<{
    code: string;
    err: string;
    durationMs?: number;
    cached: boolean;
  }> => bundleWithCache(cellId, input)
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
          cached: action.payload.cached,
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
