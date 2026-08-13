#!/usr/bin/env node
import { program } from 'commander';
import { serveCommand } from './commands/serve';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { version } from './version';

program
  .name('my-scrapbook')
  .description(
    'An in-browser coding notebook: write JavaScript with npm imports and markdown docs, see it run live'
  )
  .version(version);

// serve is the default so a bare `npx my-scrapbook` opens the notebook.
program.addCommand(serveCommand, { isDefault: true });
program.addCommand(exportCommand);
program.addCommand(importCommand);

program.parse(process.argv);
