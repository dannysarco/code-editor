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

// Pause between resetting the preview iframe's srcdoc and posting the bundled
// code into it, giving the fresh document time to install its message
// listener. A load-event handshake would be more principled; this matches the
// app's long-standing behavior.
export const PREVIEW_EXECUTE_DELAY_MS = 50;
