import { IS_DEMO } from '../demo-mode';
import * as server from './server';
import * as browser from './browser';

// Where the notebook lives is the only difference between the CLI build and
// the hosted demo: the local API's notebook file, or the browser's IndexedDB.
// IS_DEMO is a build-time constant, so the unused implementation is dead code
// to the bundler.
export const persistence = IS_DEMO ? browser : server;
