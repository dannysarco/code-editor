// Resolved at runtime relative to dist/index.js (this file bundles into it),
// so the reported version always matches the installed package.
export const { version } = require('../package.json') as { version: string };
