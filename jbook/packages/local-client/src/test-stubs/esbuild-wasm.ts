// Test stand-in for esbuild-wasm: the real module throws at import time under
// jsdom (its TextEncoder instanceof-invariant fails across realms). Tests that
// exercise bundling mock '../bundler' directly; this stub only exists so that
// importing the module graph doesn't crash.
export const initialize = async () => {};
export const build = async () => ({ outputFiles: [{ text: '' }] });
