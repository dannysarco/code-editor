// Result of bundling a cell's code in the browser. Bundling failures are
// reported through `err` rather than thrown.
export interface BundleResult {
  code: string;
  err: string;
}
