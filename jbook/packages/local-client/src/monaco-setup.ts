// Self-host Monaco: bundle the editor from the installed monaco-editor
// package instead of @monaco-editor/react's default CDN loader, so the app
// works fully offline. Vite's ?worker imports produce the web workers Monaco
// needs; only the base editor worker and the typescript worker are included
// since the notebook only edits JavaScript.
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';

self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  },
};

loader.config({ monaco });
