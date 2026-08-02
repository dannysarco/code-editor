#!/usr/bin/env node
import { program } from 'commander';
import { serveCommand } from './commands/serve';
import { exportCommand } from './commands/export';

// Resolved at runtime relative to dist/index.js (esbuild inlines it into the
// published bundle), so the reported version always matches the package.
const { version } = require('../package.json') as { version: string };

program
  .name('my-scrapbook')
  .description(
    'An in-browser coding notebook: write JavaScript with npm imports and markdown docs, see it run live'
  )
  .version(version);

// serve is the default so a bare `npx my-scrapbook` opens the notebook.
program.addCommand(serveCommand, { isDefault: true });
program.addCommand(exportCommand);

program.parse(process.argv);
