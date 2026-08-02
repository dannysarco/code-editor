// Delay after the last keystroke before re-bundling a code cell. Long enough
// that esbuild-wasm isn't re-run on every keypress (bundling also refetches
// any uncached unpkg modules), short enough that the preview feels live.
export const BUNDLE_DEBOUNCE_MS = 750;

// Delay after the last cell change before persisting the notebook to disk.
// Shorter than BUNDLE_DEBOUNCE_MS on purpose: saving is a cheap local POST,
// and a shorter window narrows the span in which a crash loses work.
export const PERSIST_SAVE_DEBOUNCE_MS = 250;

// Delay before the JSX highlighter re-parses the buffer after an edit; the
// library's own default. Parsing with @babel/parser is fast, so this mainly
// coalesces bursts of keystrokes.
export const JSX_HIGHLIGHT_DEBOUNCE_MS = 100;

// Maximum number of undo history entries kept for the notebook. Snapshots are
// cheap (cells are small JSON), and 50 comfortably covers a working session
// without unbounded growth.
export const UNDO_HISTORY_LIMIT = 50;

// Maximum console entries kept per preview. A console.log inside a loop can
// emit thousands of messages per second; keeping only the newest N bounds
// both memory and re-render cost while still showing where the output ended.
export const MAX_CONSOLE_ENTRIES = 200;
